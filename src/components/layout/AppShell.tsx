"use client";

import { ReactNode } from "react";
import { useUserName } from "@/components/user-name-context";
import { Sidebar } from "./Sidebar";
import { Topbar } from "./Topbar";
import { BottomNav } from "./BottomNav";
import { FloatingAddButton } from "@/components/money-manager/FloatingAddButton";

interface AppShellProps {
  children: ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  const userName = useUserName();
  return (
    <div style={{ minHeight: "100vh", background: "var(--bg)", color: "var(--text-1)" }}>
      <Sidebar userName={userName} />

      <div className="lg:pl-[220px]">
        <Topbar userName={userName} />

        <main
          className="mx-auto flex w-full max-w-[520px] flex-col gap-6 pt-6 lg:!max-w-[720px] lg:!px-10 lg:!pt-9"
          style={{
            paddingLeft: "20px",
            paddingRight: "20px",
            paddingBottom: "calc(80px + env(safe-area-inset-bottom, 0px))",
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
