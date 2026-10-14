import {
  formatNaira,
  getCourseAccessUrl,
  getTier,
  type CourseTier,
} from "@/lib/money-mastery";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Purchase confirmation delivery.
 *
 * The email itself is composed and sent by a Make.com scenario that holds the
 * Zoho connection. This module's only job is to hand Make the facts of a
 * completed purchase and record whether that handoff succeeded.
 *
 * Two failure modes are designed around here, and they pull in opposite
 * directions:
 *
 * 1. Make is down. The buyer has paid and receives nothing, and nothing in the
 *    system would show that. Handled by leaving purchase_email_sent_at null
 *    and re-posting from the cron sweep.
 * 2. The post is slow or hangs. Every second spent waiting is a second the
 *    Paystack webhook has not answered, and Paystack retries the whole webhook
 *    when it does. Handled by a hard timeout well inside that window.
 *
 * Note what this does NOT prove. A 2xx from Make means Make received the
 * payload, not that a scenario ran or that Zoho accepted the message. A
 * scenario that receives and then fails is invisible here. Closing that gap
 * would mean Make calling back on completion.
 */

/**
 * Make's incoming-webhook URL. Sending is disabled entirely when unset, so a
 * project without it configured behaves exactly as it did before this existed
 * rather than erroring on every purchase.
 */
const WEBHOOK_URL = process.env.PURCHASE_EMAIL_WEBHOOK_URL?.trim();

/**
 * Optional shared secret, sent as a header.
 *
 * Make's webhook URLs contain a long random token and are not guessable, so
 * this is defence in depth rather than the actual defence. It matters because
 * the payload carries a customer's name and email: if the URL ever leaked from
 * a log or a screenshot, this is what stops someone using it to send mail to
 * arbitrary addresses.
 */
const WEBHOOK_SECRET = process.env.PURCHASE_EMAIL_WEBHOOK_SECRET?.trim();

/**
 * Well inside the Paystack webhook window.
 *
 * fulfilment runs first and itself makes a Supabase call, so this is additive
 * on top of that, not the whole request. If it ever does overrun, Paystack
 * retries the webhook and fulfilment is idempotent on the reference, so the
 * cost is a repeated upsert rather than a repeated account invite.
 */
const TRIGGER_TIMEOUT_MS = 5_000;

/** Everything the scenario needs to write the email. */
export type PurchaseEmail = {
  reference: string;
  email: string;
  fullName: string | null;
  tier: CourseTier;
  amount: number;
  variant: "a" | "b" | "c" | null;
  paidAt: string | null;
  /** True when this is the cron sweep re-posting a missed confirmation. */
  isRetry: boolean;
};

export type TriggerResult = {
  /** Whether Make took the payload. */
  triggered: boolean;
  /** Whether purchase_email_sent_at was written. */
  marked: boolean;
  reason: string;
};

function payloadFor(purchase: PurchaseEmail) {
  const tier = getTier(purchase.tier);

  return {
    reference: purchase.reference,
    email: purchase.email,
    fullName: purchase.fullName,
    firstName: purchase.fullName?.split(" ")[0] ?? null,
    tier: purchase.tier,
    tierName: tier?.name ?? purchase.tier,
    // Minor units, the same integer stored in enrollments, so the scenario can
    // reconcile against the database without guessing at a unit convention.
    amount: purchase.amount,
    amountDisplay: formatNaira(purchase.amount),
    currency: "NGN",
    variant: purchase.variant,
    paidAt: purchase.paidAt,
    courseAccessUrl: getCourseAccessUrl(),
    includesFosai: purchase.tier === "course_fosai",
    isRetry: purchase.isRetry,
  };
}

async function markSent(reference: string): Promise<void> {
  const { error } = await createAdminClient()
    .from("enrollments")
    .update({ purchase_email_sent_at: new Date().toISOString() })
    .eq("paystack_reference", reference)
    // Keeps a concurrent retry from rewriting a timestamp that is already
    // correct, and makes a duplicate Paystack webhook a no-op here.
    .is("purchase_email_sent_at", null);

  if (error) {
    console.error("[purchase-email] Could not mark as sent:", error.message);
  }
}

/**
 * Posts a completed purchase to the Make scenario.
 *
 * Never throws and never rejects. The caller is the Paystack webhook, and an
 * exception escaping here would produce a non-2xx, which Paystack answers by
 * replaying the entire webhook.
 */
export async function triggerPurchaseEmail(
  purchase: PurchaseEmail,
): Promise<TriggerResult> {
  if (!WEBHOOK_URL) {
    // Not an error. A deployment without Make configured must still complete
    // purchases, it just does not send confirmations.
    return { triggered: false, marked: false, reason: "not-configured" };
  }

  try {
    const response = await fetch(WEBHOOK_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(WEBHOOK_SECRET ? { "X-Purchase-Email-Secret": WEBHOOK_SECRET } : {}),
      },
      body: JSON.stringify(payloadFor(purchase)),
      signal: AbortSignal.timeout(TRIGGER_TIMEOUT_MS),
    });

    if (!response.ok) {
      // Deliberately not logging the URL, which carries Make's token.
      console.error(
        `[purchase-email] Scenario returned ${response.status} for ${purchase.reference}`,
      );
      return { triggered: false, marked: false, reason: `http-${response.status}` };
    }

    await markSent(purchase.reference);

    return { triggered: true, marked: true, reason: "accepted" };
  } catch (error) {
    // AbortError here is the timeout firing, which is the expected shape of a
    // Make outage rather than a programming fault.
    const reason = error instanceof Error ? error.name : "unknown";
    console.error(
      `[purchase-email] Could not reach the scenario for ${purchase.reference}: ${reason}`,
    );
    return { triggered: false, marked: false, reason };
  }
}