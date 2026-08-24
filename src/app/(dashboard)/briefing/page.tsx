import { redirect } from "next/navigation";
import { AppShell } from "@/components/layout/AppShell";
import { GreetingHeader } from "@/components/financial/GreetingHeader";
import { FinancialHealthHero } from "@/components/financial/FinancialHealthHero";
import { SnapshotSection } from "@/components/financial/SnapshotSection";
import { InsightCard } from "@/components/financial/InsightCard";
import { RiskOverview } from "@/components/financial/RiskOverview";
import { RecommendedActions } from "@/components/financial/RecommendedActions";
import { getBriefingData } from "@/services/financial-health.service";
import { createClient } from "@/lib/supabase/server";

export default async function BriefingPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const data = await getBriefingData(user.id);
  const name = user.user_metadata?.full_name ?? user.email?.split("@")[0] ?? "there";

  return (
    <AppShell>
      <GreetingHeader name={name} />

      <FinancialHealthHero score={data.financialHealthScore} />

      <SnapshotSection userId={user.id} initialData={data} />

      <InsightCard />

      <RiskOverview items={data.riskItems} />

      <RecommendedActions items={data.actionItems} />
    </AppShell>
  );
}
