"use client";

import { ReactNode } from "react";
import Link from "next/link";
import { LogoIcon } from "@/components/brand/LogoIcon";

interface Props {
  children: ReactNode;
}

export function OnboardingLayout({ children }: Props) {
  return (
    <main className="relative flex min-h-screen items-center justify-center px-4 py-8 sm:px-6 sm:py-12">
      <div className="relative z-10 flex w-full max-w-2xl flex-col items-center">
        <div className="mb-6 flex items-center gap-2.5 rounded-full px-5 py-2 sm:mb-8"
          style={{
            background: "var(--glass-bg)",
            backdropFilter: "blur(16px) saturate(1.3)",
            border: "1px solid var(--glass-border)",
            boxShadow: "var(--shadow-card)",
          }}
        >
          <LogoIcon size={20} style={{ color: "var(--accent)" }} />
          <span
            style={{
              fontSize: "0.9375rem",
              fontWeight: 700,
              letterSpacing: "-0.01em",
              color: "var(--text-1)",
            }}
          >
            FOS·AI
          </span>
        </div>

        <div
          className="glass w-full"
          style={{ padding: "20px" }}
        >
          <div className="sm:p-8 lg:p-10">
            {children}
          </div>

          <div style={{ padding: "0 8px 8px", textAlign: "center" }}>
            <Link
              href="/privacy"
              style={{
                fontSize: "0.75rem",
                color: "var(--text-3)",
                textDecoration: "none",
              }}
            >
              Privacy Policy
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}