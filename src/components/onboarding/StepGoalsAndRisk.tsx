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
  DateSelects,
  MoneyField,
  RadioCards,
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
  onNext: (data: StepGoalsAndRiskForm) => void;
  onBack: () => void;
}

export function StepGoalsAndRisk({ currency, onNext, onBack }: Props) {
  const now = new Date();
  const [answers, setAnswers] = useState<RiskAnswers>({});

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
    },
  });

  // The risk options live outside a Controller, so their answers have to be
  // written into the form explicitly. Without this the resolver still sees the
  // empty `riskAnswers` default, fails the length check, and handleSubmit never
  // reaches the submit callback at all.
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

  const submit = handleSubmit((data) => onNext(data));

  return (
    <StepShell
      title="Your goal and your risk style"
      description="One thing you are working towards, then a few short scenarios. There are no wrong answers."
      onSubmit={submit}
      submitLabel="Finish"
      submitting={isSubmitting}
      onBack={onBack}
    >
      <Controller
        control={control}
        name="goalTitle"
        render={({ field }) => (
          <TextField
            id="goalTitle"
            label="What is your main financial goal?"
            value={field.value}
            onChange={field.onChange}
            onBlur={field.onBlur}
            placeholder="e.g. Build an emergency fund"
            error={errors.goalTitle?.message}
          />
        )}
      />

      <Controller
        control={control}
        name="goalAmount"
        render={({ field }) => (
          <MoneyField
            id="goalAmount"
            label="How much would you need to reach it?"
            value={field.value}
            onChange={field.onChange}
            currency={currency}
            helper="A rounded figure is fine."
            whyWeAsk="Your goal becomes the first thing we put on your dashboard, with a progress bar you can watch move."
            error={errors.goalAmount?.message}
          />
        )}
      />

      <Controller
        control={control}
        name="goalTargetDate"
        render={({ field }) => (
          <DateSelects
            idPrefix="goalTargetDate"
            label="When would you like to reach it?"
            value={field.value}
            onChange={field.onChange}
            minYear={now.getFullYear()}
            maxYear={now.getFullYear() + 50}
            whyWeAsk="How long your money needs to stay invested is one of the things that shapes the advice we give you later, so we work it out from this date."
            error={errors.goalTargetDate?.message}
          />
        )}
      />

      <div className="mt-2 flex flex-col gap-5">
        <h3 className="font-display text-base font-semibold text-text-primary">
          How do you handle risk?
        </h3>

        {RISK_QUESTIONS.map((q) => (
          <RadioCards
            key={q.key}
            name={q.key}
            question={q.question}
            options={[...q.options]}
            value={answers[q.key]?.answer ?? ""}
            onChange={(label, score) => {
              commitAnswers({ ...answers, [q.key]: { answer: label, score } });
            }}
          />
        ))}

        {errors.riskAnswers?.message && (
          <p className="text-xs text-rose">{errors.riskAnswers.message}</p>
        )}
      </div>

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
            optional
            helper="This only changes how much we explain things to you."
            error={errors.investmentExperience?.message}
            options={INVESTMENT_EXPERIENCE_OPTIONS.map((label) => ({
              value: label,
              label,
            }))}
          />
        )}
      />
    </StepShell>
  );
}