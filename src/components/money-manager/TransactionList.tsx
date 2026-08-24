"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { TransactionRow } from "./TransactionRow";
import type { Transaction, Category, Account } from "@/types/database";

interface Props {
  transactions: Transaction[];
  categories: Category[];
  accounts: Account[];
  currency?: string;
}

function groupByDate(transactions: Transaction[]) {
  const groups: { date: string; label: string; items: Transaction[] }[] = [];
  const now = new Date();
  const today = now.toISOString().split("T")[0];
  const yesterday = new Date(now.setDate(now.getDate() - 1)).toISOString().split("T")[0];

  const map = new Map<string, Transaction[]>();
  for (const tx of transactions) {
    const key = tx.transaction_date;
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(tx);
  }

  for (const [date, items] of map) {
    let label = date;
    if (date === today) label = "Today";
    else if (date === yesterday) label = "Yesterday";
    else {
      const d = new Date(date + "T00:00:00");
      label = d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
    }
    groups.push({ date, label, items });
  }

  return groups.sort((a, b) => b.date.localeCompare(a.date));
}

export function TransactionList({ transactions, categories, accounts, currency = "USD" }: Props) {
  if (transactions.length === 0) {
    return (
      <div
        className="glass"
        style={{ padding: "32px", textAlign: "center" }}
      >
        <p style={{ fontSize: "0.875rem", color: "var(--text-2)" }}>No transactions yet</p>
        <p className="mt-1" style={{ fontSize: "0.75rem", color: "var(--text-3)" }}>
          Tap the + button to record your first one
        </p>
      </div>
    );
  }

  const groups = groupByDate(transactions);

  return (
    <div className="glass" style={{ overflow: "hidden" }}>
      <div
        className="flex items-center justify-between"
        style={{
          padding: "12px 16px",
          borderBottom: "1px solid var(--glass-border)",
        }}
      >
        <h3 style={{ fontSize: "0.875rem", fontWeight: 600, color: "var(--text-1)" }}>
          Recent Transactions
        </h3>
        <Link
          href="/money-manager/transactions"
          className="flex items-center"
          style={{
            gap: "4px",
            fontFamily: "var(--font-mono-family)",
            fontSize: "0.75rem",
            fontWeight: 600,
            color: "var(--accent)",
          }}
        >
          View all <ArrowRight size={12} />
        </Link>
      </div>
      <div>
        {groups.map((group) => (
          <div key={group.date}>
            <div style={{ padding: "8px 16px 4px" }}>
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
                {group.label}
              </span>
            </div>
            <div style={{ padding: "0 4px" }}>
              {group.items.map((tx) => (
                <TransactionRow
                  key={tx.id}
                  transaction={tx}
                  categories={categories}
                  accounts={accounts}
                  currency={currency}
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
