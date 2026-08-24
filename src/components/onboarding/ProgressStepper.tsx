"use client";

import { Check } from "lucide-react";

const STEPS = [
  { num: 1, label: "Personal" },
  { num: 2, label: "Cash Flow" },
  { num: 3, label: "Assets" },
  { num: 4, label: "Goals" },
  { num: 5, label: "Risk" },
];

interface Props {
  currentStep: number;
}

export function ProgressStepper({ currentStep }: Props) {
  return (
    <div style={{ margin: "-8px -8px 32px", padding: "0 8px", overflowX: "auto" }} className="sm:!mx-0 sm:!mb-10 sm:!overflow-visible sm:!px-0">
      <div
        className="flex w-max min-w-full items-center justify-between sm:w-full"
      >
        {STEPS.map((step, i) => {
          const isCompleted = currentStep > step.num;
          const isCurrent = currentStep === step.num;

          return (
            <div key={step.num} className="flex items-center">
              <div className="flex flex-col items-center">
                <div
                  style={{
                    width: "28px",
                    height: "28px",
                    borderRadius: "50%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "0.6875rem",
                    fontWeight: 600,
                    transition: "all 0.2s var(--ease)",
                    background: isCompleted ? "var(--accent)" : isCurrent ? "var(--accent-soft)" : "transparent",
                    color: isCompleted ? "#fff" : isCurrent ? "var(--accent)" : "var(--text-3)",
                    border: isCurrent ? "2px solid var(--accent)" : isCompleted ? "none" : "2px solid var(--glass-border)",
                  }}
                  className="sm:!w-8 sm:!h-8 sm:!text-xs"
                >
                  {isCompleted ? <Check style={{ width: "14px", height: "14px" }} /> : step.num}
                </div>
                <span
                  style={{
                    marginTop: "4px",
                    fontSize: "0.625rem",
                    fontWeight: 500,
                    lineHeight: 1.2,
                    color: isCurrent ? "var(--accent)" : "var(--text-3)",
                  }}
                  className="sm:!mt-1.5 sm:!text-xs"
                >
                  {step.label}
                </span>
              </div>
              {i < STEPS.length - 1 && (
                <div
                  style={{
                    marginLeft: "6px",
                    marginRight: "6px",
                    marginTop: "-1.25rem",
                    height: "2px",
                    width: "24px",
                    background: isCompleted ? "var(--accent)" : "var(--glass-border)",
                    transition: "background 0.2s var(--ease)",
                  }}
                  className="sm:!mx-3 sm:!w-12 lg:!w-20"
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
