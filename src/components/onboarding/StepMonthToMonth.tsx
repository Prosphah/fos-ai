"use client";

import { Controller, useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { Resolver } from "react-hook-form";

import {
  stepMonthToMonthSchema,
  type StepMonthToMonthForm,
} from "@/lib/validation/onboarding";
import { MoneyField, Section, StepShell } from "./fields";

interface Props {
  currency: string;
  /** Take home income from step 1, needed for the "what is left over" readout. */
  income: number;
  /** Last saved answers, so stepping back does not wipe the form. */
  defaultValues?: Partial<StepMonthToMonthForm>;
  onNext: (data: StepMonthToMonthForm) => void;
  onBack: () => void;
}

export function StepMonthToMonth({
  currency,
  income,
  defaultValues,
  onNext,
  onBack,
}: Props) {
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
      ...defaultValues,
    },
  });

  const spending = useWatch({ control, name: "monthlyLivingExpenses" });
  const debt = useWatch({ control, name: "debtRepaymentsMonthly" });

  const out = spending + debt;
  const showInsight = income > 0 && out > 0;
  const left = income - out;

  return (
    <StepShell
      eyebrow="Month to month"
      title="What comes in, what goes out"
      description="Rough numbers are genuinely fine. This is the biggest part of your score, so an honest average beats a precise guess."
      onSubmit={handleSubmit((data) => onNext(data))}
      submitLabel="Next step"
      submitting={isSubmitting}
      onBack={onBack}
    >
      <Section label="Money out">
        <Controller
          control={control}
          name="monthlyLivingExpenses"
          render={({ field }) => (
            <MoneyField
              id="monthlyLivingExpenses"
              label="Monthly spending"
              value={field.value}
              onChange={field.onChange}
              currency={currency}
              helper="Rent, food, transport, bills, everything."
              whyWeAsk="We compare what comes in against what goes out. That gap is the single largest part of your financial health score, which is why an honest average helps you more than a precise one."
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
              label="Monthly debt payments"
              value={field.value}
              onChange={field.onChange}
              currency={currency}
              helper="Credit cards, loans, a mortgage, a car loan. Zero is a normal answer."
              whyWeAsk="This tells us how much of your budget is already promised, and it feeds the debt side of your score."
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
              label="What you save"
              value={field.value}
              onChange={field.onChange}
              currency={currency}
              optional
              helper="We can work this out from your income and spending, so you never need this."
            />
          )}
        />
      </Section>

      {showInsight && (
        <div className="flex items-start gap-2.5 rounded-[14px] border border-outline bg-surface-2 px-4 py-4 text-sm leading-[1.55] text-text-secondary">
          <span aria-hidden="true" className="shrink-0 text-mint">
            ◆
          </span>
          {left >= 0 ? (
            <p>
              That leaves you{" "}
              <span className="font-semibold tabular-nums text-text-primary">
                {left.toLocaleString()}
              </span>{" "}
              a month, which is a{" "}
              <span className="font-semibold tabular-nums text-text-primary">
                {Math.round((left / income) * 100)}%
              </span>{" "}
              savings rate.
            </p>
          ) : (
            <p>
              That is{" "}
              <span className="font-semibold tabular-nums text-text-primary">
                {Math.abs(left).toLocaleString()}
              </span>{" "}
              a month more going out than coming in. That is common, and it is
              fixable. The score will show it honestly.
            </p>
          )}
        </div>
      )}
    </StepShell>
  );
}