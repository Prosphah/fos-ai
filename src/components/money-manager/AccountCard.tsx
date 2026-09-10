"use client";

import { Landmark, Wallet, BarChart3, CreditCard, Banknote, PiggyBank } from "lucide-react";
import { formatCurrency } from "@/lib/format";
import type { Account } from "@/types/database";

const typeIcons = {
  cash: Banknote,
  current: Wallet,
  savings: PiggyBank,
  investment: BarChart3,
  credit: CreditCard,
  other: Landmark,
};

const typeLabels = {
  cash: "Cash",
  current: "Current",
  savings: "Savings",
  investment: "Investment",
  credit: "Credit",
  other: "Other",
};

const typeColors: Record<string, { bg: string; color: string }> = {
  cash: { bg: "var(--accent-soft)", color: "var(--accent)" },
  current: { bg: "var(--mint-soft)", color: "var(--mint)" },
  savings: { bg: "rgba(59, 130, 246, 0.12)", color: "#3B82F6" },
  investment: { bg: "rgba(168, 85, 247, 0.12)", color: "#A855F7" },
  credit: { bg: "var(--rose-soft)", color: "var(--rose)" },
  other: { bg: "var(--glass-bg)", color: "var(--text-3)" },
};

interface Props {
  account: Account;
}

export function AccountCard({ account }: Props) {
  const Icon = typeIcons[account.type];
  const colors = typeColors[account.type] ?? typeColors.other;
  const balance = Number(account.balance);
  const formatted = formatCurrency(balance, account.currency);

  return (
    <div
      className="glass"
      style={{ padding: "18px", minWidth: "200px", flexShrink: 0 }}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center" style={{ gap: "10px" }}>
          <div
            style={{
              width: "32px",
              height: "32px",
              borderRadius: "var(--radius-xs)",
              background: colors.bg,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <Icon size={16} style={{ color: colors.color }} />
          </div>
          <div>
            <p style={{ fontSize: "0.875rem", fontWeight: 500, color: "var(--text-1)" }}>
              {account.name}
            </p>
            <p style={{ fontSize: "0.6875rem", color: "var(--text-3)" }}>
              {typeLabels[account.type]}
            </p>
          </div>
        </div>
        {account.account_number_last4 && (
          <span style={{ fontSize: "0.6875rem", color: "var(--text-3)" }}>
            &bull;&bull;{account.account_number_last4}
          </span>
        )}
      </div>
      <p
        className="mt-4"
        style={{
          fontFamily: "var(--font-display-family)",
          fontWeight: 700,
          fontSize: "1.25rem",
          letterSpacing: "-0.02em",
          color: "var(--text-1)",
        }}
      >
        {formatted}
      </p>
    </div>
  );
}
