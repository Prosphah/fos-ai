import { NextResponse } from "next/server";

import { triggerPurchaseEmail } from "@/lib/purchase-email";
import { createAdminClient } from "@/lib/supabase/admin";
import type { CourseTier } from "@/lib/money-mastery";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const CRON_SECRET = process.env.CRON_SECRET;

/**
 * How long a purchase may sit unconfirmed before it is re-posted.
 *
 * An hour is long enough that an ordinary Make blip is already over by the
 * time this runs, and short enough that somebody who paid this morning has
 * their access details before they go to bed.
 */
const RETRY_AFTER_MINUTES = 60;

/**
 * Ceiling on one run.
 *
 * This is a time budget as much as a count. Each row costs one sequential post
 * to Make, and when Make is down each one burns the full trigger timeout, so
 * the worst case is BATCH_LIMIT multiplied by that timeout. Ten rows at three
 * seconds is about thirty seconds, which leaves headroom under the pg_net
 * timeout below and under this function's own maxDuration.
 *
 * Ten is also comfortably more than this will ever see. The rows reaching it
 * are purchases whose confirmation never landed, which should be zero on most
 * days.
 */
const BATCH_LIMIT = 10;

/**
 * The sweep has to finish before Vercel kills it, and before pg_net gives up
 * waiting for it. Thirty seconds of worst-case work against a sixty second
 * ceiling.
 */
export const maxDuration = 60;

type UnconfirmedRow = {
  paystack_reference: string;
  email: string;
  full_name: string | null;
  tier: CourseTier;
  amount: number;
  source_variant: "a" | "b" | "c" | null;
  created_at: string;
  is_gift: boolean | null;
  gift_purchaser_name: string | null;
  gift_purchaser_email: string | null;
};

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

  const cutoff = new Date(Date.now() - RETRY_AFTER_MINUTES * 60_000).toISOString();

  const { data, error } = await supabase
    .from("enrollments")
    .select(
      "paystack_reference,email,full_name,tier,amount,source_variant,created_at,is_gift,gift_purchaser_name,gift_purchaser_email"
    )
    // The grandfathering backfill in 20261015000001 means historical purchases
    // are excluded by construction, not by a date window. Anything reaching
    // this query is a purchase made while the feature was live whose
    // confirmation never landed.
    .eq("status", "paid")
    .is("purchase_email_sent_at", null)
    .lt("created_at", cutoff)
    // Newest first, deliberately.
    //
    // A row that keeps failing keeps its claim released and stays eligible
    // forever, and the oldest eligible row would otherwise sort to the front of
    // every single run. Past the batch limit that is starvation: one purchase
    // that cannot be delivered fills every slot on every run and newer
    // purchases are never attempted at all.
    //
    // Ordering newest-first means a stuck row sinks behind them instead. It is
    // still retried, just only once the queue above it has drained, and the
    // buyers most likely to still be waiting come first.
    .order("created_at", { ascending: false })
    .limit(BATCH_LIMIT);

  if (error) {
    return NextResponse.json(
      { error: "Could not read unconfirmed purchases", detail: error.message },
      { status: 500 },
    );
  }

  const rows = (data ?? []) as UnconfirmedRow[];

  if (rows.length === 0) {
    return NextResponse.json({ checked: 0, sent: 0, failed: 0 });
  }

  const failures: { reference: string; reason: string }[] = [];
  let sent = 0;
  let skipped = 0;

  // Sequential on purpose. These are rare, the count is bounded, and firing
  // them in parallel would trade a careful trickle against Make for a burst
  // during exactly the outage where Make is least able to absorb it. It also
  // keeps the worst case at BATCH_LIMIT multiplied by the trigger timeout,
  // which is the budget this endpoint is sized against.
  for (const row of rows) {
    const result = await triggerPurchaseEmail({
      reference: row.paystack_reference,
      email: row.email,
      fullName: row.full_name,
      tier: row.tier,
      amount: row.amount,
      variant: row.source_variant,
      // created_at stands in for paid_at here: this is only used to stamp the
      // email, and the sweep is about reach, not about accounting.
      paidAt: row.created_at,
      isRetry: true,
      // On a gift row, email/full_name are the recipient's; the payer's name
      // rides along so the retirement keeps the gift wording.
      isGift: row.is_gift ?? false,
      giftPurchaserName: row.gift_purchaser_name,
      giftPurchaserEmail: row.gift_purchaser_email,
    });

    if (result.triggered) {
      sent += 1;
    } else if (result.reason === "already-claimed") {
      // The webhook got there first, or another sweep is mid-flight. Not a
      // failure, and counting it as one would report noise every hour.
      skipped += 1;
    } else {
      failures.push({ reference: row.paystack_reference, reason: result.reason });
    }
  }

  console.error(
    `[resend-purchase-emails] ${rows.length} unconfirmed, ${sent} sent, ${skipped} claimed elsewhere, ${failures.length} still failing`,
  );

  return NextResponse.json({
    checked: rows.length,
    sent,
    skipped,
    failed: failures.length,
    // Returned so a failing scenario is visible without reading logs.
    failures: failures.slice(0, 10),
  });
}