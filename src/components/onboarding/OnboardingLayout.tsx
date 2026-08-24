"use client";

import { ReactNode } from "react";

interface Props {
  children: ReactNode;
}

export function OnboardingLayout({ children }: Props) {
  return (
    <main
      className="mx-auto flex min-h-screen max-w-2xl items-center px-3 py-6 sm:px-6 sm:py-16"
    >
      <div
        className="glass w-full"
        style={{ padding: "20px" }}
      >
        <div className="sm:p-8 lg:p-10">
          {children}
        </div>
      </div>
    </main>
  );
}
