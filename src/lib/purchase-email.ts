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
 * The webhook's API key, sent as a header.
 *
 * This is Make's own webhook authentication, not a convention of ours. A
 * custom webhook module with any API key added answers 401 to a request that
 * does not carry a matching one, and Make compares against every key on the
 * module, so any single one of them grants access.
 *
 * Required whenever an API key is configured on the Make module. The header
 * name is exact and case-insensitive; the value is what has to match.
 *
 * Make's webhook URLs already contain a long unguessable token, so this is not
 * the only thing standing between a leaked URL and arbitrary mail. It matters
 * because the payload carries a customer's name and email.
 */
const WEBHOOK_SECRET = process.env.PURCHASE_EMAIL_WEBHOOK_SECRET?.trim();

/**
 * Well inside the Paystack webhook window.
 *
 * Two budgets depend on this number. In the webhook it is additive on top of
 * fulfilment's own Supabase call, because a slow post means a slow response and
 * Paystack replays a webhook that does not answer in time. In the sweep it is
 * multiplied by the batch size, which is why that is kept small.
 */
const TRIGGER_TIMEOUT_MS = 3_000;

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

/**
 * Takes exclusive ownership of a purchase before anything is sent.
 *
 * The update is a compare-and-swap: it only writes when the column is still
 * null, and returns the row it touched. That single conditional is what makes
 * two concurrent callers resolve to one sender, because the database decides
 * the winner rather than the application.
 *
 * The timestamp is written before the post rather than after, because checking
 * for null after posting is not a lock. A Paystack replay and a sweep running
 * at the same moment both read null, both post, and the buyer gets the
 * confirmation twice.
 */
async function claim(reference: string): Promise<boolean> {
  try {
    const { data, error } = await createAdminClient()
      .from("enrollments")
      .update({ purchase_email_sent_at: new Date().toISOString() })
      .eq("paystack_reference", reference)
      .is("purchase_email_sent_at", null)
      .select("paystack_reference")
      .maybeSingle();

    if (error) {
      console.error("[purchase-email] Could not claim:", error.message);
      return false;
    }

    return data !== null;
  } catch (error) {
    console.error(
      "[purchase-email] Could not claim:",
      error instanceof Error ? error.message : "Unknown error",
    );
    return false;
  }
}

/**
 * Hands a claim back so the sweep can retry it.
 *
 * This makes the whole flow at-least-once rather than exactly-once, which is
 * the deliberate choice. An HTTP post has no way to distinguish "the scenario
 * never received this" from "the scenario received it and the response was
 * lost", so releasing on any failure risks a second confirmation email. The
 * alternative is holding the claim on failure, which risks a buyer who paid
 * never receiving anything. A duplicate email is an annoyance; a missing one
 * is a refund request.
 */
async function release(reference: string): Promise<void> {
  try {
    const { error } = await createAdminClient()
      .from("enrollments")
      .update({ purchase_email_sent_at: null })
      .eq("paystack_reference", reference);

    if (error) {
      console.error("[purchase-email] Could not release claim:", error.message);
    }
  } catch (error) {
    console.error(
      "[purchase-email] Could not release claim:",
      error instanceof Error ? error.message : "Unknown error",
    );
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
    //
    // Returns before claiming anything. Claiming here would stamp every row as
    // sent while nothing was sent, and the sweep would then skip all of them
    // once the URL was finally configured.
    return { triggered: false, marked: false, reason: "not-configured" };
  }

  if (!(await claim(purchase.reference))) {
    // Either a concurrent caller got there first, or the claim failed
    // outright. Neither is a reason to send.
    return { triggered: false, marked: false, reason: "already-claimed" };
  }

  try {
    const response = await fetch(WEBHOOK_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(WEBHOOK_SECRET
          ? {
              // Make rejects with 401 unless the API key arrives under this
              // exact name. Sending it under our own header name instead looks
              // correct and silently fails, which is the whole of the 401 this
              // was traced back to.
              "x-make-apikey": WEBHOOK_SECRET,
              // Also kept under our own name, so a scenario can still tell an
              // authorised post from an arbitrary one that somehow learned the
              // URL. Make ignores headers it does not recognise.
              "X-Purchase-Email-Secret": WEBHOOK_SECRET,
            }
          : {}),
      },
      body: JSON.stringify(payloadFor(purchase)),
      signal: AbortSignal.timeout(TRIGGER_TIMEOUT_MS),
    });

    if (!response.ok) {
      // Deliberately not logging the URL, which carries Make's token.
      console.error(
        `[purchase-email] Scenario returned ${response.status} for ${purchase.reference}`,
      );
      await release(purchase.reference);
      return { triggered: false, marked: false, reason: `http-${response.status}` };
    }

    // The claim doubles as the record that the confirmation went out.
    return { triggered: true, marked: true, reason: "accepted" };
  } catch (error) {
    // AbortError here is the timeout firing, which is the expected shape of a
    // Make outage rather than a programming fault.
    const reason = error instanceof Error ? error.name : "unknown";
    console.error(
      `[purchase-email] Could not reach the scenario for ${purchase.reference}: ${reason}`,
    );
    await release(purchase.reference);
    return { triggered: false, marked: false, reason };
  }
}