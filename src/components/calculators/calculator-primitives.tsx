"use client";

import { useEffect, useRef, useState } from "react";

export const labelStyle = {
  fontFamily: "var(--font-mono-family)",
  fontSize: "0.6875rem",
  fontWeight: 600 as const,
  color: "var(--text-3)",
  textTransform: "uppercase" as const,
  letterSpacing: "0.1em",
  marginBottom: "8px",
};

export const inputStyle = {
  display: "block",
  width: "100%",
  padding: "12px 14px",
  borderRadius: "var(--radius-sm)",
  border: "1px solid var(--glass-border)",
  background: "var(--glass-bg)",
  fontSize: "0.875rem",
  color: "var(--text-1)",
  outline: "none",
  minHeight: "44px",
  transition: "border-color 0.2s var(--ease), box-shadow 0.2s var(--ease)",
} as const;

export function useFocusStyle() {
  const [focused, setFocused] = useState(false);
  const bind = {
    onFocus: () => setFocused(true),
    onBlur: () => setFocused(false),
  };
  const border = focused
    ? "1px solid var(--accent)"
    : "1px solid var(--glass-border)";
  const shadow = focused ? "0 0 0 3px var(--accent-softer)" : "none";
  return { bind, border, shadow };
}

export function useAnimatedNumber(value: number, duration = 600): number {
  const [display, setDisplay] = useState(value);
  const prevRef = useRef(value);

  useEffect(() => {
    const from = prevRef.current;
    if (from === value) return;
    prevRef.current = value;
    const start = performance.now();
    let raf: number;
    const tick = (now: number) => {
      const p = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - p, 3);
      setDisplay(from + (value - from) * eased);
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [value, duration]);

  return display;
}

export function buildPoints(
  values: number[],
  w: number,
  h: number,
  scale?: { min: number; max: number }
): string {
  if (values.length < 2) return "";
  const max = scale?.max ?? Math.max(...values, 1);
  const min = scale?.min ?? Math.min(...values, 0);
  const range = max - min || 1;
  const pts = values.map((v, i) => {
    const x = (i / (values.length - 1)) * w;
    const y = h - ((v - min) / range) * (h - 10) - 5;
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  });
  return pts.join(" ");
}

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

export function Segmented<T extends string>({
  options,
  value,
  onChange,
}: {
  options: readonly { value: T; label: string }[];
  value: T;
  onChange: (v: T) => void;
}) {
  return (
    <div
      style={{
        borderRadius: "var(--radius-sm)",
        background: "var(--glass-bg)",
        padding: "4px",
        display: "grid",
        gridTemplateColumns: `repeat(${options.length}, 1fr)`,
        gap: "4px",
      }}
    >
      {options.map((opt) => {
        const isActive = opt.value === value;
        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange(opt.value)}
            style={{
              borderRadius: "var(--radius-xs)",
              padding: "9px 10px",
              fontSize: "0.75rem",
              fontWeight: 600,
              fontFamily: "var(--font-mono-family)",
              background: isActive ? "var(--glass-bg)" : "transparent",
              color: isActive ? "var(--text-1)" : "var(--text-3)",
              border: isActive
                ? "1px solid var(--glass-border)"
                : "1px solid transparent",
              boxShadow: isActive ? "var(--shadow-card)" : "none",
              transition: "all 0.2s var(--ease)",
              cursor: "pointer",
              letterSpacing: "0.02em",
            }}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}

export const CHART_W = 600;
export const CHART_H = 120;
