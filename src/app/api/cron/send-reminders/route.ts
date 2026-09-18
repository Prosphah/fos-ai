import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import webPush from "web-push";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const vapidPublicKey = process.env.VAPID_PUBLIC_KEY;
const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY;
const vapidEmail = process.env.VAPID_EMAIL;
const CRON_SECRET = process.env.CRON_SECRET;

if (vapidPublicKey && vapidPrivateKey && vapidEmail) {
  webPush.setVapidDetails(vapidEmail, vapidPublicKey, vapidPrivateKey);
}

function getTimeInTimezone(tz: string): { hours: number; minutes: number; day: number; dateKey: string } {
  try {
    const now = new Date();
    const parts = new Intl.DateTimeFormat("en-US", {
      timeZone: tz,
      hour: "numeric",
      minute: "numeric",
      hourCycle: "h23",
      weekday: "short",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).formatToParts(now);

    const hour = parseInt(parts.find((p) => p.type === "hour")?.value ?? "0", 10);
    const minute = parseInt(parts.find((p) => p.type === "minute")?.value ?? "0", 10);
    const weekdayStr = parts.find((p) => p.type === "weekday")?.value ?? "Sun";
    const year = parts.find((p) => p.type === "year")?.value ?? "1970";
    const month = parts.find((p) => p.type === "month")?.value ?? "01";
    const dayOfMonth = parts.find((p) => p.type === "day")?.value ?? "01";

    const dayMap: Record<string, number> = {
      Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6,
    };
    const day = dayMap[weekdayStr] ?? 0;
    const dateKey = `${year}-${month}-${dayOfMonth}`;

    return { hours: hour, minutes: minute, day, dateKey };
  } catch {
    const now = new Date();
    return {
      hours: now.getUTCHours(),
      minutes: now.getUTCMinutes(),
      day: now.getUTCDay(),
      dateKey: now.toISOString().slice(0, 10),
    };
  }
}

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (!CRON_SECRET || authHeader !== `Bearer ${CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!vapidPublicKey || !vapidPrivateKey || !vapidEmail) {
    return NextResponse.json({ error: "VAPID keys not configured" }, { status: 503 });
  }

  let supabase;
  try {
    supabase = createAdminClient();
  } catch {
    return NextResponse.json({ error: "Server misconfigured" }, { status: 500 });
  }

  const { data: settings, error: fetchError } = await supabase
    .from("user_settings")
    .select("user_id, reminder_enabled, reminder_time, reminder_days, timezone")
    .eq("reminder_enabled", true);

  if (fetchError) {
    console.error("[Cron] Failed to fetch reminder settings:", fetchError);
    return NextResponse.json({ error: "Database error" }, { status: 500 });
  }

  if (!settings || settings.length === 0) {
    return NextResponse.json({ success: true, processed: 0, sent: 0 });
  }

  let processed = 0;
  let sent = 0;

  for (const setting of settings) {
    const tz = setting.timezone || "UTC";
    const { hours, minutes, day, dateKey } = getTimeInTimezone(tz);

    const reminderDays = Array.isArray(setting.reminder_days) ? setting.reminder_days : [];
    if (!reminderDays.includes(day)) continue;

    const reminderTime = typeof setting.reminder_time === "string" ? setting.reminder_time.slice(0, 5) : "19:00";
    const [rh, rm] = reminderTime.split(":").map(Number);
    if (hours !== rh || minutes !== rm) continue;

    const { error: claimError } = await supabase
      .from("reminder_deliveries")
      .insert({
        user_id: setting.user_id,
        delivery_date: dateKey,
        reminder_time: reminderTime,
      });

    if (claimError) {
      if (claimError.code === "23505") continue;
      console.error(`[Cron] Failed to claim delivery for user ${setting.user_id}:`, claimError);
      return NextResponse.json({ error: "Delivery claim failed" }, { status: 500 });
    }

    processed++;

    const { data: subscriptions, error: subError } = await supabase
      .from("push_subscriptions")
      .select("id, endpoint, p256dh, auth")
      .eq("user_id", setting.user_id)
      .eq("is_active", true);

    if (subError) {
      console.error(`[Cron] Failed to fetch subscriptions for user ${setting.user_id}:`, subError);
    }

    if (subscriptions && subscriptions.length > 0) {
      const payload = JSON.stringify({
        title: "Have you recorded your transactions?",
        body: "Tap to open Money Manager and log today's cash movements.",
        url: "/money-manager",
      });

      const expiredIds: string[] = [];

      await Promise.allSettled(
        subscriptions.map(async (sub) => {
          try {
            await webPush.sendNotification(
              { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
              payload
            );
            sent++;
          } catch (err: unknown) {
            const pushErr = err as { statusCode?: number };
            if (pushErr.statusCode === 404 || pushErr.statusCode === 410) {
              expiredIds.push(sub.id);
            }
          }
        })
      );

      if (expiredIds.length > 0) {
        await supabase
          .from("push_subscriptions")
          .update({ is_active: false, updated_at: new Date().toISOString() })
          .in("id", expiredIds);
      }
    }

    await supabase.from("notifications").insert({
      user_id: setting.user_id,
      title: "Have you recorded your transactions?",
      body: "Tap to open Money Manager and log today's cash movements.",
      icon: null,
      url: "/money-manager",
      type: "reminder",
      is_read: false,
    });
  }

  return NextResponse.json({ success: true, processed, sent });
}
