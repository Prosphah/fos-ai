"use client";

import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { stepPersonalSchema, type StepPersonalForm } from "@/lib/validation/onboarding";
import { Button } from "@/components/ui/button";
import { CurrencyInput } from "@/components/ui/currency-input";
import { handleEnterToNext } from "@/lib/enter-to-next";
import { Wallet } from "lucide-react";
import type { Resolver } from "react-hook-form";

interface Props {
  defaultValues?: Partial<StepPersonalForm>;
  onNext: (data: StepPersonalForm) => void;
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

export function StepPersonal({ defaultValues, onNext }: Props) {
  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting },
  } = useForm<StepPersonalForm>({
    resolver: zodResolver(stepPersonalSchema) as Resolver<StepPersonalForm>,
    defaultValues: {
      age: defaultValues?.age ?? undefined,
      country: defaultValues?.country ?? "",
      currency: defaultValues?.currency ?? "",
      employmentStatus: defaultValues?.employmentStatus ?? "",
      monthlyIncome: defaultValues?.monthlyIncome ?? undefined,
      incomeFrequency: defaultValues?.incomeFrequency ?? "",
    },
  });

  return (
    <form onSubmit={handleSubmit((data) => onNext(data))} onKeyDown={handleEnterToNext} style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
      <div>
        <h2 style={{ fontFamily: "var(--font-display-family)", fontSize: "1.25rem", fontWeight: 700, color: "var(--text-1)" }}>
          Let&apos;s start with you
        </h2>
        <p className="mt-1" style={{ fontSize: "0.875rem", color: "var(--text-2)" }}>
          Just a few quick questions so we can tailor everything to your situation.
        </p>
      </div>

      <div>
        <label style={labelStyle}>How old are you?</label>
        <input
          type="number"
          {...register("age")}
          onWheel={(e) => (e.target as HTMLInputElement).blur()}
          style={inputStyle}
        />
        {errors.age && <p className="mt-1" style={{ fontSize: "0.75rem", color: "var(--rose)" }}>{errors.age.message}</p>}
      </div>

      <div>
        <label style={labelStyle}>Which country do you live in?</label>
        <input
          type="text"
          {...register("country")}
          placeholder="e.g. United States"
          style={inputStyle}
        />
        {errors.country && <p className="mt-1" style={{ fontSize: "0.75rem", color: "var(--rose)" }}>{errors.country.message}</p>}
      </div>

      <div>
        <label style={labelStyle}>What currency do you use?</label>
        <select {...register("currency")} style={{ ...inputStyle, appearance: "none" }}>
          <option value="">Select currency</option>
          <option value="USD">USD — US Dollar</option>
          <option value="EUR">EUR — Euro</option>
          <option value="GBP">GBP — British Pound</option>
          <option value="CAD">CAD — Canadian Dollar</option>
          <option value="AUD">AUD — Australian Dollar</option>
          <option value="JPY">JPY — Japanese Yen</option>
          <option value="NZD">NZD — New Zealand Dollar</option>
          <option value="CHF">CHF — Swiss Franc</option>
          <option value="INR">INR — Indian Rupee</option>
          <option value="NGN">NGN — Nigerian Naira</option>
          <option value="BRL">BRL — Brazilian Real</option>
          <option value="MXN">MXN — Mexican Peso</option>
        </select>
        {errors.currency && <p className="mt-1" style={{ fontSize: "0.75rem", color: "var(--rose)" }}>{errors.currency.message}</p>}
      </div>

      <div>
        <label style={labelStyle}>What&apos;s your employment status?</label>
        <select {...register("employmentStatus")} style={{ ...inputStyle, appearance: "none" }}>
          <option value="">Select status</option>
          <option value="employed">Employed (full-time)</option>
          <option value="employed_part_time">Employed (part-time)</option>
          <option value="self_employed">Self-employed</option>
          <option value="freelancer">Freelancer / Contractor</option>
          <option value="unemployed">Unemployed</option>
          <option value="retired">Retired</option>
          <option value="student">Student</option>
        </select>
        {errors.employmentStatus && <p className="mt-1" style={{ fontSize: "0.75rem", color: "var(--rose)" }}>{errors.employmentStatus.message}</p>}
      </div>

      <div>
        <label style={labelStyle}>
          How much money comes into your account each month, on average?
        </label>
        <div className="relative mt-1">
          <span style={{ position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)", color: "var(--text-3)" }}>
            <Wallet style={{ width: "16px", height: "16px" }} />
          </span>
          <Controller
            name="monthlyIncome"
            control={control}
            render={({ field }) => (
              <CurrencyInput
                {...field}
                style={{ ...inputStyle, paddingLeft: "40px" }}
              />
            )}
          />
        </div>
        {errors.monthlyIncome && <p className="mt-1" style={{ fontSize: "0.75rem", color: "var(--rose)" }}>{errors.monthlyIncome.message}</p>}
      </div>

      <div>
        <label style={labelStyle}>How often are you paid?</label>
        <select {...register("incomeFrequency")} style={{ ...inputStyle, appearance: "none" }}>
          <option value="">Select frequency</option>
          <option value="weekly">Weekly</option>
          <option value="biweekly">Every two weeks</option>
          <option value="monthly">Monthly</option>
          <option value="quarterly">Quarterly</option>
          <option value="yearly">Yearly</option>
          <option value="irregular">Irregular / Variable</option>
        </select>
        {errors.incomeFrequency && <p className="mt-1" style={{ fontSize: "0.75rem", color: "var(--rose)" }}>{errors.incomeFrequency.message}</p>}
      </div>

      <div style={{ display: "flex", justifyContent: "flex-end", paddingTop: "8px" }}>
        <Button type="submit" disabled={isSubmitting} size="lg">
          {isSubmitting ? "Saving\u2026" : "Next step"}
        </Button>
      </div>
    </form>
  );
}
