"use client";

import { Controller, useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { Resolver } from "react-hook-form";

import {
  stepOwnAndOweSchema,
  type StepOwnAndOweForm,
} from "@/lib/validation/onboarding";
import { FieldRow, MoneyField, Section, StepShell } from "./fields";

function formatMoney(value: number, currency: string): string {
  const amount = Math.round(value || 0);
  if (!currency) return amount.toLocaleString();
  try {
    return new Intl.NumberFormat(undefined, {
      style: "currency",
      currency,
      maximumFractionDigits: 0,
    }).format(amount);
  } catch {
    return amount.toLocaleString();
  }
}

interface Props {
  currency: string;
  /** Last saved answers, so stepping back does not wipe the form. */
  defaultValues?: Partial<StepOwnAndOweForm>;
  onNext: (data: StepOwnAndOweForm) => void;
  onBack: () => void;
}

export function StepOwnAndOwe({ currency, defaultValues, onNext, onBack }: Props) {
  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<StepOwnAndOweForm>({
    resolver: zodResolver(stepOwnAndOweSchema) as Resolver<StepOwnAndOweForm>,
    mode: "onTouched",
    defaultValues: {
      totalCash: 0,
      totalInvestments: 0,
      totalPropertyValue: 0,
      totalBusinessOwnership: 0,
      totalDebt: 0,
      ...defaultValues,
    },
  });

  const cash = useWatch({ control, name: "totalCash" });
  const investments = useWatch({ control, name: "totalInvestments" });
  const property = useWatch({ control, name: "totalPropertyValue" });
  const business = useWatch({ control, name: "totalBusinessOwnership" });
  const owed = useWatch({ control, name: "totalDebt" });

  const assets = cash + investments + property + business;
  const netWorth = assets - owed;

  return (
    <StepShell
      eyebrow="Balance sheet"
      title="What you have and what you owe"
      description="Round everything to the nearest thousand if that is easier. Imprecision costs you nothing here."
      onSubmit={handleSubmit((data) => onNext(data))}
      submitLabel="Next step"
      submitting={isSubmitting}
      onBack={onBack}
    >
      <Section label="What you own">
        <Controller
          control={control}
          name="totalCash"
          render={({ field }) => (
            <MoneyField
              id="totalCash"
              label="Cash you could reach today"
              value={field.value}
              onChange={field.onChange}
              currency={currency}
              whyWeAsk="This is the only asset we count towards your emergency fund, which is a quarter of your score. Money locked in a pension or a land purchase does not count here."
              error={errors.totalCash?.message}
            />
          )}
        />

        <Controller
          control={control}
          name="totalInvestments"
          render={({ field }) => (
            <MoneyField
              id="totalInvestments"
              label="Investments and retirement"
              value={field.value}
              onChange={field.onChange}
              currency={currency}
              helper="Stocks, bonds, crypto, a 401k, an ISA, a pension. Add them together."
            />
          )}
        />

        <FieldRow>
          <Controller
            control={control}
            name="totalPropertyValue"
            render={({ field }) => (
              <MoneyField
                id="totalPropertyValue"
                label="Property and valuables"
                value={field.value}
                onChange={field.onChange}
                currency={currency}
                error={errors.totalPropertyValue?.message}
                inRow
              />
            )}
          />
          <Controller
            control={control}
            name="totalBusinessOwnership"
            render={({ field }) => (
              <MoneyField
                id="totalBusinessOwnership"
                label="Business or other assets"
                value={field.value}
                onChange={field.onChange}
                currency={currency}
                optional
                error={errors.totalBusinessOwnership?.message}
                inRow
              />
            )}
          />
        </FieldRow>
      </Section>

      <Section label="What you owe">
        <Controller
          control={control}
          name="totalDebt"
          render={({ field }) => (
            <MoneyField
              id="totalDebt"
              label="Everything you owe, added up"
              value={field.value}
              onChange={field.onChange}
              currency={currency}
              helper="Credit cards, personal loans, student loans, mortgage, car loan. One total is fine."
              whyWeAsk="This is the debt side of your score. Being accurate here genuinely works in your favour, because otherwise we would assume you owe nothing."
              error={errors.totalDebt?.message}
            />
          )}
        />

        {/*
          Running total. Net worth is the answer and leads; assets and owed are
          the inputs the app just used, so they sit beneath it as label left,
          value right rows. No truncate anywhere: hiding digits of a balance is
          the worst thing this block could do. tabular-nums stops the digits
          shifting while the value updates.
        */}
        <div className="mt-7 flex flex-col gap-[18px] rounded-2xl border border-outline bg-surface-2 px-5 py-[22px] @min-[520px]:flex-row @min-[520px]:items-start @min-[520px]:gap-9">
          <div>
            <p className="text-[13px] leading-[1.4] text-muted-foreground">Net worth</p>
            <p
              className={`mt-1 font-display text-[30px] font-bold leading-[1.15] tracking-[-0.02em] tabular-nums ${
                netWorth < 0 ? "text-rose" : "text-accent"
              }`}
            >
              {netWorth < 0 ? "\u2212" : ""}
              {formatMoney(Math.abs(netWorth), currency)}
            </p>
          </div>

          <div className="grid gap-2.5 border-t border-outline pt-[18px] @min-[520px]:ml-auto @min-[520px]:flex @min-[520px]:gap-8 @min-[520px]:border-t-0 @min-[520px]:pt-0">
            <div className="flex items-baseline justify-between gap-4 @min-[520px]:flex-col @min-[520px]:items-end @min-[520px]:gap-0.5">
              <span className="text-[13px] text-muted-foreground">Assets</span>
              <span className="font-display text-[15px] font-semibold tabular-nums text-text-primary">
                {formatMoney(assets, currency)}
              </span>
            </div>
            <div className="flex items-baseline justify-between gap-4 @min-[520px]:flex-col @min-[520px]:items-end @min-[520px]:gap-0.5">
              <span className="text-[13px] text-muted-foreground">Owed</span>
              <span className="font-display text-[15px] font-semibold tabular-nums text-text-primary">
                {formatMoney(owed, currency)}
              </span>
            </div>
          </div>
        </div>
      </Section>
    </StepShell>
  );
}