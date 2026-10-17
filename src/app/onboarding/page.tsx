"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";

import { OnboardingLayout } from "@/components/onboarding/OnboardingLayout";
import { ProgressStepper } from "@/components/onboarding/ProgressStepper";
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
  const [direction, setDirection] = useState(1);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [profileId, setProfileId] = useState<string | null>(null);
  const [currency, setCurrency] = useState("");

  useEffect(() => {
    getOnboardingStatus()
      .then((status) => {
        if (status.onboarded) {
          router.replace("/briefing");
          return;
        }
        setStep(status.currentStep ?? 1);
        setProfileId(status.profileId ?? null);
      })
      .catch(() => {
        setLoading(false);
      })
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
    await handleSave(() => saveAboutYou(data), 2);
  };

  const onNextMonthToMonth = async (data: StepMonthToMonthForm) => {
    await handleSave(() => saveMonthToMonth(data, profileId), 3);
  };

  const onNextOwnAndOwe = async (data: StepOwnAndOweForm) => {
    await handleSave(() => saveOwnAndOwe(data, profileId), 4);
  };

  const onNextGoalsAndRisk = async (data: StepGoalsAndRiskForm) => {
    await handleSave(() => saveGoalsAndRisk(data, profileId), LAST_STEP + 1);
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
    enter: (dir: number) => ({
      x: dir > 0 ? 80 : -80,
      opacity: 0,
    }),
    center: {
      x: 0,
      opacity: 1,
    },
    exit: (dir: number) => ({
      x: dir > 0 ? -80 : 80,
      opacity: 0,
    }),
  };

  return (
    <OnboardingLayout>
      <ProgressStepper currentStep={step} />

      {error && (
        <div className="mb-4 overflow-hidden rounded-xl border border-rose-soft bg-rose-soft px-4 py-3 text-sm text-rose">
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
            x: { type: "spring", stiffness: 300, damping: 30 },
            opacity: { duration: 0.2 },
          }}
        >
          {step === 1 && <StepAboutYou key="step1" onNext={onNextAboutYou} />}
          {step === 2 && (
            <StepMonthToMonth
              key="step2"
              currency={currency}
              onNext={onNextMonthToMonth}
              onBack={() => goToStep(1)}
            />
          )}
          {step === 3 && (
            <StepOwnAndOwe
              key="step3"
              currency={currency}
              onNext={onNextOwnAndOwe}
              onBack={() => goToStep(2)}
            />
          )}
          {step === 4 && (
            <StepGoalsAndRisk
              key="step4"
              currency={currency}
              onNext={onNextGoalsAndRisk}
              onBack={() => goToStep(3)}
            />
          )}
        </motion.div>
      </AnimatePresence>
    </OnboardingLayout>
  );
}