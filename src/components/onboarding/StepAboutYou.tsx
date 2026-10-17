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
  MoneyField,
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
  onNext: (data: StepAboutYouForm) => void;
}

export function StepAboutYou({ onNext }: Props) {
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
    },
  });

  const currency = useWatch({ control, name: "currency" });

  return (
    <StepShell
      title="Let's start with you"
      description="A few quick details so we can tailor everything to your situation."
      onSubmit={handleSubmit((data) => onNext(data))}
      submitLabel="Next step"
      submitting={isSubmitting}
    >
      <div className="grid gap-5 sm:grid-cols-2">
        <Controller
          control={control}
          name="firstName"
          render={({ field }) => (
            <TextField
              id="firstName"
              label="What's your first name?"
              value={field.value}
              onChange={field.onChange}
              onBlur={field.onBlur}
              placeholder="e.g. Michael"
              autoComplete="given-name"
              error={errors.firstName?.message}
            />
          )}
        />

        <Controller
          control={control}
          name="lastName"
          render={({ field }) => (
            <TextField
              id="lastName"
              label="What's your last name?"
              value={field.value}
              onChange={field.onChange}
              onBlur={field.onBlur}
              placeholder="e.g. Johnson"
              autoComplete="family-name"
              error={errors.lastName?.message}
            />
          )}
        />
      </div>

      <Controller
        control={control}
        name="dateOfBirth"
        render={({ field }) => (
          <DateSelects
            idPrefix="dateOfBirth"
            label="What's your date of birth?"
            value={field.value}
            onChange={field.onChange}
            minYear={now.getFullYear() - 100}
            maxYear={now.getFullYear() - MIN_AGE_YEARS}
            maxDate={earliestDateOfBirth(now)}
            helper={`You must be at least ${MIN_AGE_YEARS} to use FOS·AI.`}
            error={errors.dateOfBirth?.message}
          />
        )}
      />

      <Controller
        control={control}
        name="currency"
        render={({ field }) => (
          <SelectField
            id="currency"
            label="What currency do you use?"
            value={field.value}
            onChange={field.onChange}
            placeholder="Select currency"
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
          <div className="flex flex-col gap-2">
            <MoneyField
              id="monthlyIncome"
              label="How much lands in your account each month?"
              value={field.value}
              onChange={field.onChange}
              currency={currency || ""}
              helper="Take home, after tax, averaged over a year. A rough figure is fine."
              whyWeAsk="Your income is one of four things that build your financial health score. It is the number everything else is measured against. We only use what you tell us here."
              error={errors.monthlyIncome?.message}
            />
            {touchedFields.monthlyIncome && field.value === 0 && (
              <p className="text-xs text-text-secondary">
                Not earning anything right now is okay. Your score will read
                lower until you have an income, and you can update this in
                Settings whenever that changes.
              </p>
            )}
          </div>
        )}
      />
    </StepShell>
  );
}