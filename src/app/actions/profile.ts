"use server";

import { createClient } from "@/lib/supabase/server";

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

export async function getProfile() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data } = await supabase
    .from("financial_profiles")
    .select("first_name, last_name, age, country, currency, employment_status, monthly_income, income_frequency")
    .eq("user_id", user.id)
    .maybeSingle();

  return data;
}

export async function updateProfile(data: {
  firstName?: string;
  lastName?: string;
  age?: number;
  country?: string;
  currency?: string;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (data.firstName !== undefined) updates.first_name = data.firstName;
  if (data.lastName !== undefined) updates.last_name = data.lastName;
  if (data.age !== undefined) updates.age = data.age;
  if (data.country !== undefined) updates.country = data.country;
  if (data.currency !== undefined) updates.currency = data.currency;

  const { error } = await supabase
    .from("financial_profiles")
    .update(updates)
    .eq("user_id", user.id);

  if (error) return { error: error.message };
  return { success: true };
}
