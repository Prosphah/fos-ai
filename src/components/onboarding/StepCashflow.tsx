"use client";

import { useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { stepCashflowSchema, type StepCashflowForm } from "@/lib/validation/onboarding";
import { Button } from "@/components/ui/button";
import { CurrencyInput } from "@/components/ui/currency-input";
import { handleEnterToNext } from "@/lib/enter-to-next";
import { Wallet, X } from "lucide-react";
import type { Resolver } from "react-hook-form";

interface Props {
  defaultValues?: Partial<StepCashflowForm>;
  onNext: (data: StepCashflowForm) => void;
  onBack: () => void;
}

const labelStyle = {
  fontSize: "0.875rem",
  fontWeight: 500,
  color: "var(--text-1)",
};

const inputStyle = {
  display: "block",
  width: "100%",
  marginTop: "4px",
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

export function StepCashflow({ defaultValues, onNext, onBack }: Props) {
  const [expenseTags, setExpenseTags] = useState<string[]>(
    defaultValues?.expectedMajorExpenses ?? []
  );
  const [tagInput, setTagInput] = useState("");

  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting },
  } = useForm<StepCashflowForm>({
    resolver: zodResolver(stepCashflowSchema) as Resolver<StepCashflowForm>,
    defaultValues: {
      monthlyLivingExpenses: defaultValues?.monthlyLivingExpenses ?? undefined,
      debtRepaymentsMonthly: defaultValues?.debtRepaymentsMonthly ?? undefined,
      monthlySavings: defaultValues?.monthlySavings ?? undefined,
      otherIncome: defaultValues?.otherIncome ?? undefined,
      expectedMajorExpenses: defaultValues?.expectedMajorExpenses ?? [],
    },
  });

  const addTag = () => {
    const val = tagInput.trim();
    if (val && !expenseTags.includes(val)) {
      setExpenseTags([...expenseTags, val]);
    }
    setTagInput("");
  };

  const removeTag = (tag: string) => {
    setExpenseTags(expenseTags.filter((t) => t !== tag));
  };

  const onSubmit = (data: StepCashflowForm) => {
    onNext({ ...data, expectedMajorExpenses: expenseTags });
  };

  return (
    <form onSubmit={handleSubmit((data) => onSubmit(data))} onKeyDown={handleEnterToNext} style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
      <div>
        <h2 style={{ fontFamily: "var(--font-display-family)", fontSize: "1.25rem", fontWeight: 700, color: "var(--text-1)" }}>
          Your cash flow
        </h2>
        <p className="mt-1" style={{ fontSize: "0.875rem", color: "var(--text-2)" }}>
          Understanding your monthly flow helps us build a realistic picture.
        </p>
      </div>

      {([
        ["monthlyLivingExpenses", "What are your monthly living expenses? (rent, groceries, utilities, etc.)"],
        ["debtRepaymentsMonthly", "How much goes toward debt repayments each month? (credit cards, loans, etc.)"],
        ["monthlySavings", "How much do you save each month?"],
        ["otherIncome", "Do you have any other sources of income? (side hustles, investments, etc.)"],
      ] as const).map(([key, label]) => (
        <div key={key}>
          <label style={labelStyle}>{label}</label>
          <div className="relative mt-1">
            <span style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "var(--text-3)" }}>
              <Wallet style={{ width: "16px", height: "16px" }} />
            </span>
            <Controller
              name={key}
              control={control}
              render={({ field }) => (
                <CurrencyInput
                  {...field}
                  style={{ ...inputStyle, paddingLeft: "40px" }}
                />
              )}
            />
          </div>
          {errors[key] && <p className="mt-1" style={{ fontSize: "0.75rem", color: "var(--rose)" }}>{errors[key]?.message}</p>}
        </div>
      ))}

      <div>
        <label style={labelStyle}>
          Any expected major expenses in the next 12 months? (wedding, travel, medical, etc.)
        </label>
        <div className="mt-2 flex flex-wrap" style={{ gap: "8px" }}>
          {expenseTags.map((tag) => (
            <span
              key={tag}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "4px",
                borderRadius: "var(--radius-xs)",
                background: "var(--accent-soft)",
                padding: "6px 12px",
                fontSize: "0.75rem",
                fontWeight: 500,
                color: "var(--accent)",
              }}
            >
              {tag}
              <button type="button" onClick={() => removeTag(tag)} style={{ color: "var(--accent)", opacity: 0.5 }}>
                <X style={{ width: "12px", height: "12px" }} />
              </button>
            </span>
          ))}
        </div>
        <div className="mt-2 flex" style={{ gap: "8px" }}>
          <input
            type="text"
            value={tagInput}
            onChange={(e) => setTagInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addTag(); } }}
            placeholder="Type an expense and press Enter"
            style={{ ...inputStyle, flex: 1, minWidth: 0, marginTop: 0 }}
          />
          <Button type="button" variant="outline" size="sm" className="shrink-0" style={{ minHeight: "44px" }} onClick={addTag}>
            Add
          </Button>
        </div>
      </div>

      <div className="flex items-center justify-between" style={{ gap: "12px", paddingTop: "8px" }}>
        <Button type="button" variant="outline" size="lg" onClick={onBack} style={{ minHeight: "44px" }}>
          Back
        </Button>
        <Button type="submit" disabled={isSubmitting} size="lg" style={{ minHeight: "44px" }}>
          {isSubmitting ? "Saving\u2026" : "Next step"}
        </Button>
      </div>
    </form>
  );
}
