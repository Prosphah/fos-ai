"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
}

export function PWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [visible, setVisible] = useState(false);
  const [installing, setInstalling] = useState(false);

  useEffect(() => {
    const dismissed = localStorage.getItem("fos-ai-pwa-dismissed");
    const isStandalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as Navigator & { standalone?: boolean }).standalone === true;

    if (dismissed || isStandalone) return;

    let active = true;
    let authenticated = false;

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      if (authenticated) setVisible(true);
    };

    const installedHandler = () => {
      setVisible(false);
      setDeferredPrompt(null);
    };

    window.addEventListener("beforeinstallprompt", handler);
    window.addEventListener("appinstalled", installedHandler);

    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => {
      if (!active || !data.user) return;
      authenticated = true;
      setDeferredPrompt((prompt) => {
        if (prompt) setVisible(true);
        return prompt;
      });
    });

    return () => {
      active = false;
      window.removeEventListener("beforeinstallprompt", handler);
      window.removeEventListener("appinstalled", installedHandler);
    };
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    setInstalling(true);
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") {
      setVisible(false);
    }
    setDeferredPrompt(null);
    setInstalling(false);
  };

  const handleDismiss = () => {
    setVisible(false);
    localStorage.setItem("fos-ai-pwa-dismissed", "true");
  };

  if (!visible) return null;

  return (
    <div data-pwa-install-prompt className="fixed bottom-4 left-1/2 z-50 w-[calc(100%-2rem)] max-w-md -translate-x-1/2 animate-in slide-in-from-bottom-4 fade-in duration-300">
      <div className="rounded-2xl border border-[#e2e8f0] bg-white p-4 shadow-lg">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#f0edff]">
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#695AFF"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="7 10 12 15 17 10" />
              <line x1="12" y1="15" x2="12" y2="3" />
            </svg>
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-semibold text-[#0f172a]">
              Install FOS·AI
            </h3>
            <p className="mt-1 text-xs text-[#64748b] leading-relaxed">
              Add to your home screen for faster access and offline support.
            </p>
            <div className="mt-3 flex items-center gap-2">
              <button
                onClick={handleInstall}
                disabled={installing}
                className="rounded-lg bg-[#695AFF] px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-[#5a4ae0] disabled:opacity-50"
              >
                {installing ? "Installing..." : "Install App"}
              </button>
              <button
                onClick={handleDismiss}
                className="rounded-lg px-3 py-2 text-xs font-medium text-[#64748b] transition-colors hover:bg-[#f8fafc]"
              >
                Not now
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
