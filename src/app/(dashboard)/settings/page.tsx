"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { useAppLock } from "@/hooks/use-app-lock";
import { getProfile, updateProfile } from "@/app/actions/profile";
import Link from "next/link";
import { useTheme } from "next-themes";
import { ShieldCheck, Fingerprint, Trash2, MessageSquare, ChevronRight, Sun, Moon, LogOut, Plus, Bell } from "lucide-react";
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
  const [reminderEnabled, setReminderEnabled] = useState(true);
  const [reminderTime, setReminderTime] = useState("19:00");
  const [reminderDays, setReminderDays] = useState<number[]>([0, 1, 2, 3, 4, 5, 6]);
  const [reminderDraftEnabled, setReminderDraftEnabled] = useState(true);
  const [reminderDraftTime, setReminderDraftTime] = useState("19:00");
  const [reminderDraftDays, setReminderDraftDays] = useState<number[]>([0, 1, 2, 3, 4, 5, 6]);
  const [reminderSaving, setReminderSaving] = useState(false);
  const [reminderError, setReminderError] = useState("");
  const [showReminderModal, setShowReminderModal] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);

  const closePinSetup = useCallback(() => setShowPinSetup(false), []);
  const closeRemovePinModal = useCallback(() => setShowRemovePinModal(false), []);
  const closeReminderModal = useCallback(() => {
    setReminderDraftEnabled(reminderEnabled);
    setReminderDraftTime(reminderTime);
    setReminderDraftDays([...reminderDays]);
    setShowReminderModal(false);
  }, [reminderEnabled, reminderTime, reminderDays]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      if (showRemovePinModal) closeRemovePinModal();
      else if (showPinSetup) closePinSetup();
      else if (showReminderModal) closeReminderModal();
      else if (showProfileModal) setShowProfileModal(false);
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [showRemovePinModal, showPinSetup, showReminderModal, showProfileModal, closeRemovePinModal, closePinSetup, closeReminderModal]);

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

    fetch("/api/user-settings/reminder")
      .then((r) => r.json())
      .then((data) => {
        if (data.reminder_enabled !== undefined) setReminderEnabled(data.reminder_enabled);
        if (data.reminder_time) setReminderTime(data.reminder_time);
        if (data.reminder_days) setReminderDays(data.reminder_days);
      })
      .catch(() => {});

    if (window.PublicKeyCredential) {
      PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable().then(
        setBiometricAvailable
      ).catch(() => {
        setSecurityError("Could not check biometric availability. Please try again.");
      });
    }
  }, []);

  const handleSave = async (): Promise<boolean> => {
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
        return false;
      } else {
        setSuccess(true);
        setTimeout(() => setSuccess(false), 3000);
        return true;
      }
    } catch {
      setError("Could not save your changes. Please try again.");
      return false;
    } finally {
      setSaving(false);
    }
  };

  const handleReminderSave = async (): Promise<boolean> => {
    setReminderSaving(true);
    setReminderError("");
    try {
      const response = await fetch("/api/user-settings/reminder", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reminder_enabled: reminderDraftEnabled,
          reminder_time: reminderDraftTime,
          reminder_days: reminderDraftDays,
        }),
      });
      if (!response.ok) {
        throw new Error("Failed to save reminder settings");
      }
      setReminderEnabled(reminderDraftEnabled);
      setReminderTime(reminderDraftTime);
      setReminderDays(reminderDraftDays);
      return true;
    } catch {
      setReminderError("Could not save your reminder settings. Please try again.");
      return false;
    } finally {
      setReminderSaving(false);
    }
  };

  const openReminderModal = () => {
    setReminderDraftEnabled(reminderEnabled);
    setReminderDraftTime(reminderTime);
    setReminderDraftDays([...reminderDays]);
    setShowReminderModal(true);
  };

  function formatTimeDisplay(time: string): string {
    const [h, m] = time.split(":").map(Number);
    const period = h >= 12 ? "PM" : "AM";
    const hour = h % 12 || 12;
    return `${hour}:${String(m).padStart(2, "0")} ${period}`;
  }

  function formatDaysDisplay(days: number[]): string {
    if (days.length === 7) return "Every day";
    if (days.length === 0) return "No days";
    const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const sorted = [...days].sort();
    const consecutive = sorted.every((d, i) => i === 0 || d === sorted[i - 1] + 1);
    if (consecutive && sorted.length > 2) {
      return `${dayNames[sorted[0]]} – ${dayNames[sorted[sorted.length - 1]]}`;
    }
    return sorted.map((d) => dayNames[d]).join(", ");
  }

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
            padding: "32px 28px",
          }}
        >
          {/* Avatar + Name + Edit */}
          <div style={{ display: "flex", alignItems: "center", gap: "20px", marginBottom: "28px" }}>
            <div
              style={{
                width: "64px",
                height: "64px",
                borderRadius: "var(--radius)",
                background: "var(--accent)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontFamily: "var(--font-display-family)",
                fontWeight: 700,
                fontSize: "1.375rem",
                color: "#fff",
                flexShrink: 0,
                boxShadow: "0 4px 20px rgba(105, 90, 255, 0.3)",
              }}
            >
              {(firstName?.[0] ?? "T").toUpperCase()}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <h2
                style={{
                  fontSize: "1.125rem",
                  fontWeight: 600,
                  color: "var(--text-1)",
                  lineHeight: 1.3,
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                  margin: 0,
                }}
              >
                {firstName || lastName ? `${firstName} ${lastName}`.trim() : <span style={{ color: "var(--text-3)" }}>Your name</span>}
              </h2>
              <p
                style={{
                  fontFamily: "var(--font-mono-family)",
                  fontSize: "0.6875rem",
                  fontWeight: 600,
                  color: "var(--text-3)",
                  textTransform: "uppercase",
                  letterSpacing: "0.08em",
                  margin: "4px 0 0",
                }}
              >
                Profile
              </p>
            </div>
            <button
              onClick={() => setShowProfileModal(true)}
              style={{
                padding: "7px 18px",
                borderRadius: "999px",
                border: "1px solid var(--accent)",
                background: "rgba(105, 90, 255, 0.1)",
                color: "var(--accent)",
                fontSize: "0.8125rem",
                fontWeight: 600,
                cursor: "pointer",
                transition: "all 0.15s var(--ease)",
                flexShrink: 0,
              }}
            >
              Edit
            </button>
          </div>

          {/* Details */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "16px",
              padding: "20px",
              borderRadius: "var(--radius-sm)",
              background: "rgba(255, 255, 255, 0.02)",
              border: "1px solid var(--glass-border)",
            }}
          >
            {[
              { label: "Age", value: age },
              { label: "Country", value: country },
              { label: "Currency", value: currency },
            ].map(({ label, value }) => (
              <div key={label}>
                <span
                  style={{
                    fontFamily: "var(--font-mono-family)",
                    fontSize: "0.625rem",
                    fontWeight: 600,
                    color: "var(--text-3)",
                    textTransform: "uppercase",
                    letterSpacing: "0.08em",
                    display: "block",
                    marginBottom: "4px",
                  }}
                >
                  {label}
                </span>
                <span
                  style={{
                    fontSize: "0.9375rem",
                    fontWeight: 500,
                    color: value ? "var(--text-1)" : "var(--text-3)",
                    fontStyle: value ? "normal" : "italic",
                  }}
                >
                  {value || "Not set"}
                </span>
              </div>
            ))}
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

        {/* Reminders Section */}
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
            Reminders
          </h2>

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
            <span style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <Bell size={18} style={{ color: reminderEnabled ? "var(--accent)" : "var(--text-3)" }} />
              <span>
                <span style={{ display: "block", fontSize: "0.875rem", fontWeight: 500, color: "var(--text-1)" }}>
                  Daily reminder
                </span>
                <span style={{ display: "block", marginTop: "3px", fontSize: "0.75rem", color: "var(--text-3)" }}>
                  {reminderEnabled
                    ? `At ${formatTimeDisplay(reminderTime)} · ${formatDaysDisplay(reminderDays)}`
                    : "Disabled"}
                </span>
              </span>
            </span>
            <button
              onClick={openReminderModal}
              style={{
                padding: "6px 14px",
                borderRadius: "999px",
                border: "1px solid var(--accent-soft)",
                background: "var(--accent-soft)",
                color: "var(--accent)",
                fontSize: "0.75rem",
                fontWeight: 600,
                cursor: "pointer",
                transition: "all 0.15s var(--ease)",
              }}
            >
              Edit
            </button>
          </div>
        </div>

        {/* Reminder Edit Modal */}
        {showReminderModal && (
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Edit reminder"
            onClick={(e) => { if (e.target === e.currentTarget) closeReminderModal(); }}
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
                maxWidth: "380px",
                background: "var(--bg)",
                border: "1px solid var(--glass-border)",
                borderRadius: "var(--radius)",
                padding: "28px 24px",
                maxHeight: "85vh",
                overflowY: "auto",
              }}
            >
              <h3 style={{ fontSize: "1rem", fontWeight: 700, color: "var(--text-1)", marginBottom: "20px" }}>
                Edit reminder
              </h3>

              <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
                {/* Enable toggle */}
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <span style={{ fontSize: "0.875rem", fontWeight: 500, color: "var(--text-1)" }}>
                    Enabled
                  </span>
                  <button
                    onClick={() => setReminderDraftEnabled(!reminderDraftEnabled)}
                    style={{
                      width: "44px",
                      height: "24px",
                      borderRadius: "12px",
                      background: reminderDraftEnabled ? "var(--accent)" : "var(--gauge-track)",
                      position: "relative",
                      transition: "background 0.2s var(--ease)",
                      border: "none",
                      cursor: "pointer",
                    }}
                  >
                    <div
                      style={{
                        width: "18px",
                        height: "18px",
                        borderRadius: "50%",
                        background: "#fff",
                        position: "absolute",
                        top: "3px",
                        left: reminderDraftEnabled ? "23px" : "3px",
                        transition: "left 0.2s var(--ease)",
                        boxShadow: "0 1px 3px rgba(0,0,0,0.15)",
                      }}
                    />
                  </button>
                </div>

                {/* Time picker */}
                <div>
                  <label
                    htmlFor="reminder-time"
                    style={{ fontSize: "0.8125rem", fontWeight: 500, color: "var(--text-1)", display: "block", marginBottom: "6px" }}
                  >
                    Reminder time
                  </label>
                  <input
                    id="reminder-time"
                    type="time"
                    value={reminderDraftTime}
                    onChange={(e) => setReminderDraftTime(e.target.value)}
                    style={{
                      display: "block",
                      width: "100%",
                      padding: "12px 14px",
                      borderRadius: "var(--radius-sm)",
                      border: "1px solid var(--glass-border)",
                      background: "var(--glass-bg)",
                      fontSize: "0.875rem",
                      color: "var(--text-1)",
                      outline: "none",
                      minHeight: "44px",
                    }}
                  />
                </div>

                {/* Day picker */}
                <div>
                  <span style={{ fontSize: "0.8125rem", fontWeight: 500, color: "var(--text-1)", display: "block", marginBottom: "8px" }}>
                    Active days
                  </span>
                  <div style={{ display: "flex", gap: "6px" }}>
                    {[
                      { label: "Su", day: 0 },
                      { label: "Mo", day: 1 },
                      { label: "Tu", day: 2 },
                      { label: "We", day: 3 },
                      { label: "Th", day: 4 },
                      { label: "Fr", day: 5 },
                      { label: "Sa", day: 6 },
                    ].map(({ label, day }) => {
                      const active = reminderDraftDays.includes(day);
                      return (
                        <button
                          key={day}
                          onClick={() => setReminderDraftDays((prev) =>
                            prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day].sort()
                          )}
                          style={{
                            flex: 1,
                            height: "40px",
                            borderRadius: "var(--radius-xs)",
                            border: `1.5px solid ${active ? "var(--accent)" : "var(--glass-border)"}`,
                            background: active ? "var(--accent-soft)" : "var(--glass-bg)",
                            color: active ? "var(--accent)" : "var(--text-3)",
                            fontSize: "0.75rem",
                            fontWeight: 600,
                            cursor: "pointer",
                            transition: "all 0.15s var(--ease)",
                          }}
                        >
                          {label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {reminderError && (
                <p style={{ marginTop: "12px", fontSize: "0.875rem", color: "var(--rose)" }}>
                  {reminderError}
                </p>
              )}

              {/* Actions */}
              <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "24px" }}>
                <button
                  onClick={closeReminderModal}
                  style={{
                    padding: "10px 20px",
                    borderRadius: "999px",
                    border: "1px solid var(--glass-border)",
                    background: "transparent",
                    color: "var(--text-2)",
                    fontSize: "0.8125rem",
                    fontWeight: 500,
                    cursor: "pointer",
                  }}
                >
                  Cancel
                </button>
                <button
                  onClick={async () => {
                    const saved = await handleReminderSave();
                    if (saved) setShowReminderModal(false);
                  }}
                  disabled={reminderSaving}
                  style={{
                    padding: "10px 24px",
                    borderRadius: "999px",
                    background: "var(--accent)",
                    color: "#fff",
                    fontSize: "0.8125rem",
                    fontWeight: 600,
                    border: "none",
                    cursor: reminderSaving ? "not-allowed" : "pointer",
                    opacity: reminderSaving ? 0.6 : 1,
                  }}
                >
                  {reminderSaving ? "Saving\u2026" : "Save"}
                </button>
              </div>
            </div>
          </div>
        )}

        {showProfileModal && (
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Edit profile"
            onClick={(e) => { if (e.target === e.currentTarget) setShowProfileModal(false); }}
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
                maxWidth: "380px",
                background: "var(--bg)",
                border: "1px solid var(--glass-border)",
                borderRadius: "var(--radius)",
                padding: "28px 24px",
                maxHeight: "85vh",
                overflowY: "auto",
              }}
            >
              <h3 style={{ fontSize: "1rem", fontWeight: 700, color: "var(--text-1)", marginBottom: "20px" }}>
                Edit profile
              </h3>

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
                    style={inputStyle}
                    className="select-chevron"
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

              {/* Actions */}
              <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "24px" }}>
                <button
                  onClick={() => setShowProfileModal(false)}
                  style={{
                    padding: "10px 20px",
                    borderRadius: "999px",
                    border: "1px solid var(--glass-border)",
                    background: "transparent",
                    color: "var(--text-2)",
                    fontSize: "0.8125rem",
                    fontWeight: 500,
                    cursor: "pointer",
                  }}
                >
                  Cancel
                </button>
                <button
                  onClick={async () => {
                    const saved = await handleSave();
                    if (saved) setShowProfileModal(false);
                  }}
                  disabled={saving}
                  style={{
                    padding: "10px 24px",
                    borderRadius: "999px",
                    background: "var(--accent)",
                    color: "#fff",
                    fontSize: "0.8125rem",
                    fontWeight: 600,
                    border: "none",
                    cursor: saving ? "not-allowed" : "pointer",
                    opacity: saving ? 0.6 : 1,
                  }}
                >
                  {saving ? "Saving\u2026" : "Save"}
                </button>
              </div>
            </div>
          </div>
        )}

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
                        } else {
                          setSecurityError("");
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
                      borderRadius: "999px",
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
                    borderRadius: "999px",
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
                        setSecurityError("");
                      } else {
                        setSecurityError("Biometric registration failed. Ensure your device supports fingerprint/Face ID.");
                      }
                    }}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "6px",
                      padding: "8px 12px",
                      borderRadius: "999px",
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
                      borderRadius: "999px",
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
                borderRadius: "999px",
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
