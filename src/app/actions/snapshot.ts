"use server";

import { getBriefingDataByPeriod } from "@/services/financial-health.service";
import type { SnapshotPeriod } from "@/services/financial-health.service";
import { createClient } from "@/lib/supabase/server";

export async function fetchSnapshotByPeriod(userId: string, period: SnapshotPeriod) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || user.id !== userId) {
    return { metrics: [], chartData: [], chartValue: "", chartTrend: "", currency: "USD" };
  }
  return getBriefingDataByPeriod(userId, period);
}
