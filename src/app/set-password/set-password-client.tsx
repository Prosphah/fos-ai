"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, Loader2, TriangleAlert } from "lucide-react";

import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";

type Phase = "checking" | "ready" | "expired";

const MIN_LENGTH = 8;

const inputStyle: React.CSSProperties = {
  display: "block",
  width: "100%",
  borderRadius: "var(--radius-sm)",
  border: "1px solid var(--glass-border)",
  background: "var(--glass-bg)",
  padding: "12px 16px",
  fontSize: "0.875rem",
  color: "var(--text-1)",
  outline: "none",
  transition: "border-color 0.2s var(--ease), box-shadow 0.2s var(--ease)",
};

const inputClass =
  "focus:border-[var(--accent)] focus:shadow-[0_0_0_3px_var(--accent-soft)]";

/**
 * Turns the invitation's redirect into a session.
 *
 * This has to happen in the browser, and that is not a style choice. Supabase
 * verifies an invitation server-side and redirects to redirect_to carrying the
 * session as a URL fragment:
 *
 *   https://fos-ai.betiangli.xyz/set-password#access_token=...&refresh_token=...
 *
 * A fragment is never transmitted to a server. A server-rendered page cannot
 * see it, and neither can a server redirect, which drops it on the way past.
 * That is exactly why routing the invitation through /auth/callback failed: the
 * redirect reached the password page with the tokens still in the address bar
 * of a request the server never saw, and every buyer got told the link had
 * expired.
 *
 * Both delivery shapes are handled. The fragment is what this project
 * receives today. The code parameter is handled as well, because it is what a
 * PKCE flow would deliver, and this should not break silently if GoTrue is
 * switched over.
 */
function useInvitationSession() {
  const [phase, setPhase] = useState<Phase>("checking");
  const [email, setEmail] = useState("");
  const [firstName, setFirstName] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function establish() {
      const supabase = createClient();

      const hash = new URLSearchParams(window.location.hash.replace(/^#/, ""));
      const accessToken = hash.get("access_token");
      const refreshToken = hash.get("refresh_token");

      if (accessToken && refreshToken) {
        const { error } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken,
        });

        // Strip the tokens from the address bar immediately. They are bearer
        // credentials for this account, and leaving them in place means they
        // sit in history and can travel in a Referer header.
        window.history.replaceState(null, "", window.location.pathname);

        if (error) {
          if (!cancelled) setPhase("expired");
          return;
        }
      }

      const code = new URLSearchParams(window.location.search).get("code");
      if (!accessToken && code) {
        await supabase.auth.exchangeCodeForSession(code);
        window.history.replaceState(null, "", window.location.pathname);
      }

      const { data } = await supabase.auth.getSession();
      const user = data.session?.user;

      if (cancelled) return;

      if (!user) {
        setPhase("expired");
        return;
      }

      const fullName = user.user_metadata?.full_name;
      setEmail(user.email ?? "");
      setFirstName(typeof fullName === "string" ? fullName.split(" ")[0] : null);
      setPhase("ready");
    }

    establish();

    return () => {
      cancelled = true;
    };
  }, []);

  return { phase, email, firstName };
}

export default function SetPasswordClient() {
  const { phase, email, firstName } = useInvitationSession();

  if (phase === "checking") {
    return (
      <div style={{ textAlign: "center", padding: "24px 0" }}>
        <Loader2
          className="mx-auto animate-spin"
          size={26}
          style={{ color: "var(--accent)" }}
        />
        <p style={{ marginTop: "16px", fontSize: "0.875rem", color: "var(--text-3)" }}>
          Confirming your invitation…
        </p>
      </div>
    );
  }

  if (phase === "expired") {
    return (
      <>
        <div style={{ textAlign: "center" }}>
          <TriangleAlert size={28} className="mx-auto" style={{ color: "var(--amber)" }} />
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
              fontSize: "0.875rem",
              fontWeight: 600,
              color: "var(--accent)",
              textDecoration: "none",
            }}
          >
            Go to sign in
          </Link>
        </div>
      </>
    );
  }

  return <PasswordForm email={email} firstName={firstName} />;
}

function PasswordForm({
  email,
  firstName,
}: {
  email: string;
  firstName: string | null;
}) {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setError("");

    if (password !== confirm) {
      setError("Those passwords do not match.");
      return;
    }

    setLoading(true);

    const supabase = createClient();
    const { error: updateError } = await supabase.auth.updateUser({ password });

    if (updateError) {
      setLoading(false);
      setError(updateError.message);
      return;
    }

    // "/" decides where a new account belongs: onboarding when it has no
    // profile yet, otherwise straight to the briefing.
    router.replace("/");
    router.refresh();
  }

  return (
    <>
      <p
        style={{
          fontFamily: "var(--font-mono-family)",
          fontSize: "0.625rem",
          fontWeight: 600,
          textTransform: "uppercase",
          letterSpacing: "0.1em",
          color: "var(--text-3)",
        }}
      >
        One last step
      </p>
      <h1
        style={{
          marginTop: "6px",
          fontFamily: "var(--font-display-family)",
          fontSize: "1.25rem",
          fontWeight: 700,
          letterSpacing: "-0.02em",
          color: "var(--text-1)",
        }}
      >
        {firstName ? `Set your password, ${firstName}` : "Set your password"}
      </h1>
      <p
        style={{
          marginTop: "4px",
          fontSize: "0.875rem",
          lineHeight: 1.7,
          color: "var(--text-3)",
        }}
      >
        Your FOS·AI account is already reserved for{" "}
        <strong style={{ color: "var(--text-2)" }}>{email}</strong>. Choose a
        password to activate it.
      </p>

      <form
        onSubmit={submit}
        style={{ marginTop: "24px", display: "flex", flexDirection: "column", gap: "16px" }}
      >
        <div>
          <label
            htmlFor="password"
            style={{
              display: "block",
              fontSize: "0.875rem",
              fontWeight: 500,
              color: "var(--text-2)",
              marginBottom: "6px",
            }}
          >
            Password
          </label>
          <div style={{ position: "relative" }}>
            <input
              id="password"
              type={show ? "text" : "password"}
              required
              minLength={MIN_LENGTH}
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={`At least ${MIN_LENGTH} characters`}
              style={{ ...inputStyle, paddingRight: "44px" }}
              className={inputClass}
            />
            <button
              type="button"
              onClick={() => setShow((s) => !s)}
              aria-label={show ? "Hide password" : "Show password"}
              style={{
                position: "absolute",
                right: "12px",
                top: "50%",
                transform: "translateY(-50%)",
                color: "var(--text-3)",
                display: "flex",
                alignItems: "center",
                padding: "4px",
                borderRadius: "var(--radius-xs)",
                background: "none",
                border: "none",
                cursor: "pointer",
              }}
            >
              {show ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
        </div>

        <div>
          <label
            htmlFor="confirm"
            style={{
              display: "block",
              fontSize: "0.875rem",
              fontWeight: 500,
              color: "var(--text-2)",
              marginBottom: "6px",
            }}
          >
            Confirm password
          </label>
          <input
            id="confirm"
            type={show ? "text" : "password"}
            required
            minLength={MIN_LENGTH}
            autoComplete="new-password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            placeholder="Type it once more"
            style={inputStyle}
            className={inputClass}
          />
        </div>

        {error && (
          <div
            role="alert"
            style={{
              borderRadius: "var(--radius-sm)",
              border: "1px solid var(--rose-soft)",
              background: "var(--rose-soft)",
              padding: "12px 16px",
              fontSize: "0.875rem",
              color: "var(--rose)",
            }}
          >
            {error}
          </div>
        )}

        <Button
          type="submit"
          disabled={loading}
          size="lg"
          className="w-full"
          style={{ minHeight: "44px" }}
        >
          {loading ? (
            <>
              <Loader2 className="size-4 animate-spin" />
              Setting your password…
            </>
          ) : (
            "Activate my account"
          )}
        </Button>
      </form>
    </>
  );
}