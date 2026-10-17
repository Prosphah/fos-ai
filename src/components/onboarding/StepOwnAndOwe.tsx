"use client";

import { Controller, useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { Resolver } from "react-hook-form";

import {
  stepOwnAndOweSchema,
  type StepOwnAndOweForm,
} from "@/lib/validation/onboarding";
import { MoneyField, StepShell } from "./fields";

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
  onNext: (data: StepOwnAndOweForm) => void;
  onBack: () => void;
}

export function StepOwnAndOwe({ currency, onNext, onBack }: Props) {
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
    },
  });

  const values = useWatch({ control });
  const cash = Number(values.totalCash) || 0;
  const investments = Number(values.totalInvestments) || 0;
  const property = Number(values.totalPropertyValue) || 0;
  const business = Number(values.totalBusinessOwnership) || 0;
  const owed = Number(values.totalDebt) || 0;

  const assets = cash + investments + property + business;
  const netWorth = assets - owed;

  return (
    <StepShell
      title="What you own and what you owe"
      description="This gives us your balance sheet. Round numbers are completely fine."
      onSubmit={handleSubmit((data) => onNext(data))}
      submitLabel="Next step"
      submitting={isSubmitting}
      onBack={onBack}
    >
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
            helper="Checking and savings, minus anything locked away."
            whyWeAsk="This is the only asset we can count towards your emergency fund, which is a quarter of your financial health score."
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
            helper="Stocks, bonds, crypto, a 401k, an ISA, a pension. Add them all up here."
            whyWeAsk="What you have invested is the other half of what you own. It feeds the debt ratio, which is a quarter of your financial health score."
            error={errors.totalInvestments?.message}
          />
        )}
      />

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
            helper="Your home, land, a vehicle, anything else worth money."
            whyWeAsk="We add property and valuables to the assets side of your financial health score, so a rough estimate already helps."
            error={errors.totalPropertyValue?.message}
          />
        )}
      />

      <Controller
        control={control}
        name="totalBusinessOwnership"
        render={({ field }) => (
          <MoneyField
            id="totalBusinessOwnership"
            label="A business or anything else you own"
            value={field.value}
            onChange={field.onChange}
            currency={currency}
            helper="Your share of a company, equipment, anything else. Leave it at 0 if it does not apply."
            whyWeAsk="Anything you own counts towards the assets side of your financial health score, including a business you are part of."
            error={errors.totalBusinessOwnership?.message}
          />
        )}
      />

      <Controller
        control={control}
        name="totalDebt"
        render={({ field }) => (
          <MoneyField
            id="totalDebt"
            label="Everything you owe, added together"
            value={field.value}
            onChange={field.onChange}
            currency={currency}
            helper="Credit cards, personal loans, student loans, a mortgage, a car loan. One total is fine."
            whyWeAsk="This is the debt side of your financial health score. Being accurate here genuinely works in your favour, because we would otherwise assume you owe nothing."
            error={errors.totalDebt?.message}
          />
        )}
      />

      {/*
        Running total for the five boxes above.

        The three figures are not peers: net worth is the answer, assets and owed
        are the inputs the app just used to reach it. So net worth leads and is
        the largest. On a phone it sits on its own full width line, and assets and
        owed become label left, value right rows, which gives each amount the
        whole width rather than half of it. From sm up it is a single row reading
        Assets, Owed, then net worth on the right, so the arithmetic still reads
        left to right on a wide screen.

        There is deliberately no truncate. At 360px the old three column grid gave
        each column about 90px, which cut a formatted amount short, and silently
        hiding digits of a balance is the worst thing this block could do: someone
        has to be able to tell N12,000,000 from N120,000,000 at a glance.

        tabular-nums keeps the digits from shifting sideways as the value updates
        while you type.
      */}
      <div className="rounded-md border border-border bg-card px-4 py-4">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between sm:gap-6">
          <div className="order-2 flex flex-col gap-1.5 border-t border-border pt-3 sm:order-1 sm:flex-row sm:gap-8 sm:border-t-0 sm:pt-0">
            <div className="flex items-baseline justify-between gap-4 sm:block">
              <p className="text-xs text-muted-foreground">Assets</p>
              <p className="font-display text-base font-semibold tabular-nums text-text-primary sm:mt-0.5">
                {formatMoney(assets, currency)}
              </p>
            </div>
            <div className="flex items-baseline justify-between gap-4 sm:block">
              <p className="text-xs text-muted-foreground">Owed</p>
              <p className="font-display text-base font-semibold tabular-nums text-text-primary sm:mt-0.5">
                {formatMoney(owed, currency)}
              </p>
            </div>
          </div>

          <div className="order-1 min-w-0 sm:order-2 sm:text-right">
            <p className="text-xs text-muted-foreground">Net worth</p>
            <p
              className={`mt-0.5 font-display text-2xl font-semibold tabular-nums sm:text-xl ${
                netWorth < 0 ? "text-rose" : "text-accent"
              }`}
            >
              {formatMoney(netWorth, currency)}
            </p>
          </div>
        </div>
      </div>
    </StepShell>
  );
}