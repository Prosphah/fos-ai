"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Target,
  BrainCircuit,
  DollarSign,
  Calculator,
} from "lucide-react";

const links = [
  { name: "Briefing", href: "/briefing", icon: LayoutDashboard },
  { name: "Accounts", href: "/money-manager", icon: DollarSign },
  { name: "Goals", href: "/goals", icon: Target },
  { name: "Tools", href: "/tools", icon: Calculator },
  { name: "FOS AI", href: "/assistant", icon: BrainCircuit },
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
            <Icon size={22} style={{ transition: "transform 0.2s var(--ease)" }} />
            {item.name}
          </Link>
        );
      })}
    </nav>
  );
}
