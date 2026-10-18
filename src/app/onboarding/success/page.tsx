"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { LogoIcon } from "@/components/brand/LogoIcon";
import { getOnboardingScore } from "../actions";

export default function SuccessPage() {
  const router = useRouter();
  // Long enough to actually read the score and the line explaining it. Three
  // seconds was not enough to glance at anything.
  const [countdown, setCountdown] = useState(10);
  const [score, setScore] = useState<number | null>(null);

  useEffect(() => {
    getOnboardingScore().then((result) => setScore(result.score));
  }, []);

  useEffect(() => {
    if (countdown > 0) {
      const t = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(t);
    }
    router.replace("/briefing");
  }, [countdown, router]);

  const goNow = () => router.replace("/briefing");

  return (
    <main
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "var(--bg)",
        padding: "24px",
      }}
    >
      <div style={{ width: "100%", maxWidth: "400px", textAlign: "center" }}>
        {/* Brand pill */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "8px",
            borderRadius: "var(--radius-full)",
            background: "rgba(105, 90, 255, 0.08)",
            border: "1px solid rgba(105, 90, 255, 0.2)",
            padding: "6px 16px 6px 10px",
            marginBottom: "32px",
          }}
        >
          <LogoIcon size={22} />
          <span
            style={{
              fontFamily: "var(--font-display-family)",
              fontWeight: 700,
              fontSize: "0.875rem",
              color: "var(--accent)",
            }}
          >
            FOS·AI
          </span>
        </motion.div>

        {/* Purple check icon */}
        <motion.div
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 300, damping: 20, delay: 0.15 }}
          style={{
            margin: "0 auto",
            width: "64px",
            height: "64px",
            borderRadius: "var(--radius-sm)",
            background: "linear-gradient(135deg, var(--accent), #4F3DC9)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: "0 4px 20px var(--accent-glow)",
          }}
        >
          <Check size={32} style={{ color: "#fff" }} strokeWidth={3} />
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          style={{
            fontFamily: "var(--font-display-family)",
            fontSize: "1.5rem",
            fontWeight: 700,
            color: "var(--text-1)",
            marginTop: "24px",
          }}
        >
          You&apos;re all set!
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          style={{
            fontSize: "0.875rem",
            color: "var(--text-2)",
            marginTop: "8px",
            lineHeight: 1.6,
          }}
        >
          Your financial profile is complete. We&apos;re building your personalized dashboard now.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          style={{
            marginTop: "28px",
            padding: "20px",
            borderRadius: "var(--radius-sm)",
            background: "var(--glass-bg)",
            border: "1px solid var(--glass-border)",
          }}
        >
          {score !== null ? (
            <>
              <p
                style={{
                  fontFamily: "var(--font-mono-family)",
                  fontSize: "0.625rem",
                  fontWeight: 600,
                  letterSpacing: "0.1em",
                  textTransform: "uppercase",
                  color: "var(--text-3)",
                }}
              >
                Your financial health score
              </p>
              <p
                style={{
                  fontFamily: "var(--font-display-family)",
                  fontSize: "2.5rem",
                  fontWeight: 700,
                  lineHeight: 1.1,
                  marginTop: "4px",
                  color: "var(--text-1)",
                }}
              >
                {score}
                <span
                  style={{
                    fontSize: "1rem",
                    fontWeight: 500,
                    color: "var(--text-3)",
                  }}
                >
                  {" "}
                  / 100
                </span>
              </p>
              <p
                style={{
                  fontSize: "0.8125rem",
                  color: "var(--text-2)",
                  marginTop: "8px",
                  lineHeight: 1.6,
                }}
              >
                This is a starting point, not a verdict. It moves as your money
                does, and your dashboard explains how it is worked out.
              </p>
            </>
          ) : (
            <p
              style={{
                fontSize: "0.8125rem",
                color: "var(--text-2)",
                lineHeight: 1.6,
              }}
            >
              Working out your financial health score…
            </p>
          )}
        </motion.div>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          style={{
            fontFamily: "var(--font-mono-family)",
            fontSize: "0.75rem",
            color: "var(--text-3)",
            marginTop: "32px",
            letterSpacing: "0.02em",
          }}
        >
          Taking you to your dashboard in {countdown} seconds, or go there now
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
        >
          <Button
            size="lg"
            onClick={goNow}
            className="mt-5 h-[52px] w-full rounded-full px-7"
          >
            Go to Dashboard
          </Button>
        </motion.div>
      </div>
    </main>
  );
}
