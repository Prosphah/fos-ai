"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { formatCurrency } from "@/lib/format";

interface BudgetRow {
  categoryId: string | null;
  categoryName: string | null;
  amount: number;
  spent: number;
}

interface Props {
  totalBudget: number;
  totalSpent: number;
  categories: BudgetRow[];
  currency?: string;
}

function ProgressBar({ spent, limit }: { spent: number; limit: number }) {
  const pct = limit > 0 ? Math.min((spent / limit) * 100, 100) : 0;

  return (
    <div
      style={{
        height: "8px",
        width: "100%",
        borderRadius: "999px",
        background: "var(--gauge-track)",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          height: "100%",
          borderRadius: "999px",
          width: `${pct}%`,
          background: pct >= 90 ? "var(--rose)" : pct >= 70 ? "var(--amber)" : "linear-gradient(90deg, var(--accent), #9185FF)",
          transition: "width 0.4s var(--ease)",
        }}
      />
    </div>
  );
}

export function BudgetProgress({ totalBudget, totalSpent, categories, currency = "USD" }: Props) {
  const totalPct = totalBudget > 0 ? Math.round((totalSpent / totalBudget) * 100) : 0;

  return (
    <div className="glass" style={{ padding: "22px" }}>
      <div className="flex items-center justify-between">
        <h3 style={{ fontSize: "0.875rem", fontWeight: 600, color: "var(--text-1)" }}>
          Budget
        </h3>
        <Link
          href="/money-manager/budgets"
          className="flex items-center"
          style={{
            gap: "4px",
            fontFamily: "var(--font-mono-family)",
            fontSize: "0.75rem",
            fontWeight: 600,
            color: "var(--accent)",
          }}
        >
          Edit <ArrowRight size={12} />
        </Link>
      </div>

      {/* Total budget */}
      <div className="mt-4">
        <div className="flex items-baseline justify-between">
          <span
            style={{
              fontFamily: "var(--font-display-family)",
              fontWeight: 700,
              fontSize: "1.5rem",
              letterSpacing: "-0.02em",
              color: "var(--text-1)",
            }}
          >
            {formatCurrency(totalSpent, currency)}
          </span>
          <span style={{ fontSize: "0.875rem", color: "var(--text-3)" }}>
            of {formatCurrency(totalBudget, currency)}
          </span>
        </div>
        <div className="mt-2">
          <ProgressBar spent={totalSpent} limit={totalBudget} />
        </div>
        <p className="mt-1.5" style={{ fontSize: "0.75rem", color: "var(--text-3)" }}>
          {totalPct}% spent this month
        </p>
      </div>

      {/* Per-category breakdown */}
      {categories.length > 0 && (
        <div
          className="mt-5 space-y-3"
          style={{ borderTop: "1px solid var(--glass-border)", paddingTop: "16px" }}
        >
          {categories.map((cat) => (
            <div key={cat.categoryId ?? "total"}>
              <div className="flex items-center justify-between" style={{ fontSize: "0.75rem" }}>
                <span style={{ fontWeight: 500, color: "var(--text-1)" }}>
                  {cat.categoryName ?? "Uncategorized"}
                </span>
                <span style={{ color: "var(--text-3)" }}>
                  {formatCurrency(cat.spent, currency)} / {formatCurrency(cat.amount, currency)}
                </span>
              </div>
              <div className="mt-1">
                <ProgressBar spent={cat.spent} limit={cat.amount} />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
