"use client";

import { Controller, useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { Resolver } from "react-hook-form";

import {
  CURRENCY_OPTIONS,
  MIN_AGE_YEARS,
  earliestDateOfBirth,
  stepAboutYouSchema,
  type StepAboutYouForm,
} from "@/lib/validation/onboarding";
import {
  DateSelects,
  FieldRow,
  MoneyField,
  Section,
  SelectField,
  StepShell,
  TextField,
} from "./fields";

const CURRENCY_LABELS: Record<(typeof CURRENCY_OPTIONS)[number], string> = {
  USD: "US Dollar",
  EUR: "Euro",
  GBP: "British Pound",
  CAD: "Canadian Dollar",
  AUD: "Australian Dollar",
  JPY: "Japanese Yen",
  NZD: "New Zealand Dollar",
  CHF: "Swiss Franc",
  INR: "Indian Rupee",
  NGN: "Nigerian Naira",
  BRL: "Brazilian Real",
  MXN: "Mexican Peso",
};

interface Props {
  /** Last saved answers, so stepping back does not wipe the form. */
  defaultValues?: Partial<StepAboutYouForm>;
  onNext: (data: StepAboutYouForm) => void;
}

export function StepAboutYou({ defaultValues, onNext }: Props) {
  const now = new Date();

  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting, touchedFields },
  } = useForm<StepAboutYouForm>({
    resolver: zodResolver(stepAboutYouSchema) as Resolver<StepAboutYouForm>,
    mode: "onTouched",
    defaultValues: {
      firstName: "",
      lastName: "",
      dateOfBirth: "",
      currency: "",
      monthlyIncome: 0,
      ...defaultValues,
    },
  });

  const currency = useWatch({ control, name: "currency" });
  const income = useWatch({ control, name: "monthlyIncome" });

  return (
    <StepShell
      eyebrow="Getting started"
      title="First, the basics"
      description="Four short steps. We only ask for things that change the numbers we show you."
      onSubmit={handleSubmit((data) => onNext(data))}
      submitLabel="Next step"
      submitting={isSubmitting}
    >
      <Section label="Your details">
        <FieldRow>
          <Controller
            control={control}
            name="firstName"
            render={({ field }) => (
              <TextField
                id="firstName"
                label="First name"
                value={field.value}
                onChange={field.onChange}
                onBlur={field.onBlur}
                placeholder="e.g. Michael"
                autoComplete="given-name"
                error={errors.firstName?.message}
                inRow
              />
            )}
          />
          <Controller
            control={control}
            name="lastName"
            render={({ field }) => (
              <TextField
                id="lastName"
                label="Last name"
                value={field.value}
                onChange={field.onChange}
                onBlur={field.onBlur}
                placeholder="e.g. Johnson"
                autoComplete="family-name"
                error={errors.lastName?.message}
                inRow
              />
            )}
          />
        </FieldRow>

        <Controller
          control={control}
          name="dateOfBirth"
          render={({ field }) => (
            <DateSelects
              idPrefix="dateOfBirth"
              label="Date of birth"
              value={field.value}
              onChange={field.onChange}
              minYear={now.getFullYear() - 100}
              maxYear={now.getFullYear() - MIN_AGE_YEARS}
              maxDate={earliestDateOfBirth(now)}
              helper={`You must be 18 or older to use FOS·AI.`}
              error={errors.dateOfBirth?.message}
            />
          )}
        />
      </Section>

      <Section label="Your money">
        <Controller
          control={control}
          name="currency"
          render={({ field }) => (
            <SelectField
              id="currency"
              label="Currency you use"
              value={field.value}
              onChange={field.onChange}
              placeholder="Select a currency"
              options={CURRENCY_OPTIONS.map((code) => ({
                value: code,
                label: `${code} — ${CURRENCY_LABELS[code]}`,
              }))}
              error={errors.currency?.message}
            />
          )}
        />

        <Controller
          control={control}
          name="monthlyIncome"
          render={({ field }) => (
            <div className="flex flex-col gap-2.5">
              <MoneyField
                id="monthlyIncome"
                label="Monthly income"
                value={field.value}
                onChange={field.onChange}
                currency={currency || ""}
                helper="Take home, after tax, averaged over a year. A rough figure is fine."
                whyWeAsk="Your income is one of four things that build your financial health score. It is the number everything else is measured against. We only use what you type here, and you can change it in Settings at any time."
                error={errors.monthlyIncome?.message}
              />
              {touchedFields.monthlyIncome && income === 0 && (
                <p className="text-[13.5px] leading-[1.5] text-text-secondary">
                  Not earning anything right now is okay. Your score will read lower
                  until you have an income, and you can update this in Settings
                  whenever that changes.
                </p>
              )}
            </div>
          )}
        />
      </Section>
    </StepShell>
  );
}