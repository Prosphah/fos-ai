"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";

import { OnboardingBrand, OnboardingLayout } from "@/components/onboarding/OnboardingLayout";
import { OnboardingProgress } from "@/components/onboarding/OnboardingProgress";
import { StepAboutYou } from "@/components/onboarding/StepAboutYou";
import { StepMonthToMonth } from "@/components/onboarding/StepMonthToMonth";
import { StepOwnAndOwe } from "@/components/onboarding/StepOwnAndOwe";
import { StepGoalsAndRisk } from "@/components/onboarding/StepGoalsAndRisk";
import {
  saveAboutYou,
  saveMonthToMonth,
  saveOwnAndOwe,
  saveGoalsAndRisk,
  finishOnboarding,
  getOnboardingStatus,
} from "./actions";
import type {
  StepAboutYouForm,
  StepMonthToMonthForm,
  StepOwnAndOweForm,
  StepGoalsAndRiskForm,
} from "@/lib/validation/onboarding";

const LAST_STEP = 4;

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [reachedStep, setReachedStep] = useState(1);
  const [direction, setDirection] = useState(1);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [profileId, setProfileId] = useState<string | null>(null);
  const [currency, setCurrency] = useState("");
  const [income, setIncome] = useState(0);

  /**
   * Last successfully submitted answers per step. Each step is unmounted when
   * you navigate away, so without this every step rebuilds itself from its
   * hard-coded zero defaults and a revisit silently shows an empty form.
   */
  const [drafts, setDrafts] = useState<{
    about: StepAboutYouForm | null;
    month: StepMonthToMonthForm | null;
    own: StepOwnAndOweForm | null;
    goals: StepGoalsAndRiskForm | null;
  }>({ about: null, month: null, own: null, goals: null });

  useEffect(() => {
    getOnboardingStatus()
      .then((status) => {
        if (status.onboarded) {
          router.replace("/briefing");
          return;
        }
        const resumeAt = status.currentStep ?? 1;
        setStep(resumeAt);
        setReachedStep(resumeAt);
        setProfileId(status.profileId ?? null);

        // Restore what a previous session already answered, so resuming shows
        // the real answers instead of an empty form.
        if (status.saved) {
          setDrafts(status.saved);
          setCurrency(status.saved.about.currency);
          setIncome(status.saved.about.monthlyIncome);
        }
      })
      .catch(() => setLoading(false))
      .finally(() => setLoading(false));
  }, [router]);

  const goToStep = useCallback(
    (nextStep: number) => {
      setDirection(nextStep >= step ? 1 : -1);
      setStep(nextStep);
      window.scrollTo({ top: 0, behavior: "smooth" });
    },
    [step]
  );

  const handleSave = useCallback(
    async (
      saveFn: () => Promise<{ error?: unknown; profileId?: string | null }>,
      nextStep: number
    ) => {
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
        if (nextStep > LAST_STEP) {
          const done = await finishOnboarding(profileId);
          if (done.success) {
            router.push("/onboarding/success");
          } else {
            setError(done.error ?? "Failed to complete onboarding");
          }
        } else {
          setReachedStep((prev) => Math.max(prev, nextStep));
          goToStep(nextStep);
        }
      } catch {
        setError("Something went wrong. Please try again.");
      }
      setSaving(false);
    },
    [goToStep, router, profileId]
  );

  const onNextAboutYou = async (data: StepAboutYouForm) => {
    setCurrency(data.currency);
    setIncome(data.monthlyIncome);
    setDrafts((prev) => ({ ...prev, about: data }));
    await handleSave(() => saveAboutYou(data), 2);
  };

  const onNextMonthToMonth = async (data: StepMonthToMonthForm) => {
    setDrafts((prev) => ({ ...prev, month: data }));
    await handleSave(() => saveMonthToMonth(data, profileId), 3);
  };

  const onNextOwnAndOwe = async (data: StepOwnAndOweForm) => {
    setDrafts((prev) => ({ ...prev, own: data }));
    await handleSave(() => saveOwnAndOwe(data, profileId), 4);
  };

  const onNextGoalsAndRisk = async (data: StepGoalsAndRiskForm) => {
    setDrafts((prev) => ({ ...prev, goals: data }));
    await handleSave(() => saveGoalsAndRisk(data, profileId), LAST_STEP + 1);
  };

  // Falls back to the retained step 1 answers, so a person who tabs forward and
  // back without pressing Next on step 1 still gets a currency on every money
  // field rather than a bare number.
  const activeCurrency = currency || drafts.about?.currency || "";
  const activeIncome = income || drafts.about?.monthlyIncome || 0;

  if (loading) {
    return (
      <OnboardingLayout>
        <div className="flex items-center justify-center py-24">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-accent/25 border-t-accent" />
        </div>
      </OnboardingLayout>
    );
  }

  const slideVariants = {
    enter: (dir: number) => ({ x: dir > 0 ? 40 : -40, opacity: 0 }),
    center: { x: 0, opacity: 1 },
    exit: (dir: number) => ({ x: dir > 0 ? -40 : 40, opacity: 0 }),
  };

  return (
    <OnboardingLayout>
      <OnboardingBrand />

      <OnboardingProgress
        currentStep={step}
        reachedStep={reachedStep}
        onJump={goToStep}
      />

      {error && (
        <div className="mb-4 overflow-hidden rounded-[14px] border border-destructive/25 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      )}

      {saving && (
        <div className="mb-4 flex items-center gap-2 text-sm text-text-secondary">
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-accent/25 border-t-accent" />
          Saving your progress...
        </div>
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
            x: { type: "spring", stiffness: 320, damping: 32 },
            opacity: { duration: 0.18 },
          }}
        >
          {step === 1 && (
            <StepAboutYou defaultValues={drafts.about ?? undefined} onNext={onNextAboutYou} />
          )}
          {step === 2 && (
            <StepMonthToMonth
              currency={activeCurrency}
              income={activeIncome}
              defaultValues={drafts.month ?? undefined}
              onNext={onNextMonthToMonth}
              onBack={() => goToStep(1)}
            />
          )}
          {step === 3 && (
            <StepOwnAndOwe
              currency={activeCurrency}
              defaultValues={drafts.own ?? undefined}
              onNext={onNextOwnAndOwe}
              onBack={() => goToStep(2)}
            />
          )}
          {step === 4 && (
            <StepGoalsAndRisk
              currency={activeCurrency}
              defaultValues={drafts.goals ?? undefined}
              onNext={onNextGoalsAndRisk}
              onBack={() => goToStep(3)}
            />
          )}
        </motion.div>
      </AnimatePresence>
    </OnboardingLayout>
  );
}