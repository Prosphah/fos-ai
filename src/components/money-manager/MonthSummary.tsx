"use client";

import { TrendingUp, TrendingDown, PiggyBank, ArrowUpRight } from "lucide-react";
import { formatCurrency } from "@/lib/format";

interface Props {
  income: number;
  expenses: number;
  savingsRate: number;
  currency?: string;
}

const metrics = (income: number, expenses: number, savingsRate: number, currency: string) => [
  {
    title: "Income",
    value: formatCurrency(income, currency),
    icon: TrendingUp,
    color: "var(--accent)",
    bg: "var(--accent-soft)",
  },
  {
    title: "Expenses",
    value: formatCurrency(expenses, currency),
    icon: TrendingDown,
    color: "var(--rose)",
    bg: "var(--rose-soft)",
  },
  {
    title: "Savings Rate",
    value: `${savingsRate}%`,
    icon: PiggyBank,
    color: "var(--accent)",
    bg: "var(--accent-soft)",
  },
  {
    title: "Net Flow",
    value: formatCurrency(income - expenses, currency),
    icon: ArrowUpRight,
    color: income - expenses >= 0 ? "var(--accent)" : "var(--rose)",
    bg: income - expenses >= 0 ? "var(--accent-soft)" : "var(--rose-soft)",
  },
];

export function MonthSummary({ income, expenses, savingsRate, currency = "USD" }: Props) {
  const items = metrics(income, expenses, savingsRate, currency);

  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }} className="lg:!grid-cols-4">
      {items.map((item) => (
        <div
          key={item.title}
          className="glass"
          style={{ padding: "18px" }}
        >
          <div className="flex items-center" style={{ gap: "8px" }}>
            <div
              style={{
                width: "28px",
                height: "28px",
                borderRadius: "var(--radius-xs)",
                background: item.bg,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              <item.icon size={14} style={{ color: item.color }} />
            </div>
            <span
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
            </span>
          </div>
          <p
            className="mt-3"
            style={{
              fontFamily: "var(--font-display-family)",
              fontWeight: 700,
              fontSize: "1.25rem",
              letterSpacing: "-0.02em",
              color: "var(--text-1)",
            }}
          >
            {item.value}
          </p>
        </div>
      ))}
    </div>
  );
}
