"use client";

import { motion } from "framer-motion";
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
  const active = Math.min(Math.max(currentStep, 1), STEPS.length);
  const currentLabel = STEPS[active - 1].label;

  return (
    <div className="mb-8 sm:mb-10">
      {/* HUD row: current step readout + mono counter */}
      <div className="mb-4 flex items-center justify-between">
        <span
          style={{
            fontFamily: "var(--font-mono-family)",
            fontSize: "0.625rem",
            fontWeight: 600,
            letterSpacing: "0.1em",
            textTransform: "uppercase",
            color: "var(--accent)",
          }}
        >
          {currentLabel}
        </span>
        <span
          style={{
            fontFamily: "var(--font-mono-family)",
            fontSize: "0.625rem",
            fontWeight: 600,
            letterSpacing: "0.06em",
            padding: "3px 10px",
            borderRadius: "var(--radius-full)",
            background: "var(--accent-soft)",
            color: "var(--accent)",
          }}
        >
          {String(active).padStart(2, "0")} / {String(STEPS.length).padStart(2, "0")}
        </span>
      </div>

      {/* Track: square tiles + gauge connectors */}
      <div className="flex items-center" role="list" aria-label="Onboarding steps">
        {STEPS.map((step, i) => {
          const isCompleted = active > step.num;
          const isCurrent = active === step.num;
          const filled = isCompleted || isCurrent;

          return (
            <div
              key={step.num}
              role="listitem"
              aria-current={isCurrent ? "step" : undefined}
              aria-label={`${step.label}, ${
                isCompleted ? "completed" : isCurrent ? "current step" : "not completed"
              }`}
              className="flex items-center"
              style={{ flexBasis: 0, flexGrow: 1, minWidth: 0 }}
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: "spring", stiffness: 320, damping: 22, delay: i * 0.05 }}
                className="flex h-[30px] w-[30px] shrink-0 items-center justify-center"
                style={{
                  borderRadius: "var(--radius-xs)",
                  background: filled
                    ? "linear-gradient(135deg, var(--accent), #4F3DC9)"
                    : "var(--glass-bg)",
                  border: filled ? "1px solid rgba(105, 90, 255, 0.4)" : "1px solid var(--glass-border)",
                  boxShadow: filled
                    ? "0 2px 12px var(--accent-glow)"
                    : "inset 0 1px 0 rgba(255,255,255,0.4)",
                  color: "#FFFFFF",
                }}
              >
                {isCompleted ? (
                  <Check className="h-3.5 w-3.5 text-white" strokeWidth={3} />
                ) : (
                  <span
                    style={{
                      fontFamily: "var(--font-mono-family)",
                      fontSize: "0.75rem",
                      fontWeight: 600,
                      color: filled ? "#fff" : "var(--text-3)",
                    }}
                  >
                    {step.num}
                  </span>
                )}
              </motion.div>

              {i < STEPS.length - 1 && (
                <div
                  className="ml-1.5 h-1 flex-1 overflow-hidden"
                  style={{
                    borderRadius: "999px",
                    background: "var(--gauge-track)",
                  }}
                >
                  <motion.div
                    initial={false}
                    animate={{ width: isCompleted ? "100%" : "0%" }}
                    transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                    className="h-full"
                    style={{
                      borderRadius: "999px",
                      background: "linear-gradient(90deg, var(--accent), #9185FF)",
                    }}
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}