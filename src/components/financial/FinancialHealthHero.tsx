"use client";

import { useEffect, useRef, useState } from "react";

interface Props {
  score?: number;
  scoreDelta?: number;
}

export function FinancialHealthHero({ score = 82, scoreDelta = 0 }: Props) {
  const radius = 65;
  const circumference = 2 * Math.PI * radius;
  const targetOffset = circumference * (1 - score / 100);

  const status =
    score >= 80
      ? { label: "Strong", color: "var(--mint)", bg: "var(--mint-soft)" }
      : score >= 60
      ? { label: "Good", color: "var(--accent)", bg: "var(--accent-soft)" }
      : score >= 40
      ? { label: "Fair", color: "var(--amber)", bg: "var(--amber-soft)" }
      : { label: "Needs Attention", color: "var(--rose)", bg: "var(--rose-soft)" };

  const [displayScore, setDisplayScore] = useState(0);
  const [arcOffset, setArcOffset] = useState(circumference);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  const animated = useRef(false);

  useEffect(() => {
    if (animated.current) return;
    animated.current = true;

    const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    setPrefersReducedMotion(prefersReduced);

    requestAnimationFrame(() => {
      setArcOffset(targetOffset);
      if (prefersReduced) setDisplayScore(score);
    });

    if (prefersReduced) return;

    const duration = 1300;
    const start = performance.now() + 80;
    function tick(now: number) {
      const p = Math.min(1, Math.max(0, (now - start) / duration));
      const eased = 1 - Math.pow(1 - p, 3);
      setDisplayScore(Math.round(eased * score));
      if (p < 1) requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  }, [score, targetOffset, circumference]);

  return (
    <div
      className="glass relative overflow-hidden"
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        textAlign: "center",
        padding: "28px 22px 24px",
        marginBottom: "16px",
      }}
    >
      {/* Ambient glow */}
      <div
        style={{
          position: "absolute",
          top: "-40%",
          left: "50%",
          transform: "translateX(-50%)",
          width: "250px",
          height: "250px",
          background: `radial-gradient(circle, ${status.bg}, transparent 70%)`,
          pointerEvents: "none",
        }}
      />

      {/* Label */}
      <p
        style={{
          fontFamily: "var(--font-mono-family)",
          fontSize: "0.6875rem",
          fontWeight: 600,
          color: "var(--text-3)",
          textTransform: "uppercase",
          letterSpacing: "0.1em",
          marginBottom: "16px",
          position: "relative",
          zIndex: 1,
        }}
      >
        Financial Health
      </p>

      {/* Gauge */}
      <div
        style={{
          position: "relative",
          width: "160px",
          height: "160px",
          marginBottom: "16px",
        }}
        className="lg:!w-[180px] lg:!h-[180px]"
      >
        <svg
          viewBox="0 0 160 160"
          style={{ width: "100%", height: "100%", transform: "rotate(-90deg)" }}
        >
          <circle
            cx="80"
            cy="80"
            r={radius}
            fill="none"
            stroke="var(--gauge-track)"
            strokeWidth="10"
          />
          <circle
            cx="80"
            cy="80"
            r={radius}
            fill="none"
            stroke={status.color}
            strokeWidth="10"
            strokeDasharray={circumference}
            strokeDashoffset={arcOffset}
            strokeLinecap="round"
            style={{
              filter: `drop-shadow(0 0 10px ${status.bg})`,
              transition: prefersReducedMotion ? "none" : "stroke-dashoffset 1.5s cubic-bezier(0.22, 1, 0.36, 1)",
            }}
          />
        </svg>

        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <span
            style={{
              fontFamily: "var(--font-mono-family)",
              fontWeight: 700,
              fontSize: "2.5rem",
              letterSpacing: "-0.03em",
              lineHeight: 1,
              color: "var(--text-1)",
            }}
            className="lg:!text-[2.75rem]"
          >
            {displayScore}
          </span>
          <span
            style={{
              fontFamily: "var(--font-mono-family)",
              fontSize: "0.75rem",
              color: "var(--text-3)",
              marginTop: "2px",
            }}
          >
            / 100
          </span>
        </div>
      </div>

      {/* Pills */}
      <div
        style={{
          display: "flex",
          gap: "8px",
          flexWrap: "wrap",
          justifyContent: "center",
          position: "relative",
          zIndex: 1,
        }}
      >
        <span
          style={{
            fontFamily: "var(--font-mono-family)",
            fontSize: "0.6875rem",
            fontWeight: 600,
            padding: "4px 11px",
            borderRadius: "var(--radius-full)",
            letterSpacing: "0.02em",
            background: status.bg,
            color: status.color,
          }}
        >
          {status.label}
        </span>
        <span
          style={{
            fontFamily: "var(--font-mono-family)",
            fontSize: "0.6875rem",
            fontWeight: 600,
            padding: "4px 11px",
            borderRadius: "var(--radius-full)",
            letterSpacing: "0.02em",
            background: scoreDelta > 0 ? "var(--accent-soft)" : scoreDelta < 0 ? "var(--rose-soft)" : "var(--amber-soft)",
            color: scoreDelta > 0 ? "var(--accent)" : scoreDelta < 0 ? "var(--rose)" : "var(--amber)",
          }}
        >
          {scoreDelta > 0 ? `+${scoreDelta}` : scoreDelta} this month
        </span>
      </div>
    </div>
  );
}
