import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");

  if (code) {
    try {
      const supabase = await createClient();
      const { error } = await supabase.auth.exchangeCodeForSession(code);

      if (error) {
        console.error("Auth callback failed:", error.message);
        return NextResponse.redirect(`${origin}/login?error=auth_callback_failed`);
      }
    } catch (error) {
      console.error("Auth callback failed:", error);
      return NextResponse.redirect(`${origin}/login?error=auth_callback_failed`);
    }
  }

  return NextResponse.redirect(`${origin}/`);
}