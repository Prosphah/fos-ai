import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data, error } = await supabase
    .from("user_settings")
    .select("reminder_enabled, reminder_time, reminder_days")
    .eq("user_id", user.id)
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: "Failed to fetch reminder settings" }, { status: 500 });
  }

  if (!data) {
    return NextResponse.json({
      reminder_enabled: true,
      reminder_time: "19:00",
      reminder_days: [0, 1, 2, 3, 4, 5, 6],
    });
  }

  return NextResponse.json(data);
}

export async function PUT(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (body === null || typeof body !== "object" || Array.isArray(body)) {
    return NextResponse.json({ error: "Invalid reminder settings" }, { status: 400 });
  }

  const input = body as Record<string, unknown>;
  const hasEnabled = input.reminder_enabled !== undefined;
  const hasTime = input.reminder_time !== undefined;
  const hasDays = input.reminder_days !== undefined;
  const validTime = typeof input.reminder_time === "string" && /^([01]\d|2[0-3]):[0-5]\d$/.test(input.reminder_time);
  const validDays = Array.isArray(input.reminder_days) &&
    input.reminder_days.every((day) => Number.isInteger(day) && day >= 0 && day <= 6);

  if ((hasEnabled && typeof input.reminder_enabled !== "boolean") ||
      (hasTime && !validTime) ||
      (hasDays && (!validDays || new Set(input.reminder_days as number[]).size !== (input.reminder_days as number[]).length))) {
    return NextResponse.json({ error: "Invalid reminder settings" }, { status: 400 });
  }

  const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (hasEnabled) updates.reminder_enabled = input.reminder_enabled;
  if (hasTime) updates.reminder_time = input.reminder_time;
  if (hasDays) updates.reminder_days = input.reminder_days;

  const { error } = await supabase
    .from("user_settings")
    .upsert({ user_id: user.id, ...updates }, { onConflict: "user_id" });

  if (error) {
    console.error("Failed to update reminder settings:", error);
    return NextResponse.json({ error: "Failed to save" }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
