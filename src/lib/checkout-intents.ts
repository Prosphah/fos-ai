import { getCourseAccessUrl, type CourseTier } from "@/lib/money-mastery";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Checkout intent capture.
 *
 * A pending row is written before Paystack is called, so that people who start
 * a checkout and do not finish are visible. Without it enrollments only ever
 * contains sales, and a storefront that converts 2% and one that converts 2%
 * out of ten visitors look identical.
 *
 * The row is written under the same paystack_reference the webhook upserts on,
 * so a completed purchase updates this row rather than adding another. That
 * also means the row is guaranteed to exist before Paystack could possibly call
 * back, which removes the race between "insert the intent" and "receive the
 * webhook".
 *
 * Nothing in this file throws. Recording intent is bookkeeping; a sale that
 * completes without a pending row is still a sale, and losing the row only
 * costs an entry in the analytics. Failing the request would cost revenue over
 * a database that is briefly unavailable.
 */

/** Shape written to enrollments at checkout start. */
export type CheckoutIntent = {
  reference: string;
  email: string;
  fullName: string;
  tier: CourseTier;
  amount: number;
  variant: "a" | "b" | "c" | null;
};

export async function recordCheckoutIntent(intent: CheckoutIntent): Promise<void> {
  try {
    const { error } = await createAdminClient().from("enrollments").insert({
      paystack_reference: intent.reference,
      email: intent.email,
      full_name: intent.fullName,
      tier: intent.tier,
      amount: intent.amount,
      status: "pending",
      source_variant: intent.variant,
      course_access_url: getCourseAccessUrl(),
    });

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
    const { error } = await createAdminClient()
      .from("enrollments")
      .update({ status: "failed" })
      .eq("paystack_reference", reference);

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