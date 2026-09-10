"use server";

import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

const feedbackSchema = z.object({
  area: z.enum(["briefing", "money_manager", "assistant", "tools", "settings", "other"]),
  feedbackType: z.enum(["improvement", "feature_request", "bug", "other"]),
  message: z.string().trim().min(10, "Please share at least 10 characters.").max(4000),
});

export async function submitFeedback(input: unknown) {
  const parsed = feedbackSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Please check your feedback." };
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const { error } = await supabase.from("feedback").insert({
    user_id: user.id,
    area: parsed.data.area,
    feedback_type: parsed.data.feedbackType,
    message: parsed.data.message,
  });

  if (error) return { error: "Could not submit feedback. Please try again." };
  return { success: true };
}