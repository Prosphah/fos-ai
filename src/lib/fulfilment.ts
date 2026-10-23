import { createAdminClient } from "@/lib/supabase/admin";
import { getCourseAccessUrl, type CourseTier } from "@/lib/money-mastery";
import { SITE_ORIGIN } from "@/lib/seo";

export type FosaiOutcome =
  | "not-applicable"
  | "invited"
  | "existing"
  | "failed"
  /**
   * The purchase was refunded. Distinct from "not-applicable" because the
   * caller must stop short of announcing the sale, not merely skip FOS*AI.
   */
  | "refunded";

export type FulfilmentResult = {
  fosaiOutcome: FosaiOutcome;
  fosaiNote: string;
};

/**
 * Turns a verified payment into access.
 *
 * 1. Upserts the enrollment keyed on the payment reference (idempotent, so a
 *    retried webhook cannot create a second row).
 * 2. Invites the buyer to FOS*AI with the email they paid with, but only on the
 *    bundle tier, and only if they do not already hold an account.
 *
 * An address that already has an account is linked to the purchase instead of
 * being invited again. Supabase will not invite an existing user, and treating
 * that refusal as a sent invitation is how a buyer ends up waiting for an email
 * that was never queued.
 */
export async function fulfilEnrollment(params: {
  email: string;
  fullName: string | null;
  tier: CourseTier;
  amount: number;
  reference: string;
  transactionId: number | null;
  /** Which storefront variant produced the sale. Null when unattributed. */
  sourceVariant?: "a" | "b" | "c" | null;
  /** Which processor owns the reference. Written for the recovery sweep. */
  paymentProvider?: "paystack" | "flutterwave";
  /** E.164 digits captured at checkout, when there was one. */
  phone?: string | null;
}): Promise<FulfilmentResult> {
  const admin = createAdminClient();
  const normalizedEmail = params.email.trim().toLowerCase();

  const { data: existing } = await admin
    .from("enrollments")
    .select("status")
    .eq("paystack_reference", params.reference)
    .maybeSingle();

  /*
   * A refunded purchase is never provisioned. The success page calls this on
   * every render, so without this guard a buyer who revisits their receipt
   * after a refund would be walked through the FOS*AI invitation a second
   * time — an invitation for access that was already taken back. Returning
   * before the upsert also leaves the row's status alone: refunded is the one
   * state a payment callback must not talk its way out of.
   */
  if (existing?.status === "refunded") {
    return {
      fosaiOutcome: "refunded",
      fosaiNote: "Purchase was refunded; nothing was provisioned.",
    };
  }

  /*
   * Preserve a status that says more than "paid" does. The success page calls
   * this on every render, so without this check a buyer who reloads their
   * receipt would move an active FOS*AI enrolment back to "paid".
   */
  const status =
    existing &&
    (existing.status === "active" || existing.status === "provisioning")
      ? existing.status
      : "paid";

  const { data: enrollment, error: upsertError } = await admin
    .from("enrollments")
    .upsert(
      {
        email: normalizedEmail,
        full_name: params.fullName,
        tier: params.tier,
        amount: params.amount,
        currency: "NGN",
        status,
        paystack_reference: params.reference,
        paystack_transaction_id: params.transactionId,
        course_access_url: getCourseAccessUrl(),
        source_variant: params.sourceVariant ?? null,
        // Only written when supplied, so a rescue path that does not know the
        // provider cannot overwrite a value recorded at checkout.
        ...(params.paymentProvider ? { payment_provider: params.paymentProvider } : {}),
        ...(params.phone ? { customer_phone: params.phone } : {}),
        // A followed-up checkout that ends in a payment reads clean again —
        // the checkout-intents migration's contract ("reset to 0 on
        // payment"). These columns describe pending rows only.
        followup_step: 0,
        followup_sent_at: null,
      },
      { onConflict: "paystack_reference" }
    )
    .select("id, fosai_user_id, fosai_invited_at")
    .single();

  if (upsertError) {
    throw new Error(`Could not record enrollment: ${upsertError.message}`);
  }

  // A payment is the end of the buyer's recovery story, not just of the row
  // it belongs to. A buyer who attempts several checkouts and pays one of
  // them leaves the others pending with a first-touch claim on them; the
  // abandoned-checkout sweep would later select those rows (touch 1 looks
  // for unclaimed pending rows, touch 2 looks for pending rows at step 1)
  // and email someone whose payment already landed. The upsert above hushes
  // the paid row itself — these two updates hush the other attempts, at the
  // one place every payment truth passes through: the webhook's fulfil
  // path and the recovery sweep's rescue path both call this function.
  //
  // followup_step 2 is the sweep's "no further touch" marker, and the pair
  // keeps travelling with recovery_attempts, so rows read one story:
  // contacted once, second touch closed by a payment, never further mail.
  // followup_sent_at is cleared rather than kept — no second email was ever
  // triggered for these rows — which also makes them invisible to the
  // second-touch SELECT's age test on its own.
  const hushedAt = new Date().toISOString();

  // Rows the recovery sweep already claimed (the first email went out at
  // touch-1 time and recovery_started_at records it): preserve that stamp.
  const { error: claimedSiblingsError } = await admin
    .from("enrollments")
    .update({
      recovery_attempts: 2,
      followup_step: 2,
      followup_sent_at: null,
    })
    .eq("email", normalizedEmail)
    .eq("status", "pending")
    .neq("paystack_reference", params.reference)
    .not("recovery_started_at", "is", null);

  if (claimedSiblingsError) {
    console.error(
      `[fulfilment] Could not hush claimed sibling checkouts for ${normalizedEmail}: ${claimedSiblingsError.message}`
    );
  }

  // Rows the sweep never claimed: stamp them now. claimRemainingCheckoutsFor
  // Email promises that once a buyer "has been contacted — or has paid",
  // every pending row under their email is moot, but only payment carries a
  // hook that fires even when no email ever went out, so the stamp is
  // written here; without it, an hour-old unclaimed attempt would get a
  // recovery email even though the buyer paid a different attempt minutes
  // after starting it.
  const { error: freshSiblingsError } = await admin
    .from("enrollments")
    .update({
      recovery_started_at: hushedAt,
      recovery_attempts: 2,
      followup_step: 2,
      followup_sent_at: null,
    })
    .eq("email", normalizedEmail)
    .eq("status", "pending")
    .neq("paystack_reference", params.reference)
    .is("recovery_started_at", null);

  if (freshSiblingsError) {
    console.error(
      `[fulfilment] Could not hush unclaimed sibling checkouts for ${normalizedEmail}: ${freshSiblingsError.message}`
    );
  }

  if (params.tier !== "course_fosai") {
    return {
      fosaiOutcome: "not-applicable",
      fosaiNote: "Course-only tier, no FOS*AI access.",
    };
  }

  if (enrollment.fosai_user_id) {
    return enrollment.fosai_invited_at
      ? {
          fosaiOutcome: "invited",
          fosaiNote: "FOS*AI invitation was already sent.",
        }
      : {
          fosaiOutcome: "existing",
          fosaiNote: "Purchase is already linked to an existing FOS*AI account.",
        };
  }

  try {
    /*
     * Ask whether the buyer already has an account before inviting them.
     *
     * Supabase answers an invite for a registered address with "already been
     * registered" and sends nothing. The old code read that as a successful
     * invite, stamped fosai_invited_at and moved the row to active, so the
     * buyer was told to watch their inbox for an email that never existed.
     *
     * A lookup failure is not fatal: the invite below is still worth trying,
     * and the error branch repeats the lookup in case the address was
     * registered between the two calls.
     */
    const existingUser = await findUserByEmail(normalizedEmail).catch(
      (error: unknown) => {
        console.error(
          `[fulfilment] Could not look up FOS*AI account for ${normalizedEmail}: ${
            error instanceof Error ? error.message : "Unknown error"
          }`
        );
        return null;
      }
    );

    if (existingUser) {
      await linkExistingUser(enrollment.id, normalizedEmail, existingUser.id);
      return {
        fosaiOutcome: "existing",
        fosaiNote:
          "Buyer already has a FOS*AI account; purchase linked without a new invitation.",
      };
    }

    // The invitation has to land directly on /set-password, not on the site
    // root and not through /auth/callback.
    //
    // Supabase verifies the token server-side and redirects to redirect_to
    // carrying the session as a URL fragment:
    //
    //   https://fos-ai.betiangli.xyz/set-password#access_token=...&refresh_token=...
    //
    // A fragment is never transmitted to a server. The root page therefore sees
    // no session and redirects to /login, which asks a buyer for a password
    // they have never chosen; signing up instead fails because the address
    // already exists. Routing through /auth/callback does not help either,
    // because the server redirect that follows drops the fragment on the floor
    // before the next page ever sees it.
    //
    // /set-password reads window.location.hash and establishes the session in
    // the browser, which is the only place the tokens exist.
    const inviteOptions = {
      redirectTo: `${SITE_ORIGIN}/set-password`,
      // Carry the buyer's name into user_metadata so the account is not
      // anonymous and the page can greet them. Omitted entirely rather than
      // written as null, which would put a literal null where the app expects a
      // string.
      ...(params.fullName ? { data: { full_name: params.fullName } } : {}),
    };

    const { data, error } = await admin.auth.admin.inviteUserByEmail(
      normalizedEmail,
      inviteOptions,
    );

    if (error) {
      // Already registered means the account was created between the lookup
      // and this invite. Link it rather than pretending an email went out.
      if (/already been registered|already exists/i.test(error.message)) {
        const racedUser = await findUserByEmail(normalizedEmail).catch(
          () => null
        );
        if (racedUser) {
          await linkExistingUser(
            enrollment.id,
            normalizedEmail,
            racedUser.id
          );
          return {
            fosaiOutcome: "existing",
            fosaiNote:
              "Buyer already has a FOS*AI account; purchase linked without a new invitation.",
          };
        }
      }
      throw error;
    }

    await admin
      .from("enrollments")
      .update({
        fosai_user_id: data.user?.id ?? null,
        fosai_invited_at: new Date().toISOString(),
        status: "active",
      })
      .eq("id", enrollment.id);

    return {
      fosaiOutcome: "invited",
      fosaiNote: "FOS*AI invitation sent.",
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    await admin
      .from("enrollments")
      .update({ status: "provisioning" })
      .eq("id", enrollment.id);
    console.error(
      `[fulfilment] FOS*AI invite failed for ${normalizedEmail}: ${message}`
    );
    return {
      fosaiOutcome: "failed",
      fosaiNote: `FOS*AI invite failed: ${message}`,
    };
  }
}

async function linkExistingUser(
  enrollmentId: string,
  email: string,
  userId: string
): Promise<void> {
  const admin = createAdminClient();
  const { error } = await admin
    .from("enrollments")
    .update({
      fosai_user_id: userId,
      /*
       * No invitation was sent. Clearing this matters for rows written by the
       * old code, which stamped it on the "already registered" path and made
       * the receipt promise an email that Supabase never queued.
       */
      fosai_invited_at: null,
      status: "active",
    })
    .eq("id", enrollmentId)
    .eq("email", email);

  if (error) {
    throw new Error(`Could not link existing FOS*AI account: ${error.message}`);
  }

  console.log(`[fulfilment] Linked existing FOS*AI account for ${email}`);
}

/**
 * How long the FOS*AI user lookup may take, in total.
 *
 * This runs inside the payment webhook, and a GoTrue instance that hangs
 * would hold the webhook open until the provider gives up and retries the
 * whole charge. Four seconds matches the budget the recovery sweep gives a
 * provider verify.
 */
const USER_LOOKUP_TIMEOUT_MS = 4_000;

/**
 * Looks up an existing auth user by email.
 *
 * supabase-js's `admin.listUsers` only exposes page/perPage. GoTrue's
 * `/admin/users` endpoint supports a `filter` query, which is a substring
 * match, so the response is checked for the exact address before it is used.
 * The paged SDK path is kept as a fallback for a project whose endpoint stops
 * accepting `filter`; it is slower, but this runs only for a bundle purchase.
 */
async function findUserByEmail(email: string): Promise<{ id: string } | null> {
  const baseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/+$/, "");
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!baseUrl || !serviceKey) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY"
    );
  }

  const url = new URL(`${baseUrl}/auth/v1/admin/users`);
  url.searchParams.set("page", "1");
  url.searchParams.set("per_page", "20");
  url.searchParams.set("filter", email);

  // One clock for the whole lookup: the filtered fetch and the paged fallback
  // below draw from the same budget, so a slow first call cannot hand the
  // fallback a second full window and stretch the webhook past its timeout.
  const deadline = Date.now() + USER_LOOKUP_TIMEOUT_MS;

  const response = await fetch(url, {
    headers: { apikey: serviceKey, Authorization: `Bearer ${serviceKey}` },
    cache: "no-store",
    signal: AbortSignal.timeout(Math.max(deadline - Date.now(), 1)),
  });

  if (response.ok) {
    const body = (await response.json()) as {
      users?: Array<{ id?: unknown; email?: unknown }>;
    };
    const match = body.users?.find(
      (user) =>
        typeof user.id === "string" &&
        typeof user.email === "string" &&
        user.email.toLowerCase() === email
    );
    return match ? { id: match.id as string } : null;
  }

  // Older or differently configured GoTrue builds may not accept `filter`.
  // Fall back to the official, paginated admin endpoint, on the same clock as
  // the lookup above: every page is another sequential request and the webhook
  // is waiting on the whole loop.
  const admin = createAdminClient();

  for (let page = 1; page <= 10; page += 1) {
    const remaining = deadline - Date.now();
    if (remaining <= 0) break;

    // Raced rather than trusted: supabase-js exposes no per-request timeout,
    // so one stalled page would otherwise hang this function — and with it
    // the webhook — past every other budget in this file. The loss surfaces
    // as an error, and the caller already treats a failed lookup as "no
    // account", which proceeds to the invitation.
    let timer: ReturnType<typeof setTimeout> | undefined;
    const { data, error } = await Promise.race([
      admin.auth.admin.listUsers({ page, perPage: 1000 }),
      new Promise<never>((_, reject) => {
        timer = setTimeout(
          () => reject(new Error("FOS*AI user lookup timed out")),
          remaining
        );
      }),
    ]).finally(() => clearTimeout(timer));
    if (error) throw error;

    const match = data.users.find(
      (user) => user.email?.toLowerCase() === email
    );
    if (match) return { id: match.id };

    if (page >= (data.lastPage ?? 1)) break;
  }

  return null;
}
