import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export default async function Home() {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("financial_profiles")
    .select("onboarding_completed, risk_score")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!profile?.onboarding_completed && !profile?.risk_score) {
    redirect("/onboarding");
  }

  redirect("/briefing");
}
