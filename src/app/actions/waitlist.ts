"use server";

import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

const waitlistSchema = z.object({
  email: z.string().email("Please enter a valid email address."),
  feature: z.enum(["assistant", "goals"]),
});

export async function joinWaitlist(input: unknown) {
  const parsed = waitlistSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Please check your input." };
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const { error } = await supabase.from("waitlist").insert({
    user_id: user.id,
    email: parsed.data.email,
    feature: parsed.data.feature,
  });

  if (error) return { error: "Could not join the waitlist. Please try again." };
  return { success: true };
}
