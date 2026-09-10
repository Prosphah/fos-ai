"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { PinInput, PinInputHandle } from "./PinInput";
import { PinSetup } from "./PinSetup";
import { BiometricButton } from "./BiometricButton";
import { LogOut } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

interface Props {
  hasPin: boolean;
  biometricAvailable: boolean;
  biometricRegistered: boolean;
  onSetupComplete: (pin: string, enableBiometric: boolean) => Promise<void>;
  onVerify: (pin: string) => Promise<boolean>;
  onAuthenticateBiometric: () => Promise<boolean>;
}

export function AppLockScreen({
  hasPin,
  biometricAvailable,
  biometricRegistered,
  onSetupComplete,
  onVerify,
  onAuthenticateBiometric,
}: Props) {
  const [error, setError] = useState("");
  const [verifying, setVerifying] = useState(false);
  const [showSetup, setShowSetup] = useState(!hasPin);
  const pinRef = useRef<PinInputHandle>(null);

  const handleVerify = async (pin: string) => {
    setVerifying(true);
    setError("");
    const success = await onVerify(pin);
    if (!success) {
      setError("Incorrect PIN. Try again.");
      pinRef.current?.clear();
    }
    setVerifying(false);
  };

  const handleSetupComplete = async (pin: string, enableBiometric: boolean) => {
    setError("");
    try {
      await onSetupComplete(pin, enableBiometric);
      setShowSetup(false);
    } catch {
      setError("Could not set up app lock. Please try again.");
    }
  };

  if (showSetup) {
    return (
      <div style={overlayStyle}>
        <div style={containerStyle}>
          <PinSetup
            biometricAvailable={biometricAvailable}
            onSetupComplete={handleSetupComplete}
          />
        </div>
      </div>
    );
  }

  return (
    <div style={overlayStyle}>
      <div style={containerStyle}>
        {/* Logo */}
        <div style={{ textAlign: "center", marginBottom: "8px" }}>
          <Image
            src="/logo.png"
            alt="FOS·AI"
            width={48}
            height={48}
            priority
          />
        </div>

        <h2 style={titleStyle}>Welcome back</h2>
        <p style={subtitleStyle}>Enter your PIN to unlock</p>

        <PinInput
            ref={pinRef}
          onComplete={handleVerify}
          error={error}
          disabled={verifying}
        />

        {biometricRegistered && (
          <BiometricButton onAuthenticate={onAuthenticateBiometric} />
        )}

        <button
          type="button"
          onClick={() => {
            void createClient().auth.signOut();
          }}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "6px",
            marginTop: "16px",
            padding: "8px 12px",
            borderRadius: "var(--radius-sm)",
            border: "none",
            background: "transparent",
            color: "var(--text-3)",
            fontSize: "0.8125rem",
            cursor: "pointer",
            transition: "color 0.2s var(--ease)",
          }}
        >
          <LogOut size={14} />
          Use a different account
        </button>
      </div>
    </div>
  );
}

const overlayStyle: React.CSSProperties = {
  position: "fixed",
  inset: 0,
  zIndex: 9999,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  padding: "32px",
  background: "var(--bg)",
  animation: "overlay-in 0.3s var(--ease) forwards",
};

const containerStyle: React.CSSProperties = {
  width: "100%",
  maxWidth: "360px",
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  gap: "24px",
  animation: "modal-pop 0.4s var(--ease-spring) forwards",
};

const titleStyle: React.CSSProperties = {
  fontFamily: "var(--font-display-family)",
  fontSize: "1.25rem",
  fontWeight: 700,
  color: "var(--text-1)",
  textAlign: "center",
};

const subtitleStyle: React.CSSProperties = {
  fontSize: "0.875rem",
  color: "var(--text-2)",
  textAlign: "center",
  marginTop: "-12px",
};
