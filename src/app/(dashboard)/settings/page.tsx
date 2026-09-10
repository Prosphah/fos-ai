"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { useAppLock } from "@/hooks/use-app-lock";
import { getProfile, updateProfile } from "@/app/actions/profile";
import Link from "next/link";
import { useTheme } from "next-themes";
import { ShieldCheck, Fingerprint, Trash2, MessageSquare, ChevronRight, Sun, Moon, LogOut, Plus } from "lucide-react";
import { PinSetup, PinInput, type PinInputHandle } from "@/components/app-lock";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

const inputStyle = {
  display: "block",
  width: "100%",
  marginTop: "4px",
  padding: "12px 14px",
  borderRadius: "var(--radius-sm)",
  border: "1px solid var(--glass-border)",
  background: "var(--glass-bg)",
  fontSize: "0.875rem",
  color: "var(--text-1)",
  outline: "none",
  minHeight: "44px",
  transition: "border-color 0.2s var(--ease), box-shadow 0.2s var(--ease)",
};

const labelStyle = {
  fontSize: "0.875rem",
  fontWeight: 500 as const,
  color: "var(--text-1)",
};

export default function SettingsPage() {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [age, setAge] = useState("");
  const [country, setCountry] = useState("");
  const [currency, setCurrency] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
  const [hasPin, setHasPin] = useState(false);
  const [biometricAvailable, setBiometricAvailable] = useState(false);
  const [biometricRegistered, setBiometricRegistered] = useState(false);
  const { theme, setTheme } = useTheme();
  const { verifyPin, removePin, setupPin, registerBiometric } = useAppLock();
  const [showPinSetup, setShowPinSetup] = useState(false);
  const [showRemovePinModal, setShowRemovePinModal] = useState(false);
  const [removePinError, setRemovePinError] = useState("");
  const [securityError, setSecurityError] = useState("");
  const removePinRef = useRef<PinInputHandle>(null);
  const router = useRouter();

  const closePinSetup = useCallback(() => setShowPinSetup(false), []);
  const closeRemovePinModal = useCallback(() => setShowRemovePinModal(false), []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      if (showRemovePinModal) closeRemovePinModal();
      else if (showPinSetup) closePinSetup();
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [showRemovePinModal, showPinSetup, closeRemovePinModal, closePinSetup]);

  const handleLogout = async () => {
    const supabase = createClient();
    const { error } = await supabase.auth.signOut();
    if (error) {
      setError("Could not log out. Please try again.");
      return;
    }
    router.replace("/login");
  };

  useEffect(() => {
    void Promise.resolve().then(() => {
      setHasPin(!!localStorage.getItem("fos-ai-pin-hash"));
      setBiometricRegistered(!!localStorage.getItem("fos-ai-biometric-cred"));
    });
    getProfile().then((p) => {
      if (p) {
        setFirstName(p.first_name ?? "");
        setLastName(p.last_name ?? "");
        setAge(p.age?.toString() ?? "");
        setCountry(p.country ?? "");
        setCurrency(p.currency ?? "");
      }
    }).catch(() => {
      setError("Could not load your profile. Please try again.");
    }).finally(() => {
      setLoading(false);
    });

    if (window.PublicKeyCredential) {
      PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable().then(
        setBiometricAvailable
      ).catch(() => {
        setSecurityError("Could not check biometric availability. Please try again.");
      });
    }
  }, []);

  const handleSave = async () => {
    setSaving(true);
    setError("");
    setSuccess(false);

    try {
      const result = await updateProfile({
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        age: age ? parseInt(age, 10) : undefined,
        country: country.trim() || undefined,
        currency: currency || undefined,
      });

      if (result.error) {
        setError(result.error);
      } else {
        setSuccess(true);
        setTimeout(() => setSuccess(false), 3000);
      }
    } catch {
      setError("Could not save your changes. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <AppShell>
      <div>
        <h1 className="text-[40px] font-bold tracking-tight text-text-primary">
          Settings
        </h1>
        <p className="mt-2 text-base text-text-secondary">
          Manage your profile and preferences.
        </p>
      </div>

      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-14 animate-pulse rounded-lg bg-muted" />
          ))}
        </div>
      ) : (
        <>
        <div
          style={{
            borderRadius: "var(--radius)",
            border: "1px solid var(--glass-border)",
            background: "var(--glass-bg)",
            padding: "24px",
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
              marginBottom: "20px",
            }}
          >
            Profile
          </h2>

          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
              <div>
                <label htmlFor="first-name" style={labelStyle}>First name</label>
                <input
                  id="first-name"
                  type="text"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  placeholder="e.g. Michael"
                  style={inputStyle}
                />
              </div>
              <div>
                <label htmlFor="last-name" style={labelStyle}>Last name</label>
                <input
                  id="last-name"
                  type="text"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  placeholder="e.g. Johnson"
                  style={inputStyle}
                />
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
              <div>
                <label htmlFor="age" style={labelStyle}>Age</label>
                <input
                  id="age"
                  type="number"
                  value={age}
                  onChange={(e) => setAge(e.target.value)}
                  placeholder="e.g. 30"
                  style={inputStyle}
                />
              </div>
              <div>
                <label htmlFor="country" style={labelStyle}>Country</label>
                <input
                  id="country"
                  type="text"
                  value={country}
                  onChange={(e) => setCountry(e.target.value)}
                  placeholder="e.g. Nigeria"
                  style={inputStyle}
                />
              </div>
            </div>

            <div>
              <label htmlFor="currency" style={labelStyle}>Currency</label>
              <select
                id="currency"
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                style={{ ...inputStyle, appearance: "none" }}
              >
                <option value="">Select currency</option>
                <option value="USD">USD — US Dollar</option>
                <option value="EUR">EUR — Euro</option>
                <option value="GBP">GBP — British Pound</option>
                <option value="CAD">CAD — Canadian Dollar</option>
                <option value="AUD">AUD — Australian Dollar</option>
                <option value="JPY">JPY — Japanese Yen</option>
                <option value="NGN">NGN — Nigerian Naira</option>
                <option value="INR">INR — Indian Rupee</option>
                <option value="BRL">BRL — Brazilian Real</option>
                <option value="MXN">MXN — Mexican Peso</option>
              </select>
            </div>
          </div>

          {error && (
            <p style={{ marginTop: "12px", fontSize: "0.875rem", color: "var(--rose)" }}>
              {error}
            </p>
          )}
          {success && (
            <p style={{ marginTop: "12px", fontSize: "0.875rem", color: "var(--mint)" }}>
              Profile updated successfully.
            </p>
          )}

          <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "20px" }}>
            <button
              onClick={handleSave}
              disabled={saving}
              style={{
                padding: "10px 24px",
                borderRadius: "var(--radius-sm)",
                background: "var(--accent)",
                color: "#fff",
                fontSize: "0.875rem",
                fontWeight: 600,
                border: "none",
                cursor: saving ? "not-allowed" : "pointer",
                opacity: saving ? 0.6 : 1,
                transition: "opacity 0.2s var(--ease)",
              }}
            >
              {saving ? "Saving\u2026" : "Save changes"}
            </button>
          </div>
        </div>

        <div className="lg:hidden">
          <Link
            href="/feedback"
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: "16px",
              padding: "16px",
              borderRadius: "var(--radius)",
              border: "1px solid var(--accent-soft)",
              background: "var(--accent-soft)",
              color: "var(--accent)",
            }}
          >
            <span style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <MessageSquare size={20} />
              <span>
                <span style={{ display: "block", fontSize: "0.9375rem", fontWeight: 700 }}>Share feedback</span>
                <span style={{ display: "block", marginTop: "3px", fontSize: "0.75rem", color: "var(--text-2)" }}>
                  Help us improve FOS·AI
                </span>
              </span>
            </span>
            <ChevronRight size={18} />
          </Link>
        </div>

        <div
          style={{
            borderRadius: "var(--radius)",
            border: "1px solid var(--glass-border)",
            background: "var(--glass-bg)",
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
              marginBottom: "20px",
            }}
          >
            Appearance
          </h2>
          <button
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              width: "100%",
              padding: "14px 16px",
              borderRadius: "var(--radius-sm)",
              border: "1px solid var(--glass-border)",
              background: "var(--glass-bg)",
              color: "var(--text-1)",
              textAlign: "left",
              cursor: "pointer",
            }}
            aria-label="Toggle theme"
          >
            <span style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
              <span>
                <span style={{ display: "block", fontSize: "0.875rem", fontWeight: 500 }}>
                  Theme
                </span>
                <span style={{ display: "block", marginTop: "3px", fontSize: "0.75rem", color: "var(--text-3)" }}>
                  Switch between light and dark mode
                </span>
              </span>
            </span>
            <span style={{ fontSize: "0.75rem", color: "var(--text-3)", textTransform: "capitalize" }}>
              {theme === "dark" ? "Dark" : "Light"}
            </span>
          </button>
        </div>

        {/* Security Section */}
        <div
          style={{
            borderRadius: "var(--radius)",
            border: "1px solid var(--glass-border)",
            background: "var(--glass-bg)",
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
              marginBottom: "20px",
            }}
          >
            Security
          </h2>

          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            {!hasPin && !showPinSetup && (
              <button
                onClick={() => setShowPinSetup(true)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  width: "100%",
                  padding: "14px 16px",
                  borderRadius: "var(--radius-sm)",
                  border: "1px solid var(--accent-soft)",
                  background: "var(--accent-soft)",
                  color: "var(--accent)",
                  textAlign: "left",
                  cursor: "pointer",
                }}
              >
                <span style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                  <ShieldCheck size={18} />
                  <span>
                    <span style={{ display: "block", fontSize: "0.875rem", fontWeight: 600 }}>Set up App PIN</span>
                    <span style={{ display: "block", marginTop: "3px", fontSize: "0.75rem", color: "var(--text-2)" }}>
                      Secure your app with a 4-digit PIN
                    </span>
                  </span>
                </span>
                <Plus size={18} />
              </button>
            )}

            {showPinSetup && !hasPin && (
              <div
                role="dialog"
                aria-modal="true"
                aria-label="Set up App PIN"
                onClick={(e) => { if (e.target === e.currentTarget) setShowPinSetup(false); }}
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
                  animation: "overlay-in 0.2s var(--ease) forwards",
                }}
              >
                <div
                  style={{
                    width: "100%",
                    maxWidth: "360px",
                    background: "var(--bg)",
                    border: "1px solid var(--glass-border)",
                    borderRadius: "var(--radius)",
                    padding: "32px 24px",
                    animation: "modal-pop 0.3s var(--ease-spring) forwards",
                  }}
                >
                  <PinSetup
                    biometricAvailable={biometricAvailable}
                    onSetupComplete={async (pin, enableBiometric) => {
                      await setupPin(pin);
                      if (enableBiometric) {
                        const ok = await registerBiometric();
                        if (!ok) {
                          setSecurityError("PIN set, but biometric registration failed. You can enable it later.");
                        }
                      }
                      setHasPin(true);
                      setBiometricRegistered(!!localStorage.getItem("fos-ai-biometric-cred"));
                      setShowPinSetup(false);
                    }}
                  />
                  <button
                    onClick={() => setShowPinSetup(false)}
                    style={{
                      display: "block",
                      margin: "20px auto 0",
                      padding: "8px 20px",
                      borderRadius: "var(--radius-sm)",
                      border: "1px solid var(--glass-border)",
                      background: "transparent",
                      color: "var(--text-3)",
                      fontSize: "0.8125rem",
                      cursor: "pointer",
                    }}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {hasPin && (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "14px 16px",
                  borderRadius: "var(--radius-sm)",
                  border: "1px solid var(--glass-border)",
                  background: "var(--glass-bg)",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                  <ShieldCheck size={18} style={{ color: "var(--mint)" }} />
                  <div>
                    <p style={{ fontSize: "0.875rem", fontWeight: 500, color: "var(--text-1)" }}>
                      App PIN
                    </p>
                    <p style={{ fontSize: "0.75rem", color: "var(--text-3)" }}>
                      4-digit PIN is set
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setShowRemovePinModal(true);
                    setRemovePinError("");
                  }}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                    padding: "8px 12px",
                    borderRadius: "var(--radius-sm)",
                    border: "1px solid var(--rose-soft)",
                    background: "var(--rose-soft)",
                    color: "var(--rose)",
                    fontSize: "0.8125rem",
                    fontWeight: 500,
                    cursor: "pointer",
                  }}
                >
                  <Trash2 size={14} />
                  Remove
                </button>
              </div>
            )}

            {biometricAvailable && (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "14px 16px",
                  borderRadius: "var(--radius-sm)",
                  border: "1px solid var(--glass-border)",
                  background: "var(--glass-bg)",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                  <Fingerprint size={18} style={{ color: biometricRegistered ? "var(--mint)" : "var(--text-3)" }} />
                  <div>
                    <p style={{ fontSize: "0.875rem", fontWeight: 500, color: "var(--text-1)" }}>
                      Biometric Unlock
                    </p>
                    <p style={{ fontSize: "0.75rem", color: "var(--text-3)" }}>
                      {biometricRegistered ? "Enabled" : hasPin ? "Not configured" : "Set up a PIN first"}
                    </p>
                  </div>
                </div>
                {!biometricRegistered && hasPin && (
                  <button
                    onClick={async () => {
                      const ok = await registerBiometric();
                      if (ok) {
                        setBiometricRegistered(true);
                      } else {
                        setSecurityError("Biometric registration failed. Ensure your device supports fingerprint/Face ID.");
                      }
                    }}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "6px",
                      padding: "8px 12px",
                      borderRadius: "var(--radius-sm)",
                      border: "1px solid var(--accent-soft)",
                      background: "var(--accent-soft)",
                      color: "var(--accent)",
                      fontSize: "0.8125rem",
                      fontWeight: 500,
                      cursor: "pointer",
                    }}
                  >
                    <Fingerprint size={14} />
                    Enable
                  </button>
                )}
                {biometricRegistered && (
                  <button
                    onClick={() => {
                      localStorage.removeItem("fos-ai-biometric-cred");
                      setBiometricRegistered(false);
                    }}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "6px",
                      padding: "8px 12px",
                      borderRadius: "var(--radius-sm)",
                      border: "1px solid var(--rose-soft)",
                      background: "var(--rose-soft)",
                      color: "var(--rose)",
                      fontSize: "0.8125rem",
                      fontWeight: 500,
                      cursor: "pointer",
                    }}
                  >
                    <Trash2 size={14} />
                    Remove
                  </button>
                )}
              </div>
            )}
          </div>

          {securityError && (
            <p style={{ marginTop: "12px", fontSize: "0.875rem", color: "var(--rose)" }}>
              {securityError}
            </p>
          )}
        </div>

        <div
          style={{
            borderRadius: "var(--radius)",
            border: "1px solid var(--glass-border)",
            background: "var(--glass-bg)",
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
              marginBottom: "20px",
            }}
          >
            Account
          </h2>
          <button
            onClick={handleLogout}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              width: "100%",
              padding: "14px 16px",
              borderRadius: "var(--radius-sm)",
              border: "1px solid var(--rose-soft)",
              background: "var(--rose-soft)",
              color: "var(--rose)",
              textAlign: "left",
              cursor: "pointer",
              fontWeight: 500,
              fontSize: "0.875rem",
            }}
          >
            <span style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <LogOut size={18} />
              <span>
                <span style={{ display: "block", fontWeight: 600 }}>Log out</span>
                <span style={{ display: "block", marginTop: "3px", fontSize: "0.75rem", color: "var(--text-3)" }}>
                  Sign out of your account
                </span>
              </span>
            </span>
            <ChevronRight size={18} />
          </button>
        </div>
        </>
      )}

      {showRemovePinModal && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Remove PIN"
          onClick={(e) => { if (e.target === e.currentTarget) setShowRemovePinModal(false); }}
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
            animation: "overlay-in 0.2s var(--ease) forwards",
          }}
        >
          <div
            style={{
              width: "100%",
              maxWidth: "360px",
              background: "var(--bg)",
              border: "1px solid var(--glass-border)",
              borderRadius: "var(--radius)",
              padding: "32px 24px",
              textAlign: "center",
              animation: "modal-pop 0.3s var(--ease-spring) forwards",
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
              <Trash2 size={24} style={{ color: "var(--rose)" }} />
            </div>
            <h2 style={{ fontFamily: "var(--font-display-family)", fontSize: "1.125rem", fontWeight: 700, color: "var(--text-1)", marginBottom: "8px" }}>
              Remove your PIN?
            </h2>
            <p style={{ fontSize: "0.875rem", color: "var(--text-2)", marginBottom: "24px" }}>
              Enter your current PIN to confirm removal. You&apos;ll need to set it up again on next launch.
            </p>
            <PinInput
              ref={removePinRef}
              onComplete={async (pin) => {
                const verified = await verifyPin(pin);
                if (!verified) {
                  setRemovePinError("Incorrect PIN. Try again.");
                  removePinRef.current?.clear();
                  return;
                }
                removePin();
                setHasPin(false);
                setBiometricRegistered(false);
                setShowRemovePinModal(false);
              }}
              error={removePinError}
            />
            <button
              onClick={() => setShowRemovePinModal(false)}
              style={{
                display: "block",
                margin: "20px auto 0",
                padding: "8px 20px",
                borderRadius: "var(--radius-sm)",
                border: "1px solid var(--glass-border)",
                background: "transparent",
                color: "var(--text-3)",
                fontSize: "0.8125rem",
                cursor: "pointer",
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </AppShell>
  );
}
