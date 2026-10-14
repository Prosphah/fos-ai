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
 * The volume this will ever see is the number of purchases that failed to
 * send an email, which should be zero most days. The limit exists so that a
 * bad run cannot turn into a burst of thousands of POSTs against Make.
 */
const BATCH_LIMIT = 25;

type UnconfirmedRow = {
  paystack_reference: string;
  email: string;
  full_name: string | null;
  tier: CourseTier;
  amount: number;
  source_variant: "a" | "b" | "c" | null;
  created_at: string;
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
    .select("paystack_reference,email,full_name,tier,amount,source_variant,created_at")
    // The grandfathering backfill in 20261015000001 means historical purchases
    // are excluded by construction, not by a date window. Anything reaching
    // this query is a purchase made while the feature was live whose
    // confirmation never landed.
    .eq("status", "paid")
    .is("purchase_email_sent_at", null)
    .lt("created_at", cutoff)
    .order("created_at", { ascending: true })
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

  // Sequential on purpose. These are rare, the count is bounded, and firing
  // them in parallel would trade a careful trickle against Make for a burst
  // during exactly the outage where Make is least able to absorb it.
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
    });

    if (result.triggered) {
      sent += 1;
    } else {
      failures.push({ reference: row.paystack_reference, reason: result.reason });
    }
  }

  console.error(
    `[resend-purchase-emails] ${rows.length} unconfirmed, ${sent} sent, ${failures.length} still failing`,
  );

  return NextResponse.json({
    checked: rows.length,
    sent,
    failed: failures.length,
    // Returned so a failing scenario is visible without reading logs.
    failures: failures.slice(0, 10),
  });
}