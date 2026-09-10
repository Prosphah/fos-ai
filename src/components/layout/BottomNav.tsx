"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Target,
  DollarSign,
  Calculator,
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

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-40 flex items-stretch border-t pb-safe lg:hidden"
      style={{
        background: "var(--nav-bg)",
        backdropFilter: "blur(24px) saturate(1.5)",
        WebkitBackdropFilter: "blur(24px) saturate(1.5)",
        borderColor: "var(--nav-border)",
        transition: "background 0.3s var(--ease), border-color 0.3s var(--ease)",
      }}
    >
      {links.map((item) => {
        const Icon = item.icon;
        const isActive = pathname === item.href;

        return (
          <Link
            key={item.name}
            href={item.href}
            className="flex flex-1 flex-col items-center justify-center gap-1 py-2.5 px-1 transition-colors"
            style={{
              color: isActive ? "var(--accent)" : "var(--text-3)",
              fontSize: "0.625rem",
              fontWeight: 600,
              letterSpacing: "0.02em",
              WebkitTapHighlightColor: "transparent",
            }}
          >
            <span
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: "3px",
              }}
            >
              {item.isLogo ? (
                <span
                  className={isActive ? "brand-breathe" : undefined}
                  style={{
                    width: 26,
                    height: 26,
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
                    size={18}
                    style={{
                      position: "relative",
                      color: isActive ? "#FFFFFF" : undefined,
                      transition: "color 0.2s var(--ease)",
                    }}
                  />
                </span>
              ) : Icon ? (
                <Icon size={22} style={{ transition: "transform 0.2s var(--ease)" }} />
              ) : null}
              {item.name}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}
