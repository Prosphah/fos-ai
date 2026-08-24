"use client";

import { ReactNode } from "react";
import { Sidebar } from "./Sidebar";
import { Topbar } from "./Topbar";
import { BottomNav } from "./BottomNav";
import { FloatingAddButton } from "@/components/money-manager/FloatingAddButton";

interface AppShellProps {
  children: ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  return (
    <div style={{ minHeight: "100vh", background: "var(--bg)", color: "var(--text-1)" }}>
      <Sidebar />

      <div className="lg:pl-[220px]">
        <Topbar />

        <main
          className="mx-auto flex w-full max-w-[520px] flex-col gap-6 pb-[32px] pt-6 lg:!max-w-[720px] lg:!px-10 lg:!pt-9 lg:pb-[60px]"
          style={{
            paddingLeft: "20px",
            paddingRight: "20px",
          }}
        >
          <div
            style={{ display: "flex", flexDirection: "column", gap: "24px" }}
          >
            {children}
          </div>
        </main>
      </div>

      <BottomNav />
      <FloatingAddButton />
    </div>
  );
}
