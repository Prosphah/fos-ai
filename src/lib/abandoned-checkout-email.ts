import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Abandoned-checkout recovery delivery.
 *
 * A checkout that stays pending — the buyer reached Paystack and left, or the
 * card was declined — is a person who raised their hand and walked out of the
 * shop. This module hands the facts of that checkout to a Make.com scenario
 * that composes and sends one recovery email through Zoho, the same handoff
 * the purchase confirmation uses.
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

/** Make's incoming-webhook URL for the recovery scenario. Unset disables sending. */
const WEBHOOK_URL = process.env.ABANDONED_CHECKOUT_WEBHOOK_URL?.trim();

/**
 * The scenario's API key, sent as the x-make-apikey header. Same mechanism as
 * the purchase scenario: Make answers 401 unless a configured key matches.
 */
const WEBHOOK_SECRET =
  process.env.ABANDONED_CHECKOUT_WEBHOOK_SECRET?.trim();

/** Hard ceiling on the post, so one slow scenario cannot eat the sweep's budget. */
const TRIGGER_TIMEOUT_MS = 3_000;

/** Everything the scenario needs to write the recovery email. */
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
 * Takes exclusive ownership of a checkout before anything is sent.
 *
 * Same compare-and-swap as the purchase claim: it only writes while
 * recovery_started_at is still null, so a sweep and a future second touch
 * cannot both send. The timestamp is written before the post and released on
 * failure, which makes delivery at-least-once — a duplicate recovery email is
 * an annoyance, while a buyer who wanted the course and got silence is a
 * sale lost.
 */
async function claim(reference: string): Promise<boolean> {
  try {
    const { data, error } = await createAdminClient()
      .from("enrollments")
      .update({
        recovery_started_at: new Date().toISOString(),
        // One touch, by design. The column exists so a second touch at a
        // longer delay can be added without a migration; until then no path
        // increments it past 1.
        recovery_attempts: 1,
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
 * Hands a claim back so the next sweep run can retry it.
 *
 * Returns whether the row is actually unclaimed afterwards. A release that
 * fails leaves the row claimed with nothing in the database to distinguish
 * it from a successful send, and the sweep only selects rows with a null
 * claim — so silence here would strand the buyer permanently. One immediate
 * retry catches the transient Supabase blips that dominate this failure
 * mode; if even the retry fails, the caller reports a `release-failed`
 * reason into the sweep's visible failures instead of reporting the row as
 * unclaimed.
 *
 * A time-based stale-claim reaper is deliberately absent: a claimed row is
 * indistinguishable from a delivered email (a successful send stays
 * claimed), so bulk-releasing stale claims would re-email buyers who were
 * already contacted. The residual risk after a double failure is one buyer
 * needing a manual `update ... set recovery_started_at = null` — annoying,
 * but bounded and loud.
 */
async function release(reference: string): Promise<boolean> {
  const attempt = async (): Promise<boolean> => {
    const { error } = await createAdminClient()
      .from("enrollments")
      .update({ recovery_started_at: null, recovery_attempts: 0 })
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
 * Posts one abandoned checkout to the Make scenario.
 *
 * Never throws and never rejects — the caller is a cron sweep processing a
 * batch, and one bad row must not take the rest of the run with it.
 */
export async function triggerAbandonedCheckoutEmail(
  checkout: AbandonedCheckoutEmail,
): Promise<TriggerResult> {
  if (!WEBHOOK_URL) {
    // Not an error. A deployment without the scenario configured behaves as
    // before: rows stay unclaimed and eligible, so wiring Make up later needs
    // no backfill.
    return { triggered: false, marked: false, reason: "not-configured" };
  }

  if (!(await claim(checkout.reference))) {
    // Claimed by a concurrent run, or the claim write failed outright.
    return { triggered: false, marked: false, reason: "already-claimed" };
  }

  try {
    const response = await fetch(WEBHOOK_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(WEBHOOK_SECRET
          ? {
              // Same header contract as the purchase scenario. Make rejects
              // with 401 unless the key arrives under this exact name.
              "x-make-apikey": WEBHOOK_SECRET,
              "X-Abandoned-Checkout-Secret": WEBHOOK_SECRET,
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
      const released = await release(checkout.reference);
      // A release that failed leaves the row claimed; it must not be
      // reported as a plain HTTP failure, which reads as "eligible again
      // next run" when it is not. The sweep surfaces this prefix in its
      // failures list.
      return {
        triggered: false,
        marked: false,
        reason: released ? `http-${response.status}` : `release-failed-http-${response.status}`,
      };
    }

    return { triggered: true, marked: true, reason: "accepted" };
  } catch (error) {
    const reason = error instanceof Error ? error.name : "unknown";
    console.error(
      `[abandoned-checkout] Could not reach the scenario for ${checkout.reference}: ${reason}`,
    );
    const released = await release(checkout.reference);
    return {
      triggered: false,
      marked: false,
      reason: released ? reason : `release-failed-${reason}`,
    };
  }
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
  email: string,
): Promise<void> {
  try {
    const { error } = await createAdminClient()
      .from("enrollments")
      .update({
        recovery_started_at: new Date().toISOString(),
        recovery_attempts: 1,
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
