"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";

type Status = "idle" | "loading" | "error";

/**
 * Minimum enforced here. Supabase's own minimum is configurable per project and
 * may be higher, so the server's rejection is surfaced rather than assumed
 * unreachable.
 */
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

export default function SetPasswordForm({
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
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState("");

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setError("");

    if (password !== confirm) {
      setStatus("error");
      setError("Those passwords do not match.");
      return;
    }

    setStatus("loading");

    const supabase = createClient();
    const { error: updateError } = await supabase.auth.updateUser({ password });

    if (updateError) {
      setStatus("error");
      setError(updateError.message);
      return;
    }

    // The session established by the invitation is still valid, so there is no
    // need to sign in again. "/" decides where a new account belongs.
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
        style={{
          marginTop: "24px",
          display: "flex",
          flexDirection: "column",
          gap: "16px",
        }}
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
          disabled={status === "loading"}
          size="lg"
          className="w-full"
          style={{ minHeight: "44px" }}
        >
          {status === "loading" ? (
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