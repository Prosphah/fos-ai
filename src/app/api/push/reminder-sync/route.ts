import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: settings, error } = await supabase
    .from("user_settings")
    .select("reminder_enabled, reminder_time, reminder_days")
    .eq("user_id", user.id)
    .maybeSingle();

  if (error) {
    return NextResponse.json(
      { error: "Failed to fetch user settings" },
      { status: 500 }
    );
  }

  const reminderSettings = settings ?? {
    reminder_enabled: true,
    reminder_time: "19:00",
    reminder_days: [0, 1, 2, 3, 4, 5, 6],
  };

  return NextResponse.json({
    reminders: [
      {
        userId: user.id,
        enabled: reminderSettings.reminder_enabled,
        time: reminderSettings.reminder_time,
        days: reminderSettings.reminder_days,
      },
    ],
  });
}
