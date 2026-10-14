"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";

export function ThemeToggle() {
  const { setTheme, resolvedTheme } = useTheme();

  return (
    <button
      type="button"
      onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
      aria-label="Switch colour theme"
      title="Switch colour theme"
      className="sales-focus grid shrink-0 place-items-center rounded-full border p-2.5 text-[var(--sales-text-2)] transition hover:text-[var(--sales-text-1)]"
      style={{ borderColor: "var(--sales-border)", background: "var(--sales-surface)" }}
    >
      {/* The dark class lives on <html>, so both icons render on the server
          and CSS picks the right one. No mounted state needed. */}
      <Sun size={16} className="dark:hidden" />
      <Moon size={16} className="hidden dark:block" />
    </button>
  );
}