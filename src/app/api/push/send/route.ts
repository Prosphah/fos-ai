import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import webPush from "web-push";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const vapidPublicKey = process.env.VAPID_PUBLIC_KEY;
const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY;
const vapidEmail = process.env.VAPID_EMAIL;

if (vapidPublicKey && vapidPrivateKey && vapidEmail) {
  webPush.setVapidDetails(vapidEmail, vapidPublicKey, vapidPrivateKey);
}

interface PushPayload {
  title: string;
  body?: string;
  url?: string;
  tag?: string;
  targetUserId?: string;
  type?: string;
}

export async function POST(request: Request) {
  if (!vapidPublicKey || !vapidPrivateKey || !vapidEmail) {
    return NextResponse.json(
      { error: "VAPID keys not configured on the server" },
      { status: 503 }
    );
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: PushPayload;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { title, body: notifBody, url, tag, targetUserId, type } = body;

  if (!title) {
    return NextResponse.json({ error: "title is required" }, { status: 400 });
  }

  const userId = targetUserId || user.id;

  // Save to notifications table so it appears in the panel
  const { error: notifError } = await supabase.from("notifications").insert({
    user_id: userId,
    title,
    body: notifBody || null,
    icon: null,
    url: url || "/money-manager",
    type: type || "reminder",
    is_read: false,
  });

  if (notifError) {
    console.error("Failed to save notification to DB:", notifError);
    return NextResponse.json({ error: "Failed to save notification" }, { status: 500 });
  }

  // Fetch active push subscriptions
  const { data: subscriptions, error: fetchError } = await supabase
    .from("push_subscriptions")
    .select("id, endpoint, p256dh, auth")
    .eq("user_id", userId)
    .eq("is_active", true);

  if (fetchError) {
    console.error("Failed to fetch subscriptions:", fetchError);
    return NextResponse.json({ error: "Failed to fetch subscriptions" }, { status: 500 });
  }

  if (!subscriptions || subscriptions.length === 0) {
    return NextResponse.json({ success: true, sent: 0, failed: 0, total: 0 });
  }

  const payload = JSON.stringify({
    title,
    body: notifBody || "",
    url: url || "/money-manager",
    tag: tag || undefined,
  });

  let sent = 0;
  let failed = 0;
  const expiredIds: string[] = [];

  const results = await Promise.allSettled(
    subscriptions.map(async (sub) => {
      try {
        await webPush.sendNotification(
          {
            endpoint: sub.endpoint,
            keys: { p256dh: sub.p256dh, auth: sub.auth },
          },
          payload
        );
        sent++;
      } catch (err: any) {
        failed++;
        console.error(`Push failed for sub ${sub.id}:`, err.statusCode, err.body || err.message);
        if (err.statusCode === 404 || err.statusCode === 410) {
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

  return NextResponse.json({
    success: true,
    sent,
    failed,
    total: subscriptions.length,
  });
}
