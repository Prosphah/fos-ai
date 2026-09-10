"use client";

import { useState, useEffect } from "react";
import type { LucideIcon } from "lucide-react";
import { useForm, Controller, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { recordTransactionSchema, type RecordTransactionForm } from "@/lib/validation/money-manager";
import { Button } from "@/components/ui/button";
import { CurrencyInput } from "@/components/ui/currency-input";
import { formatCurrency } from "@/lib/format";
import { toLocalDateString } from "@/lib/date";
import { addTransaction, listCategories, listAccounts } from "@/app/money-manager/actions";
import {
  ArrowRightLeft,
  Calendar,
  Repeat,
  TrendingDown,
  TrendingUp,
  ChevronDown,
  Briefcase,
  Code,
  PlusCircle,
  Utensils,
  Car,
  Home,
  Zap,
  Film,
  Heart,
  BookOpen,
  ShoppingBag,
  Shield,
  CreditCard,
  Gift,
  PiggyBank,
  BarChart3,
  MoreHorizontal,
  Wallet,
} from "lucide-react";
import type { Category, Account } from "@/types/database";
import type { Resolver } from "react-hook-form";
import { useRouter } from "next/navigation";

interface Props {
  onSuccess?: () => void;
  defaultType?: "income" | "expense" | "transfer";
  defaultDate?: string;
}

const typeOptions = [
  { value: "expense" as const, label: "Expense", icon: TrendingDown },
  { value: "income" as const, label: "Income", icon: TrendingUp },
  { value: "transfer" as const, label: "Transfer", icon: ArrowRightLeft },
];

const recurringOptions = [
  { value: "daily", label: "Daily" },
  { value: "weekly", label: "Weekly" },
  { value: "monthly", label: "Monthly" },
  { value: "yearly", label: "Yearly" },
];

const categoryIconMap: Record<string, LucideIcon> = {
  briefcase: Briefcase,
  code: Code,
  "trending-up": TrendingUp,
  "plus-circle": PlusCircle,
  utensils: Utensils,
  car: Car,
  home: Home,
  zap: Zap,
  film: Film,
  heart: Heart,
  "book-open": BookOpen,
  "shopping-bag": ShoppingBag,
  shield: Shield,
  "credit-card": CreditCard,
  gift: Gift,
  "piggy-bank": PiggyBank,
  "bar-chart": BarChart3,
  "more-horizontal": MoreHorizontal,
  wallet: Wallet,
};

function getCategoryIcon(iconName: string | null): LucideIcon {
  if (!iconName) return Wallet;
  return categoryIconMap[iconName] ?? Wallet;
}

const inputStyle = {
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
};

export function TransactionForm({ onSuccess, defaultType = "expense", defaultDate }: Props) {
  const router = useRouter();
  const [categories, setCategories] = useState<Category[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [serverError, setServerError] = useState<string | null>(null);

  const today = defaultDate ?? toLocalDateString(new Date());

  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting },
  } = useForm<RecordTransactionForm>({
    resolver: zodResolver(recordTransactionSchema) as Resolver<RecordTransactionForm>,
    defaultValues: {
      type: defaultType,
      amount: undefined,
      description: "",
      date: today,
      categoryId: null,
      accountId: null,
      transferToId: null,
      notes: null,
      tags: [],
      isRecurring: false,
      recurringConfig: null,
    },
  });

  const txType = useWatch({ control, name: "type" });
  const isRecurring = useWatch({ control, name: "isRecurring" });
  const selectedCategoryId = useWatch({ control, name: "categoryId" });

  useEffect(() => {
    async function loadData() {
      const [catRes, accRes] = await Promise.all([listCategories(), listAccounts()]);
      if (catRes.categories) setCategories(catRes.categories);
      if (accRes.accounts) setAccounts(accRes.accounts);
    }
    loadData();
  }, []);

  const filteredCategories = categories
    .filter((c) => {
      if (txType === "transfer") return false;
      return c.type === txType || c.type === "both";
    })
    .sort((a, b) => {
      if (a.name === "Other Expense") return 1;
      if (b.name === "Other Expense") return -1;
      return 0;
    });

  const onSubmit = async (data: RecordTransactionForm) => {
    setServerError(null);
    const result = await addTransaction({ ...data, tags: [], notes: null });
    if (result.error) {
      setServerError(typeof result.error === "string" ? result.error : "Failed to record transaction");
      return;
    }
    router.refresh();
    onSuccess?.();
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
      {serverError && (
        <div
          style={{
            borderRadius: "var(--radius-xs)",
            background: "var(--rose-soft)",
            padding: "8px 12px",
            fontSize: "0.875rem",
            color: "var(--rose)",
          }}
        >
          {serverError}
        </div>
      )}

      {/* Type toggle */}
      <div style={{ borderRadius: "var(--radius-sm)", background: "var(--glass-bg)", padding: "4px" }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "4px" }}>
          {typeOptions.map((opt) => {
            const Icon = opt.icon;
            const isActive = txType === opt.value;
            return (
              <label
                key={opt.value}
                style={{
                  display: "flex",
                  cursor: "pointer",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "8px",
                  borderRadius: "var(--radius-xs)",
                  padding: "10px 12px",
                  fontSize: "0.875rem",
                  fontWeight: 500,
                  background: isActive ? "var(--glass-bg)" : "transparent",
                  color: isActive ? "var(--text-1)" : "var(--text-3)",
                  boxShadow: isActive ? "var(--shadow-card)" : "none",
                  border: isActive ? "1px solid var(--glass-border)" : "1px solid transparent",
                  transition: "all 0.2s var(--ease)",
                }}
              >
                <input type="radio" value={opt.value} className="sr-only" {...register("type")} />
                <Icon size={15} style={isActive ? { color: "var(--accent)" } : undefined} />
                {opt.label}
              </label>
            );
          })}
        </div>
      </div>

      {/* Amount */}
      <div>
        <label style={{ fontFamily: "var(--font-mono-family)", fontSize: "0.6875rem", fontWeight: 600, color: "var(--text-3)", textTransform: "uppercase", letterSpacing: "0.1em" }}>
          Amount
        </label>
        <div className="mt-2">
          <Controller
            name="amount"
            control={control}
            render={({ field }) => (
              <CurrencyInput
                {...field}
                placeholder="0.00"
                style={{ ...inputStyle, fontSize: "1.5rem", fontWeight: 700, minHeight: "56px" }}
              />
            )}
          />
        </div>
        {errors.amount && <p className="mt-1.5" style={{ fontSize: "0.75rem", color: "var(--rose)" }}>{errors.amount.message}</p>}
      </div>

      {/* Category */}
      {txType !== "transfer" && (
        <div>
          <label style={{ fontFamily: "var(--font-mono-family)", fontSize: "0.6875rem", fontWeight: 600, color: "var(--text-3)", textTransform: "uppercase", letterSpacing: "0.1em" }}>
            Category
          </label>
          <div className="mt-2 grid grid-cols-3 gap-1.5 sm:grid-cols-4">
            {filteredCategories.map((cat) => {
              const Icon = getCategoryIcon(cat.icon);
              const isSelected = selectedCategoryId === cat.id;
              return (
                <label
                  key={cat.id}
                  style={{
                    display: "flex",
                    cursor: "pointer",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: "8px",
                    borderRadius: "var(--radius-sm)",
                    padding: "12px 8px",
                    textAlign: "center",
                    border: `1px solid ${isSelected ? "var(--accent)" : "var(--glass-border)"}`,
                    background: isSelected ? "var(--accent-soft)" : "var(--glass-bg)",
                    transition: "all 0.2s var(--ease)",
                  }}
                >
                  <input type="radio" value={cat.id} className="sr-only" {...register("categoryId")} />
                  <div
                    style={{
                      width: "36px",
                      height: "36px",
                      borderRadius: "var(--radius-xs)",
                      background: `${cat.color ?? "var(--text-3)"}15`,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <Icon size={17} style={{ color: cat.color ?? "var(--text-3)" }} />
                  </div>
                  <span style={{ fontSize: "0.6875rem", fontWeight: 500, color: "var(--text-2)", lineHeight: 1.2 }}>
                    {cat.name}
                  </span>
                </label>
              );
            })}
          </div>
        </div>
      )}

      {/* Account */}
      <div>
        <label style={{ fontFamily: "var(--font-mono-family)", fontSize: "0.6875rem", fontWeight: 600, color: "var(--text-3)", textTransform: "uppercase", letterSpacing: "0.1em" }}>
          {txType === "transfer" ? "From Account" : "Account"}
        </label>
        <div className="relative mt-2">
          <select
            {...register("accountId")}
            style={{ ...inputStyle, appearance: "none", paddingRight: "36px" }}
          >
            <option value="">Select account</option>
            {accounts.map((acc) => (
              <option key={acc.id} value={acc.id}>
                {acc.name} ({acc.type}) &mdash; {formatCurrency(acc.balance, acc.currency)}
              </option>
            ))}
          </select>
          <ChevronDown size={16} style={{ position: "absolute", right: "12px", top: "50%", transform: "translateY(-50%)", color: "var(--text-3)", pointerEvents: "none" }} />
        </div>
      </div>

      {/* Transfer To */}
      {txType === "transfer" && (
        <div>
          <div className="flex items-center" style={{ gap: "8px", color: "var(--text-3)" }}>
            <ArrowRightLeft size={14} />
            <label style={{ fontFamily: "var(--font-mono-family)", fontSize: "0.6875rem", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.1em" }}>
              To Account
            </label>
          </div>
          <div className="relative mt-2">
            <select
              {...register("transferToId")}
              style={{ ...inputStyle, appearance: "none", paddingRight: "36px" }}
            >
              <option value="">Select destination</option>
              {accounts.map((acc) => (
                <option key={acc.id} value={acc.id}>
                  {acc.name} ({acc.type})
                </option>
              ))}
            </select>
            <ChevronDown size={16} style={{ position: "absolute", right: "12px", top: "50%", transform: "translateY(-50%)", color: "var(--text-3)", pointerEvents: "none" }} />
          </div>
        </div>
      )}

      {/* Date */}
      <div>
        <label style={{ fontFamily: "var(--font-mono-family)", fontSize: "0.6875rem", fontWeight: 600, color: "var(--text-3)", textTransform: "uppercase", letterSpacing: "0.1em" }}>
          Date
        </label>
        <div className="relative mt-2">
          <Calendar size={15} style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "var(--text-3)" }} />
          <input
            type="date"
            {...register("date")}
            style={{ ...inputStyle, paddingLeft: "40px" }}
          />
        </div>
        {errors.date && <p className="mt-1.5" style={{ fontSize: "0.75rem", color: "var(--rose)" }}>{errors.date.message}</p>}
      </div>

      {/* Description */}
      <div>
        <label style={{ fontFamily: "var(--font-mono-family)", fontSize: "0.6875rem", fontWeight: 600, color: "var(--text-3)", textTransform: "uppercase", letterSpacing: "0.1em" }}>
          Description
        </label>
        <input
          type="text"
          {...register("description")}
          placeholder="What was this for?"
          style={{ ...inputStyle, marginTop: "8px" }}
        />
        {errors.description && <p className="mt-1.5" style={{ fontSize: "0.75rem", color: "var(--rose)" }}>{errors.description.message}</p>}
      </div>

      {/* Recurring */}
      <div
        style={{
          borderRadius: "var(--radius-sm)",
          border: "1px solid var(--glass-border)",
          background: "var(--glass-bg)",
          padding: "14px",
        }}
      >
        <label className="flex cursor-pointer items-center" style={{ gap: "12px" }}>
          <input
            type="checkbox"
            {...register("isRecurring")}
            style={{ width: "16px", height: "16px", accentColor: "var(--accent)" }}
          />
          <div className="flex items-center" style={{ gap: "8px" }}>
            <Repeat size={14} style={{ color: "var(--text-3)" }} />
            <span style={{ fontSize: "0.875rem", fontWeight: 500, color: "var(--text-1)" }}>Recurring transaction</span>
          </div>
        </label>
        {isRecurring && (
          <div className="mt-3 grid grid-cols-2 gap-2">
            <div className="relative">
              <select
                {...register("recurringConfig.frequency")}
                style={{ ...inputStyle, appearance: "none", paddingRight: "32px", fontSize: "0.875rem" }}
              >
                {recurringOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
              <ChevronDown size={14} style={{ position: "absolute", right: "10px", top: "50%", transform: "translateY(-50%)", color: "var(--text-3)", pointerEvents: "none" }} />
            </div>
            <input
              type="date"
              {...register("recurringConfig.end_date")}
              style={{ ...inputStyle, fontSize: "0.875rem" }}
            />
          </div>
        )}
      </div>

      <Button
        type="submit"
        disabled={isSubmitting}
        className="w-full"
        style={{ minHeight: "48px", fontSize: "0.875rem", fontWeight: 600, borderRadius: "var(--radius-sm)" }}
      >
        {isSubmitting ? "Recording..." : "Record Transaction"}
      </Button>
    </form>
  );
}
