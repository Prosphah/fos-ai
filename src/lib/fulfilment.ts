import { createAdminClient } from "@/lib/supabase/admin";
import { getCourseAccessUrl, type CourseTier } from "@/lib/money-mastery";

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
    const { data, error } = await admin.auth.admin.inviteUserByEmail(normalizedEmail);

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