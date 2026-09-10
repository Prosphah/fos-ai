"use client";

import { Shield, TrendingDown, PieChart } from "lucide-react";
import type { ActionItem } from "@/services/financial-health.service";

const iconMap = {
  shield: Shield,
  "trending-down": TrendingDown,
  "pie-chart": PieChart,
};

const impactStyles: Record<string, string> = {
  high: "var(--accent)",
  medium: "var(--amber)",
};

interface Props {
  items: ActionItem[];
}

export function RecommendedActions({ items }: Props) {
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
        Recommended Actions
      </p>

      <div className="mt-5 grid gap-4 md:grid-cols-3">
        {items.map((item) => {
          const Icon = iconMap[item.icon];

          return (
            <div
              key={item.id}
              className="glass flex flex-col"
              style={{ padding: "22px" }}
            >
              <Icon size={18} style={{ color: "var(--accent)" }} />

              <h3
                className="mt-4"
                style={{
                  fontSize: "0.875rem",
                  fontWeight: 600,
                  color: "var(--text-1)",
                }}
              >
                {item.title}
              </h3>

              <p
                className="mt-1.5 flex-1"
                style={{
                  fontSize: "0.75rem",
                  lineHeight: 1.6,
                  color: "var(--text-2)",
                }}
              >
                {item.description}
              </p>

              <div className="mt-5 flex items-center justify-between">
                <span
                  style={{
                    fontFamily: "var(--font-mono-family)",
                    fontSize: "0.6875rem",
                    fontWeight: 600,
                    color: impactStyles[item.impactLevel] ?? "var(--text-3)",
                    textTransform: "uppercase",
                    letterSpacing: "0.06em",
                  }}
                >
                  {item.impact}
                </span>

                <button
                  style={{
                    borderRadius: "999px",
                    border: "1px solid var(--glass-border)",
                    padding: "6px 14px",
                    fontSize: "0.75rem",
                    fontWeight: 500,
                    color: "var(--text-1)",
                    background: "var(--glass-bg)",
                    backdropFilter: "blur(16px)",
                    WebkitBackdropFilter: "blur(16px)",
                    transition: "background 0.2s var(--ease), border-color 0.2s var(--ease)",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = "var(--glass-bg-hover)";
                    e.currentTarget.style.borderColor = "var(--glass-border-hover)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = "var(--glass-bg)";
                    e.currentTarget.style.borderColor = "var(--glass-border)";
                  }}
                >
                  {item.cta}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
