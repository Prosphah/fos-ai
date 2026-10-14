"use client";

import { useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  FileJson,
  Table2,
  Trash2,
  ChevronRight,
  Loader2,
  AlertTriangle,
} from "lucide-react";

const inputStyle: React.CSSProperties = {
  display: "block",
  width: "100%",
  padding: "12px 14px",
  borderRadius: "var(--radius-sm)",
  border: "1px solid var(--glass-border)",
  background: "var(--glass-bg)",
  fontSize: "0.875rem",
  color: "var(--text-1)",
  outline: "none",
};

const CSV_TABLES = [
  { id: "transactions", label: "Transactions" },
  { id: "accounts", label: "Accounts" },
  { id: "budgets", label: "Budgets" },
  { id: "savings_goals", label: "Savings goals" },
  { id: "categories", label: "Categories" },
  { id: "financial_goals", label: "Onboarding goals" },
  { id: "notifications", label: "Notifications" },
] as const;

export function AccountDataSection() {
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState("");
  const router = useRouter();

  const download = useCallback(
    (query: string, filename: string) => {
      // A plain anchor with the download attribute keeps the file out of the
      // React tree and lets the browser handle the save dialog.
      const link = document.createElement("a");
      link.href = `/api/account/export${query}`;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      link.remove();
    },
    []
  );

  const fetchArchive = useCallback(async () => {
    setBusy("archive");
    setError("");
    try {
      const res = await fetch("/api/account/export");
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? "Export failed.");
      }
      const blob = await res.blob();
      const stamp = new Date().toISOString().slice(0, 10);
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `fos-ai-export-${stamp}.json`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Export failed.");
    } finally {
      setBusy(null);
    }
  }, []);

  const downloadCsv = useCallback((table: string) => {
    setBusy(table);
    setError("");
    const stamp = new Date().toISOString().slice(0, 10);
    download(`?table=${table}`, `fos-ai-${table}-${stamp}.csv`);
    // The anchor fires synchronously; nothing to await.
    setTimeout(() => setBusy(null), 400);
  }, [download]);

  return (
    <>
      <div
        style={{
          border: "1px solid var(--glass-border)",
          borderRadius: "var(--radius)",
          background: "var(--glass-bg)",
          backdropFilter: "blur(16px)",
          WebkitBackdropFilter: "blur(16px)",
          padding: "24px",
          marginTop: "16px",
        }}
      >
        <h2
          style={{
            fontFamily: "var(--font-mono-family)",
            fontSize: "0.6875rem",
            fontWeight: 600,
            color: "var(--text-3)",
            textTransform: "uppercase",
            letterSpacing: "0.1em",
            marginBottom: "8px",
          }}
        >
          Your data
        </h2>
        <p
          style={{
            fontSize: "0.8125rem",
            color: "var(--text-3)",
            marginBottom: "20px",
            lineHeight: 1.6,
          }}
        >
          Download a copy of everything FOS&middot;AI holds about you. Use the full
          archive as a backup, or take a single table as CSV for a spreadsheet.
        </p>

        <button
          onClick={fetchArchive}
          disabled={busy !== null}
          style={rowButtonStyle}
        >
          <span style={rowIconWrap}>
            {busy === "archive" ? (
              <Loader2 size={18} className="animate-spin" />
            ) : (
              <FileJson size={18} />
            )}
          </span>
          <span style={rowTextStyle}>
            <span style={rowTitleStyle}>Download everything</span>
            <span style={rowSubStyle}>
              One JSON file: profile, transactions, goals, settings, and
              feedback
            </span>
          </span>
          <ChevronRight size={18} style={{ color: "var(--text-3)" }} />
        </button>

        <div
          style={{
            fontFamily: "var(--font-mono-family)",
            fontSize: "0.625rem",
            fontWeight: 600,
            color: "var(--text-3)",
            textTransform: "uppercase",
            letterSpacing: "0.1em",
            margin: "24px 0 10px",
          }}
        >
          Or a single table
        </div>

        <div style={chipWrap}>
          {CSV_TABLES.map((t) => (
            <button
              key={t.id}
              onClick={() => downloadCsv(t.id)}
              disabled={busy !== null}
              style={chipStyle}
            >
              {busy === t.id ? (
                <Loader2 size={13} className="animate-spin" />
              ) : (
                <Table2 size={13} />
              )}
              {t.label}
            </button>
          ))}
        </div>

        {error && (
          <div
            role="alert"
            style={{
              marginTop: "16px",
              borderRadius: "var(--radius-sm)",
              border: "1px solid var(--rose-soft)",
              background: "var(--rose-soft)",
              padding: "12px 16px",
              fontSize: "0.8125rem",
              color: "var(--rose)",
            }}
          >
            {error}
          </div>
        )}
      </div>

      <DangerZone onDeleted={() => router.replace("/login")} />
    </>
  );
}

function DangerZone({ onDeleted }: { onDeleted: () => void }) {
  const [open, setOpen] = useState(false);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const close = useCallback(() => {
    setOpen(false);
    setPassword("");
    setConfirm("");
    setError("");
  }, []);

  const canSubmit = password.length > 0 && confirm === "DELETE" && !busy;

  const handleDelete = async () => {
    if (!canSubmit) return;
    setBusy(true);
    setError("");

    try {
      const res = await fetch("/api/account/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password, confirm }),
      });

      const body = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(body.error ?? "We could not delete your account.");
      }

      // The account is gone. Clear anything this device cached, then leave.
      try {
        localStorage.clear();
        sessionStorage.clear();
      } catch {
        // Storage may be unavailable in private mode. The account is deleted
        // either way, so there is nothing to recover from.
      }
      onDeleted();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong.");
      setBusy(false);
    }
  };

  return (
    <>
      <div
        style={{
          border: "1px solid var(--rose-soft)",
          borderRadius: "var(--radius)",
          background: "var(--glass-bg)",
          backdropFilter: "blur(16px)",
          WebkitBackdropFilter: "blur(16px)",
          padding: "24px",
          marginTop: "16px",
        }}
      >
        <h2
          style={{
            fontFamily: "var(--font-mono-family)",
            fontSize: "0.6875rem",
            fontWeight: 600,
            color: "var(--rose)",
            textTransform: "uppercase",
            letterSpacing: "0.1em",
            marginBottom: "8px",
          }}
        >
          Danger zone
        </h2>
        <p
          style={{
            fontSize: "0.8125rem",
            color: "var(--text-3)",
            marginBottom: "20px",
            lineHeight: 1.6,
          }}
        >
          Deleting your account erases your profile, transactions, budgets, and
          goals. This cannot be undone.
        </p>

        <button
          onClick={() => {
            setOpen(true);
            setTimeout(() => inputRef.current?.focus(), 50);
          }}
          style={rowButtonStyle}
        >
          <span style={{ ...rowIconWrap, background: "var(--rose-soft)" }}>
            <Trash2 size={18} style={{ color: "var(--rose)" }} />
          </span>
          <span style={rowTextStyle}>
            <span style={{ ...rowTitleStyle, color: "var(--rose)" }}>
              Delete my account
            </span>
            <span style={rowSubStyle}>
              Permanently erase your data and close your account
            </span>
          </span>
          <ChevronRight size={18} style={{ color: "var(--rose)" }} />
        </button>
      </div>

      {open && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Delete your account"
          onClick={(e) => {
            if (e.target === e.currentTarget && !busy) close();
          }}
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 9999,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "24px",
            background: "rgba(0, 0, 0, 0.5)",
            backdropFilter: "blur(8px)",
            WebkitBackdropFilter: "blur(8px)",
          }}
        >
          <div
            style={{
              width: "100%",
              maxWidth: "420px",
              background: "var(--bg)",
              borderRadius: "var(--radius)",
              border: "1px solid var(--rose-soft)",
              padding: "32px 24px",
              textAlign: "center",
              boxShadow: "var(--shadow-card)",
            }}
          >
            <div
              style={{
                width: "48px",
                height: "48px",
                borderRadius: "12px",
                background: "var(--rose-soft)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                margin: "0 auto 16px",
              }}
            >
              <AlertTriangle size={24} style={{ color: "var(--rose)" }} />
            </div>

            <h2
              style={{
                fontFamily: "var(--font-display-family)",
                fontSize: "1.125rem",
                fontWeight: 700,
                color: "var(--text-1)",
                marginBottom: "8px",
              }}
            >
              Delete your account?
            </h2>
            <p
              style={{
                fontSize: "0.875rem",
                color: "var(--text-2)",
                lineHeight: 1.65,
                marginBottom: "20px",
              }}
            >
              This permanently erases your profile, transactions, accounts,
              budgets, and goals. There is no undo and no backup.
            </p>

            <div
              style={{
                textAlign: "left",
                borderRadius: "var(--radius-sm)",
                background: "var(--rose-soft)",
                padding: "12px 14px",
                marginBottom: "20px",
                fontSize: "0.75rem",
                color: "var(--text-2)",
                lineHeight: 1.6,
              }}
            >
              Download a copy first if you want one. Payment records are kept by
              law, but they are unlinked from your account.
            </div>

            <label
              htmlFor="delete-password"
              style={{
                display: "block",
                textAlign: "left",
                fontSize: "0.8125rem",
                fontWeight: 500,
                color: "var(--text-1)",
                marginBottom: "6px",
              }}
            >
              Your password
            </label>
            <input
              ref={inputRef}
              id="delete-password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={busy}
              style={inputStyle}
            />

            <label
              htmlFor="delete-confirm"
              style={{
                display: "block",
                textAlign: "left",
                fontSize: "0.8125rem",
                fontWeight: 500,
                color: "var(--text-1)",
                margin: "16px 0 6px",
              }}
            >
              Type{" "}
              <code
                style={{
                  fontFamily: "var(--font-mono-family)",
                  color: "var(--rose)",
                }}
              >
                DELETE
              </code>{" "}
              to confirm
            </label>
            <input
              id="delete-confirm"
              type="text"
              autoComplete="off"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              disabled={busy}
              placeholder="DELETE"
              style={inputStyle}
            />

            {error && (
              <div
                role="alert"
                style={{
                  marginTop: "16px",
                  borderRadius: "var(--radius-sm)",
                  background: "var(--rose-soft)",
                  padding: "10px 14px",
                  fontSize: "0.8125rem",
                  color: "var(--rose)",
                }}
              >
                {error}
              </div>
            )}

            <div style={{ display: "flex", gap: "12px", marginTop: "24px" }}>
              <button
                onClick={close}
                disabled={busy}
                style={{
                  flex: 1,
                  padding: "12px 20px",
                  borderRadius: "999px",
                  border: "1px solid var(--glass-border)",
                  background: "transparent",
                  color: "var(--text-2)",
                  fontSize: "0.875rem",
                  cursor: busy ? "not-allowed" : "pointer",
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={!canSubmit}
                style={{
                  flex: 1,
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "8px",
                  padding: "12px 20px",
                  borderRadius: "999px",
                  border: "1px solid var(--rose)",
                  background: canSubmit ? "var(--rose)" : "var(--rose-soft)",
                  color: canSubmit ? "#fff" : "var(--rose)",
                  fontSize: "0.875rem",
                  fontWeight: 600,
                  opacity: busy ? 0.6 : 1,
                  cursor: canSubmit && !busy ? "pointer" : "not-allowed",
                }}
              >
                {busy ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
                {busy ? "Deleting…" : "Delete permanently"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

/* ── Shared row styles, matching the Account card in Settings ───────── */

const rowButtonStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: "12px",
  width: "100%",
  padding: "14px 16px",
  borderRadius: "var(--radius-sm)",
  border: "1px solid var(--glass-border)",
  background: "var(--glass-bg)",
  color: "var(--text-1)",
  textAlign: "left",
  cursor: "pointer",
  fontSize: "0.875rem",
};

const rowIconWrap: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  width: "34px",
  height: "34px",
  borderRadius: "10px",
  background: "var(--accent-soft)",
  color: "var(--accent)",
  flexShrink: 0,
};

const rowTextStyle: React.CSSProperties = {
  flex: 1,
  minWidth: 0,
};

const rowTitleStyle: React.CSSProperties = {
  display: "block",
  fontWeight: 600,
};

const rowSubStyle: React.CSSProperties = {
  display: "block",
  marginTop: "3px",
  fontSize: "0.75rem",
  color: "var(--text-3)",
  lineHeight: 1.5,
};

const chipWrap: React.CSSProperties = {
  display: "flex",
  flexWrap: "wrap",
  gap: "8px",
};

const chipStyle: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  gap: "6px",
  padding: "7px 12px",
  minHeight: "34px",
  borderRadius: "999px",
  border: "1px solid var(--glass-border)",
  background: "var(--glass-bg)",
  color: "var(--text-2)",
  fontSize: "0.75rem",
  fontWeight: 500,
  cursor: "pointer",
};