"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Eye, EyeOff, Loader2 } from "lucide-react";

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
        setSuccess(
          "Account created! Check your email for a confirmation link, then sign in."
        );
        setLoading(false);
        return;
      }

      router.replace("/");
    }
  };

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
      <div style={{ width: "100%", maxWidth: "24rem" }}>
        {/* Logo */}
        <div style={{ textAlign: "center", marginBottom: "32px" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "12px" }}>
            <Image
              src="/logo.png"
              alt="FOS·AI"
              width={48}
              height={48}
            />
            <span
              style={{
                fontFamily: "var(--font-display-family)",
                fontSize: "1.5rem",
                fontWeight: 700,
                letterSpacing: "-0.02em",
                color: "var(--text-1)",
              }}
            >
              fos.ai
            </span>
          </div>
          <p style={{ marginTop: "8px", fontSize: "0.875rem", color: "var(--text-3)" }}>
            Your Financial Operating System
          </p>
        </div>

        {/* Form card */}
        <div
          style={{
            borderRadius: "var(--radius-lg)",
            border: "1px solid var(--glass-border)",
            background: "var(--glass-bg)",
            padding: "32px",
            backdropFilter: "blur(24px) saturate(1.5)",
            WebkitBackdropFilter: "blur(24px) saturate(1.5)",
          }}
        >
          <h2 style={{ fontSize: "1.125rem", fontWeight: 600, color: "var(--text-1)" }}>
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
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                style={inputStyle}
                onFocus={(e) => { e.currentTarget.style.borderColor = "var(--accent)"; e.currentTarget.style.boxShadow = "0 0 0 3px var(--accent-soft)"; }}
                onBlur={(e) => { e.currentTarget.style.borderColor = "var(--glass-border)"; e.currentTarget.style.boxShadow = "none"; }}
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
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={mode === "signup" ? "At least 6 characters" : "Enter your password"}
                  style={{ ...inputStyle, paddingRight: "40px" }}
                  onFocus={(e) => { e.currentTarget.style.borderColor = "var(--accent)"; e.currentTarget.style.boxShadow = "0 0 0 3px var(--accent-soft)"; }}
                  onBlur={(e) => { e.currentTarget.style.borderColor = "var(--glass-border)"; e.currentTarget.style.boxShadow = "none"; }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: "absolute",
                    right: "12px",
                    top: "50%",
                    transform: "translateY(-50%)",
                    color: "var(--text-3)",
                    display: "flex",
                    alignItems: "center",
                  }}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {error && (
              <div style={{ borderRadius: "var(--radius-sm)", border: "1px solid var(--rose-soft)", background: "var(--rose-soft)", padding: "12px 16px", fontSize: "0.875rem", color: "var(--rose)" }}>
                {error}
              </div>
            )}

            {success && (
              <div style={{ borderRadius: "var(--radius-sm)", border: "1px solid var(--accent-soft)", background: "var(--accent-soft)", padding: "12px 16px", fontSize: "0.875rem", color: "var(--accent)" }}>
                {success}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              style={{
                display: "flex",
                width: "100%",
                alignItems: "center",
                justifyContent: "center",
                borderRadius: "var(--radius-sm)",
                background: "var(--accent)",
                padding: "12px 16px",
                fontSize: "0.875rem",
                fontWeight: 600,
                color: "#fff",
                border: "none",
                cursor: loading ? "not-allowed" : "pointer",
                opacity: loading ? 0.6 : 1,
                transition: "background 0.2s var(--ease), opacity 0.2s var(--ease)",
              }}
            >
              {loading ? (
                <>
                  <Loader2 size={16} style={{ marginRight: "8px", animation: "spin 1s linear infinite" }} />
                  {mode === "signin" ? "Signing in\u2026" : "Creating account\u2026"}
                </>
              ) : (
                <>{mode === "signin" ? "Sign in" : "Create account"}</>
              )}
            </button>
          </form>

          <div style={{ marginTop: "24px", textAlign: "center", fontSize: "0.875rem", color: "var(--text-3)" }}>
            {mode === "signin" ? (
              <>
                Don&apos;t have an account?{" "}
                <button
                  type="button"
                  onClick={() => { setMode("signup"); setError(""); setSuccess(""); }}
                  style={{ fontWeight: 600, color: "var(--accent)", background: "none", border: "none", cursor: "pointer", padding: 0 }}
                >
                  Create one
                </button>
              </>
            ) : (
              <>
                Already have an account?{" "}
                <button
                  type="button"
                  onClick={() => { setMode("signin"); setError(""); setSuccess(""); }}
                  style={{ fontWeight: 600, color: "var(--accent)", background: "none", border: "none", cursor: "pointer", padding: 0 }}
                >
                  Sign in
                </button>
              </>
            )}
          </div>
        </div>

        <p style={{ marginTop: "24px", textAlign: "center", fontSize: "0.75rem", color: "var(--text-3)" }}>
          By continuing, you agree to our{" "}
          <Link href="/privacy" style={{ color: "var(--accent)", textDecoration: "none" }}>
            Privacy Policy
          </Link>
        </p>
      </div>
    </main>
  );
}
