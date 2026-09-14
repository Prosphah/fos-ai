"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Target,
  Settings,
  LogOut,
  DollarSign,
  Calculator,
  MessageSquare,
  type LucideIcon,
} from "lucide-react";
import { LogoIcon } from "@/components/brand/LogoIcon";

const links: { name: string; href: string; icon?: LucideIcon; isLogo?: boolean }[] = [
  { name: "Briefing", href: "/briefing", icon: LayoutDashboard },
  { name: "Accounts", href: "/money-manager", icon: DollarSign },
  { name: "FOS AI", href: "/assistant", isLogo: true },
  { name: "Goals", href: "/goals", icon: Target },
  { name: "Tools", href: "/tools", icon: Calculator },
];

export function Sidebar({ userName }: { userName?: string }) {
  const pathname = usePathname();

  return (
    <aside
      className="fixed left-0 top-0 hidden h-screen flex-col lg:flex"
      style={{
        width: "var(--sidebar-w)",
        minWidth: "var(--sidebar-w)",
        background: "var(--nav-bg)",
        backdropFilter: "blur(24px) saturate(1.5)",
        WebkitBackdropFilter: "blur(24px) saturate(1.5)",
        borderRight: "1px solid var(--nav-border)",
        padding: "24px 12px",
        zIndex: 20,
        transition: "background 0.3s var(--ease), border-color 0.3s var(--ease)",
      }}
    >
      {/* Brand */}
      <div style={{ padding: "0 12px", marginBottom: "4px" }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "10px",
          }}
        >
          <Image
            src="/logo-all.png"
            alt="FOS·AI"
            width={44}
            height={44}
            style={{ flexShrink: 0 }}
          />
          <span
            style={{
              fontFamily: "var(--font-display-family)",
              fontWeight: 700,
              fontSize: "1.25rem",
              letterSpacing: "-0.02em",
              color: "var(--text-1)",
            }}
          >
            fos.ai
          </span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex flex-1 flex-col" style={{ gap: "2px", marginTop: "32px" }}>
        {links.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;

          return (
            <Link
              key={item.name}
              href={item.href}
              className="relative flex items-center"
              style={{
                gap: "11px",
                padding: "10px 14px",
                borderRadius: "var(--radius-xs)",
                fontSize: "0.8125rem",
                fontWeight: isActive ? 600 : 500,
                color: isActive ? "var(--text-1)" : "var(--text-2)",
                background: isActive ? "var(--accent-soft)" : "transparent",
                boxShadow: isActive && item.isLogo ? "var(--shadow-glow)" : "none",
                transition: "color 0.2s var(--ease), background 0.2s var(--ease)",
              }}
              onMouseEnter={(e) => {
                if (!isActive) {
                  e.currentTarget.style.background = "var(--glass-bg-hover)";
                  e.currentTarget.style.color = "var(--text-1)";
                }
              }}
              onMouseLeave={(e) => {
                if (!isActive) {
                  e.currentTarget.style.background = "transparent";
                  e.currentTarget.style.color = "var(--text-2)";
                }
              }}
            >
              {item.isLogo ? (
                <span
                  className={isActive ? "brand-breathe" : undefined}
                  style={{
                    width: 22,
                    height: 22,
                    flexShrink: 0,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    borderRadius: "var(--radius-xs)",
                    position: "relative",
                    background: isActive ? "var(--accent)" : "transparent",
                    transition: "background 0.2s var(--ease)",
                  }}
                >
                  {isActive && (
                    <span className="brand-chip-aura" aria-hidden />
                  )}
                  <LogoIcon
                    size={16}
                    style={{
                      position: "relative",
                      color: isActive ? "#FFFFFF" : undefined,
                      transition: "color 0.2s var(--ease)",
                    }}
                  />
                </span>
              ) : Icon ? (
                <Icon size={18} style={isActive ? { color: "var(--accent)" } : undefined} />
              ) : null}
              {item.name}
            </Link>
          );
        })}
      </nav>

      <Link
        href="/feedback"
        aria-label="Send product feedback"
        style={{
          display: "flex",
          alignItems: "center",
          gap: "11px",
          margin: "0 0 16px",
          padding: "13px 14px",
          borderRadius: "var(--radius-xs)",
          border: "1px solid var(--accent-soft)",
          background: pathname === "/feedback" ? "var(--accent)" : "var(--accent-soft)",
          color: pathname === "/feedback" ? "#fff" : "var(--accent)",
          boxShadow: "var(--shadow-glow)",
          transition: "color 0.2s var(--ease), background 0.2s var(--ease)",
        }}
      >
        <MessageSquare size={18} />
        <span style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
          <span style={{ fontSize: "0.8125rem", fontWeight: 700 }}>Share feedback</span>
          <span style={{ fontSize: "0.625rem", opacity: 0.8 }}>Help shape FOS·AI</span>
        </span>
      </Link>

      {/* Footer */}
      <div
        style={{
          marginTop: "auto",
          paddingTop: "16px",
          borderTop: "1px solid var(--glass-border)",
          display: "flex",
          flexDirection: "column",
          gap: "6px",
        }}
      >
        {/* User profile */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "10px",
            padding: "10px 12px",
            marginBottom: "4px",
          }}
        >
          <div
            style={{
              width: "34px",
              height: "34px",
              borderRadius: "var(--radius-xs)",
              background: "var(--accent)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontFamily: "var(--font-display-family)",
              fontWeight: 700,
              fontSize: "0.8125rem",
              color: "#fff",
              flexShrink: 0,
            }}
          >
            {(userName?.[0] ?? "T").toUpperCase()}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <p
              style={{
                fontSize: "0.8125rem",
                fontWeight: 600,
                color: "var(--text-1)",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {userName || "there"}
            </p>
            <p
              style={{
                fontFamily: "var(--font-mono-family)",
                fontSize: "0.625rem",
                color: "var(--text-3)",
                letterSpacing: "0.06em",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              FOUNDATION
            </p>
          </div>
        </div>

        {/* Settings & Logout */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            padding: "0 12px",
          }}
        >
          <Link
            href="/settings"
            style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              fontSize: "0.75rem",
              fontWeight: 500,
              color: "var(--text-3)",
              padding: "6px 0",
              transition: "color 0.2s var(--ease)",
            }}
          >
            <Settings size={13} />
            Settings
          </Link>

          <button
            style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              fontSize: "0.75rem",
              fontWeight: 500,
              color: "var(--text-3)",
              padding: "6px 0",
              transition: "color 0.2s var(--ease)",
            }}
            aria-label="Log out"
          >
            Logout
            <LogOut size={13} />
          </button>
        </div>
      </div>
    </aside>
  );
}
