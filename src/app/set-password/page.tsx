import type { Metadata } from "next";

import { LogoIcon } from "@/components/brand/LogoIcon";

import SetPasswordClient from "./set-password-client";

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
 * Deliberately a client component. Supabase verifies the invitation server-side
 * and redirects with the session in a URL fragment, which no server ever
 * receives, so this page has to read window.location.hash and call setSession
 * before it can know who is arriving. A server component would render "this
 * link no longer works" for every buyer, every time.
 */
export default function SetPasswordPage() {
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
            <SetPasswordClient />
          </div>
        </div>
      </div>
    </main>
  );
}