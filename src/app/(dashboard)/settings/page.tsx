"use client";

import { useState, useEffect } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { useAppLock } from "@/hooks/use-app-lock";
import { getProfile, updateProfile } from "@/app/actions/profile";
import { ShieldCheck, Fingerprint, Trash2 } from "lucide-react";

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
  const { verifyPin, authenticateBiometric, removePin } = useAppLock();

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
        setError("Could not check biometric availability. Please try again.");
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
                <ShieldCheck size={18} style={{ color: hasPin ? "var(--mint)" : "var(--text-3)" }} />
                <div>
                  <p style={{ fontSize: "0.875rem", fontWeight: 500, color: "var(--text-1)" }}>
                    App PIN
                  </p>
                  <p style={{ fontSize: "0.75rem", color: "var(--text-3)" }}>
                    {hasPin ? "4-digit PIN is set" : "No PIN configured"}
                  </p>
                </div>
              </div>
              {hasPin && (
                <button
                  onClick={() => {
                    if (window.confirm("Remove your PIN? You'll need to set it up again on next launch.")) {
                      const enteredPin = window.prompt("Enter your PIN to confirm removal:");
                      void (async () => {
                        const verified = enteredPin
                          ? await verifyPin(enteredPin)
                          : biometricRegistered && await authenticateBiometric();
                        if (!verified) {
                          setError("PIN or biometric verification failed.");
                          return;
                        }
                        removePin();
                      setHasPin(false);
                      setBiometricRegistered(false);
                      })();
                    }
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
                      {biometricRegistered ? "Enabled" : "Not configured"}
                    </p>
                  </div>
                </div>
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
        </div>
        </>
      )}
    </AppShell>
  );
}
