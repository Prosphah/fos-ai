"use client";

import { useEffect, useState, useCallback } from "react";
import { usePushSubscription } from "@/hooks/use-push-subscription";

const DISMISSED_KEY = "fos-ai-notif-dismissed";
const DELAY_MS = 60_000;

export function NotificationPrompt() {
  const { isSupported, permission, isSubscribed, loading, subscribe } = usePushSubscription();
  const [visible, setVisible] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const checkPwaPromptVisible = useCallback((): boolean => {
    if (typeof document === "undefined") return false;
    return !!document.querySelector("[data-pwa-install-prompt]");
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!isSupported || permission === "denied" || isSubscribed) return;

    const dismissed = localStorage.getItem(DISMISSED_KEY);
    if (dismissed) return;

    let timeout: ReturnType<typeof setTimeout>;
    let retryCount = 0;
    const MAX_RETRIES = 6;

    const tryShow = () => {
      if (checkPwaPromptVisible() && retryCount < MAX_RETRIES) {
        retryCount++;
        timeout = setTimeout(tryShow, 5_000);
        return;
      }
      setVisible(true);
    };

    timeout = setTimeout(tryShow, DELAY_MS);

    return () => clearTimeout(timeout);
  }, [isSupported, permission, isSubscribed, checkPwaPromptVisible]);

  if (!visible || showSuccess) return null;

  const handleEnable = async () => {
    const success = await subscribe();
    if (success) {
      setVisible(false);
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
    }
  };

  const handleDismiss = () => {
    setVisible(false);
    localStorage.setItem(DISMISSED_KEY, "true");
  };

  return (
    <div
      data-notification-prompt
      className="fixed bottom-4 left-1/2 z-50 w-[calc(100%-2rem)] max-w-md -translate-x-1/2 animate-in slide-in-from-bottom-4 fade-in duration-300"
    >
      <div
        className="rounded-2xl p-4 shadow-lg"
        style={{
          background: "var(--glass-bg)",
          backdropFilter: "blur(24px) saturate(1.4)",
          WebkitBackdropFilter: "blur(24px) saturate(1.4)",
          border: "1px solid var(--glass-border)",
        }}
      >
        <div className="flex items-start gap-3">
          <div
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
            style={{ background: "var(--accent-soft)" }}
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="var(--accent)"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
              <path d="M13.73 21a2 2 0 0 1-3.46 0" />
            </svg>
          </div>
          <div className="flex-1 min-w-0">
            <h3
              className="text-sm font-semibold"
              style={{ color: "var(--text-1)" }}
            >
              Stay on top of your finances
            </h3>
            <p
              className="mt-1 text-xs leading-relaxed"
              style={{ color: "var(--text-2)" }}
            >
              Get daily reminders to record your cash movements and never miss a
              transaction. Works even when the app is closed.
            </p>
            <div className="mt-3 flex items-center gap-2">
              <button
                onClick={handleEnable}
                disabled={loading}
                className="rounded-lg px-4 py-2 text-xs font-semibold text-white transition-colors disabled:opacity-50"
                style={{
                  background: "var(--accent)",
                }}
                onMouseEnter={(e) => {
                  if (!loading) e.currentTarget.style.opacity = "0.85";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.opacity = "1";
                }}
              >
                {loading ? "Enabling..." : "Enable Notifications"}
              </button>
              <button
                onClick={handleDismiss}
                className="rounded-lg px-3 py-2 text-xs font-medium transition-colors"
                style={{ color: "var(--text-2)" }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "var(--glass-bg-hover)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "transparent";
                }}
              >
                Maybe later
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
