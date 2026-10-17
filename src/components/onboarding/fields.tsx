"use client";

import { useId, useMemo, useState, type ReactNode } from "react";
import { Info } from "lucide-react";

import { CurrencyInput } from "@/components/ui/currency-input";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { handleEnterToNext } from "@/lib/enter-to-next";
import { isRealIsoDate } from "@/lib/validation/onboarding";

/**
 * The single field layer every onboarding step renders through.
 *
 * These replace the labelStyle and inputStyle objects that were copy pasted into
 * each of the five old step components, and they are built on the same primitives
 * the rest of the app uses, so the colours come from the theme rather than from
 * hard coded values.
 */

const CONTROL_CLASSES =
  "h-11 w-full rounded-md border border-border bg-card px-3.5 text-sm text-text-primary outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-destructive/20";

const MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

function daysInMonth(month: string, year: string): number {
  if (!month) return 31;
  const m = Number(month);
  const y = year ? Number(year) : 2024; // a leap year, so 29 is offered for February
  return new Date(y, m, 0).getDate();
}

function WhyWeAsk({ text }: { text: string }) {
  const [open, setOpen] = useState(false);
  const panelId = useId();

  return (
    <span className="relative inline-flex">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-controls={panelId}
        aria-label="Why we ask for this"
        className="inline-flex size-4 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors outline-none hover:text-accent focus-visible:ring-3 focus-visible:ring-ring/50"
      >
        <Info className="size-3.5" aria-hidden="true" />
      </button>
      {open && (
        <span
          id={panelId}
          role="note"
          className="absolute top-6 left-0 z-30 block w-64 rounded-md border border-border bg-card p-3 text-xs leading-relaxed font-normal text-text-secondary shadow-lg"
        >
          {text}
        </span>
      )}
    </span>
  );
}

interface FieldShellProps {
  id: string;
  label: string;
  optional?: boolean;
  helper?: string;
  error?: string;
  whyWeAsk?: string;
  children: (describedBy: string | undefined) => ReactNode;
}

function FieldShell({
  id,
  label,
  optional,
  helper,
  error,
  whyWeAsk,
  children,
}: FieldShellProps) {
  const hintId = `${id}-hint`;
  const errorId = `${id}-error`;
  const describedBy = error ? errorId : helper ? hintId : undefined;

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center gap-1.5">
        <label htmlFor={id} className="text-sm font-medium text-text-primary">
          {label}
        </label>
        {optional && (
          <span className="text-xs font-normal text-muted-foreground">
            Optional
          </span>
        )}
        {whyWeAsk && <WhyWeAsk text={whyWeAsk} />}
      </div>

      {children(describedBy)}

      {error ? (
        <p id={errorId} className="text-xs text-rose">
          {error}
        </p>
      ) : (
        helper && (
          <p id={hintId} className="text-xs text-text-secondary">
            {helper}
          </p>
        )
      )}
    </div>
  );
}

interface TextFieldProps {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  autoComplete?: string;
  optional?: boolean;
  helper?: string;
  error?: string;
  whyWeAsk?: string;
  onBlur?: () => void;
}

export function TextField({
  id,
  label,
  value,
  onChange,
  placeholder,
  autoComplete,
  optional,
  helper,
  error,
  whyWeAsk,
  onBlur,
}: TextFieldProps) {
  return (
    <FieldShell
      id={id}
      label={label}
      optional={optional}
      helper={helper}
      error={error}
      whyWeAsk={whyWeAsk}
    >
      {(describedBy) => (
        <Input
          id={id}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onBlur={onBlur}
          placeholder={placeholder}
          autoComplete={autoComplete}
          aria-describedby={describedBy}
          aria-invalid={error ? true : undefined}
          className={CONTROL_CLASSES}
        />
      )}
    </FieldShell>
  );
}

interface MoneyFieldProps {
  id: string;
  label: string;
  value: number;
  onChange: (value: number) => void;
  currency: string;
  optional?: boolean;
  helper?: string;
  error?: string;
  whyWeAsk?: string;
}

export function MoneyField({
  id,
  label,
  value,
  onChange,
  currency,
  optional,
  helper,
  error,
  whyWeAsk,
}: MoneyFieldProps) {
  return (
    <FieldShell
      id={id}
      label={label}
      optional={optional}
      helper={helper}
      error={error}
      whyWeAsk={whyWeAsk}
    >
      {(describedBy) => (
        <div className="relative">
          <span
            aria-hidden="true"
            className="pointer-events-none absolute top-1/2 left-3.5 -translate-y-1/2 font-mono text-xs font-semibold tracking-wider text-muted-foreground"
          >
            {currency}
          </span>
          <CurrencyInput
            id={id}
            value={value}
            onChange={onChange}
            aria-describedby={describedBy}
            aria-invalid={error ? true : undefined}
            className={cn(CONTROL_CLASSES, "pl-14")}
          />
        </div>
      )}
    </FieldShell>
  );
}

interface SelectOption {
  value: string;
  label: string;
}

interface SelectFieldProps {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: readonly SelectOption[];
  placeholder: string;
  optional?: boolean;
  helper?: string;
  error?: string;
}

export function SelectField({
  id,
  label,
  value,
  onChange,
  options,
  placeholder,
  optional,
  helper,
  error,
}: SelectFieldProps) {
  return (
    <FieldShell
      id={id}
      label={label}
      optional={optional}
      helper={helper}
      error={error}
    >
      {(describedBy) => (
        <select
          id={id}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          aria-describedby={describedBy}
          aria-invalid={error ? true : undefined}
          className={cn(CONTROL_CLASSES, "select-chevron")}
        >
          <option value="">{placeholder}</option>
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      )}
    </FieldShell>
  );
}

interface DateSelectsProps {
  idPrefix: string;
  label: string;
  /** ISO yyyy-mm-dd, or an empty string when nothing is chosen yet. */
  value: string;
  onChange: (iso: string) => void;
  minYear: number;
  maxYear: number;
  /**
   * Latest selectable date as yyyy-mm-dd. Options past it are hidden rather than
   * left selectable, so the dropdowns cannot produce a date the server rejects.
   */
  maxDate?: string;
  helper?: string;
  error?: string;
  whyWeAsk?: string;
}

export function DateSelects({
  idPrefix,
  label,
  value,
  onChange,
  minYear,
  maxYear,
  maxDate,
  helper,
  error,
  whyWeAsk,
}: DateSelectsProps) {
  const hintId = `${idPrefix}-hint`;
  const errorId = `${idPrefix}-error`;
  const describedBy = error ? errorId : helper ? hintId : undefined;

  // This component is the only writer of its own value in both places it is
  // used, so the three dropdowns are seeded from the value once and every later
  // change goes through the handlers below.
  const [day, setDay] = useState(() => value.slice(8, 10));
  const [month, setMonth] = useState(() => value.slice(5, 7));
  const [year, setYear] = useState(() => value.slice(0, 4));

  const emit = (nextDay: string, nextMonth: string, nextYear: string) => {
    if (!nextDay || !nextMonth || !nextYear) {
      onChange("");
      return;
    }
    const candidate = `${nextYear}-${nextMonth.padStart(2, "0")}-${nextDay.padStart(2, "0")}`;
    onChange(isRealIsoDate(candidate) ? candidate : "");
  };

  const maxYearOfMaxDate = maxDate ? maxDate.slice(0, 4) : null;
  const maxMonthOfMaxDate = maxDate ? maxDate.slice(5, 7) : null;
  const maxDayOfMaxDate = maxDate ? maxDate.slice(8, 10) : null;

  /**
   * Clamps a chosen month to the maxDate cutoff when the selected year is the
   * cutoff year, so a month past the cutoff cannot be kept in state even though
   * its option is hidden from the dropdown.
   */
  const clampMonth = (currentMonth: string, nextYear: string): string => {
    if (
      maxDate &&
      nextYear === maxYearOfMaxDate &&
      currentMonth > maxMonthOfMaxDate!
    ) {
      return maxMonthOfMaxDate!;
    }
    return currentMonth;
  };

  /** Keeps a chosen day valid for its month and for the maxDate cutoff. */
  const clampDay = (
    currentDay: string,
    nextMonth: string,
    nextYear: string
  ): string => {
    if (!currentDay) return currentDay;
    const monthMax = daysInMonth(nextMonth, nextYear);
    const cutoffApplies =
      maxDate &&
      nextYear === maxYearOfMaxDate &&
      nextMonth === maxMonthOfMaxDate;
    const max = cutoffApplies ? Number(maxDayOfMaxDate) : monthMax;
    return Number(currentDay) > max ? String(max) : currentDay;
  };

  const handleDay = (nextDay: string) => {
    setDay(nextDay);
    emit(nextDay, month, year);
  };

  const handleMonth = (nextMonth: string) => {
    setMonth(nextMonth);
    const nextDay = clampDay(day, nextMonth, year);
    if (nextDay !== day) setDay(nextDay);
    emit(nextDay, nextMonth, year);
  };

  const handleYear = (nextYear: string) => {
    setYear(nextYear);
    // Narrowing the year can push the chosen month or day past the cutoff, so
    // both are re-clamped here and the corrected values are emitted.
    const nextMonth = clampMonth(month, nextYear);
    if (nextMonth !== month) setMonth(nextMonth);
    const nextDay = clampDay(day, nextMonth, nextYear);
    if (nextDay !== day) setDay(nextDay);
    emit(nextDay, nextMonth, nextYear);
  };

  const maxDay = useMemo(() => {
    const monthMax = daysInMonth(month, year);
    if (maxDate && year === maxYearOfMaxDate && month === maxMonthOfMaxDate) {
      return Number(maxDayOfMaxDate);
    }
    return monthMax;
  }, [month, year, maxDate, maxYearOfMaxDate, maxMonthOfMaxDate, maxDayOfMaxDate]);

  const days = useMemo(
    () => Array.from({ length: maxDay }, (_, i) => String(i + 1)),
    [maxDay]
  );
  const years = useMemo(() => {
    const list: string[] = [];
    for (let y = maxYear; y >= minYear; y--) list.push(String(y));
    return list;
  }, [minYear, maxYear]);

  const selectClasses = cn(CONTROL_CLASSES, "select-chevron px-3");

  return (
    <FieldShell
      id={`${idPrefix}-day`}
      label={label}
      helper={helper}
      error={error}
      whyWeAsk={whyWeAsk}
    >
      {() => (
        <div className="flex gap-2" role="group" aria-label={label}>
          <select
            id={`${idPrefix}-day`}
            value={day}
            onChange={(e) => handleDay(e.target.value)}
            aria-label="Day"
            aria-describedby={describedBy}
            aria-invalid={error ? true : undefined}
            className={cn(selectClasses, "flex-1")}
          >
            <option value="">Day</option>
            {days.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>

          <select
            id={`${idPrefix}-month`}
            value={month}
            onChange={(e) => handleMonth(e.target.value)}
            aria-label="Month"
            className={cn(selectClasses, "flex-[2]")}
          >
            <option value="">Month</option>
            {MONTH_NAMES.map((name, index) => {
              const v = String(index + 1).padStart(2, "0");
              // In the final allowed year, months after the cutoff are hidden.
              const pastLimit =
                maxDate && year === maxYearOfMaxDate && v > maxMonthOfMaxDate!;
              if (pastLimit) return null;
              return (
                <option key={name} value={v}>
                  {name}
                </option>
              );
            })}
          </select>

          <select
            id={`${idPrefix}-year`}
            value={year}
            onChange={(e) => handleYear(e.target.value)}
            aria-label="Year"
            className={cn(selectClasses, "flex-[1.4]")}
          >
            <option value="">Year</option>
            {years.map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>
        </div>
      )}
    </FieldShell>
  );
}

interface RadioCardsProps {
  name: string;
  question: string;
  options: { label: string; score: number }[];
  value: string;
  onChange: (label: string, score: number) => void;
}

export function RadioCards({
  name,
  question,
  options,
  value,
  onChange,
}: RadioCardsProps) {
  return (
    <fieldset className="border-0 p-0">
      <legend className="mb-2.5 text-sm font-medium text-text-primary">
        {question}
      </legend>
      <div className="flex flex-col gap-2">
        {options.map((option) => {
          const id = `${name}-${option.score}-${option.label
            .replace(/[^a-z0-9]+/gi, "-")
            .toLowerCase()}`;
          const selected = value === option.label;
          return (
            <label
              key={option.label}
              htmlFor={id}
              className={cn(
                "flex min-h-11 cursor-pointer items-center gap-3 rounded-md border px-3.5 py-2.5 text-sm transition-colors",
                selected
                  ? "border-accent bg-accent/10 text-text-primary"
                  : "border-border bg-card text-text-secondary hover:bg-muted"
              )}
            >
              <input
                type="radio"
                id={id}
                name={name}
                checked={selected}
                onChange={() => onChange(option.label, option.score)}
                className="sr-only"
              />
              <span
                aria-hidden="true"
                className={cn(
                  "flex size-4 shrink-0 items-center justify-center rounded-full border transition-colors",
                  selected ? "border-accent" : "border-border"
                )}
              >
                {selected && <span className="size-2 rounded-full bg-accent" />}
              </span>
              <span className="flex-1 focus-within:text-text-primary">
                {option.label}
              </span>
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}

interface StepShellProps {
  title: string;
  description: string;
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
  submitLabel: string;
  submitting?: boolean;
  onBack?: () => void;
  children: ReactNode;
}

export function StepShell({
  title,
  description,
  onSubmit,
  submitLabel,
  submitting,
  onBack,
  children,
}: StepShellProps) {
  return (
    <form
      onSubmit={onSubmit}
      onKeyDown={handleEnterToNext}
      noValidate
      className="flex flex-col gap-5"
    >
      <div>
        <h2 className="font-display text-xl font-bold text-text-primary">
          {title}
        </h2>
        <p className="mt-1 text-sm text-text-secondary">{description}</p>
      </div>

      {children}

      <div className="flex items-center justify-between gap-3 pt-2">
        {onBack ? (
          <Button
            type="button"
            variant="outline"
            size="lg"
            onClick={onBack}
            className="min-h-11"
          >
            Back
          </Button>
        ) : (
          <span />
        )}
        <Button type="submit" size="lg" disabled={submitting} className="min-h-11">
          {submitting ? "Saving…" : submitLabel}
        </Button>
      </div>
    </form>
  );
}