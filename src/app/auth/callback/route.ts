import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

/**
 * Where to send someone once their code has been exchanged.
 *
 * `intent` is matched against an exact value rather than being used as a path.
 * A `next=/whatever` parameter would let anyone who can get a link clicked
 * bounce a buyer to an arbitrary address after they authenticate.
 */
function destinationFor(intent: string | null, origin: string): string {
  return intent === "set-password" ? `${origin}/set-password` : `${origin}/`;
}

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

  // An invitation arrives here with no code of its own: Supabase has already
  // verified the token and handed us a session. Without this the buyer would
  // continue to "/", find no profile, and land back on a password prompt they
  // have no way to satisfy.
  return NextResponse.redirect(destinationFor(searchParams.get("intent"), origin));
}