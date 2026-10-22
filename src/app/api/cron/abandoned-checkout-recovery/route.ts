import { NextResponse } from "next/server";

import {
  claimRemainingCheckoutsForEmail,
  claimRemainingCheckoutsForSecondTouch,
  triggerAbandonedCheckoutEmail,
  triggerAbandonedCheckoutSecondTouch,
} from "@/lib/abandoned-checkout-email";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  asStorefrontVariant,
  formatNaira,
  getStorefrontVariantUrl,
  getTier,
} from "@/lib/money-mastery";
import { fulfilEnrollment } from "@/lib/fulfilment";
import { triggerPurchaseEmail } from "@/lib/purchase-email";
import { verifyTransaction } from "@/lib/paystack";
import { parseFullName } from "@/lib/validation/checkout";
import type { CourseTier } from "@/lib/money-mastery";
import type { PaystackVerifiedTransaction } from "@/lib/paystack";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const CRON_SECRET = process.env.CRON_SECRET;

/**
 * How long a checkout stays silent before the buyer is contacted.
 *
 * An hour, not minutes: Paystack sessions routinely take that long to resolve
 * when the buyer pays by bank transfer or fumbles a bank-app OTP, and an
 * email that arrives while the payment is still in flight tells someone who
 * already paid that they did not. Every send is also verified against
 * Paystack below, so an hour is belt-and-braces, not the only guard.
 */
const RECOVERY_AFTER_MINUTES = 60;

/**
 * How long after the first recovery email the second touch is worth sending.
 *
 * 48 hours, not less: the first email owes the buyer time to actually read
 * it and act, and the payment in flight the first hour probably guarded
 * against is by now either paid or definitively not. It is also short enough
 * that a checkout followed up a second time is still a fresh decision — the
 * touch-2 email's copy ("a couple of days ago I sent you the payment
 * details") is written for this exact range.
 *
 * Together with MAX_AGE_DAYS below this bounds the whole sequence: a
 * checkout can hear from us at hour 1 and day 2, and fall silent from day 7.
 */
const SECOND_TOUCH_AFTER_HOURS = 48;

/**
 * Stop reaching out after this long. Someone who left a checkout a week ago
 * has either bought it somewhere else or does not want it; the row still
 * feeds analytics, it just stops generating mail.
 */
const MAX_AGE_DAYS = 7;

/**
 * Unfinished checkouts are deleted after 90 days. That is not a choice this
 * file makes: it is a promise in the privacy policy's payments section, made
 * before the recovery sweep existed. This is the code that keeps it.
 */
const DELETE_AFTER_DAYS = 90;

/**
 * Ceiling on emails per run, per queue.
 *
 * This is a time budget. Each email can cost up to two Paystack verifies and
 * one post to Make, so five is the largest batch whose worst case (five times
 * eleven seconds) still fits under the pg_net timeout and maxDuration below.
 * Realistically each queue sees zero or one rows; the cap exists for the day
 * a Paystack outage dumps an hour of failed checkouts into the queue at once.
 * With two queues the worst case is ten buyers, which is exactly what the
 * HARD_STOP below is for: the run drains as far as it drains and answers.
 */
const BATCH_LIMIT = 5;

/** Most Paystack verifies answer in well under a second; 4s is a hard stop. */
const VERIFY_TIMEOUT_MS = 4_000;

/**
 * The sweep stops starting new buyers once this much of the run has elapsed.
 *
 * The batch is a time budget, not a quota. Worst case per buyer is two
 * four-second verifies plus a three-second Make post plus Supabase writes,
 * so five buyers can outrun a limits-free loop — and a run that overruns
 * maxDuration is killed mid-flight, losing the later buyers, the 90-day
 * cleanup, and the HTTP status the watchdog records. Checking at 40s leaves
 * the in-flight buyer room to finish and the cleanup room to run inside the
 * 60s ceiling.
 */
const HARD_STOP_MS = 40_000;

/**
 * How many of a buyer's pending checkouts get verified before giving up.
 * Multiple attempts by one person are normal (a declined card followed by a
 * retry); two covers a declined attempt plus the retry. Older rows than that
 * are claimed unverified, because the recovery email never assumes a payment.
 */
const MAX_VERIFIES_PER_EMAIL = 2;

/** The sweep must finish before pg_net gives up waiting for it. */
export const maxDuration = 60;

type PendingRow = {
  paystack_reference: string;
  email: string;
  full_name: string | null;
  tier: CourseTier;
  amount: number;
  source_variant: "a" | "b" | "c" | null;
  created_at: string;
};

function firstNameOf(fullName: string | null): string | null {
  if (!fullName) return null;
  const [first] = fullName.split(" ");
  return first && first.length > 0 ? first : null;
}

/**
 * One contact per buyer. The newest row carries the facts of the checkout
 * they last tried; every row under the same email gets claimed together so
 * the next sweep run cannot email them twice.
 */
function groupByBuyer(rows: PendingRow[]): Map<string, PendingRow[]> {
  const byEmail = new Map<string, PendingRow[]>();
  for (const row of rows) {
    // Group on the canonical form the checkout route and the webhook both
    // write. Every stored email is trimmed and lowercased, but the grouping
    // must not depend on writer discipline staying perfect: two spellings
    // of one address would split one buyer into two map entries and email
    // the same person twice in a single run.
    const key = row.email.trim().toLowerCase();
    const existing = byEmail.get(key);
    if (existing) existing.push(row);
    else byEmail.set(key, [row]);
  }
  return byEmail;
}

/**
 * Verify a buyer's attempts against Paystack before any email is drafted.
 *
 * Verifies the newest attempts first: a later attempt is the likelier one to
 * carry a payment, and MAX_VERIFIES_PER_EMAIL bounds the cost.
 */
async function verifyBeforeContact(
  buyerRows: PendingRow[]
): Promise<{ rescue: PaystackVerifiedTransaction | null; unverifiable: boolean }> {
  let rescue: PaystackVerifiedTransaction | null = null;
  let unverifiable = false;

  for (const row of buyerRows.slice(0, MAX_VERIFIES_PER_EMAIL)) {
    let transaction: PaystackVerifiedTransaction | null = null;
    try {
      transaction = await verifyTransaction(
        row.paystack_reference,
        VERIFY_TIMEOUT_MS
      );
    } catch {
      // verifyTransaction only guarantees null for HTTP-level refusal. A
      // network error, DNS failure, or the 4s abort timeout firing all
      // throw instead — and an unhandled throw here would kill the whole
      // sweep: the buyers behind this one unprocessed, the 90-day
      // retention cleanup skipped, and a 500 recorded by the watchdog.
      // An unknown state is handled identically to a null return below.
      transaction = null;
    }

    if (transaction === null) {
      // Could not confirm either way. The caller skips without claiming;
      // next run retries. Emailing on an unknown state risks telling a
      // paying customer they did not pay.
      unverifiable = true;
      break;
    }

    if (transaction.status === "success") {
      rescue = transaction;
      break;
    }
  }

  return { rescue, unverifiable };
}

/**
 * A pending checkout whose Paystack transaction actually succeeded is a
 * buyer who paid and whose webhook was lost — the worst possible recipient
 * of either a "finish your purchase" email or a follow-up about it. Finishing
 * the purchase is the exact work the missed webhook would have done. Both
 * paths are idempotent, so a late webhook replay changes nothing.
 *
 * Returns true when the rescue completed. Records its own failures.
 */
async function rescuePaystackPayment(
  email: string,
  rescue: PaystackVerifiedTransaction,
  failures: { reference: string; reason: string }[]
): Promise<boolean> {
  const tier = getTier(String(rescue.metadata?.tier ?? ""));
  const fullName = parseFullName(rescue.metadata?.full_name);

  if (!tier) {
    // The checkout route always writes tier into Paystack metadata, so
    // this means the payment predates it or was made by hand. Not
    // something a sweep should guess its way out of; the row stays
    // surfaced in the failures list, and no recovery email is sent.
    console.error(
      `[abandoned-checkout] Rescue for ${rescue.reference} skipped: no tier in Paystack metadata. Fulfil by hand.`
    );
    failures.push({ reference: rescue.reference, reason: "rescue-no-tier" });
    return false;
  }

  try {
    await fulfilEnrollment({
      email,
      fullName,
      tier: tier.id as CourseTier,
      amount: rescue.amount ?? tier.amount,
      reference: rescue.reference,
      transactionId: rescue.transactionId,
      sourceVariant: asStorefrontVariant(rescue.metadata?.source_variant),
    });
  } catch (e) {
    failures.push({
      reference: rescue.reference,
      reason: `rescue-fulfil-${e instanceof Error ? e.message : "error"}`,
    });
    return false;
  }

  await triggerPurchaseEmail({
    reference: rescue.reference,
    email,
    fullName,
    tier: tier.id,
    amount: rescue.amount ?? tier.amount,
    variant: asStorefrontVariant(rescue.metadata?.source_variant),
    paidAt: rescue.paidAt,
    isRetry: true,
  });

  await claimRemainingCheckoutsForEmail(email);
  return true;
}

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (!CRON_SECRET || authHeader !== `Bearer ${CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let supabase;
  try {
    supabase = createAdminClient();
  } catch {
    return NextResponse.json({ error: "Server misconfigured" }, { status: 500 });
  }

  const now = Date.now();
  const cutoff = new Date(now - RECOVERY_AFTER_MINUTES * 60_000).toISOString();
  const secondCutoff = new Date(
    now - SECOND_TOUCH_AFTER_HOURS * 3_600_000
  ).toISOString();
  const maxAge = new Date(now - MAX_AGE_DAYS * 86_400_000).toISOString();

  // ── First touch: pending rows nobody has emailed. ───────────────────────
  const { data, error } = await supabase
    .from("enrollments")
    .select(
      "paystack_reference,email,full_name,tier,amount,source_variant,created_at"
    )
    // Only pending rows are eligible. A failed row is a buyer Paystack never
    // showed a payment page to — they saw the error and can retry on the spot,
    // and mailing them about a page they never reached reads as surveillance.
    .eq("status", "pending")
    .is("recovery_started_at", null)
    .lt("created_at", cutoff)
    .gt("created_at", maxAge)
    // Newest first, deliberately — same starvation logic as the purchase
    // sweep: a row that keeps failing to verify keeps its claim released and
    // stays eligible forever, and newest-first lets a stuck row sink behind
    // the queue instead of filling every slot.
    .order("created_at", { ascending: false })
    // Slack over BATCH_LIMIT so one buyer with several attempts does not
    // crowd the batch out entirely.
    .limit(BATCH_LIMIT * 8);

  if (error) {
    return NextResponse.json(
      { error: "Could not read pending checkouts", detail: error.message },
      { status: 500 }
    );
  }

  // ── Second touch: rows the first email went out for, still unpaid. ──────
  //
  // followup_step = 1 is the readable record of a delivered first email
  // (the pair writes in lockstep with the recovery columns), and
  // followup_sent_at is when it was claimed — the 48-hour age test reads
  // that stamp, not the checkout's, so a row first emailed late in its life
  // still gets its full two-day grace.
  //
  // Rows are ordered oldest first, inverting the first touch: a second-touch
  // candidate retires silently at MAX_AGE_DAYS no matter what its attempts
  // do, so this queue has no equivalent of the first touch's released-claim
  // starvation, and the oldest rows — the ones closest to never being
  // followed up — should claim the budget first.
  //
  // This test is per row; the 48-hour grace is per buyer, and sibling rows
  // can carry newer stamps than anything these filters return. The loop
  // below re-confirms the buyer-level grace before anything is sent.
  const { data: secondData, error: secondError } = await supabase
    .from("enrollments")
    .select(
      "paystack_reference,email,full_name,tier,amount,source_variant,created_at"
    )
    .eq("status", "pending")
    .eq("followup_step", 1)
    .lte("followup_sent_at", secondCutoff)
    .gt("created_at", maxAge)
    .order("created_at", { ascending: true })
    .limit(BATCH_LIMIT * 8);

  if (secondError) {
    return NextResponse.json(
      { error: "Could not read second-touch checkouts", detail: secondError.message },
      { status: 500 }
    );
  }

  const rows = (data ?? []) as PendingRow[];
  const secondRows = (secondData ?? []) as PendingRow[];

  const firstTouchBuyers = groupByBuyer(rows);
  const secondTouchBuyers = groupByBuyer(secondRows);

  const firstBatch = [...firstTouchBuyers.entries()].slice(0, BATCH_LIMIT);
  const secondBatch = [...secondTouchBuyers.entries()].slice(0, BATCH_LIMIT);

  let recoveredPayments = 0;
  let emailsSent = 0;
  let followupsSent = 0;
  let skipped = 0;
  let deleted = 0;
  const failures: { reference: string; reason: string }[] = [];

  // A buyer handled in the first-touch loop must not also receive a second
  // touch in the same run: a buyer can sit in both queues when they have one
  // claimed first-touch checkout and one brand-new attempt. The recovery
  // email about the new attempt already covers that buyer this hour.
  const touchedThisRun = new Set<string>();

  // ── First-touch loop. ────────────────────────────────────────────────────
  for (const [email, buyerRows] of firstBatch) {
    // No new buyer once the run is old. Continuing rather than breaking
    // keeps the loop draining to the 90-day cleanup below, with every
    // remaining buyer counted in `skipped` so the response stays honest.
    // `now` is the request start captured above, so the comparison also
    // covers the time the SELECT spent.
    if (Date.now() - now > HARD_STOP_MS) {
      skipped += 1;
      continue;
    }

    // Marked before anything else, so an unverifiable or failed buyer is
    // never also queued for a same-run second touch.
    touchedThisRun.add(email);

    // Verify before writing a word. A pending row whose Paystack transaction
    // actually succeeded is a buyer who paid and whose webhook was lost —
    // the worst possible recipient of a "finish your purchase" email.
    const { rescue, unverifiable } = await verifyBeforeContact(buyerRows);

    // Unverified rows stay eligible. Not a failure worth recording: Paystack
    // blips and comes back on the next run.
    if (unverifiable) {
      skipped += 1;
      continue;
    }

    if (rescue) {
      // The webhook died; this buyer paid and heard nothing. Fulfil and send
      // the purchase confirmation — the exact work the missed webhook would
      // have done.
      const rescued = await rescuePaystackPayment(email, rescue, failures);
      if (rescued) recoveredPayments += 1;
      // A rescue that could not complete (no tier, write failed) is already
      // recorded in `failures`; in both cases this buyer gets no recovery
      // email this run — emailing after a failed fulfil risks the same
      // contradiction the verify step exists to prevent.
      continue;
    }

    // Genuinely unfinished: declined, abandoned, or still pending at
    // Paystack. Email once, about the checkout they last tried.
    const newest = buyerRows[0];
    const tier = getTier(newest.tier);

    const result = await triggerAbandonedCheckoutEmail({
      reference: newest.paystack_reference,
      email,
      firstName: firstNameOf(newest.full_name),
      tierId: newest.tier,
      tierName: tier?.name ?? newest.tier,
      amountDisplay: formatNaira(newest.amount),
      variant: newest.source_variant,
      startedAt: newest.created_at,
      resumeUrl: getStorefrontVariantUrl(newest.source_variant ?? undefined),
    });

    if (result.triggered) {
      // The sweep claimed the newest row inside the trigger; this closes out
      // the buyer's other attempts so they cannot trigger a second email.
      await claimRemainingCheckoutsForEmail(email);
      emailsSent += 1;
    } else if (result.reason === "already-claimed") {
      skipped += 1;
    } else {
      failures.push({ reference: newest.paystack_reference, reason: result.reason });
    }
  }

  // ── Second-touch loop: the value-first follow-up. ────────────────────────
  for (const [email, buyerRows] of secondBatch) {
    // The same shape of guard as the first loop: the budget is shared, the
    // first touch outranks the second, and this loop still drains to the
    // cleanup while counting every buyer it leaves behind.
    if (Date.now() - now > HARD_STOP_MS) {
      skipped += 1;
      continue;
    }

    // Both queues reached into this buyer's rows this hour; the first touch
    // decided already.
    if (touchedThisRun.has(email)) continue;

    // Second-touch eligibility is measured per row, but the 48-hour grace
    // period belongs to the buyer. The SELECT above can only see rows older
    // than secondCutoff, so a sibling claim stamped inside the grace window
    // — another attempt that got its own first touch hours ago — is
    // invisible to it. Look up the buyer's newest pending-row stamp
    // directly; a hit means someone contacted this buyer recently, and the
    // follow-up must wait out the full 48 hours from every claim they carry.
    // A lookup error is treated the same as a hit: no confirmation, no
    // follow-up.
    const { data: stampedSibling, error: stampError } = await supabase
      .from("enrollments")
      .select("paystack_reference")
      .eq("email", email)
      .eq("status", "pending")
      .gt("followup_sent_at", secondCutoff)
      .limit(1)
      .maybeSingle();

    // The verdict is applied one step later, deliberately: the verify below
    // still runs, so a buyer who paid a pending attempt lands in the rescue
    // path and is fulfilled this run regardless of the grace clock. The
    // window protects the buyer's inbox, never their access to something
    // they paid for.
    const graceViolated = stampError !== null || stampedSibling !== null;

    // The second-touch SELECT handed rows over oldest first, but the newest
    // attempt is still the one with the newest facts — the checkout the
    // buyer last tried — and the one Paystack is most likely to confirm a
    // payment for. Newest first for both.
    const attempts = [...buyerRows].sort((a, b) =>
      a.created_at < b.created_at ? 1 : -1
    );

    const { rescue, unverifiable } = await verifyBeforeContact(attempts);

    if (unverifiable) {
      skipped += 1;
      continue;
    }

    if (rescue) {
      // The buyer paid a pending attempt after the first email went out —
      // receiving the follow-up would tell them they hadn't. Fulfil instead.
      const rescued = await rescuePaystackPayment(email, rescue, failures);
      if (rescued) recoveredPayments += 1;
      continue;
    }

    // With payment ruled out and fulfilled above, the grace check now gates
    // the only thing left for this buyer: the email.
    if (graceViolated) {
      skipped += 1;
      continue;
    }

    const newest = attempts[0];
    const tier = getTier(newest.tier);

    const result = await triggerAbandonedCheckoutSecondTouch({
      reference: newest.paystack_reference,
      email,
      firstName: firstNameOf(newest.full_name),
      tierId: newest.tier,
      tierName: tier?.name ?? newest.tier,
      amountDisplay: formatNaira(newest.amount),
      variant: newest.source_variant,
      startedAt: newest.created_at,
      resumeUrl: getStorefrontVariantUrl(newest.source_variant ?? undefined),
    });

    if (result.triggered) {
      // The trigger claimed the newest row; this closes out the buyer's
      // other step-1 attempts together so no later run follows up about a
      // checkout this email already covered.
      await claimRemainingCheckoutsForSecondTouch(email);
      followupsSent += 1;
    } else if (result.reason === "already-claimed") {
      skipped += 1;
    } else if (result.reason === "not-configured") {
      // A configured state, not a defect: the sequence deliberately ends at
      // one email until the second Make scenario is wired up. Recorded in
      // the log so the wiring gap is visible, and in `skipped` so the
      // failure list stays reserved for rows that genuinely could not send.
      console.error(
        "[abandoned-checkout] Second touch not configured; skipping follow-up candidates."
      );
      skipped += 1;
    } else {
      failures.push({
        reference: newest.paystack_reference,
        // Prefixed so a failing second touch never reads as a first-touch
        // problem in the watchdog.
        reason: `second-${result.reason}`,
      });
    }
  }

  // Keep the privacy policy's 90-day deletion promise. Unfinished means
  // pending and failed alike; paid rows are finished and never touched here.
  const deleteBefore = new Date(now - DELETE_AFTER_DAYS * 86_400_000).toISOString();
  const { data: deletedRows, error: deleteError } = await supabase
    .from("enrollments")
    .delete()
    .in("status", ["pending", "failed"])
    .lt("created_at", deleteBefore)
    .select("paystack_reference");

  if (deleteError) {
    console.error(`[abandoned-checkout] 90-day deletion failed: ${deleteError.message}`);
  } else {
    deleted = deletedRows?.length ?? 0;
  }

  console.error(
    `[abandoned-checkout] ${firstBatch.length} first-touch buyers, ${secondBatch.length} second-touch buyers, ${emailsSent} recovery emails, ${followupsSent} follow-up emails, ${recoveredPayments} lost payments rescued, ${skipped} skipped, ${failures.length} failing, ${deleted} expired rows deleted`
  );

  return NextResponse.json({
    buyers: firstBatch.length,
    secondTouchBuyers: secondBatch.length,
    emailsSent,
    followupsSent,
    recoveredPayments,
    skipped,
    failed: failures.length,
    failures: failures.slice(0, 10),
    deletedAfter90Days: deleted,
  });
}
