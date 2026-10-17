"use client";

import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { Resolver } from "react-hook-form";

import {
  stepMonthToMonthSchema,
  type StepMonthToMonthForm,
} from "@/lib/validation/onboarding";
import { MoneyField, StepShell } from "./fields";

interface Props {
  currency: string;
  onNext: (data: StepMonthToMonthForm) => void;
  onBack: () => void;
}

export function StepMonthToMonth({ currency, onNext, onBack }: Props) {
  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<StepMonthToMonthForm>({
    resolver: zodResolver(stepMonthToMonthSchema) as Resolver<StepMonthToMonthForm>,
    mode: "onTouched",
    defaultValues: {
      monthlyLivingExpenses: 0,
      debtRepaymentsMonthly: 0,
      monthlySavings: 0,
    },
  });

  return (
    <StepShell
      title="Your month to month"
      description="What comes in and what goes out, so we can see the shape of your month."
      onSubmit={handleSubmit((data) => onNext(data))}
      submitLabel="Next step"
      submitting={isSubmitting}
      onBack={onBack}
    >
      <Controller
        control={control}
        name="monthlyLivingExpenses"
        render={({ field }) => (
          <MoneyField
            id="monthlyLivingExpenses"
            label="What do you spend each month?"
            value={field.value}
            onChange={field.onChange}
            currency={currency}
            helper="Rent, food, transport, bills, everything. A rounded up figure is fine."
            whyWeAsk="We compare what comes in against what goes out. That gap is the largest single part of your financial health score, so an honest average helps you more than a precise one."
            error={errors.monthlyLivingExpenses?.message}
          />
        )}
      />

      <Controller
        control={control}
        name="debtRepaymentsMonthly"
        render={({ field }) => (
          <MoneyField
            id="debtRepaymentsMonthly"
            label="How much goes to debt each month?"
            value={field.value}
            onChange={field.onChange}
            currency={currency}
            helper="Credit cards, loans, a mortgage, a car loan. Zero is a normal answer."
            whyWeAsk="This tells us how much of your budget is already promised, and it feeds the debt side of your financial health score."
            error={errors.debtRepaymentsMonthly?.message}
          />
        )}
      />

      <Controller
        control={control}
        name="monthlySavings"
        render={({ field }) => (
          <MoneyField
            id="monthlySavings"
            label="How much do you manage to save?"
            value={field.value}
            onChange={field.onChange}
            currency={currency}
            optional
            whyWeAsk="Optional. We can work your savings rate out from your income and expenses, so you never need this. It only helps us understand where you are heading."
            error={errors.monthlySavings?.message}
          />
        )}
      />
    </StepShell>
  );
}