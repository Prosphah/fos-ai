"use server";

import { createClient } from "@/lib/supabase/server";
import { profileDetailsSchema } from "@/lib/validation/onboarding";

export async function getProfileName(): Promise<{ firstName: string | null; lastName: string | null }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { firstName: null, lastName: null };

  const { data } = await supabase
    .from("financial_profiles")
    .select("first_name, last_name")
    .eq("user_id", user.id)
    .maybeSingle();

  return {
    firstName: data?.first_name ?? null,
    lastName: data?.last_name ?? null,
  };
}

/**
 * `age` is only selected for rows written before onboarding started collecting a
 * date of birth; the settings page prefers date_of_birth and falls back to it.
 */
export async function getProfile() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data } = await supabase
    .from("financial_profiles")
    .select("first_name, last_name, date_of_birth, age, currency")
    .eq("user_id", user.id)
    .maybeSingle();

  return data;
}

export async function updateProfile(data: {
  firstName?: string;
  lastName?: string;
  dateOfBirth?: string;
  currency?: string;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  // Only the fields the caller actually sent are validated. A partial save must
  // not be blocked by a field it never touched, so an absent date of birth is
  // left out of the payload entirely rather than sent as an empty string. Any
  // value that is supplied is still validated, so this cannot write an under 18
  // date of birth.
  const supplied: Record<string, unknown> = {};
  if (data.firstName !== undefined) supplied.firstName = data.firstName;
  if (data.lastName !== undefined) supplied.lastName = data.lastName;
  if (data.dateOfBirth) supplied.dateOfBirth = data.dateOfBirth;
  if (data.currency !== undefined) supplied.currency = data.currency;

  const parsed = profileDetailsSchema.safeParse(supplied);

  if (!parsed.success) {
    return { error: parsed.error.flatten().fieldErrors };
  }

  const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (data.firstName !== undefined) updates.first_name = parsed.data.firstName;
  if (data.lastName !== undefined) updates.last_name = parsed.data.lastName;
  if (parsed.data.dateOfBirth) updates.date_of_birth = parsed.data.dateOfBirth;
  if (data.currency !== undefined) updates.currency = parsed.data.currency;

  const { error } = await supabase
    .from("financial_profiles")
    .update(updates)
    .eq("user_id", user.id);

  if (error) return { error: error.message };

  // Currency lives in two columns: financial_profiles.currency drives the
  // briefing, user_settings.currency drives Money Manager. The settings page
  // exposes a single control, so write both or the two surfaces disagree.
  if (data.currency !== undefined) {
    const { error: settingsError } = await supabase.rpc("upsert_user_settings", {
      p_user_id: user.id,
      p_currency: data.currency,
    });
    if (settingsError) return { error: settingsError.message };
  }

  return { success: true };
}