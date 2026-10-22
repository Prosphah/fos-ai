import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Abandoned-checkout recovery delivery: the two-touch sequence.
 *
 * A checkout that stays pending — the buyer reached Paystack and left, or the
 * card was declined — is a person who raised their hand and walked out of the
 * shop. Touch 1 hands the facts of that checkout to a Make.com scenario that
 * composes and sends the "resume your checkout" email through Zoho. Touch 2
 * posts the same facts to a second scenario that sends the value-first
 * follow-up (one rule from the course, then the way back in) about rows still
 * pending a second touch long after the first email went out.
 *
 * Both touches share everything below — the payload shape, the claim
 * discipline, the release semantics, the timeouts. Only the webhook URL,
 * its key, and which columns get written on claim differ.
 *
 * The architecture is deliberately identical to purchase-email.ts, down to the
 * failure modes it designs around:
 *
 * 1. Make is down. A row would be claimed while nothing was sent, and the
 *    buyer would never hear anything. Handled by releasing the claim on any
 *    failure so the sweep retries next hour.
 * 2. The post is slow or hangs. The sweep has an hourly budget, not an
 *    unbounded one. Handled by a hard timeout.
 *
 * What this module deliberately does NOT decide: who is eligible. Eligibility
 * (pending, old enough, young enough, verified against Paystack first) is the
 * sweep route's job. This file only moves a claimed row.
 */

/** Make's incoming-webhook URL for the first-touch scenario. Unset disables it. */
const WEBHOOK_URL = process.env.ABANDONED_CHECKOUT_WEBHOOK_URL?.trim();

/**
 * The first scenario's API key, sent as the x-make-apikey header. Same
 * mechanism as the purchase scenario: Make answers 401 unless a configured
 * key matches.
 */
const WEBHOOK_SECRET = process.env.ABANDONED_CHECKOUT_WEBHOOK_SECRET?.trim();

/**
 * Make's incoming-webhook URL for the second-touch scenario — the value-first
 * follow-up email sent about a checkout that stayed pending after the first
 * recovery email. Unset leaves the sequence at one touch: the sweep then
 * reports second-touch candidates as skipped rather than failed, because a
 * sequence that deliberately ends at one more email is a configuration state,
 * not a missing email.
 */
const SECOND_WEBHOOK_URL =
  process.env.ABANDONED_CHECKOUT_SECOND_WEBHOOK_URL?.trim();

/** The second scenario's API key, same header contract as the first. */
const SECOND_WEBHOOK_SECRET =
  process.env.ABANDONED_CHECKOUT_SECOND_WEBHOOK_SECRET?.trim();

/** Hard ceiling on the post, so one slow scenario cannot eat the sweep's budget. */
const TRIGGER_TIMEOUT_MS = 3_000;

/** Everything a scenario needs to write its email. The two touches take the same payload. */
export type AbandonedCheckoutEmail = {
  reference: string;
  email: string;
  firstName: string | null;
  tierId: string;
  tierName: string;
  /** Formatted for a human, e.g. "₦23,000". */
  amountDisplay: string;
  variant: "a" | "b" | "c" | null;
  /** ISO timestamp of the checkout attempt, for "you started this at". */
  startedAt: string;
  /** Where the buyer picks up: their storefront variant. */
  resumeUrl: string;
};

export type TriggerResult = {
  /** Whether Make took the payload. */
  triggered: boolean;
  /** Whether the claim held (true unless released after a failure). */
  marked: boolean;
  reason: string;
};

function payloadFor(checkout: AbandonedCheckoutEmail) {
  return {
    reference: checkout.reference,
    email: checkout.email,
    firstName: checkout.firstName,
    tierId: checkout.tierId,
    tierName: checkout.tierName,
    amountDisplay: checkout.amountDisplay,
    variant: checkout.variant,
    startedAt: checkout.startedAt,
    resumeUrl: checkout.resumeUrl,
  };
}

/**
 * Takes exclusive ownership of a pending checkout before the first email.
 *
 * Same compare-and-swap as the purchase claim: it only writes while
 * recovery_started_at is still null, so two runs cannot both send. The
 * timestamp is written before the post and released on failure, which makes
 * delivery at-least-once — a duplicate recovery email is an annoyance, while
 * a buyer who wanted the course and got silence is a sale lost.
 */
async function claimFirstTouch(reference: string): Promise<boolean> {
  const claimedAt = new Date().toISOString();
  try {
    const { data, error } = await createAdminClient()
      .from("enrollments")
      .update({
        recovery_started_at: claimedAt,
        // recovery_attempts is incremented by the second touch's own claim;
        // the first touch only ever sets it to 1.
        recovery_attempts: 1,
        // The readable pair the checkout-intents migration added for this
        // exact purpose, kept in lockstep with the recovery columns: set on
        // claim, cleared on release, cleared again on payment by the fulfil
        // upsert. Both stamps are the claim moment; the Make post follows
        // within the 3s trigger timeout.
        followup_step: 1,
        followup_sent_at: claimedAt,
      })
      .eq("paystack_reference", reference)
      // A paid row must never be claimable. Between this sweep's SELECT and
      // this UPDATE, the Paystack webhook can land and flip the status to
      // paid — filtering on status here makes the claim atomic with that
      // transition in the database, so the worst case is no claim
      // ("already-claimed" to the caller) rather than a "finish your
      // purchase" email sent to someone who paid.
      .eq("status", "pending")
      .is("recovery_started_at", null)
      .select("paystack_reference")
      .maybeSingle();

    if (error) {
      console.error("[abandoned-checkout] Could not claim:", error.message);
      return false;
    }

    return data !== null;
  } catch (error) {
    console.error(
      "[abandoned-checkout] Could not claim:",
      error instanceof Error ? error.message : "Unknown error",
    );
    return false;
  }
}

/**
 * Takes exclusive ownership for the second touch.
 *
 * The compare-and-swap key moves to followup_step: the row must be exactly at
 * step 1 — claimed by the first touch, never further — so two overlapping
 * runs cannot both send a second email. recovery_started_at is deliberately
 * left alone: it carries the moment the buyer was first contacted, and
 * releaseSecondTouch trusts it as the first-touch stamp to restore on
 * failure.
 */
async function claimSecondTouch(reference: string): Promise<boolean> {
  const claimedAt = new Date().toISOString();
  try {
    const { data, error } = await createAdminClient()
      .from("enrollments")
      .update({
        recovery_attempts: 2,
        followup_step: 2,
        followup_sent_at: claimedAt,
      })
      .eq("paystack_reference", reference)
      // Same status guard as the first-touch claim: a payment landing between
      // selection and this write must win, and this update must lose.
      .eq("status", "pending")
      .eq("followup_step", 1)
      .select("paystack_reference")
      .maybeSingle();

    if (error) {
      console.error(
        "[abandoned-checkout] Could not claim for second touch:",
        error.message,
      );
      return false;
    }

    return data !== null;
  } catch (error) {
    console.error(
      "[abandoned-checkout] Could not claim for second touch:",
      error instanceof Error ? error.message : "Unknown error",
    );
    return false;
  }
}

/**
 * Hands a first-touch claim back so the next sweep run can retry it.
 *
 * Returns whether the row is actually unclaimed afterwards. A release that
 * fails leaves the row claimed with nothing in the database to distinguish
 * it from a delivered email (a successful send stays claimed), so silence
 * here would strand the buyer permanently. One immediate retry catches the
 * transient Supabase blips that dominate this failure mode; if even the
 * retry fails, the caller reports a `release-failed` reason into the sweep's
 * visible failures instead of reporting the row as unclaimed.
 *
 * A time-based stale-claim reaper is deliberately absent: a claimed row is
 * indistinguishable from a delivered email (a successful send stays
 * claimed), so bulk-releasing stale claims would re-email buyers who were
 * already contacted. The residual risk after a double failure is one buyer
 * needing a manual `update ... set recovery_started_at = null` — annoying,
 * but bounded and loud.
 */
async function releaseFirstTouch(reference: string): Promise<boolean> {
  const attempt = async (): Promise<boolean> => {
    const { error } = await createAdminClient()
      .from("enrollments")
      .update({
        recovery_started_at: null,
        recovery_attempts: 0,
        // Released means nothing went out: the readable pair resets with the
        // claim, so a failed send never looks like a delivered email.
        followup_step: 0,
        followup_sent_at: null,
      })
      .eq("paystack_reference", reference);

    if (error) {
      console.error(
        "[abandoned-checkout] Could not release claim:",
        error.message,
      );
      return false;
    }
    return true;
  };

  try {
    if (await attempt()) return true;
    return await attempt();
  } catch (error) {
    console.error(
      "[abandoned-checkout] Could not release claim:",
      error instanceof Error ? error.message : "Unknown error",
    );
    try {
      return await attempt();
    } catch {
      return false;
    }
  }
}

/**
 * Hands a second-touch claim back so the next sweep run can try again.
 *
 * Mirrors releaseFirstTouch's at-least-once contract, with one deliberate
 * difference: the follow-up pair is restored to the state the first touch
 * left it in — step 1, and followup_sent_at back to recovery_started_at —
 * rather than cleared. Nothing was sent, but the first email did go out, so
 * resetting the 48-hour age test to zero would mean the row waits another
 * two days after every failed attempt for no reason.
 *
 * For every row at step 1, followup_sent_at equals recovery_started_at: the
 * first claim, the sibling claimer and the backfill migration all write the
 * pair from the same moment. Restoring from the recovery column therefore
 * reproduces the exact pre-claim state.
 *
 * The write is scoped to pending rows. If a payment landed inside the 3s
 * claim-and-post window, the paid row keeps the clean pair the fulfil upsert
 * wrote instead of being re-stamped by a failed send.
 *
 * If there is no recovery_started_at on record — a state the invariant above
 * says should not exist — the pair is left exactly as the failed claim wrote
 * it: unreachable for the next 48 hours, then eligible again. Annoying at
 * worst, and never silent.
 */
async function releaseSecondTouch(reference: string): Promise<boolean> {
  const attempt = async (): Promise<boolean> => {
    // PostgREST cannot copy a column inside an UPDATE, so the first-touch
    // stamp is read before writing. One extra read on a failure-only path.
    const { data: row, error: readError } = await createAdminClient()
      .from("enrollments")
      .select("recovery_started_at")
      .eq("paystack_reference", reference)
      .maybeSingle();

    if (readError) {
      console.error(
        "[abandoned-checkout] Could not release second touch:",
        readError.message,
      );
      return false;
    }

    const firstTouchStamp = row?.recovery_started_at as string | null;

    const patch: {
      recovery_attempts: number;
      followup_step: number;
      followup_sent_at?: string | null;
    } = {
      recovery_attempts: 1,
      followup_step: 1,
    };
    if (firstTouchStamp) {
      patch.followup_sent_at = firstTouchStamp;
    }

    const { error } = await createAdminClient()
      .from("enrollments")
      .update(patch)
      .eq("paystack_reference", reference)
      .eq("status", "pending");

    if (error) {
      console.error(
        "[abandoned-checkout] Could not release second touch:",
        error.message,
      );
      return false;
    }
    return true;
  };

  try {
    if (await attempt()) return true;
    return await attempt();
  } catch (error) {
    console.error(
      "[abandoned-checkout] Could not release second touch:",
      error instanceof Error ? error.message : "Unknown error",
    );
    try {
      return await attempt();
    } catch {
      return false;
    }
  }
}

/**
 * Posts one claimed checkout to its Make scenario.
 *
 * Never throws and never rejects — the caller is a cron sweep processing a
 * batch, and one bad row must not take the rest of the run with it.
 * Which scenario, which claim, and which release is decided by the caller;
 * the wire contract is identical for both touches.
 */
async function postToMake(
  checkout: AbandonedCheckoutEmail,
  touch: {
    url: string | undefined;
    secret: string | undefined;
    claim: (reference: string) => Promise<boolean>;
    release: (reference: string) => Promise<boolean>;
  }
): Promise<TriggerResult> {
  if (!touch.url) {
    // Not an error. A touch without its scenario configured behaves as
    // before: rows stay as they were and the sweep retries every hour, so
    // wiring Make up later needs no backfill.
    return { triggered: false, marked: false, reason: "not-configured" };
  }

  if (!(await touch.claim(checkout.reference))) {
    // Claimed by a concurrent run, or the claim write failed outright.
    return { triggered: false, marked: false, reason: "already-claimed" };
  }

  try {
    const response = await fetch(touch.url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(touch.secret
          ? {
              // Same header contract as the purchase scenario. Make rejects
              // with 401 unless the key arrives under this exact name.
              "x-make-apikey": touch.secret,
              "X-Abandoned-Checkout-Secret": touch.secret,
            }
          : {}),
      },
      body: JSON.stringify(payloadFor(checkout)),
      signal: AbortSignal.timeout(TRIGGER_TIMEOUT_MS),
    });

    if (!response.ok) {
      // Deliberately not logging the URL, which carries Make's token.
      console.error(
        `[abandoned-checkout] Scenario returned ${response.status} for ${checkout.reference}`,
      );
      const released = await touch.release(checkout.reference);
      // A release that failed leaves the row claimed; it must not be
      // reported as a plain HTTP failure, which reads as "eligible again
      // next run" when it is not. The sweep surfaces this prefix in its
      // failures list.
      return {
        triggered: false,
        marked: false,
        reason: released
          ? `http-${response.status}`
          : `release-failed-http-${response.status}`,
      };
    }

    return { triggered: true, marked: true, reason: "accepted" };
  } catch (error) {
    const reason = error instanceof Error ? error.name : "unknown";
    console.error(
      `[abandoned-checkout] Could not reach the scenario for ${checkout.reference}: ${reason}`,
    );
    const released = await touch.release(checkout.reference);
    return {
      triggered: false,
      marked: false,
      reason: released ? reason : `release-failed-${reason}`,
    };
  }
}

/**
 * Sends the first-touch recovery email about one abandoned checkout.
 */
export async function triggerAbandonedCheckoutEmail(
  checkout: AbandonedCheckoutEmail
): Promise<TriggerResult> {
  return postToMake(checkout, {
    url: WEBHOOK_URL,
    secret: WEBHOOK_SECRET,
    claim: claimFirstTouch,
    release: releaseFirstTouch,
  });
}

/**
 * Sends the second-touch, value-first follow-up about one abandoned checkout.
 * Same payload as the first touch; the scenario receiving it composes the
 * other email.
 */
export async function triggerAbandonedCheckoutSecondTouch(
  checkout: AbandonedCheckoutEmail
): Promise<TriggerResult> {
  return postToMake(checkout, {
    url: SECOND_WEBHOOK_URL,
    secret: SECOND_WEBHOOK_SECRET,
    claim: claimSecondTouch,
    release: releaseSecondTouch,
  });
}

/**
 * Marks a buyer's other pending checkouts as handled.
 *
 * Someone can submit the form twice before paying, which produces two pending
 * rows with the same email. Sending on the newest and leaving the older
 * unclaimed would have next hour's sweep email the same person again about a
 * checkout they no longer remember starting. Once this buyer has been
 * contacted — or has paid — every pending row under their email is moot.
 */
export async function claimRemainingCheckoutsForEmail(
  email: string
): Promise<void> {
  const claimedAt = new Date().toISOString();
  try {
    const { error } = await createAdminClient()
      .from("enrollments")
      .update({
        recovery_started_at: claimedAt,
        recovery_attempts: 1,
        // Siblings of an emailed checkout are covered by that one email, not
        // mailed individually; the pair marks the buyer as contacted so a
        // glance at the table reads the same on every row of theirs.
        followup_step: 1,
        followup_sent_at: claimedAt,
      })
      .eq("email", email.trim().toLowerCase())
      .eq("status", "pending")
      .is("recovery_started_at", null);

    if (error) {
      console.error(
        "[abandoned-checkout] Could not claim sibling checkouts:",
        error.message,
      );
    }
  } catch (error) {
    console.error(
      "[abandoned-checkout] Could not claim sibling checkouts:",
      error instanceof Error ? error.message : "Unknown error",
    );
  }
}

/**
 * Marks a buyer's other pending checkouts as covered by the second touch.
 *
 * Runs right after a successful second-touch send about the buyer's newest
 * attempt: rows already at step 1 move to step 2 together, so no later sweep
 * emails the buyer about a checkout the follow-up already covered. Rows that
 * never saw the first email keep their own first-touch lifecycle rather than
 * being fast-forwarded out of order — claimRemainingCheckoutsForEmail (which
 * owns exactly those rows) is the path they take.
 *
 * recovery_started_at is deliberately left alone: it carries the first
 * touch's stamp wherever it exists.
 */
export async function claimRemainingCheckoutsForSecondTouch(
  email: string
): Promise<void> {
  const claimedAt = new Date().toISOString();
  try {
    const { error } = await createAdminClient()
      .from("enrollments")
      .update({
        recovery_attempts: 2,
        followup_step: 2,
        followup_sent_at: claimedAt,
      })
      .eq("email", email.trim().toLowerCase())
      .eq("status", "pending")
      .eq("followup_step", 1);

    if (error) {
      console.error(
        "[abandoned-checkout] Could not claim second-touch siblings:",
        error.message,
      );
    }
  } catch (error) {
    console.error(
      "[abandoned-checkout] Could not claim second-touch siblings:",
      error instanceof Error ? error.message : "Unknown error",
    );
  }
}
