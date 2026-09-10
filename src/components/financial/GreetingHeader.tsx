"use client";

import { useSyncExternalStore } from "react";

interface Props {
  name: string;
  stage?: string;
}

function getTimeGreeting(): string {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 12) return "Good morning";
  if (hour >= 12 && hour < 17) return "Good afternoon";
  return "Good evening";
}

const subscribeNoop = () => () => {};

export function GreetingHeader({ name, stage = "Building Emergency Fund" }: Props) {
  const greeting = useSyncExternalStore(subscribeNoop, getTimeGreeting, () => "Good morning");

  return (
    <div style={{ marginBottom: "28px" }}>
      {/* Eyebrow */}
      <p
        style={{
          fontFamily: "var(--font-mono-family)",
          fontSize: "0.6875rem",
          fontWeight: 600,
          color: "var(--accent)",
          textTransform: "uppercase",
          letterSpacing: "0.14em",
          marginBottom: "8px",
        }}
      >
        Daily Briefing
      </p>

      {/* Greeting */}
      <h1
        style={{
          fontFamily: "var(--font-display-family)",
          fontSize: "1.625rem",
          fontWeight: 700,
          letterSpacing: "-0.025em",
          lineHeight: 1.3,
          marginBottom: "10px",
          color: "var(--text-1)",
        }}
        className="sm:!text-[1.875rem] lg:!text-[2rem]"
      >
        {greeting}, {name}
      </h1>

      {/* Stage pill */}
      {stage && (
        <span
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "7px",
            background: "var(--accent-soft)",
            border: "1px solid rgba(105, 90, 255, 0.2)",
            color: "var(--accent)",
            fontFamily: "var(--font-mono-family)",
            fontSize: "0.75rem",
            fontWeight: 600,
            padding: "6px 14px",
            borderRadius: "var(--radius-full)",
            letterSpacing: "0.01em",
          }}
        >
          <span
            style={{
              width: "6px",
              height: "6px",
              borderRadius: "50%",
              background: "var(--accent)",
              boxShadow: "0 0 8px var(--accent-glow)",
              flexShrink: 0,
            }}
          />
          {stage}
        </span>
      )}
    </div>
  );
}