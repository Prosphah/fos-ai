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

  let body: { ids?: string[]; all?: boolean };
  try {
    body = await request.json();
  } catch {
    body = {};
  }

  let query = supabase
    .from("notifications")
    .update({ is_read: true })
    .eq("user_id", user.id)
    .eq("is_read", false);

  if (body.all) {
    // Mark all as read
  } else if (body.ids && body.ids.length > 0) {
    query = query.in("id", body.ids);
  } else {
    return NextResponse.json({ error: "Provide ids or all: true" }, { status: 400 });
  }

  const { error } = await query;

  if (error) {
    console.error("Failed to mark notifications as read:", error);
    return NextResponse.json({ error: "Failed to update" }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
