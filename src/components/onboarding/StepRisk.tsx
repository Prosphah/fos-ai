"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

const QUESTIONS = [
  {
    key: "drop_25",
    question: "Your portfolio drops 25% in one month. What do you do?",
    options: [
      { label: "Sell everything to prevent further losses", score: 1 },
      { label: "Sell some to reduce risk", score: 1 },
      { label: "Hold — markets go up and down", score: 2 },
      { label: "Buy more — great opportunities in downturns", score: 3 },
    ],
  },
  {
    key: "hot_tip",
    question: "A friend recommends a stock that could double — but could also lose half its value.",
    options: [
      { label: "Skip it — too risky", score: 1 },
      { label: "Invest a small amount I can afford to lose", score: 2 },
      { label: "Go big — high risk, high reward", score: 3 },
    ],
  },
  {
    key: "three_years",
    question: "You need access to your money in 3 years. Which approach feels right?",
    options: [
      { label: "Keep it in cash or a savings account", score: 1 },
      { label: "Mostly bonds with some cash", score: 1 },
      { label: "A balanced mix of stocks and bonds", score: 2 },
      { label: "Mostly stocks for growth", score: 3 },
    ],
  },
  {
    key: "market_down",
    question: "Markets have been down 20% over the last 6 months. What do you do?",
    options: [
      { label: "Move everything to cash", score: 1 },
      { label: "Wait and see before making changes", score: 1 },
      { label: "Stay the course — stick to my plan", score: 2 },
      { label: "Increase my investments while prices are low", score: 3 },
    ],
  },
];

interface Props {
  defaultValues?: { answers: { questionKey: string; answer: string; score: number }[] };
  onNext: (data: { answers: { questionKey: string; answer: string; score: number }[] }) => void;
  onBack: () => void;
}

export function StepRisk({ defaultValues, onNext, onBack }: Props) {
  const [answers, setAnswers] = useState<Record<string, { answer: string; score: number }>>(
    () => {
      const saved: Record<string, { answer: string; score: number }> = {};
      if (defaultValues?.answers) {
        for (const a of defaultValues.answers) {
          saved[a.questionKey] = { answer: a.answer, score: a.score };
        }
      }
      return saved;
    }
  );
  const [submitting, setSubmitting] = useState(false);

  const allAnswered = QUESTIONS.every((q) => answers[q.key]);

  const handleSelect = (questionKey: string, label: string, score: number) => {
    setAnswers((prev) => ({ ...prev, [questionKey]: { answer: label, score } }));
  };

  const handleSubmit = () => {
    if (!allAnswered) return;
    setSubmitting(true);
    const formatted = QUESTIONS.map((q) => ({
      questionKey: q.key,
      answer: answers[q.key].answer,
      score: answers[q.key].score,
    }));
    onNext({ answers: formatted });
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
      <div>
        <h2 style={{ fontFamily: "var(--font-display-family)", fontSize: "1.25rem", fontWeight: 700, color: "var(--text-1)" }}>
          Your risk style
        </h2>
        <p className="mt-1" style={{ fontSize: "0.875rem", color: "var(--text-2)" }}>
          A few short scenarios to understand your comfort with financial risk. There are no wrong answers.
        </p>
      </div>

      {QUESTIONS.map((q) => (
        <div
          key={q.key}
          style={{
            borderRadius: "var(--radius-sm)",
            border: "1px solid var(--glass-border)",
            background: "var(--glass-bg)",
            padding: "16px",
          }}
        >
          <p style={{ marginBottom: "12px", fontSize: "0.875rem", fontWeight: 500, color: "var(--text-1)" }}>
            {q.question}
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            {q.options.map((opt) => {
              const isSelected = answers[q.key]?.answer === opt.label;
              return (
                <button
                  type="button"
                  key={opt.label}
                  onClick={() => handleSelect(q.key, opt.label, opt.score)}
                  style={{
                    width: "100%",
                    borderRadius: "var(--radius-xs)",
                    padding: "12px 16px",
                    textAlign: "left",
                    fontSize: "0.875rem",
                    fontWeight: 500,
                    minHeight: "44px",
                    border: `1px solid ${isSelected ? "var(--accent)" : "var(--glass-border)"}`,
                    background: isSelected ? "var(--accent-soft)" : "var(--glass-bg)",
                    color: isSelected ? "var(--accent)" : "var(--text-2)",
                    boxShadow: isSelected ? "0 2px 8px rgba(139, 92, 246, 0.12)" : "none",
                    transition: "all 0.2s var(--ease)",
                  }}
                >
                  {opt.label}
                </button>
              );
            })}
          </div>
        </div>
      ))}

      <div className="flex items-center justify-between" style={{ gap: "12px", paddingTop: "8px" }}>
        <Button type="button" variant="outline" size="lg" onClick={onBack} style={{ minHeight: "44px" }}>
          Back
        </Button>
        <Button
          type="button"
          onClick={handleSubmit}
          disabled={!allAnswered || submitting}
          size="lg"
          style={{ minHeight: "44px" }}
        >
          {submitting ? "Saving\u2026" : "Finish"}
        </Button>
      </div>
    </div>
  );
}
