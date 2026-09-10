"use client";

import { useRef, useState } from "react";
import { PinInput, PinInputHandle } from "./PinInput";
import { Fingerprint, ShieldCheck } from "lucide-react";

interface Props {
  biometricAvailable: boolean;
  onSetupComplete: (pin: string, enableBiometric: boolean) => Promise<void>;
}

export function PinSetup({ biometricAvailable, onSetupComplete }: Props) {
  const [step, setStep] = useState<"create" | "confirm">("create");
  const [firstPin, setFirstPin] = useState("");
  const [error, setError] = useState("");
  const [enableBiometric, setEnableBiometric] = useState(false);
  const pinRef = useRef<PinInputHandle>(null);

  const handleCreate = (pin: string) => {
    setFirstPin(pin);
    setStep("confirm");
    setError("");
    pinRef.current?.clear();
  };

  const handleConfirm = (pin: string) => {
    if (pin !== firstPin) {
      setError("PINs don't match. Try again.");
      setStep("create");
      setFirstPin("");
      pinRef.current?.clear();
      return;
    }
    void onSetupComplete(pin, enableBiometric).catch(() => {
      setError("Could not set up app lock. Please try again.");
    });
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "32px" }}>
      <div style={{ textAlign: "center" }}>
        <div
          style={{
            width: "64px",
            height: "64px",
            borderRadius: "16px",
            background: "var(--accent-soft)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            margin: "0 auto 16px",
          }}
        >
          <ShieldCheck size={32} style={{ color: "var(--accent)" }} />
        </div>
        <h2 style={{ fontFamily: "var(--font-display-family)", fontSize: "1.25rem", fontWeight: 700, color: "var(--text-1)" }}>
          {step === "create" ? "Create a PIN" : "Confirm your PIN"}
        </h2>
        <p style={{ marginTop: "8px", fontSize: "0.875rem", color: "var(--text-2)", maxWidth: "280px" }}>
          {step === "create"
            ? "Choose a 4-digit PIN to secure your app."
            : "Enter the same PIN again to confirm."}
        </p>
      </div>

      <PinInput
        ref={pinRef}
        onComplete={step === "create" ? handleCreate : handleConfirm}
        error={error}
      />

      {biometricAvailable && step === "create" && (
        <label
          style={{
            display: "flex",
            alignItems: "center",
            gap: "10px",
            cursor: "pointer",
            padding: "12px 16px",
            borderRadius: "var(--radius-sm)",
            border: "1px solid var(--glass-border)",
            background: enableBiometric ? "var(--accent-soft)" : "var(--glass-bg)",
            transition: "all 0.2s var(--ease)",
          }}
        >
          <input
            type="checkbox"
            checked={enableBiometric}
            onChange={(e) => setEnableBiometric(e.target.checked)}
            style={{
              position: "absolute",
              width: "1px",
              height: "1px",
              padding: 0,
              margin: "-1px",
              overflow: "hidden",
              clip: "rect(0, 0, 0, 0)",
              whiteSpace: "nowrap",
              border: 0,
            }}
          />
          <Fingerprint size={20} style={{ color: enableBiometric ? "var(--accent)" : "var(--text-3)" }} />
          <span style={{ fontSize: "0.875rem", color: "var(--text-1)" }}>
            Enable biometric unlock
          </span>
        </label>
      )}
    </div>
  );
}
