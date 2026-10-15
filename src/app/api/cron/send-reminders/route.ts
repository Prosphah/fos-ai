import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import webPush from "web-push";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Matches timeout_milliseconds on the pg_net job that calls this route.
 *
 * The route walks every opted-in user whose reminder time falls inside the
 * catch-up window, claiming and pushing to each in turn. Normally that is a
 * handful of rows, but after downtime the window holds more, and a run that
 * outlived the caller's timeout would look like a failure to pg_net while
 * still completing here.
 */
export const maxDuration = 60;

const vapidPublicKey = process.env.VAPID_PUBLIC_KEY;
const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY;
const vapidEmail = process.env.VAPID_EMAIL;
const CRON_SECRET = process.env.CRON_SECRET;
const CATCH_UP_WINDOW_MINUTES = 15;
const CLAIM_STALE_AFTER_MINUTES = 10;
// 0-indexed with Sunday=0, matching dayMap below and the user_settings column
// default. Must never include 7: the cron has no weekday 7.
const DEFAULT_REMINDER_DAYS = [0, 1, 2, 3, 4, 5, 6];
const DEFAULT_REMINDER_TIME = "19:00";

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
    .select("user_id, reminder_enabled, reminder_time, reminder_days, timezone");

  if (fetchError) {
    console.error("[Cron] Failed to fetch reminder settings:", fetchError);
    return NextResponse.json({ error: "Database error" }, { status: 500 });
  }

  if (!settings || settings.length === 0) {
    // No settings rows exist at all. That is an environment problem, not a
    // user choice: rows are created at signup, so an empty table means the
    // backfill never ran. Make it loud rather than a cheerful no-op that looks
    // identical to a healthy idle run.
    console.error(
      "[Cron] user_settings is empty. Reminders cannot be delivered. " +
        "Run supabase/migrations/20261014000003_backfill_user_settings.sql " +
        "and confirm the VAPID_* env vars are set on the deployment."
    );
    return NextResponse.json(
      { error: "user_settings is empty", processed: 0, sent: 0, failed: 0 },
      { status: 503 }
    );
  }

  // Rows exist but none are opted in. That is a legitimate idle state: every
  // user turned reminders off. Return 200 so the watchdog stays quiet.
  const enabledSettings = settings.filter((s) => s.reminder_enabled === true);

  if (enabledSettings.length === 0) {
    return NextResponse.json({
      success: true,
      reason: "no users have reminders enabled",
      processed: 0,
      sent: 0,
      failed: 0,
    });
  }

  let processed = 0;
  let sent = 0;
  let failed = 0;

  for (const setting of enabledSettings) {
    const tz = setting.timezone || "UTC";
    const { hours, minutes, day, dateKey } = getTimeInTimezone(tz);

    const reminderDays = Array.isArray(setting.reminder_days)
      ? setting.reminder_days
      : DEFAULT_REMINDER_DAYS;
    if (!reminderDays.includes(day)) continue;

    const reminderTime = typeof setting.reminder_time === "string"
      ? setting.reminder_time.slice(0, 5)
      : DEFAULT_REMINDER_TIME;
    const [rh, rm] = reminderTime.split(":").map(Number);
    const minutesSinceReminder = hours * 60 + minutes - (rh * 60 + rm);
    if (minutesSinceReminder < 0 || minutesSinceReminder > CATCH_UP_WINDOW_MINUTES) continue;

    const staleBefore = new Date(Date.now() - CLAIM_STALE_AFTER_MINUTES * 60 * 1000).toISOString();
    const { data: claimToken, error: claimError } = await supabase.rpc("claim_reminder_delivery", {
      p_user_id: setting.user_id,
      p_delivery_date: dateKey,
      p_reminder_time: reminderTime,
      p_stale_before: staleBefore,
    });

    if (claimError) {
      if (claimError.code === "23505") continue;
      console.error(`[Cron] Failed to claim delivery for user ${setting.user_id}:`, claimError);
      failed++;
      continue;
    }
    if (!claimToken) continue;

    processed++;

    try {
      const { data: subscriptions, error: subError } = await supabase
        .from("push_subscriptions")
        .select("id, endpoint, p256dh, auth")
        .eq("user_id", setting.user_id)
        .eq("is_active", true);

      if (subError) throw subError;

      if (subscriptions && subscriptions.length > 0) {
        const payload = JSON.stringify({
          title: "Have you recorded your transactions?",
          body: "Tap to open Money Manager and log today's cash movements.",
          url: "/money-manager",
        });

        const expiredIds: string[] = [];
        let pushFailure: unknown;

        await Promise.all(
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
              } else {
                pushFailure = err;
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

        if (pushFailure) throw pushFailure;
      }

      const { error: completeError } = await supabase
        .from("reminder_deliveries")
        .update({ status: "completed", completed_at: new Date().toISOString() })
        .eq("claim_token", claimToken)
        .eq("user_id", setting.user_id)
        .eq("delivery_date", dateKey)
        .eq("reminder_time", reminderTime);
      if (completeError) throw completeError;

      const { error: notificationError } = await supabase.from("notifications").insert({
        user_id: setting.user_id,
        title: "Have you recorded your transactions?",
        body: "Tap to open Money Manager and log today's cash movements.",
        icon: null,
        url: "/money-manager",
        type: "reminder",
        is_read: false,
      });
      if (notificationError) {
        console.error(`[Cron] Failed to create in-app reminder for user ${setting.user_id}:`, notificationError);
      }
    } catch (error) {
      console.error(`[Cron] Failed to deliver reminder for user ${setting.user_id}:`, error);
      failed++;
      await supabase
        .from("reminder_deliveries")
        .update({ status: "failed" })
        .eq("claim_token", claimToken)
        .eq("user_id", setting.user_id)
        .eq("delivery_date", dateKey)
        .eq("reminder_time", reminderTime);
      continue;
    }
  }

  return NextResponse.json({ success: true, processed, sent, failed });
}
