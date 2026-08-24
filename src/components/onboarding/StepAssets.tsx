"use client";

import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { stepAssetsSchema, type StepAssetsForm } from "@/lib/validation/onboarding";
import { Button } from "@/components/ui/button";
import { CurrencyInput } from "@/components/ui/currency-input";
import { handleEnterToNext } from "@/lib/enter-to-next";
import { Wallet } from "lucide-react";
import type { Resolver } from "react-hook-form";

interface Props {
  defaultValues?: Partial<StepAssetsForm>;
  onNext: (data: StepAssetsForm) => void;
  onBack: () => void;
}

const labelStyle = {
  fontSize: "0.875rem",
  fontWeight: 500 as const,
  color: "var(--text-1)" as const,
};

const inputStyle = {
  display: "block" as const,
  width: "100%",
  marginTop: "4px",
  padding: "12px 14px",
  borderRadius: "var(--radius-sm)",
  border: "1px solid var(--glass-border)",
  background: "var(--glass-bg)",
  fontSize: "0.875rem",
  color: "var(--text-1)",
  outline: "none" as const,
  minHeight: "44px",
  transition: "border-color 0.2s var(--ease), box-shadow 0.2s var(--ease)",
};

export function StepAssets({ defaultValues, onNext, onBack }: Props) {
  const {
    register,
    handleSubmit,
    watch,
    control,
    formState: { errors, isSubmitting },
  } = useForm<StepAssetsForm>({
    resolver: zodResolver(stepAssetsSchema) as Resolver<StepAssetsForm>,
    defaultValues: {
      totalCash: defaultValues?.totalCash ?? 0,
      totalInvestments: defaultValues?.totalInvestments ?? 0,
      totalRetirementAccounts: defaultValues?.totalRetirementAccounts ?? 0,
      totalPropertyValue: defaultValues?.totalPropertyValue ?? 0,
      totalBusinessOwnership: defaultValues?.totalBusinessOwnership ?? 0,
      totalOtherAssets: defaultValues?.totalOtherAssets ?? 0,
      creditCardDebt: defaultValues?.creditCardDebt ?? 0,
      personalLoanDebt: defaultValues?.personalLoanDebt ?? 0,
      studentLoanDebt: defaultValues?.studentLoanDebt ?? 0,
      mortgageDebt: defaultValues?.mortgageDebt ?? 0,
      carLoanDebt: defaultValues?.carLoanDebt ?? 0,
      otherDebts: defaultValues?.otherDebts ?? 0,
    },
  });

  const values = watch();

  const totalAssetsVal =
    (Number(values.totalCash) || 0) +
    (Number(values.totalInvestments) || 0) +
    (Number(values.totalRetirementAccounts) || 0) +
    (Number(values.totalPropertyValue) || 0) +
    (Number(values.totalBusinessOwnership) || 0) +
    (Number(values.totalOtherAssets) || 0);

  const totalLiabilitiesVal =
    (Number(values.creditCardDebt) || 0) +
    (Number(values.personalLoanDebt) || 0) +
    (Number(values.studentLoanDebt) || 0) +
    (Number(values.mortgageDebt) || 0) +
    (Number(values.carLoanDebt) || 0) +
    (Number(values.otherDebts) || 0);

  const netWorth = totalAssetsVal - totalLiabilitiesVal;

  return (
    <form onSubmit={handleSubmit((data) => onNext(data))} onKeyDown={handleEnterToNext} style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
      <div>
        <h2 style={{ fontFamily: "var(--font-display-family)", fontSize: "1.25rem", fontWeight: 700, color: "var(--text-1)" }}>
          What you own &amp; what you owe
        </h2>
        <p className="mt-1" style={{ fontSize: "0.875rem", color: "var(--text-2)" }}>
          This gives us your balance sheet. Approximate numbers are fine.
        </p>
      </div>

      <div>
        <h3 style={{ marginBottom: "12px", fontSize: "0.875rem", fontWeight: 600, color: "var(--text-1)" }}>
          What do you own?
        </h3>
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          {([
            ["totalCash", "What's in your checking and savings accounts?"],
            ["totalInvestments", "Investments (stocks, bonds, crypto, etc.)"],
            ["totalRetirementAccounts", "Retirement accounts (401k, IRA, pension)"],
            ["totalPropertyValue", "Property value (home, land, real estate)"],
            ["totalBusinessOwnership", "Business ownership / equity value"],
            ["totalOtherAssets", "Other assets (vehicles, valuables, etc.)"],
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
        </div>
      </div>

      <div>
        <h3 style={{ marginBottom: "12px", fontSize: "0.875rem", fontWeight: 600, color: "var(--text-1)" }}>
          What do you owe?
        </h3>
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          {([
            ["creditCardDebt", "Credit card debt"],
            ["personalLoanDebt", "Personal loans"],
            ["studentLoanDebt", "Student loans"],
            ["mortgageDebt", "Mortgage"],
            ["carLoanDebt", "Car loan"],
            ["otherDebts", "Other debts"],
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
        </div>
      </div>

      {/* Summary */}
      <div
        style={{
          borderRadius: "var(--radius-sm)",
          border: "1px solid var(--glass-border)",
          background: "var(--glass-bg)",
          padding: "16px",
        }}
      >
        <div className="grid grid-cols-3 gap-2 text-center">
          <div>
            <p style={{ fontSize: "0.75rem", color: "var(--text-3)" }}>Total Assets</p>
            <p className="mt-0.5" style={{ fontFamily: "var(--font-display-family)", fontSize: "1.125rem", fontWeight: 600, color: "var(--text-1)" }}>
              {totalAssetsVal.toLocaleString()}
            </p>
          </div>
          <div>
            <p style={{ fontSize: "0.75rem", color: "var(--text-3)" }}>Total Liabilities</p>
            <p className="mt-0.5" style={{ fontFamily: "var(--font-display-family)", fontSize: "1.125rem", fontWeight: 600, color: "var(--text-1)" }}>
              {totalLiabilitiesVal.toLocaleString()}
            </p>
          </div>
          <div>
            <p style={{ fontSize: "0.75rem", color: "var(--text-3)" }}>Net Worth</p>
            <p className="mt-0.5" style={{ fontFamily: "var(--font-display-family)", fontSize: "1.125rem", fontWeight: 600, color: netWorth >= 0 ? "var(--accent)" : "var(--rose)" }}>
              {netWorth.toLocaleString()}
            </p>
          </div>
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
