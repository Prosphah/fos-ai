"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { OnboardingLayout } from "@/components/onboarding/OnboardingLayout";
import { ProgressStepper } from "@/components/onboarding/ProgressStepper";
import { StepPersonal } from "@/components/onboarding/StepPersonal";
import { StepCashflow } from "@/components/onboarding/StepCashflow";
import { StepAssets } from "@/components/onboarding/StepAssets";
import { StepGoals } from "@/components/onboarding/StepGoals";
import { StepRisk } from "@/components/onboarding/StepRisk";
import {
  savePersonal,
  saveCashflow,
  saveAssets,
  saveGoals,
  saveRisk,
  finishOnboarding,
  getOnboardingStatus,
} from "./actions";
import type {
  StepPersonalForm,
  StepCashflowForm,
  StepAssetsForm,
  StepGoalsForm,
  StepRiskForm,
} from "@/lib/validation/onboarding";

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [direction, setDirection] = useState(1);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [profileId, setProfileId] = useState<string | null>(null);

  const [savedPersonal, setSavedPersonal] = useState<StepPersonalForm | undefined>();
  const [savedCashflow, setSavedCashflow] = useState<StepCashflowForm | undefined>();
  const [savedAssets, setSavedAssets] = useState<StepAssetsForm | undefined>();
  const [savedGoals, setSavedGoals] = useState<StepGoalsForm | undefined>();
  const [savedRisk, setSavedRisk] = useState<StepRiskForm | undefined>();

  useEffect(() => {
    getOnboardingStatus().then((status) => {
      if (status.onboarded) {
        router.replace("/briefing");
        return;
      }
      setStep(status.currentStep ?? 1);
      if (status.profileId) {
        setProfileId(status.profileId);
      }
      const sd = status.savedData as Record<string, unknown> | null;
      if (sd) {
        if (sd.age) {
          setSavedPersonal({
            firstName: (sd.first_name as string) ?? "",
            lastName: (sd.last_name as string) ?? "",
            age: sd.age as number,
            country: sd.country as string,
            currency: sd.currency as string,
            employmentStatus: sd.employment_status as string,
            monthlyIncome: sd.monthly_income as number,
            incomeFrequency: sd.income_frequency as string,
          });
        }
        if (sd.monthly_living_expenses != null) {
          setSavedCashflow({
            monthlyLivingExpenses: (sd.monthly_living_expenses ?? 0) as number,
            debtRepaymentsMonthly: (sd.debt_repayments_monthly ?? 0) as number,
            monthlySavings: (sd.monthly_savings ?? 0) as number,
            otherIncome: (sd.other_income ?? 0) as number,
            expectedMajorExpenses: (sd.expected_major_expenses ?? []) as string[],
          });
        }
        if (sd.total_cash != null) {
          setSavedAssets({
            totalCash: (sd.total_cash ?? 0) as number,
            totalInvestments: (sd.total_investments ?? 0) as number,
            totalRetirementAccounts: (sd.total_retirement_accounts ?? 0) as number,
            totalPropertyValue: (sd.total_property_value ?? 0) as number,
            totalBusinessOwnership: (sd.total_business_ownership ?? 0) as number,
            totalOtherAssets: (sd.total_other_assets ?? 0) as number,
            creditCardDebt: (sd.credit_card_debt ?? 0) as number,
            personalLoanDebt: (sd.personal_loan_debt ?? 0) as number,
            studentLoanDebt: (sd.student_loan_debt ?? 0) as number,
            mortgageDebt: (sd.mortgage_debt ?? 0) as number,
            carLoanDebt: (sd.car_loan_debt ?? 0) as number,
            otherDebts: (sd.other_debts ?? 0) as number,
          });
        }
        if (sd.retirement_age_target != null) {
          setSavedGoals({
            goals: [], // goals are in financial_goals table, not profile
            retirementAgeTarget: sd.retirement_age_target as number,
            emergencyFundTargetMonths: (sd.emergency_fund_target_months ?? 0) as number,
            investmentHorizonYears: (sd.investment_horizon_years ?? 0) as number,
            majorPurchasesPlanned: (sd.major_purchases_planned ?? []) as string[],
          });
        }
        if (sd.risk_answers) {
          const answers = (sd.risk_answers as Array<{ questionKey: string; answer: string; score: number }>)
            .map((a) => ({ questionKey: a.questionKey, answer: a.answer, score: a.score }));
          setSavedRisk({ answers });
        }
      }
      setLoading(false);
    }).catch(() => {
      setLoading(false);
    });
  }, [router]);

  const goToStep = useCallback((nextStep: number) => {
    setDirection(nextStep >= step ? 1 : -1);
    setStep(nextStep);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [step]);

  const handleSave = useCallback(async (saveFn: () => Promise<{ error?: unknown; profileId?: string }>, nextStep: number) => {
    setSaving(true);
    setError(null);
    try {
      const result = await saveFn();
      if (result.error) {
        setError("Something went wrong saving your data. Please try again.");
        setSaving(false);
        return;
      }
      if (result.profileId) {
        setProfileId(result.profileId);
      }
      if (nextStep > 5) {
        const done = await finishOnboarding(profileId);
        if (done.success) {
          router.push("/onboarding/success");
        } else {
          setError(done.error ?? "Failed to complete onboarding");
        }
      } else {
        goToStep(nextStep);
      }
    } catch {
      setError("Something went wrong. Please try again.");
    }
    setSaving(false);
  }, [goToStep, router, profileId]);

  const onNextPersonal = async (data: StepPersonalForm) => {
    setSavedPersonal(data);
    await handleSave(() => savePersonal(data), 2);
  };

  const onNextCashflow = async (data: StepCashflowForm) => {
    setSavedCashflow(data);
    await handleSave(() => saveCashflow(data, profileId), 3);
  };

  const onNextAssets = async (data: StepAssetsForm) => {
    setSavedAssets(data);
    await handleSave(() => saveAssets(data, profileId), 4);
  };

  const onNextGoals = async (data: StepGoalsForm) => {
    setSavedGoals(data);
    await handleSave(() => saveGoals(data, profileId), 5);
  };

  const onNextRisk = async (data: StepRiskForm) => {
    setSavedRisk(data);
    await handleSave(() => saveRisk(data, profileId), 6);
  };

  if (loading) {
    return (
      <OnboardingLayout>
        <div className="flex items-center justify-center py-20">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-accent/25 border-t-accent" />
        </div>
      </OnboardingLayout>
    );
  }

  const slideVariants = {
    enter: (direction: number) => ({
      x: direction > 0 ? 80 : -80,
      opacity: 0,
    }),
    center: {
      x: 0,
      opacity: 1,
    },
    exit: (direction: number) => ({
      x: direction > 0 ? -80 : 80,
      opacity: 0,
    }),
  };

  return (
    <OnboardingLayout>
      <ProgressStepper currentStep={step} />

      <AnimatePresence mode="wait" custom={direction}>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -8, height: 0 }}
            animate={{ opacity: 1, y: 0, height: "auto" }}
            exit={{ opacity: 0, y: -8, height: 0 }}
            className="mb-4 overflow-hidden rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
          >
            {error}
          </motion.div>
        )}
      </AnimatePresence>

      {saving && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="mb-4 flex items-center gap-2 text-sm text-gray-500"
        >
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-accent/25 border-t-accent" />
          Saving your progress...
        </motion.div>
      )}

      <AnimatePresence mode="wait" custom={direction}>
        <motion.div
          key={step}
          custom={direction}
          variants={slideVariants}
          initial="enter"
          animate="center"
          exit="exit"
          transition={{
            x: { type: "spring", stiffness: 300, damping: 30 },
            opacity: { duration: 0.2 },
          }}
        >
          {step === 1 && (
            <StepPersonal
              key="step1"
              defaultValues={savedPersonal}
              onNext={onNextPersonal}
            />
          )}
          {step === 2 && (
            <StepCashflow
              key="step2"
              defaultValues={savedCashflow}
              onNext={onNextCashflow}
              onBack={() => goToStep(1)}
            />
          )}
          {step === 3 && (
            <StepAssets
              key="step3"
              defaultValues={savedAssets}
              onNext={onNextAssets}
              onBack={() => goToStep(2)}
            />
          )}
          {step === 4 && (
            <StepGoals
              key="step4"
              defaultValues={savedGoals}
              onNext={onNextGoals}
              onBack={() => goToStep(3)}
            />
          )}
          {step === 5 && (
            <StepRisk
              key="step5"
              defaultValues={savedRisk}
              onNext={onNextRisk}
              onBack={() => goToStep(4)}
            />
          )}
        </motion.div>
      </AnimatePresence>
    </OnboardingLayout>
  );
}
