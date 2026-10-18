"use client";

import { useMemo, useState, type ReactNode } from "react";
import { ChevronDown } from "lucide-react";

import { CurrencyInput } from "@/components/ui/currency-input";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { handleEnterToNext } from "@/lib/enter-to-next";
import { isRealIsoDate, todayIso } from "@/lib/validation/onboarding";

/**
 * The single field layer every onboarding step renders through.
 *
 * Built on the same primitives as the rest of the app, and sized for a phone:
 * 52px controls and 16px input text, because iOS Safari zooms the whole page
 * when an input under 16px takes focus and never zooms back out.
 *
 * Breakpoints are CONTAINER queries, not viewport ones. The card is capped at
 * a max width, so at some viewport sizes the card is narrow enough to need the
 * single column layout even though the viewport is wide. Viewport queries got
 * that wrong and squeezed two column rows into a phone width card.
 */

const CONTROL =
  "h-[52px] w-full rounded-[14px] border border-outline bg-surface-2 px-4 text-base text-text-primary outline-none transition-colors placeholder:text-muted-foreground hover:border-outline-strong focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/25 aria-invalid:border-destructive";

const SELECT_CONTROL = cn(
  CONTROL,
  "cursor-pointer appearance-none bg-[length:12px] bg-[right_15px_center] bg-no-repeat pr-10"
);

const HEAD = "flex flex-nowrap items-baseline gap-2.5";
const LABEL = "min-w-0 flex-1 text-[15px] font-semibold leading-[1.4] tracking-[-0.005em] text-text-primary";
const OPTIONAL =
  "shrink-0 whitespace-nowrap rounded-full border border-outline px-2 py-[3px] font-mono text-[10px] font-semibold uppercase tracking-[0.08em] text-muted-foreground";
const HELPER = "m-0 text-[13.5px] leading-[1.5] text-text-secondary";
const WHY_NOTE =
  "m-0 rounded-[14px] border border-outline border-l-2 border-l-accent bg-surface-2 px-4 py-3.5 text-[13.5px] leading-[1.6] text-text-secondary";

/**
 * Applied to a field that sits inside a two column row so its label, control
 * and helper share the row tracks with its neighbour. Without this a label
 * that wraps to an extra line pushes its control below the control beside it.
 * Three tracks, because the helper or error line is a sibling of the label
 * and the control, not a decoration under them.
 */
const SUBGRID =
  "@min-[520px]:row-span-3 @min-[520px]:grid @min-[520px]:[grid-template-rows:subgrid] @min-[520px]:gap-y-2.5";

function WhyWeAskTrigger({
  panelId,
  open,
  onToggle,
}: {
  panelId: string;
  open: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-expanded={open}
      aria-controls={panelId}
      className="ml-auto inline-flex shrink-0 cursor-pointer items-center gap-1.5 whitespace-nowrap border-0 bg-transparent p-0 text-[13px] font-semibold text-accent underline decoration-accent/40 decoration-1 underline-offset-[3px] transition-colors hover:decoration-accent"
    >
      Why we ask
      <ChevronDown
        className={cn("h-2.5 w-2.5 transition-transform", open && "rotate-180")}
        aria-hidden="true"
      />
    </button>
  );
}

interface FieldShellProps {
  id: string;
  label: string;
  optional?: boolean;
  helper?: string;
  error?: string;
  whyWeAsk?: string;
  inRow?: boolean;
  children: (describedBy: string | undefined) => ReactNode;
}

function FieldShell({
  id,
  label,
  optional,
  helper,
  error,
  whyWeAsk,
  inRow,
  children,
}: FieldShellProps) {
  const hintId = `${id}-hint`;
  const errorId = `${id}-error`;
  const noteId = `${id}-why`;
  const describedBy =
    [error ? errorId : null, helper ? hintId : null].filter(Boolean).join(" ") ||
    undefined;

  const [whyOpen, setWhyOpen] = useState(false);

  return (
    <div className={cn("flex flex-col gap-2.5", inRow && SUBGRID)}>
      <div className={HEAD}>
        <label htmlFor={id} className={LABEL}>
          {label}
        </label>
        {optional && <span className={OPTIONAL}>Optional</span>}
        {whyWeAsk && (
          <WhyWeAskTrigger
            panelId={noteId}
            open={whyOpen}
            onToggle={() => setWhyOpen((v) => !v)}
          />
        )}
      </div>

      {children(describedBy)}

      {error ? (
        <p id={errorId} className="text-[13px] text-rose">
          {error}
        </p>
      ) : (
        helper && (
          <p id={hintId} className={HELPER}>
            {helper}
          </p>
        )
      )}

      {/* Sits below the control, not inside the label row, which is a flex
          container and would have squeezed it beside the button. */}
      {whyWeAsk && whyOpen && (
        <p id={noteId} className={WHY_NOTE}>
          {whyWeAsk}
        </p>
      )}
    </div>
  );
}

export function Section({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div>
      <p className="mb-4 border-b border-outline pb-3 font-mono text-[11px] font-semibold uppercase tracking-[0.1em] text-muted-foreground">
        {label}
      </p>
      <div className="grid gap-6">{children}</div>
    </div>
  );
}

/** Two fields side by side on a wide card, stacked on a narrow one. */
export function FieldRow({ children }: { children: ReactNode }) {
  return (
    <div className="grid gap-6 @min-[520px]:grid-cols-2 @min-[520px]:grid-rows-[auto_auto_auto] @min-[520px]:gap-y-2.5">
      {children}
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
  inRow?: boolean;
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
  inRow,
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
      inRow={inRow}
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
          className={CONTROL}
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
  inRow?: boolean;
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
  inRow,
}: MoneyFieldProps) {
  return (
    <FieldShell
      id={id}
      label={label}
      optional={optional}
      helper={helper}
      error={error}
      whyWeAsk={whyWeAsk}
      inRow={inRow}
    >
      {(describedBy) => (
        <div className="relative">
          {/* No invented currency. Before step 1 is answered there is no
              currency to show, and guessing NGN mislabels the number. */}
          {currency && (
            <span
              aria-hidden="true"
              className="pointer-events-none absolute top-1/2 left-4 -translate-y-1/2 font-mono text-xs font-bold tracking-[0.06em] text-muted-foreground"
            >
              {currency}
            </span>
          )}
          <CurrencyInput
            id={id}
            value={value}
            onChange={onChange}
            aria-describedby={describedBy}
            aria-invalid={error ? true : undefined}
            className={cn(CONTROL, "tabular-nums", currency && "pl-[58px]")}
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
  whyWeAsk?: string;
  inRow?: boolean;
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
  whyWeAsk,
  inRow,
}: SelectFieldProps) {
  return (
    <FieldShell
      id={id}
      label={label}
      optional={optional}
      helper={helper}
      error={error}
      whyWeAsk={whyWeAsk}
      inRow={inRow}
    >
      {(describedBy) => (
        <select
          id={id}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          aria-describedby={describedBy}
          aria-invalid={error ? true : undefined}
          className={SELECT_CONTROL}
          style={{
            backgroundImage:
              "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%238C8C9E' stroke-width='2.5' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E\")",
          }}
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

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

function daysInMonth(month: string, year: string): number {
  if (!month) return 31;
  // 2024 is a leap year, so 29 is offered for February before a year is chosen.
  return new Date(year ? Number(year) : 2024, Number(month), 0).getDate();
}

interface DateSelectsProps {
  idPrefix: string;
  label: string;
  /** ISO yyyy-mm-dd, or an empty string when nothing is chosen yet. */
  value: string;
  onChange: (iso: string) => void;
  minYear: number;
  maxYear: number;
  /** Latest selectable date as yyyy-mm-dd. Months and days past it are hidden. */
  maxDate?: string;
  helper?: string;
  error?: string;
  whyWeAsk?: string;
  inRow?: boolean;
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
  inRow,
}: DateSelectsProps) {
  const hintId = `${idPrefix}-hint`;
  const errorId = `${idPrefix}-error`;
  const describedBy = error ? errorId : helper ? hintId : undefined;

  // This component is the only writer of its own value in both places it is
  // used, so the three dropdowns are seeded once and every later change goes
  // through the handlers below.
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

  const clampDay = (
    currentDay: string,
    nextMonth: string,
    nextYear: string
  ): string => {
    if (!currentDay) return currentDay;
    const cutoffApplies =
      maxDate &&
      nextYear === maxYearOfMaxDate &&
      nextMonth === maxMonthOfMaxDate;
    const max = cutoffApplies
      ? Number(maxDayOfMaxDate)
      : daysInMonth(nextMonth, nextYear);
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

  return (
    <FieldShell
      id={`${idPrefix}-day`}
      label={label}
      helper={helper}
      error={error}
      whyWeAsk={whyWeAsk}
      inRow={inRow}
    >
      {() => (
        <div className="grid grid-cols-2 gap-3 @min-[400px]:grid-cols-[1fr_2fr_1.4fr]">
          <select
            id={`${idPrefix}-day`}
            value={day}
            onChange={(e) => handleDay(e.target.value)}
            aria-label="Day"
            aria-describedby={describedBy}
            aria-invalid={error ? true : undefined}
            className={cn(SELECT_CONTROL, "min-w-0")}
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
            className={cn(SELECT_CONTROL, "min-w-0")}
          >
            <option value="">Month</option>
            {MONTH_NAMES.map((name, index) => {
              const v = String(index + 1).padStart(2, "0");
              // In the final allowed year, months after the cutoff are hidden.
              if (maxDate && year === maxYearOfMaxDate && v > maxMonthOfMaxDate!) {
                return null;
              }
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
            className={cn(SELECT_CONTROL, "col-span-2 min-w-0 @min-[400px]:col-span-1")}
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

interface GoalDateFieldProps {
  id: string;
  label: string;
  value: string;
  onChange: (iso: string) => void;
  helper?: string;
  error?: string;
  inRow?: boolean;
}

/** A native date input for the goal target date, floored at today. */
export function GoalDateField({
  id,
  label,
  value,
  onChange,
  helper,
  error,
  inRow,
}: GoalDateFieldProps) {
  const hintId = `${id}-hint`;
  const errorId = `${id}-error`;
  const describedBy = error ? errorId : helper ? hintId : undefined;

  return (
    <FieldShell
      id={id}
      label={label}
      helper={helper}
      error={error}
      inRow={inRow}
    >
      {(ids) => (
        <input
          id={id}
          type="date"
          value={value}
          min={todayIso()}
          onChange={(e) => onChange(e.target.value)}
          aria-describedby={ids ?? describedBy}
          aria-invalid={error ? true : undefined}
          className={cn(CONTROL, "cursor-pointer scheme-light dark:scheme-dark")}
        />
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
      <legend className="mb-2.5 text-[15px] font-semibold leading-[1.4] text-text-primary">
        {question}
      </legend>
      <div className="grid gap-2.5">
        {options.map((option, index) => {
          const id = `${name}-${index}`;
          const selected = value === option.label;
          return (
            <label
              key={option.label}
              htmlFor={id}
              className={cn(
                "flex min-h-[54px] cursor-pointer items-start gap-3.5 rounded-[14px] border px-4 py-4 text-[14.5px] leading-[1.45] transition-colors",
                selected
                  ? "border-accent bg-accent/10 text-text-primary"
                  : "border-outline bg-surface-2 text-text-secondary hover:border-outline-strong hover:text-text-primary"
              )}
            >
              <input
                type="radio"
                id={id}
                name={name}
                checked={selected}
                onChange={() => onChange(option.label, option.score)}
                className="peer sr-only"
              />
              <span
                aria-hidden="true"
                className={cn(
                  "mt-px grid h-5 w-5 shrink-0 place-items-center rounded-full border-[1.5px] transition-colors",
                  selected ? "border-accent" : "border-outline-strong"
                )}
              >
                {selected && <span className="h-2.5 w-2.5 rounded-full bg-accent" />}
              </span>
              <span>{option.label}</span>
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}

interface StepShellProps {
  eyebrow: string;
  title: string;
  description: string;
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
  submitLabel: string;
  submitting?: boolean;
  onBack?: () => void;
  children: ReactNode;
}

export function StepShell({
  eyebrow,
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
      className="flex flex-col gap-8"
    >
      <div>
        <p className="mb-2.5 font-mono text-[11px] font-bold uppercase tracking-[0.12em] text-accent">
          {eyebrow}
        </p>
        <h1 className="mb-2.5 font-display text-[26px] font-bold leading-[1.18] tracking-[-0.025em] text-text-primary @min-[520px]:text-[31px]">
          {title}
        </h1>
        <p className="m-0 max-w-[46ch] text-[15px] leading-[1.6] text-text-secondary">
          {description}
        </p>
      </div>

      {children}

      {/* Back on the left, Next on the right. The outline variant of the shared
          Button falls back to an 8% white film and a transparent dark fill,
          which is the faint stroke this design does not want, so Back pins
          every state to the opaque tokens. */}
      <div className="mt-2 flex items-center justify-between gap-3.5">
        {onBack ? (
          <Button
            type="button"
            variant="outline"
            size="lg"
            onClick={onBack}
            className="h-[52px] shrink-0 rounded-full border-outline bg-surface-2 px-7 hover:bg-surface-3 hover:text-text-primary dark:border-outline dark:bg-surface-2 dark:hover:bg-surface-3"
          >
            Back
          </Button>
        ) : (
          <span aria-hidden="true" />
        )}
        <Button
          type="submit"
          size="lg"
          disabled={submitting}
          className="h-[52px] flex-1 rounded-full px-7 @min-[520px]:min-w-[190px] @min-[520px]:flex-none"
        >
          {submitting ? "Saving…" : submitLabel}
        </Button>
      </div>
    </form>
  );
}