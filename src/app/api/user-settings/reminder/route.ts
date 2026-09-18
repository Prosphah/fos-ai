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
    .select("reminder_enabled, reminder_time, reminder_days, timezone")
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
      timezone: "UTC",
    });
  }

  return NextResponse.json({
    reminder_enabled: data.reminder_enabled ?? true,
    reminder_time: typeof data.reminder_time === "string" ? data.reminder_time.slice(0, 5) : "19:00",
    reminder_days: Array.isArray(data.reminder_days)
      ? [...new Set(data.reminder_days as number[])]
          .filter((d): d is number => typeof d === "number" && Number.isInteger(d) && d >= 0 && d <= 6)
          .sort((a, b) => a - b)
      : [0, 1, 2, 3, 4, 5, 6],
    timezone: data.timezone || "UTC",
  });
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

  if ((hasTime && typeof input.reminder_time !== "string") ||
      (hasDays && !Array.isArray(input.reminder_days))) {
    return NextResponse.json({ error: "Invalid reminder settings" }, { status: 400 });
  }

  let normalizedTime: string | undefined;
  if (hasTime) {
    const match = (input.reminder_time as string).match(/^([01]\d|2[0-3]):[0-5]\d(?::[0-5]\d)?$/);
    if (match) {
      normalizedTime = match[0].slice(0, 5);
    } else {
      return NextResponse.json({ error: "Invalid reminder settings" }, { status: 400 });
    }
  }

  let normalizedDays: number[] | undefined;
  if (hasDays) {
    const unique = [...new Set(input.reminder_days as number[])].filter(
      (d): d is number => typeof d === "number" && Number.isInteger(d) && d >= 0 && d <= 6
    ).sort((a, b) => a - b);
    if (unique.length === 0) {
      return NextResponse.json({ error: "Invalid reminder settings" }, { status: 400 });
    }
    normalizedDays = unique;
  }

  if (hasEnabled && typeof input.reminder_enabled !== "boolean") {
    return NextResponse.json({ error: "Invalid reminder settings" }, { status: 400 });
  }

  const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (hasEnabled) updates.reminder_enabled = input.reminder_enabled;
  if (normalizedTime !== undefined) updates.reminder_time = normalizedTime;
  if (normalizedDays !== undefined) updates.reminder_days = normalizedDays;

  if (input.timezone !== undefined && typeof input.timezone !== "string") {
    return NextResponse.json({ error: "Invalid reminder settings" }, { status: 400 });
  }

  if (input.timezone !== undefined) {
    try {
      Intl.DateTimeFormat(undefined, { timeZone: input.timezone });
      updates.timezone = input.timezone;
    } catch {
      return NextResponse.json({ error: "Invalid reminder settings" }, { status: 400 });
    }
  }

  const { error } = await supabase
    .from("user_settings")
    .upsert({ user_id: user.id, ...updates }, { onConflict: "user_id" });

  if (error) {
    console.error("Failed to update reminder settings:", error);
    return NextResponse.json({ error: "Failed to save" }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
