"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { LogoIcon } from "@/components/brand/LogoIcon";
import { Button } from "@/components/ui/button";

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");

    const supabase = createClient();

    if (mode === "signin") {
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError) {
        setError(
          signInError.message === "Invalid login credentials"
            ? "Wrong email or password. Please try again."
            : signInError.message
        );
        setLoading(false);
        return;
      }

      router.replace("/");
    } else {
      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (signUpError) {
        setError(signUpError.message);
        setLoading(false);
        return;
      }

      // If signUp returned a session, user is auto-confirmed — redirect
      if (data?.session) {
        router.replace("/");
        return;
      }

      // If the user already exists (common when switching modes), try signing in
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError) {
        setError(
          "An account with this email already exists. Log in with your password, or try a different email."
        );
        setLoading(false);
        return;
      }

      setSuccess("Welcome back! Signing you in…");
      router.replace("/");
    }
  };

  const inputClass =
    "focus:border-[var(--accent)] focus:shadow-[0_0_0_3px_var(--accent-soft)]";

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

  const toggleMode = () => {
    setMode((m) => (m === "signin" ? "signup" : "signin"));
    setError("");
    setSuccess("");
  };

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
      <div style={{ position: "relative", width: "100%", maxWidth: "24rem" }}>
        {/* Ambient glow behind the card */}
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
          {/* Logo */}
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
            <p
              style={{
                marginTop: "6px",
                fontFamily: "var(--font-mono-family)",
                fontSize: "0.6875rem",
                fontWeight: 600,
                letterSpacing: "0.1em",
                textTransform: "uppercase",
                color: "var(--text-3)",
              }}
            >
              Your Financial Operating System
            </p>
          </div>

          {/* Form card */}
          <div className="glass" style={{ padding: "32px" }}>
            <p
              style={{
                fontFamily: "var(--font-mono-family)",
                fontSize: "0.625rem",
                fontWeight: 600,
                letterSpacing: "0.1em",
                textTransform: "uppercase",
                color: "var(--text-3)",
              }}
            >
              {mode === "signin" ? "Secure access" : "New account"}
            </p>
            <h2
              style={{
                marginTop: "6px",
                fontFamily: "var(--font-display-family)",
                fontSize: "1.25rem",
                fontWeight: 700,
                letterSpacing: "-0.02em",
                color: "var(--text-1)",
              }}
            >
              {mode === "signin" ? "Welcome back" : "Create your account"}
            </h2>
            <p style={{ marginTop: "4px", fontSize: "0.875rem", color: "var(--text-3)" }}>
              {mode === "signin"
                ? "Sign in to your account to continue."
                : "Get started with your financial profile."}
            </p>

            <form onSubmit={handleSubmit} style={{ marginTop: "24px", display: "flex", flexDirection: "column", gap: "16px" }}>
              <div>
                <label htmlFor="email" style={{ display: "block", fontSize: "0.875rem", fontWeight: 500, color: "var(--text-2)", marginBottom: "6px" }}>
                  Email address
                </label>
                <input
                  id="email"
                  type="email"
                  required
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  style={inputStyle}
                  className={inputClass}
                />
              </div>

              <div>
                <label htmlFor="password" style={{ display: "block", fontSize: "0.875rem", fontWeight: 500, color: "var(--text-2)", marginBottom: "6px" }}>
                  Password
                </label>
                <div style={{ position: "relative" }}>
                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    required
                    minLength={6}
                    autoComplete={mode === "signin" ? "current-password" : "new-password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder={mode === "signup" ? "At least 6 characters" : "Enter your password"}
                    style={{ ...inputStyle, paddingRight: "44px" }}
                    className={inputClass}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={showPassword ? "Hide password" : "Show password"}
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
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              {error && (
                <div role="alert" style={{ borderRadius: "var(--radius-sm)", border: "1px solid var(--rose-soft)", background: "var(--rose-soft)", padding: "12px 16px", fontSize: "0.875rem", color: "var(--rose)" }}>
                  {error}
                </div>
              )}

              {success && (
                <div role="status" style={{ borderRadius: "var(--radius-sm)", border: "1px solid var(--accent-soft)", background: "var(--accent-soft)", padding: "12px 16px", fontSize: "0.875rem", color: "var(--accent)" }}>
                  {success}
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
                    {mode === "signin" ? "Signing in\u2026" : "Creating account\u2026"}
                  </>
                ) : (
                  <>{mode === "signin" ? "Sign in" : "Create account"}</>
                )}
              </Button>
            </form>

            <div style={{ marginTop: "24px", textAlign: "center", fontSize: "0.875rem", color: "var(--text-3)" }}>
              {mode === "signin" ? (
                <>
                  Don&apos;t have an account?{" "}
                  <Button type="button" variant="link" className="h-auto p-0" onClick={toggleMode}>
                    Create one
                  </Button>
                </>
              ) : (
                <>
                  Already have an account?{" "}
                  <Button type="button" variant="link" className="h-auto p-0" onClick={toggleMode}>
                    Sign in
                  </Button>
                </>
              )}
            </div>
          </div>

          <p style={{ marginTop: "24px", textAlign: "center", fontSize: "0.75rem", color: "var(--text-3)" }}>
            By continuing, you agree to our{" "}
            <Link href="/privacy" style={{ color: "var(--accent)", textDecoration: "none", fontWeight: 500 }}>
              Privacy Policy
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
}