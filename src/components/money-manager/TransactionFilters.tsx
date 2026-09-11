"use client";

import { useState } from "react";
import { Filter, X } from "lucide-react";
import type { Category, Account } from "@/types/database";

interface Props {
  categories: Category[];
  accounts: Account[];
  onFilterChange: (filters: {
    type?: "income" | "expense" | "transfer";
    categoryId?: string;
    accountId?: string;
    startDate?: string;
    endDate?: string;
  }) => void;
}

export function TransactionFilters({ categories, accounts, onFilterChange }: Props) {
  const [type, setType] = useState<string>("all");
  const [categoryId, setCategoryId] = useState<string>("all");
  const [accountId, setAccountId] = useState<string>("all");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [showFilters, setShowFilters] = useState(false);

  const applyFilters = (updates: Partial<{ type: string; categoryId: string; accountId: string; startDate: string; endDate: string }>) => {
    const newType = updates.type ?? type;
    const newCat = updates.categoryId ?? categoryId;
    const newAcc = updates.accountId ?? accountId;
    const newStart = updates.startDate ?? startDate;
    const newEnd = updates.endDate ?? endDate;

    if (updates.type !== undefined) setType(updates.type);
    if (updates.categoryId !== undefined) setCategoryId(updates.categoryId);
    if (updates.accountId !== undefined) setAccountId(updates.accountId);
    if (updates.startDate !== undefined) setStartDate(updates.startDate);
    if (updates.endDate !== undefined) setEndDate(updates.endDate);

    onFilterChange({
      type: newType === "all" ? undefined : (newType as "income" | "expense" | "transfer"),
      categoryId: newCat === "all" ? undefined : newCat,
      accountId: newAcc === "all" ? undefined : newAcc,
      startDate: newStart || undefined,
      endDate: newEnd || undefined,
    });
  };

  const clearFilters = () => {
    setType("all");
    setCategoryId("all");
    setAccountId("all");
    setStartDate("");
    setEndDate("");
    onFilterChange({});
  };

  const hasActiveFilters = type !== "all" || categoryId !== "all" || accountId !== "all" || startDate || endDate;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
      {/* Filter toggle + quick type filters */}
      <div className="flex items-center" style={{ gap: "8px", flexWrap: "wrap" }}>
        <button
          onClick={() => setShowFilters(!showFilters)}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "6px",
            padding: "6px 12px",
            borderRadius: "999px",
            fontSize: "0.75rem",
            fontWeight: 600,
            border: `1px solid ${showFilters || hasActiveFilters ? "var(--accent)" : "var(--glass-border)"}`,
            background: showFilters || hasActiveFilters ? "var(--accent-soft)" : "transparent",
            color: showFilters || hasActiveFilters ? "var(--accent)" : "var(--text-3)",
            transition: "all 0.2s var(--ease)",
          }}
        >
          <Filter size={12} />
          Filters
          {hasActiveFilters && (
            <span
              style={{
                width: "16px",
                height: "16px",
                borderRadius: "50%",
                background: "var(--accent)",
                color: "#fff",
                fontSize: "0.625rem",
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              !
            </span>
          )}
        </button>

        <div className="flex" style={{ gap: "4px" }}>
          {(["all", "expense", "income", "transfer"] as const).map((t) => (
            <button
              key={t}
              onClick={() => applyFilters({ type: t })}
              style={{
                padding: "6px 10px",
                borderRadius: "999px",
                fontSize: "0.75rem",
                fontWeight: 600,
                textTransform: "capitalize",
                background: type === t ? "var(--accent)" : "transparent",
                color: type === t ? "#fff" : "var(--text-3)",
                transition: "all 0.2s var(--ease)",
              }}
            >
              {t}
            </button>
          ))}
        </div>

        {hasActiveFilters && (
          <button
            onClick={clearFilters}
            className="flex items-center"
            style={{
              gap: "4px",
              fontSize: "0.75rem",
              color: "var(--text-3)",
              borderRadius: "999px",
            }}
          >
            <X size={12} />
            Clear
          </button>
        )}
      </div>

      {/* Expanded filters */}
      {showFilters && (
        <div
          className="flex flex-wrap items-end"
          style={{
            gap: "12px",
            borderRadius: "var(--radius-xs)",
            border: "1px solid var(--glass-border)",
            background: "var(--glass-bg)",
            padding: "12px",
          }}
        >
          <div>
            <label style={{ fontFamily: "var(--font-mono-family)", fontSize: "0.6875rem", fontWeight: 600, color: "var(--text-3)" }}>
              Category
            </label>
            <select
              value={categoryId}
              onChange={(e) => applyFilters({ categoryId: e.target.value })}
              className="select-chevron"
              style={{
                display: "block",
                width: "100%",
                marginTop: "4px",
                padding: "6px 10px",
                borderRadius: "var(--radius-xs)",
                border: "1px solid var(--glass-border)",
                backgroundColor: "var(--glass-bg)",
                fontSize: "0.75rem",
                color: "var(--text-1)",
                outline: "none",
              }}
            >
              <option value="all">All categories</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label style={{ fontFamily: "var(--font-mono-family)", fontSize: "0.6875rem", fontWeight: 600, color: "var(--text-3)" }}>
              Account
            </label>
            <select
              value={accountId}
              onChange={(e) => applyFilters({ accountId: e.target.value })}
              className="select-chevron"
              style={{
                display: "block",
                width: "100%",
                marginTop: "4px",
                padding: "6px 10px",
                borderRadius: "var(--radius-xs)",
                border: "1px solid var(--glass-border)",
                backgroundColor: "var(--glass-bg)",
                fontSize: "0.75rem",
                color: "var(--text-1)",
                outline: "none",
              }}
            >
              <option value="all">All accounts</option>
              {accounts.map((a) => (
                <option key={a.id} value={a.id}>{a.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label style={{ fontFamily: "var(--font-mono-family)", fontSize: "0.6875rem", fontWeight: 600, color: "var(--text-3)" }}>
              From
            </label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => applyFilters({ startDate: e.target.value })}
              style={{
                display: "block",
                marginTop: "4px",
                padding: "6px 10px",
                borderRadius: "var(--radius-xs)",
                border: "1px solid var(--glass-border)",
                background: "var(--glass-bg)",
                fontSize: "0.75rem",
                color: "var(--text-1)",
                outline: "none",
              }}
            />
          </div>

          <div>
            <label style={{ fontFamily: "var(--font-mono-family)", fontSize: "0.6875rem", fontWeight: 600, color: "var(--text-3)" }}>
              To
            </label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => applyFilters({ endDate: e.target.value })}
              style={{
                display: "block",
                marginTop: "4px",
                padding: "6px 10px",
                borderRadius: "var(--radius-xs)",
                border: "1px solid var(--glass-border)",
                background: "var(--glass-bg)",
                fontSize: "0.75rem",
                color: "var(--text-1)",
                outline: "none",
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
