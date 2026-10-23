import { getCourseAccessUrl, type CourseTier } from "@/lib/money-mastery";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Checkout intent capture.
 *
 * A pending row is written before the payment provider is called, so that
 * people who start a checkout and do not finish are visible. Without it
 * enrollments only ever contains sales, and a storefront that converts 2% and
 * one that converts 2% out of ten visitors look identical.
 *
 * The row is written under the same reference the webhook upserts on (stored in
 * the legacy paystack_reference column, which now holds either provider's
 * reference), so a completed purchase updates this row rather than adding
 * another. That also means the row is guaranteed to exist before the provider
 * could possibly call back, which removes the race between "insert the intent"
 * and "receive the webhook".
 *
 * Nothing in this file throws. Recording intent is bookkeeping; a sale that
 * completes without a pending row is still a sale, and losing the row only
 * costs an entry in the analytics. Failing the request would cost revenue over
 * a database that is briefly unavailable.
 */

/**
 * How long a bookkeeping write may delay a checkout before we stop waiting.
 *
 * PostgREST retries by default and backs off between attempts, so a database
 * that is slow rather than down can hold a request open for many seconds.
 * This runs in front of the provider call, so that stall is a stall in the
 * buyer's checkout, and it is a stall caused entirely by bookkeeping.
 */
const WRITE_TIMEOUT_MS = 2_000;

/**
 * Stops waiting on a write that has gone quiet.
 *
 * Takes a PromiseLike because a Supabase query builder is thenable but is not
 * a Promise: it has no catch or finally. Promise.resolve assimilates it, which
 * also gives the race a real promise to work with.
 *
 * Races rather than aborts, because PostgrestBuilder only accepts an
 * AbortSignal through its constructor and we do not build the builder. That
 * suits this case anyway: the row is either written a moment later or never
 * written, and neither outcome is worth holding a paying customer for.
 *
 * The timer is always cleared. Left running it would keep the event loop alive
 * past the response on a serverless instance, which is how you get billed for
 * idle time you have already finished using.
 */
async function withTimeout<T>(work: PromiseLike<T>, ms: number): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;

  const expiry = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(new Error(`Write timed out after ${ms}ms`)), ms);
  });

  try {
    return await Promise.race([Promise.resolve(work), expiry]);
  } finally {
    clearTimeout(timer);
  }
}

/** Shape written to enrollments at checkout start. */
export type CheckoutIntent = {
  reference: string;
  email: string;
  fullName: string;
  tier: CourseTier;
  amount: number;
  variant: "a" | "b" | "c" | null;
  /** Which provider owns this reference, so the sweep verifies the right API. */
  provider: "paystack" | "flutterwave";
  /** Buyer identifiers captured at checkout, sent with the TikTok Purchase. */
  clientIp: string | null;
  userAgent: string | null;
  ttclid: string | null;
  visitorId: string | null;
  /** E.164 digits, when the buyer supplied a number. */
  phone: string | null;
  /** The TikTok `_ttp` cookie, when the pixel has set one. */
  ttp: string | null;
  /**
   * Gift purchases: on a gift row `email` and `fullName` above name the
   * recipient, because that is whose access this is, and these columns record
   * the payer. All null/false on a normal purchase.
   */
  isGift: boolean;
  giftRecipientName: string | null;
  giftRecipientEmail: string | null;
  giftPurchaserName: string | null;
  giftPurchaserEmail: string | null;
};

export async function recordCheckoutIntent(intent: CheckoutIntent): Promise<void> {
  try {
    const { error } = await withTimeout(
      createAdminClient().from("enrollments").insert({
        paystack_reference: intent.reference,
        email: intent.email,
        full_name: intent.fullName,
        tier: intent.tier,
        amount: intent.amount,
        status: "pending",
        payment_provider: intent.provider,
        // Stored as null, not as the "control" that goes to payment metadata.
        // The webhook whitelists a/b/c and discards "control" before it writes,
        // so a null here is the same value the paid row will end up carrying.
        // Writing "control" instead would put an intent in one bucket and its
        // own completed purchase in another, splitting the control group in
        // the very query this row exists to make possible.
        source_variant: intent.variant,
        course_access_url: getCourseAccessUrl(),
        client_ip: intent.clientIp,
        client_user_agent: intent.userAgent,
        ttclid: intent.ttclid,
        visitor_id: intent.visitorId,
        customer_phone: intent.phone,
        ttp: intent.ttp,
        is_gift: intent.isGift,
        gift_recipient_name: intent.giftRecipientName,
        gift_recipient_email: intent.giftRecipientEmail,
        gift_purchaser_name: intent.giftPurchaserName,
        gift_purchaser_email: intent.giftPurchaserEmail,
      }),
      WRITE_TIMEOUT_MS,
    );

    if (error) {
      console.error("[checkout-intent] Could not record intent:", error.message);
    }
  } catch (error) {
    console.error(
      "[checkout-intent] Could not record intent:",
      error instanceof Error ? error.message : "Unknown error",
    );
  }
}

/**
 * Closes out an intent whose Paystack session could not be created.
 *
 * Distinct from an abandoned checkout, which is a person who chose to leave.
 * This one never got the chance to, so it must not be swept up into the
 * recovery sequence and emailed about a payment page they never reached.
 */
export async function markCheckoutFailed(reference: string): Promise<void> {
  try {
    const { error } = await withTimeout(
      createAdminClient()
        .from("enrollments")
        .update({ status: "failed" })
        .eq("paystack_reference", reference)
        // Only a checkout that has not completed can fail. Filtering on the
        // status keeps this update from ever overwriting a paid enrolment.
        //
        // Today the caller only reaches here when initializeTransaction threw,
        // and the buyer never receives an authorization URL in that case, so
        // there is nothing for them to pay and the webhook cannot have fired.
        // That makes this unreachable rather than merely unlikely, which is not
        // a good reason to leave it out: the guarantee currently rests on
        // control flow spanning two files instead of on the query itself.
        //
        // The cost of being wrong is high. A paid row downgraded to failed
        // disappears from the variant analytics and is skipped by the
        // purchase-email sweep, so the customer who paid is never emailed their
        // access. Silently, and with nothing in the logs to point at it.
        .eq("status", "pending"),
      WRITE_TIMEOUT_MS,
    );

    if (error) {
      console.error(
        "[checkout-intent] Could not mark checkout failed:",
        error.message,
      );
    }
  } catch (error) {
    console.error(
      "[checkout-intent] Could not mark checkout failed:",
      error instanceof Error ? error.message : "Unknown error",
    );
  }
}