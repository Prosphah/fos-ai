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
                <motion.div
                  animate={{
                    scale: isCurrent ? 1.1 : 1,
                    backgroundColor: isCompleted
                      ? "var(--accent)"
                      : isCurrent
                        ? "var(--accent-soft)"
                        : "transparent",
                  }}
                  transition={{ type: "spring", stiffness: 400, damping: 25 }}
                  style={{
                    width: "28px",
                    height: "28px",
                    borderRadius: "50%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "0.6875rem",
                    fontWeight: 600,
                    color: isCompleted ? "#fff" : isCurrent ? "var(--accent)" : "var(--text-3)",
                    border: isCurrent ? "2px solid var(--accent)" : isCompleted ? "none" : "2px solid var(--glass-border)",
                  }}
                  className="sm:!w-8 sm:!h-8 sm:!text-xs"
                >
                  {isCompleted ? (
                    <motion.div
                      initial={{ scale: 0, rotate: -90 }}
                      animate={{ scale: 1, rotate: 0 }}
                      transition={{ type: "spring", stiffness: 500, damping: 20 }}
                    >
                      <Check style={{ width: "14px", height: "14px" }} />
                    </motion.div>
                  ) : (
                    step.num
                  )}
                </motion.div>
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
                    background: "var(--glass-border)",
                    overflow: "hidden",
                    position: "relative",
                  }}
                  className="sm:!mx-3 sm:!w-12 lg:!w-20"
                >
                  <motion.div
                    initial={false}
                    animate={{
                      width: isCompleted ? "100%" : "0%",
                    }}
                    transition={{ duration: 0.4, ease: "easeInOut" }}
                    style={{
                      height: "100%",
                      background: "var(--accent)",
                      position: "absolute",
                      left: 0,
                      top: 0,
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
