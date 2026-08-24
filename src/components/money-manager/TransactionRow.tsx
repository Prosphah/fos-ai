"use client";

import { ArrowRightLeft } from "lucide-react";
import { formatCurrency } from "@/lib/format";
import type { Transaction, Category, Account } from "@/types/database";

interface Props {
  transaction: Transaction;
  categories: Category[];
  accounts: Account[];
  currency?: string;
}

const typeColors: Record<string, string> = {
  income: "var(--accent)",
  expense: "var(--rose)",
  transfer: "#3B82F6",
};

export function TransactionRow({ transaction, categories, accounts, currency = "USD" }: Props) {
  const category = categories.find((c) => c.id === transaction.category_id);
  const account = accounts.find((a) => a.id === transaction.account_id);
  const amount = Number(transaction.amount);
  const date = new Date(transaction.transaction_date);
  const isTransfer = transaction.type === "transfer";

  return (
    <div
      className="flex items-center"
      style={{
        gap: "12px",
        padding: "10px 12px",
        borderRadius: "var(--radius-xs)",
        transition: "background 0.15s var(--ease)",
      }}
      onMouseEnter={(e) => { e.currentTarget.style.background = "var(--glass-bg-hover)"; }}
      onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
    >
      {/* Category icon */}
      <div
        style={{
          width: "36px",
          height: "36px",
          borderRadius: "var(--radius-xs)",
          background: category?.color ?? "var(--text-3)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
          color: "#fff",
          fontSize: "0.75rem",
          fontWeight: 600,
        }}
      >
        {isTransfer ? (
          <ArrowRightLeft size={16} />
        ) : (
          category?.name?.charAt(0) ?? "?"
        )}
      </div>

      {/* Description & meta */}
      <div style={{ minWidth: 0, flex: 1 }}>
        <p
          style={{
            fontSize: "0.875rem",
            fontWeight: 500,
            color: "var(--text-1)",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {transaction.description}
        </p>
        <p style={{ fontSize: "0.6875rem", color: "var(--text-3)" }}>
          {category?.name ?? "Uncategorized"}
          {account && ` \u00B7 ${account.name}`}
        </p>
      </div>

      {/* Amount & date */}
      <div style={{ textAlign: "right" }}>
        <p
          style={{
            fontSize: "0.875rem",
            fontWeight: 600,
            color: typeColors[transaction.type] ?? "var(--text-1)",
          }}
        >
          {transaction.type === "expense" ? "-" : transaction.type === "transfer" ? "\u2192" : "+"}
          {formatCurrency(amount, currency)}
        </p>
        <p style={{ fontSize: "0.6875rem", color: "var(--text-3)" }}>
          {date.toLocaleDateString("en-US", { month: "short", day: "numeric" })}
        </p>
      </div>
    </div>
  );
}
