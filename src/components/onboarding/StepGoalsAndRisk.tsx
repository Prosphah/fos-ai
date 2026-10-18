"use client";

import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { Resolver } from "react-hook-form";

import {
  INVESTMENT_EXPERIENCE_OPTIONS,
  stepGoalsAndRiskSchema,
  type StepGoalsAndRiskForm,
} from "@/lib/validation/onboarding";
import {
  FieldRow,
  GoalDateField,
  MoneyField,
  RadioCards,
  Section,
  SelectField,
  StepShell,
  TextField,
} from "./fields";

const RISK_QUESTIONS = [
  {
    key: "drop_25",
    question: "Your portfolio drops 25% in one month. What do you do?",
    options: [
      { label: "Sell everything to prevent further losses", score: 1 },
      { label: "Sell some to reduce risk", score: 1 },
      { label: "Hold, markets go up and down", score: 2 },
      { label: "Buy more, great opportunities in downturns", score: 3 },
    ],
  },
  {
    key: "hot_tip",
    question:
      "A friend recommends a stock that could double, but could also lose half its value.",
    options: [
      { label: "Skip it, too risky", score: 1 },
      { label: "Invest a small amount I can afford to lose", score: 2 },
      { label: "Go big, high risk high reward", score: 3 },
    ],
  },
  {
    key: "three_years",
    question:
      "You need access to your money in 3 years. Which approach feels right?",
    options: [
      { label: "Keep it in cash or a savings account", score: 1 },
      { label: "Mostly bonds with some cash", score: 1 },
      { label: "A balanced mix of stocks and bonds", score: 2 },
      { label: "Mostly stocks for growth", score: 3 },
    ],
  },
  {
    key: "market_down",
    question:
      "Markets have been down 20% over the last 6 months. What do you do?",
    options: [
      { label: "Move everything to cash", score: 1 },
      { label: "Wait and see before making changes", score: 1 },
      { label: "Stay the course, stick to my plan", score: 2 },
      { label: "Increase my investments while prices are low", score: 3 },
    ],
  },
] as const;

type RiskAnswers = Record<string, { answer: string; score: number }>;

interface Props {
  currency: string;
  /** Last saved answers, so stepping back does not wipe the form. */
  defaultValues?: Partial<StepGoalsAndRiskForm>;
  onNext: (data: StepGoalsAndRiskForm) => void;
  onBack: () => void;
}

export function StepGoalsAndRisk({
  currency,
  defaultValues,
  onNext,
  onBack,
}: Props) {
  // Seeded from the saved answers, otherwise every risk question snaps back to
  // unselected the moment this step is revisited.
  const [answers, setAnswers] = useState<RiskAnswers>(() => {
    const seed: RiskAnswers = {};
    for (const saved of defaultValues?.riskAnswers ?? []) {
      seed[saved.questionKey] = { answer: saved.answer, score: saved.score };
    }
    return seed;
  });

  const {
    control,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<StepGoalsAndRiskForm>({
    resolver: zodResolver(stepGoalsAndRiskSchema) as Resolver<StepGoalsAndRiskForm>,
    mode: "onTouched",
    defaultValues: {
      goalTitle: "",
      goalAmount: 0,
      goalTargetDate: "",
      riskAnswers: [],
      investmentExperience: "",
      ...defaultValues,
    },
  });

  // The risk options live outside a Controller, so their answers must be written
  // into the form explicitly. Without this the resolver keeps seeing the empty
  // riskAnswers default, fails the length check, and handleSubmit never reaches
  // its submit callback at all.
  const commitAnswers = (next: RiskAnswers) => {
    setAnswers(next);
    setValue(
      "riskAnswers",
      RISK_QUESTIONS.filter((q) => next[q.key]).map((q) => ({
        questionKey: q.key,
        answer: next[q.key].answer,
        score: next[q.key].score,
      })),
      { shouldValidate: true }
    );
  };

  return (
    <StepShell
      eyebrow="Almost there"
      title="One goal, and how you handle risk"
      description="Your goal becomes the first thing on your dashboard. The four scenarios just tell us how to pitch advice at you."
      onSubmit={handleSubmit((data) => onNext(data))}
      submitLabel="Finish"
      submitting={isSubmitting}
      onBack={onBack}
    >
      <Section label="Your main goal">
        <Controller
          control={control}
          name="goalTitle"
          render={({ field }) => (
            <TextField
              id="goalTitle"
              label="What are you working towards?"
              value={field.value}
              onChange={field.onChange}
              onBlur={field.onBlur}
              placeholder="e.g. Build an emergency fund"
              error={errors.goalTitle?.message}
            />
          )}
        />

        <FieldRow>
          <Controller
            control={control}
            name="goalAmount"
            render={({ field }) => (
              <MoneyField
                id="goalAmount"
                label="Target amount"
                value={field.value}
                onChange={field.onChange}
                currency={currency}
                helper="Roughly how much you would need."
                error={errors.goalAmount?.message}
                inRow
              />
            )}
          />
          <Controller
            control={control}
            name="goalTargetDate"
            render={({ field }) => (
              <GoalDateField
                id="goalTargetDate"
                label="Target date"
                value={field.value}
                onChange={field.onChange}
                helper="When you would like to reach it."
                error={errors.goalTargetDate?.message}
                inRow
              />
            )}
          />
        </FieldRow>
      </Section>

      <Section label="Your risk style">
        {RISK_QUESTIONS.map((q) => (
          <RadioCards
            key={q.key}
            name={q.key}
            question={q.question}
            options={[...q.options]}
            value={answers[q.key]?.answer ?? ""}
            onChange={(label, score) =>
              commitAnswers({ ...answers, [q.key]: { answer: label, score } })
            }
          />
        ))}

        {errors.riskAnswers?.message && (
          <p className="text-[13px] text-rose">{errors.riskAnswers.message}</p>
        )}

        <Controller
          control={control}
          name="investmentExperience"
          render={({ field }) => (
            <SelectField
              id="investmentExperience"
              label="How much investing have you done before?"
              value={field.value ?? ""}
              onChange={field.onChange}
              placeholder="Select one"
              options={INVESTMENT_EXPERIENCE_OPTIONS.map((label) => ({
                value: label,
                label,
              }))}
              optional
              helper="This only changes how much we explain things to you."
              error={errors.investmentExperience?.message}
            />
          )}
        />
      </Section>
    </StepShell>
  );
}