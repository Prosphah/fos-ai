import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { endpoint: string; p256dh: string; auth: string; userAgent?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { endpoint, p256dh, auth: authKey, userAgent } = body;

  if (!endpoint || !p256dh || !authKey) {
    return NextResponse.json(
      { error: "Missing required fields: endpoint, p256dh, auth" },
      { status: 400 }
    );
  }

  let endpointUrl: URL;
  try {
    endpointUrl = new URL(endpoint);
  } catch {
    return NextResponse.json({ error: "Invalid push endpoint" }, { status: 400 });
  }

  const hostname = endpointUrl.hostname.toLowerCase();
  const allowedHost =
    endpointUrl.protocol === "https:" &&
    (hostname === "fcm.googleapis.com" ||
      hostname === "updates.push.services.mozilla.com" ||
      hostname.endsWith(".notify.windows.com") ||
      hostname === "web.push.apple.com");

  if (!allowedHost) {
    return NextResponse.json({ error: "Invalid push endpoint" }, { status: 400 });
  }

  const { error } = await supabase.from("push_subscriptions").upsert(
    {
      user_id: user.id,
      endpoint,
      p256dh,
      auth: authKey,
      user_agent: userAgent || null,
      is_active: true,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id,endpoint" }
  );

  if (error) {
    console.error("Failed to save push subscription:", error);
    return NextResponse.json({ error: "Failed to save subscription" }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
