"use client";

import {
  Shield,
  TrendingDown,
  Droplets,
} from "lucide-react";
import type { RiskItem } from "@/services/financial-health.service";

const iconMap = {
  portfolio: Shield,
  debt: TrendingDown,
  liquidity: Droplets,
};

const statusColors: Record<string, { dot: string; text: string }> = {
  amber: { dot: "var(--amber)", text: "var(--amber)" },
  green: { dot: "var(--accent)", text: "var(--accent)" },
};

const sparkColors: Record<string, string> = {
  portfolio: "var(--amber)",
  debt: "var(--accent)",
  liquidity: "var(--accent)",
};

function Sparkline({ data, color }: { data: number[]; color: string }) {
  if (!data.length) return null;

  const w = 120;
  const h = 32;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const padding = 2;

  const xStep = (w - padding * 2) / (data.length - 1);
  const points = data.map((v, i) => ({
    x: padding + i * xStep,
    y: h - padding - ((v - min) / range) * (h - padding * 2),
  }));

  let d = `M ${points[0].x} ${points[0].y}`;
  for (let i = 1; i < points.length; i++) {
    const prev = points[i - 1];
    const curr = points[i];
    const cpx = (prev.x + curr.x) / 2;
    d += ` C ${cpx} ${prev.y}, ${cpx} ${curr.y}, ${curr.x} ${curr.y}`;
  }

  return (
    <svg
      viewBox={`0 0 ${w} ${h}`}
      style={{ height: "32px", width: "100%" }}
      preserveAspectRatio="none"
    >
      <path
        d={d}
        fill="none"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

interface Props {
  items: RiskItem[];
}

export function RiskOverview({ items }: Props) {
  return (
    <section>
      <p
        style={{
          fontFamily: "var(--font-mono-family)",
          fontSize: "0.6875rem",
          fontWeight: 600,
          color: "var(--text-3)",
          textTransform: "uppercase",
          letterSpacing: "0.1em",
        }}
      >
        Risk Overview
      </p>

      <div className="mt-5 grid gap-4 md:grid-cols-3">
        {items.map((item) => {
          const Icon = iconMap[item.id as keyof typeof iconMap];
          const colors = statusColors[item.statusColor];

          return (
            <div
              key={item.id}
              className="glass"
              style={{ padding: "22px" }}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center" style={{ gap: "10px" }}>
                  <Icon size={15} style={{ color: "var(--text-3)" }} />
                  <p
                    style={{
                      fontFamily: "var(--font-mono-family)",
                      fontSize: "0.625rem",
                      fontWeight: 600,
                      color: "var(--text-3)",
                      textTransform: "uppercase",
                      letterSpacing: "0.1em",
                    }}
                  >
                    {item.title}
                  </p>
                </div>

                <span
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "6px",
                    fontFamily: "var(--font-mono-family)",
                    fontSize: "0.6875rem",
                    fontWeight: 600,
                    color: colors?.text,
                  }}
                >
                  <span
                    style={{
                      width: "6px",
                      height: "6px",
                      borderRadius: "50%",
                      background: colors?.dot,
                    }}
                  />
                  {item.status}
                </span>
              </div>

              <div className="mt-4">
                <Sparkline
                  data={item.sparklineData}
                  color={sparkColors[item.id] ?? "var(--accent)"}
                />
              </div>

              <p
                className="mt-4"
                style={{
                  fontSize: "0.75rem",
                  lineHeight: 1.6,
                  color: "var(--text-2)",
                }}
              >
                {item.description}
              </p>
            </div>
          );
        })}
      </div>
    </section>
  );
}
