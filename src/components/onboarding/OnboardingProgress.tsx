"use client";

import { Check } from "lucide-react";

import { cn } from "@/lib/utils";

export interface OnboardingStep {
  /** Short label shown on the step tab. */
  label: string;
  /** Honest time estimate shown next to the step count. */
  estimate: string;
}

export const ONBOARDING_STEPS: OnboardingStep[] = [
  { label: "About you", estimate: "About 3 minutes left" },
  { label: "Month to month", estimate: "About 2 minutes left" },
  { label: "Own and owe", estimate: "About 1 minute left" },
  { label: "Goals and risk", estimate: "Last step" },
];

interface Props {
  currentStep: number;
  /** Highest step the person has unlocked, so tabs they have not reached are disabled. */
  reachedStep: number;
  onJump: (step: number) => void;
}

export function OnboardingProgress({ currentStep, reachedStep, onJump }: Props) {
  const step = ONBOARDING_STEPS[currentStep - 1] ?? ONBOARDING_STEPS[0];
  const percent = (currentStep / ONBOARDING_STEPS.length) * 100;

  return (
    <div className="mb-7">
      <div className="mb-2.5 flex items-baseline justify-between gap-3">
        <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.1em] text-muted-foreground">
          Step <span className="font-bold text-text-primary">{currentStep}</span> of{" "}
          {ONBOARDING_STEPS.length}
        </p>
        <p className="text-xs text-muted-foreground">{step.estimate}</p>
      </div>

      <div
        className="h-1 overflow-hidden rounded-full bg-surface-3"
        role="progressbar"
        aria-valuemin={1}
        aria-valuemax={ONBOARDING_STEPS.length}
        aria-valuenow={currentStep}
        aria-label="Onboarding progress"
      >
        <div
          className="h-full rounded-full bg-gradient-to-r from-accent to-[#9185FF] transition-[width] duration-500 ease-out"
          style={{ width: `${percent}%` }}
        />
      </div>

      {/* Tabs are buttons, so a person can jump back and fix an answer without
          stepping forward through every screen again. */}
      <div className="mt-3.5 flex gap-1.5 @max-[479px]:justify-center">
        {ONBOARDING_STEPS.map((s, index) => {
          const number = index + 1;
          const state =
            number === currentStep ? "current" : number < currentStep ? "done" : "todo";
          const disabled = number > reachedStep;

          return (
            <button
              key={s.label}
              type="button"
              disabled={disabled}
              onClick={() => onJump(number)}
              aria-current={number === currentStep ? "step" : undefined}
              className={cn(
                "flex min-w-0 flex-1 basis-0 items-center gap-2 rounded-xl border border-transparent bg-transparent px-2.5 py-2 text-left text-[12.5px] font-semibold transition-colors",
                "disabled:cursor-not-allowed disabled:opacity-45",
                state === "current"
                  ? "border-outline bg-surface-2 text-text-primary"
                  : "text-muted-foreground enabled:hover:bg-surface-2",
                "@max-[479px]:[&:not([data-state=current])_span:last-child]:hidden",
              )}
              data-state={state}
            >
              <span
                className={cn(
                  "grid h-5 w-5 shrink-0 place-items-center rounded-full border-[1.5px] font-mono text-[10px] font-bold",
                  state === "done" && "border-accent bg-accent text-white",
                  state === "current" && "border-accent text-accent",
                  state === "todo" && "border-outline-strong",
                )}
              >
                {state === "done" ? <Check className="h-3 w-3" strokeWidth={3.5} /> : number}
              </span>
              <span className="truncate">{s.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}