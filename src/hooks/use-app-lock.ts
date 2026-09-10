"use client";

import { useState, useEffect, useCallback, useRef } from "react";

const PIN_HASH_KEY = "fos-ai-pin-hash";
const BIOMETRIC_CRED_KEY = "fos-ai-biometric-cred";
const LOCK_STATE_KEY = "fos-ai-locked";
const LAST_ACTIVITY_KEY = "fos-ai-last-activity";
const INACTIVITY_TIMEOUT = 5 * 60 * 1000; // 5 minutes
const PIN_KDF_ITERATIONS = 120_000;

async function hashPin(pin: string, salt: Uint8Array, iterations = PIN_KDF_ITERATIONS): Promise<string> {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey("raw", encoder.encode(pin), "PBKDF2", false, ["deriveBits"]);
  const saltBuffer = new Uint8Array(salt).buffer as ArrayBuffer;
  const hashBuffer = await crypto.subtle.deriveBits(
    { name: "PBKDF2", salt: saltBuffer, iterations, hash: "SHA-256" },
    key,
    256
  );
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

function getStoredPinHash(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(PIN_HASH_KEY);
}

function isLocked(): boolean {
  if (typeof window === "undefined") return false;
  const stored = sessionStorage.getItem(LOCK_STATE_KEY);
  if (stored === null) {
    return !!getStoredPinHash();
  }
  return stored === "true";
}

function setLocked(value: boolean) {
  sessionStorage.setItem(LOCK_STATE_KEY, String(value));
}

function updateLastActivity() {
  localStorage.setItem(LAST_ACTIVITY_KEY, String(Date.now()));
}

function getLastActivity(): number {
  const val = localStorage.getItem(LAST_ACTIVITY_KEY);
  return val ? Number(val) : Date.now();
}

export function useAppLock() {
  const [locked, setLockedState] = useState<boolean>(() => isLocked());
  const [hasPin, setHasPin] = useState(() => !!getStoredPinHash());
  const [biometricAvailable, setBiometricAvailable] = useState(false);
  const [biometricRegistered, setBiometricRegistered] = useState(() => {
    if (typeof window === "undefined") return false;
    return !!localStorage.getItem(BIOMETRIC_CRED_KEY);
  });
  const [loading, setLoading] = useState(true);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const checkBiometricAvailability = async (): Promise<boolean> => {
    try {
      if (!window.PublicKeyCredential) return false;
      const available = await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
      return available;
    } catch {
      return false;
    }
  };

  useEffect(() => {
    checkBiometricAvailability().then(setBiometricAvailable);
    const t = setTimeout(() => setLoading(false), 0);
    return () => clearTimeout(t);
  }, []);

  const setupPin = useCallback(async (pin: string) => {
    const salt = crypto.getRandomValues(new Uint8Array(16));
    const hash = await hashPin(pin, salt);
    localStorage.setItem(PIN_HASH_KEY, JSON.stringify({
      hash,
      salt: Array.from(salt),
      iterations: PIN_KDF_ITERATIONS,
    }));
    setHasPin(true);
    setLocked(false);
    setLockedState(false);
    updateLastActivity();
  }, []);

  const verifyPin = useCallback(async (pin: string): Promise<boolean> => {
    const stored = getStoredPinHash();
    if (!stored) return false;
    let verifier: { hash: string; salt: number[]; iterations: number };
    try {
      verifier = JSON.parse(stored);
    } catch {
      return false;
    }
    const hash = await hashPin(pin, new Uint8Array(verifier.salt), verifier.iterations);
    if (hash === verifier.hash) {
      setLocked(false);
      setLockedState(false);
      updateLastActivity();
      return true;
    }
    return false;
  }, []);

  const removePin = useCallback(() => {
    localStorage.removeItem(PIN_HASH_KEY);
    localStorage.removeItem(BIOMETRIC_CRED_KEY);
    setHasPin(false);
    setBiometricRegistered(false);
    setLocked(false);
    setLockedState(false);
  }, []);

  const lock = useCallback(() => {
    setLocked(true);
    setLockedState(true);
    sessionStorage.setItem(LOCK_STATE_KEY, "true");
  }, []);

  const unlock = useCallback(() => {
    setLocked(false);
    setLockedState(false);
    sessionStorage.setItem(LOCK_STATE_KEY, "false");
    updateLastActivity();
  }, []);

  // Register biometric credential
  const registerBiometric = useCallback(async (): Promise<boolean> => {
    try {
      const challenge = new Uint8Array(32);
      crypto.getRandomValues(challenge);

      const credential = await navigator.credentials.create({
        publicKey: {
          challenge,
          rp: { name: "FOS·AI" },
          user: {
            id: new Uint8Array(16),
            name: "fos-ai-user",
            displayName: "FOS·AI User",
          },
          pubKeyCredParams: [
            { alg: -7, type: "public-key" },
            { alg: -257, type: "public-key" },
          ],
          authenticatorSelection: {
            authenticatorAttachment: "platform",
            userVerification: "required",
          },
          timeout: 60000,
        },
      });

      if (credential) {
        const pkCredential = credential as PublicKeyCredential;
        const credId = btoa(
          String.fromCharCode(...new Uint8Array(pkCredential.rawId))
        );
        localStorage.setItem(BIOMETRIC_CRED_KEY, credId);
        setBiometricRegistered(true);
        return true;
      }
      return false;
    } catch {
      return false;
    }
  }, []);

  // Authenticate with biometric
  const authenticateBiometric = useCallback(async (): Promise<boolean> => {
    try {
      const credIdB64 = localStorage.getItem(BIOMETRIC_CRED_KEY);
      if (!credIdB64) return false;

      const challenge = new Uint8Array(32);
      crypto.getRandomValues(challenge);

      const rawId = Uint8Array.from(atob(credIdB64), (c) =>
        c.charCodeAt(0)
      );

      const assertion = await navigator.credentials.get({
        publicKey: {
          challenge,
          allowCredentials: [
            {
              id: rawId,
              type: "public-key",
              transports: ["internal"],
            },
          ],
          userVerification: "required",
          timeout: 60000,
        },
      });

      if (assertion) {
        unlock();
        return true;
      }
      return false;
    } catch {
      return false;
    }
  }, [unlock]);

  // Inactivity timer
  useEffect(() => {
    if (!hasPin) return;

    const resetTimer = () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => {
        lock();
      }, INACTIVITY_TIMEOUT);
    };

    const handleActivity = () => {
      updateLastActivity();
      resetTimer();
    };

    const events = ["mousedown", "keydown", "touchstart", "scroll"];
    events.forEach((e) => document.addEventListener(e, handleActivity, { passive: true }));

    // Check on visibility change (tab switch = potential lock)
    const handleVisibility = () => {
      if (document.hidden) {
        const elapsed = Date.now() - getLastActivity();
        if (elapsed >= INACTIVITY_TIMEOUT) {
          lock();
        }
      }
    };
    document.addEventListener("visibilitychange", handleVisibility);

    resetTimer();

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      events.forEach((e) => document.removeEventListener(e, handleActivity));
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, [hasPin, locked, lock]);

  return {
    locked,
    hasPin,
    biometricAvailable,
    biometricRegistered,
    loading,
    setupPin,
    verifyPin,
    removePin,
    lock,
    unlock,
    registerBiometric,
    authenticateBiometric,
  };
}
