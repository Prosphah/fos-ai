"use client";

import { useState } from "react";
import { Fingerprint, Loader2 } from "lucide-react";

interface Props {
  onAuthenticate: () => Promise<boolean>;
}

export function BiometricButton({ onAuthenticate }: Props) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);

  const handleClick = async () => {
    setLoading(true);
    setError(false);
    try {
      const success = await onAuthenticate();
      if (!success) {
        setError(true);
        setTimeout(() => setError(false), 2000);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={loading}
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: "8px",
        padding: "16px 24px",
        borderRadius: "var(--radius-sm)",
        border: `1px solid ${error ? "var(--rose-soft)" : "var(--glass-border)"}`,
        background: error ? "var(--rose-soft)" : "var(--glass-bg)",
        cursor: loading ? "not-allowed" : "pointer",
        opacity: loading ? 0.7 : 1,
        transition: "all 0.2s var(--ease)",
      }}
    >
      {loading ? (
        <Loader2 size={28} style={{ color: "var(--accent)", animation: "spin 1s linear infinite" }} />
      ) : (
        <Fingerprint size={28} style={{ color: error ? "var(--rose)" : "var(--accent)" }} />
      )}
      <span style={{ fontSize: "0.8125rem", color: error ? "var(--rose)" : "var(--text-2)" }}>
        {loading ? "Verifying..." : error ? "Failed — try again" : "Use biometric"}
      </span>
    </button>
  );
}
