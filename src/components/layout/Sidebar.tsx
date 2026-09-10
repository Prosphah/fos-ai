"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import {
  LayoutDashboard,
  Target,
  BrainCircuit,
  Settings,
  LogOut,
  DollarSign,
  Calculator,
} from "lucide-react";
import { getProfileName } from "@/app/actions/profile";

const links = [
  { name: "Briefing", href: "/briefing", icon: LayoutDashboard },
  { name: "Accounts", href: "/money-manager", icon: DollarSign },
  { name: "Goals", href: "/goals", icon: Target },
  { name: "Tools", href: "/tools", icon: Calculator },
  { name: "FOS AI", href: "/assistant", icon: BrainCircuit },
];

export function Sidebar() {
  const pathname = usePathname();
  const [userName, setUserName] = useState<string>("");

  useEffect(() => {
    getProfileName().then((p) => {
      if (p.firstName) setUserName(p.firstName);
    }).catch(() => {
      setUserName("");
    });
  }, []);

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
                padding: "10px 12px",
                borderRadius: "var(--radius-xs)",
                fontSize: "0.8125rem",
                fontWeight: isActive ? 600 : 500,
                color: isActive ? "var(--text-1)" : "var(--text-2)",
                background: isActive ? "var(--accent-soft)" : "transparent",
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
              <Icon size={18} style={isActive ? { color: "var(--accent)" } : undefined} />
              {item.name}
            </Link>
          );
        })}
      </nav>

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
            {(userName?.[0] ?? "U").toUpperCase()}
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
              {userName || "User"}
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
