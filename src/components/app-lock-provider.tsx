"use client";

import { ReactNode, useEffect, useState } from "react";
import { useAppLock } from "@/hooks/use-app-lock";
import { AppLockScreen } from "@/components/app-lock";
import { createClient } from "@/lib/supabase/client";

interface Props {
  children: ReactNode;
}

export function AppLockProvider({ children }: Props) {
  const [authenticated, setAuthenticated] = useState<boolean | null>(null);
  const {
    locked,
    hasPin,
    biometricAvailable,
    biometricRegistered,
    loading,
    setupPin,
    verifyPin,
    registerBiometric,
    authenticateBiometric,
  } = useAppLock();

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => {
      setAuthenticated(!!data.user);
    }).catch(() => {
      setAuthenticated(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setAuthenticated(!!session);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  // Still checking auth
  if (authenticated === null || loading) {
    return (
      <div
        style={{
          position: "fixed",
          inset: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "var(--bg)",
          zIndex: 9999,
        }}
      >
        <div
          style={{
            width: "40px",
            height: "40px",
            border: "3px solid var(--glass-border)",
            borderTopColor: "var(--accent)",
            borderRadius: "50%",
            animation: "spin 0.8s linear infinite",
          }}
        />
      </div>
    );
  }

  // Not authenticated — no lock screen, just show children (login page etc.)
  if (!authenticated) {
    return <>{children}</>;
  }

  if (locked) {
    return (
      <AppLockScreen
        hasPin={hasPin}
        biometricAvailable={biometricAvailable}
        biometricRegistered={biometricRegistered}
        onSetupComplete={async (pin, enableBiometric) => {
          await setupPin(pin);
          if (enableBiometric && !(await registerBiometric())) {
            throw new Error("Biometric registration failed");
          }
        }}
        onVerify={verifyPin}
        onAuthenticateBiometric={authenticateBiometric}
      />
    );
  }

  return <>{children}</>;
}
