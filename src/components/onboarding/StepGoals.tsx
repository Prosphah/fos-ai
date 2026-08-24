"use client";

import { useState, useCallback } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { stepGoalsSchema, type StepGoalsForm } from "@/lib/validation/onboarding";
import { Button } from "@/components/ui/button";
import { CurrencyInput } from "@/components/ui/currency-input";
import { handleEnterToNext } from "@/lib/enter-to-next";
import { Wallet, X, Plus } from "lucide-react";
import type { Resolver } from "react-hook-form";

const clientGoalsSchema = stepGoalsSchema.omit({ goals: true });

interface GoalEntry {
  title: string;
  targetAmount: number;
}

interface Props {
  defaultValues?: Partial<StepGoalsForm>;
  onNext: (data: StepGoalsForm) => void;
  onBack: () => void;
}

const labelStyle = {
  fontSize: "0.875rem",
  fontWeight: 500 as const,
  color: "var(--text-1)" as const,
};

const inputStyle = {
  display: "block" as const,
  width: "100%",
  padding: "12px 14px",
  borderRadius: "var(--radius-sm)",
  border: "1px solid var(--glass-border)",
  background: "var(--glass-bg)",
  fontSize: "0.875rem",
  color: "var(--text-1)",
  outline: "none" as const,
  minHeight: "44px",
  transition: "border-color 0.2s var(--ease), box-shadow 0.2s var(--ease)",
};

export function StepGoals({ defaultValues, onNext, onBack }: Props) {
  const [goals, setGoals] = useState<GoalEntry[]>(
    defaultValues?.goals?.length ? defaultValues.goals : [{ title: "", targetAmount: 0 }]
  );
  const [purchaseTags, setPurchaseTags] = useState<string[]>(
    defaultValues?.majorPurchasesPlanned ?? []
  );
  const [tagInput, setTagInput] = useState("");
  const [goalsError, setGoalsError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting },
  } = useForm<StepGoalsForm>({
    resolver: zodResolver(clientGoalsSchema) as unknown as Resolver<StepGoalsForm>,
    defaultValues: {
      goals: defaultValues?.goals?.length ? defaultValues.goals : [{ title: "", targetAmount: 0 }],
      retirementAgeTarget: defaultValues?.retirementAgeTarget ?? null,
      emergencyFundTargetMonths: defaultValues?.emergencyFundTargetMonths ?? undefined,
      investmentHorizonYears: defaultValues?.investmentHorizonYears ?? undefined,
      majorPurchasesPlanned: defaultValues?.majorPurchasesPlanned ?? [],
    },
  });

  const updateGoal = (i: number, field: keyof GoalEntry, value: string | number) => {
    const updated = [...goals];
    updated[i] = { ...updated[i], [field]: value };
    setGoals(updated);
  };

  const addGoal = () => {
    if (goals.length < 3) setGoals([...goals, { title: "", targetAmount: 0 }]);
  };

  const removeGoal = (i: number) => {
    setGoals(goals.filter((_, idx) => idx !== i));
  };

  const addTag = () => {
    const val = tagInput.trim();
    if (val && !purchaseTags.includes(val)) {
      setPurchaseTags([...purchaseTags, val]);
    }
    setTagInput("");
  };

  const removeTag = (tag: string) => {
    setPurchaseTags(purchaseTags.filter((t) => t !== tag));
  };

  return (
    <form onSubmit={handleSubmit((data) => {
      const validGoals = goals.filter((g) => g.title.trim().length > 0);
      if (validGoals.length === 0) {
        setGoalsError("Please add at least one goal with a name");
        return;
      }
      setGoalsError(null);
      onNext({
        goals: validGoals.map((g) => ({
          title: g.title,
          targetAmount: Number(g.targetAmount) || 0,
        })),
        retirementAgeTarget: data.retirementAgeTarget,
        emergencyFundTargetMonths: data.emergencyFundTargetMonths,
        investmentHorizonYears: data.investmentHorizonYears,
        majorPurchasesPlanned: purchaseTags,
      });
    })} onKeyDown={handleEnterToNext} style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
      <div>
        <h2 style={{ fontFamily: "var(--font-display-family)", fontSize: "1.25rem", fontWeight: 700, color: "var(--text-1)" }}>
          Your financial goals
        </h2>
        <p className="mt-1" style={{ fontSize: "0.875rem", color: "var(--text-2)" }}>
          What are you working toward? Tell us about your top priorities.
        </p>
      </div>

      <div>
        <label style={labelStyle}>What are your top financial goals?</label>
        <p className="mb-2" style={{ fontSize: "0.75rem", color: "var(--text-3)" }}>Add up to 3 goals</p>

        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          {goals.map((goal, i) => (
            <div
              key={i}
              className="flex items-start"
              style={{
                gap: "8px",
                borderRadius: "var(--radius-sm)",
                border: "1px solid var(--glass-border)",
                background: "var(--glass-bg)",
                padding: "12px",
              }}
            >
              <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "8px" }}>
                <input
                  type="text"
                  value={goal.title}
                  onChange={(e) => updateGoal(i, "title", e.target.value)}
                  placeholder="e.g., Buy a house, Build emergency fund"
                  style={{ ...inputStyle, marginTop: 0 }}
                />
                <div className="relative">
                  <span style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "var(--text-3)" }}>
                    <Wallet style={{ width: "16px", height: "16px" }} />
                  </span>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={goal.targetAmount ? Number(goal.targetAmount).toLocaleString() : ""}
                    onChange={(e) => {
                      const raw = e.target.value.replace(/,/g, "").replace(/[^0-9]/g, "");
                      updateGoal(i, "targetAmount", raw ? Number(raw) : 0);
                    }}
                    onFocus={(e) => e.target.select()}
                    placeholder="Target amount"
                    style={{ ...inputStyle, marginTop: 0, paddingLeft: "40px" }}
                  />
                </div>
              </div>
              {goals.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeGoal(i)}
                  style={{
                    marginTop: "4px",
                    width: "28px",
                    height: "28px",
                    borderRadius: "var(--radius-xs)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "var(--text-3)",
                    flexShrink: 0,
                  }}
                >
                  <X style={{ width: "16px", height: "16px" }} />
                </button>
              )}
            </div>
          ))}
        </div>

        {goals.length < 3 && (
          <button
            type="button"
            onClick={addGoal}
            className="mt-2 flex items-center"
            style={{ gap: "4px", fontSize: "0.875rem", fontWeight: 500, color: "var(--accent)" }}
          >
            <Plus style={{ width: "16px", height: "16px" }} /> Add another goal
          </button>
        )}
      </div>

      {goalsError && (
        <div
          style={{
            borderRadius: "var(--radius-sm)",
            border: "1px solid var(--rose-soft)",
            background: "var(--rose-soft)",
            padding: "12px 16px",
            fontSize: "0.875rem",
            color: "var(--rose)",
          }}
        >
          {goalsError}
        </div>
      )}

      <div>
        <label style={labelStyle}>At what age do you plan to retire?</label>
        <input
          type="number"
          {...register("retirementAgeTarget")}
          onWheel={(e) => (e.target as HTMLInputElement).blur()}
          style={{ ...inputStyle, marginTop: "4px" }}
        />
      </div>

      <div>
        <label style={labelStyle}>
          If you stopped earning today, how many months could you comfortably cover your bills?
        </label>
        <input
          type="number"
          {...register("emergencyFundTargetMonths")}
          onWheel={(e) => (e.target as HTMLInputElement).blur()}
          style={{ ...inputStyle, marginTop: "4px" }}
        />
      </div>

      <div>
        <label style={labelStyle}>
          What&apos;s your investment horizon? (How many years until you need this money?)
        </label>
        <select {...register("investmentHorizonYears")} style={{ ...inputStyle, marginTop: "4px", appearance: "none" }}>
          <option value="">Select horizon</option>
          <option value="1">Less than 3 years (Short-term)</option>
          <option value="5">3-10 years (Medium-term)</option>
          <option value="15">10+ years (Long-term)</option>
        </select>
      </div>

      <div>
        <label style={labelStyle}>
          What major purchases are you planning? (home, car, education, etc.)
        </label>
        <div className="mt-2 flex flex-wrap" style={{ gap: "8px" }}>
          {purchaseTags.map((tag) => (
            <span
              key={tag}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "4px",
                borderRadius: "var(--radius-xs)",
                background: "var(--accent-soft)",
                padding: "6px 12px",
                fontSize: "0.75rem",
                fontWeight: 500,
                color: "var(--accent)",
              }}
            >
              {tag}
              <button type="button" onClick={() => removeTag(tag)} style={{ color: "var(--accent)", opacity: 0.5 }}>
                <X style={{ width: "12px", height: "12px" }} />
              </button>
            </span>
          ))}
        </div>
        <div className="mt-2 flex" style={{ gap: "8px" }}>
          <input
            type="text"
            value={tagInput}
            onChange={(e) => setTagInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addTag(); } }}
            placeholder="Type a purchase and press Enter"
            style={{ ...inputStyle, flex: 1, minWidth: 0, marginTop: 0 }}
          />
          <Button type="button" variant="outline" size="sm" className="shrink-0" style={{ minHeight: "44px" }} onClick={addTag}>
            Add
          </Button>
        </div>
      </div>

      <div className="flex items-center justify-between" style={{ gap: "12px", paddingTop: "8px" }}>
        <Button type="button" variant="outline" size="lg" onClick={onBack} style={{ minHeight: "44px" }}>
          Back
        </Button>
        <Button type="submit" disabled={isSubmitting} size="lg" style={{ minHeight: "44px" }}>
          {isSubmitting ? "Saving\u2026" : "Next step"}
        </Button>
      </div>
    </form>
  );
}
