import { createAdminClient } from "@/lib/supabase/admin";
import { getCourseAccessUrl, type CourseTier } from "@/lib/money-mastery";
import { SITE_ORIGIN } from "@/lib/seo";

/**
 * Turns a verified payment into access.
 *
 * 1. Upserts the enrollment keyed on the Paystack reference (idempotent, so a
 *    retried webhook cannot create a second row).
 * 2. Invites the buyer to FOS*AI with the email they paid with, but only on the
 *    bundle tier, and only if they do not already hold an account.
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
}): Promise<{ fosaiInvited: boolean; fosaiNote: string }> {
  const admin = createAdminClient();
  const normalizedEmail = params.email.trim().toLowerCase();

  const { data: enrollment, error: upsertError } = await admin
    .from("enrollments")
    .upsert(
      {
        email: normalizedEmail,
        full_name: params.fullName,
        tier: params.tier,
        amount: params.amount,
        currency: "NGN",
        status: "paid",
        paystack_reference: params.reference,
        paystack_transaction_id: params.transactionId,
        course_access_url: getCourseAccessUrl(),
        source_variant: params.sourceVariant ?? null,
      },
      { onConflict: "paystack_reference" }
    )
    .select("id, fosai_user_id")
    .single();

  if (upsertError) {
    throw new Error(`Could not record enrollment: ${upsertError.message}`);
  }

  if (params.tier !== "course_fosai") {
    return { fosaiInvited: false, fosaiNote: "Course-only tier, no FOS*AI access." };
  }

  if (enrollment.fosai_user_id) {
    return { fosaiInvited: true, fosaiNote: "FOS*AI access was already provisioned." };
  }

  try {
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
      // Already registered means the buyer already has an account. Link it.
      if (/already been registered|already exists/i.test(error.message)) {
        await linkExistingUser(enrollment.id, normalizedEmail);
        return {
          fosaiInvited: true,
          fosaiNote: "Existing FOS*AI account found and linked to this purchase.",
        };
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

    return { fosaiInvited: true, fosaiNote: "FOS*AI invitation sent." };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    await admin
      .from("enrollments")
      .update({ status: "provisioning" })
      .eq("id", enrollment.id);
    return { fosaiInvited: false, fosaiNote: `FOS*AI invite failed: ${message}` };
  }
}

async function linkExistingUser(enrollmentId: string, email: string): Promise<void> {
  const admin = createAdminClient();
  // No public lookup by email, so let the buyer claim it on first sign-in instead.
  await admin
    .from("enrollments")
    .update({ fosai_invited_at: new Date().toISOString(), status: "active" })
    .eq("id", enrollmentId)
    .eq("email", email);
}