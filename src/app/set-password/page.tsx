import Link from "next/link";
import type { Metadata } from "next";
import { TriangleAlert } from "lucide-react";

import { LogoIcon } from "@/components/brand/LogoIcon";
import { createClient } from "@/lib/supabase/server";

import SetPasswordForm from "./set-password-form";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Set your password | FOS·AI",
  description: "Choose a password to activate your FOS·AI account.",
  // An authenticated buyer arriving here to choose a password should not end
  // up in a search index alongside the marketing pages.
  robots: { index: false, follow: false },
};

/**
 * Where a bundle buyer lands after following their invitation.
 *
 * Supabase has already verified the token by the time they arrive, so a
 * session exists and `updateUser({ password })` will succeed. That is the whole
 * point of this page: without it the invitation redirected to "/" with no
 * session ever exchanged, which bounced straight back to /login and asked for
 * a password the buyer had never chosen.
 */
export default async function SetPasswordPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return <LinkExpired />;
  }

  // Written at invite time from the name collected at checkout.
  const fullName = user.user_metadata?.full_name;
  const firstName = typeof fullName === "string" ? fullName.split(" ")[0] : null;

  return <SetPasswordForm email={user.email ?? ""} firstName={firstName} />;
}

function Card({ children }: { children: React.ReactNode }) {
  return (
    <main
      style={{
        display: "flex",
        minHeight: "100vh",
        alignItems: "center",
        justifyContent: "center",
        padding: "32px 16px",
      }}
    >
      <div style={{ position: "relative", width: "100%", maxWidth: "26rem" }}>
        <div
          aria-hidden="true"
          style={{
            position: "absolute",
            inset: "0 -40px",
            background:
              "radial-gradient(ellipse 480px 360px at 50% 30%, var(--accent-soft), transparent 70%)",
            pointerEvents: "none",
          }}
        />

        <div style={{ position: "relative" }}>
          <div style={{ textAlign: "center", marginBottom: "32px" }}>
            <div
              className="mx-auto mb-5"
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                width: "64px",
                height: "64px",
                borderRadius: "20px",
                background: "var(--glass-bg)",
                border: "1px solid var(--glass-border)",
                boxShadow: "var(--shadow-card), 0 0 32px var(--accent-glow)",
                backdropFilter: "blur(16px) saturate(1.3)",
              }}
            >
              <LogoIcon size={36} style={{ color: "var(--accent)" }} />
            </div>
            <span
              style={{
                fontFamily: "var(--font-display-family)",
                fontSize: "1.5rem",
                fontWeight: 700,
                letterSpacing: "-0.02em",
                color: "var(--text-1)",
              }}
            >
              FOS·AI
            </span>
          </div>

          <div className="glass" style={{ padding: "32px" }}>
            {children}
          </div>
        </div>
      </div>
    </main>
  );
}

/**
 * Reached when the invitation link is expired, or has already been used.
 *
 * Both are ordinary rather than exceptional: people double-click, and people
 * forward the email to themselves and try again on another device. Saying so
 * plainly and offering sign-in is the difference between a dead end and a
 * misunderstanding.
 */
function LinkExpired() {
  return (
    <Card>
      <div style={{ textAlign: "center" }}>
        <TriangleAlert
          size={28}
          className="mx-auto"
          style={{ color: "var(--amber)" }}
        />
        <h1
          style={{
            marginTop: "16px",
            fontFamily: "var(--font-display-family)",
            fontSize: "1.25rem",
            fontWeight: 700,
            letterSpacing: "-0.02em",
            color: "var(--text-1)",
          }}
        >
          This link no longer works
        </h1>
        <p
          style={{
            marginTop: "10px",
            fontSize: "0.875rem",
            lineHeight: 1.7,
            color: "var(--text-3)",
          }}
        >
          Invitation links work once and expire. If you have already set a
          password, sign in below. If not, email me from the address you
          purchased with and I will send a fresh link.
        </p>
      </div>

      <div style={{ marginTop: "24px", textAlign: "center" }}>
        <Link
          href="/login"
          style={{
            display: "inline-block",
            fontSize: "0.875rem",
            fontWeight: 600,
            color: "var(--accent)",
            textDecoration: "none",
          }}
        >
          Go to sign in
        </Link>
      </div>
    </Card>
  );
}