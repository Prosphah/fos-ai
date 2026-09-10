"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  CalendarClock,
  Check,
  Plus,
  Sparkles,
  Target,
  TrendingUp,
  Wallet,
} from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { Button } from "@/components/ui/button";
import { joinWaitlist } from "@/app/actions/waitlist";

const capabilities = [
  {
    icon: Target,
    title: "Track momentum",
    desc: "See how close every goal is at a glance.",
  },
  {
    icon: TrendingUp,
    title: "See the path",
    desc: "Know exactly how much to set aside each month.",
  },
  {
    icon: CalendarClock,
    title: "Timeline clarity",
    desc: "Know when you'll hit each milestone.",
  },
  {
    icon: Wallet,
    title: "Right-sized targets",
    desc: "Goals that fit your actual budget.",
  },
];

function NotifyForm() {
  const [email, setEmail] = useState("");
  const [joined, setJoined] = useState(false);
  const [waitlistError, setWaitlistError] = useState("");

  if (joined) {
    return (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "10px",
          padding: "12px 16px",
          background: "var(--mint-soft)",
          border: "1px solid var(--mint)",
          borderRadius: "var(--radius-sm)",
          color: "var(--text-1)",
          fontSize: "0.875rem",
        }}
      >
        <Check size={17} style={{ color: "var(--mint)", flexShrink: 0 }} />
        You&apos;re on the list — we&apos;ll ping you when Goals goes live.
      </div>
    );
  }

  return (
    <form
      onSubmit={async (e) => {
        e.preventDefault();
        setWaitlistError("");
        try {
          const result = await joinWaitlist({ email, feature: "goals" as const });
          if (result.error) {
            setWaitlistError(result.error);
            return;
          }
          setJoined(true);
        } catch {
          setWaitlistError("Something went wrong. Please try again.");
        }
      }}
      style={{ display: "flex", gap: "8px" }}
    >
      <input
        type="email"
        required
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="you@example.com"
        aria-label="Email address"
        style={{
          flex: 1,
          minWidth: 0,
          height: "44px",
          padding: "0 16px",
          borderRadius: "var(--radius-sm)",
          border: "1px solid var(--glass-border)",
          background: "var(--glass-bg)",
          color: "var(--text-1)",
          fontSize: "0.875rem",
          outline: "none",
          transition: "all 0.25s var(--ease)",
        }}
        onFocus={(e) => {
          e.currentTarget.style.borderColor = "var(--accent)";
          e.currentTarget.style.boxShadow = "var(--shadow-glow)";
        }}
        onBlur={(e) => {
          e.currentTarget.style.borderColor = "var(--glass-border)";
          e.currentTarget.style.boxShadow = "none";
        }}
      />
      <Button
        type="submit"
        size="lg"
        className="h-11 px-4 text-[0.875rem]"
        style={{ borderRadius: "var(--radius-sm)" }}
      >
        Get notified
        <ArrowRight />
      </Button>
      {waitlistError && (
        <p style={{ width: "100%", fontSize: "0.8125rem", color: "var(--rose)" }}>
          {waitlistError}
        </p>
      )}
    </form>
  );
}

const RING_RADIUS = 40;
const RING_CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS;

function GoalPreview() {
  const featured = { name: "Emergency fund", target: "$10,000", percent: 60 };
  const secondary = [
    { name: "New car", current: "$4,200", target: "$15,000", percent: 28 },
    { name: "Vacation", current: "$3,750", target: "$5,000", percent: 75 },
  ];

  return (
    <div
      style={{
        position: "relative",
        width: "min(400px, 100%)",
        marginTop: "28px",
        textAlign: "left",
        borderRadius: "16px",
        border: "1px solid var(--glass-border)",
        background: "var(--glass-bg)",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "8px",
          padding: "12px 16px",
          borderBottom: "1px solid var(--glass-border)",
        }}
      >
        <div
          style={{
            width: "30px",
            height: "30px",
            borderRadius: "10px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "var(--accent-soft)",
            color: "var(--accent)",
          }}
        >
          <Target size={16} />
        </div>
        <span
          style={{
            color: "var(--text-1)",
            fontSize: "0.8125rem",
            fontWeight: 600,
          }}
        >
          Goal tracker
        </span>
        <span
          style={{
            display: "flex",
            alignItems: "center",
            gap: "5px",
            marginLeft: "auto",
            color: "var(--text-3)",
            fontSize: "0.6875rem",
          }}
        >
          <span
            style={{
              width: "6px",
              height: "6px",
              borderRadius: "50%",
              background: "var(--mint)",
            }}
          />
          preview
        </span>
      </div>

      <div style={{ display: "flex", flexWrap: "wrap", gap: "16px", padding: "16px" }}>
        <div style={{ position: "relative", width: 112, height: 112, flexShrink: 0 }}>
          <svg
            width={112}
            height={112}
            viewBox="0 0 112 112"
            style={{ transform: "rotate(-90deg)" }}
          >
            <circle
              cx={56}
              cy={56}
              r={RING_RADIUS}
              fill="none"
              stroke="var(--gauge-track)"
              strokeWidth={8}
            />
            <circle
              cx={56}
              cy={56}
              r={RING_RADIUS}
              fill="none"
              stroke="var(--accent)"
              strokeWidth={8}
              strokeLinecap="round"
              strokeDasharray={RING_CIRCUMFERENCE}
              strokeDashoffset={RING_CIRCUMFERENCE * (1 - featured.percent / 100)}
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
                fontFamily: "var(--font-display-family)",
                fontSize: "1.25rem",
                fontWeight: 700,
                color: "var(--text-1)",
              }}
            >
              {featured.percent}%
            </span>
            <span
              style={{
                fontSize: "0.625rem",
                color: "var(--text-3)",
                letterSpacing: "0.05em",
                textTransform: "uppercase",
              }}
            >
              funded
            </span>
          </div>
        </div>

        <div
          style={{
            flex: "1 1 150px",
            minWidth: 0,
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
          }}
        >
          <p
            style={{
              fontFamily: "var(--font-display-family)",
              fontSize: "0.9375rem",
              fontWeight: 700,
              color: "var(--text-1)",
            }}
          >
            Emergency fund
          </p>
          <p style={{ fontSize: "0.75rem", color: "var(--text-2)", marginTop: "3px" }}>
            <strong style={{ color: "var(--text-1)" }}>$6,000</strong> of{" "}
            {featured.target}
          </p>
        </div>
      </div>

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "12px",
          padding: "0 16px 16px",
        }}
      >
        {secondary.map((g) => (
          <div key={g.name}>
            <div style={{ display: "flex", gap: "8px", marginBottom: "5px" }}>
              <span
                style={{
                  fontSize: "0.75rem",
                  fontWeight: 600,
                  color: "var(--text-1)",
                  flex: 1,
                  minWidth: 0,
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {g.name}
              </span>
              <span style={{ fontSize: "0.6875rem", color: "var(--text-3)" }}>
                {g.current} of {g.target}
              </span>
            </div>
            <div
              style={{
                height: "8px",
                borderRadius: "var(--radius-full)",
                background: "var(--gauge-track)",
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  width: `${g.percent}%`,
                  height: "100%",
                  borderRadius: "var(--radius-full)",
                  background: g.percent >= 70 ? "var(--mint)" : "var(--accent)",
                }}
              />
            </div>
          </div>
        ))}

        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "6px",
            padding: "9px",
            borderRadius: "var(--radius-xs)",
            border: "1px dashed var(--glass-border)",
            color: "var(--text-3)",
            fontSize: "0.75rem",
          }}
        >
          <Plus size={14} />
          Set a goal — soon
        </div>
      </div>
    </div>
  );
}

export default function GoalsPage() {
  return (
    <AppShell>
      <div style={{ maxWidth: "760px", margin: "0 auto", width: "100%" }}>
        <Link
          href="/briefing"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "6px",
            color: "var(--text-3)",
            fontSize: "0.8125rem",
            textDecoration: "none",
            marginBottom: "24px",
            transition: "color 0.2s var(--ease)",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.color = "var(--accent)")}
          onMouseLeave={(e) =>
            (e.currentTarget.style.color = "var(--text-3)")
          }
        >
          <ArrowLeft size={15} />
          Back to briefing
        </Link>

        <section
          style={{
            position: "relative",
            padding: "48px 20px",
            borderRadius: "var(--radius)",
            border: "1px solid var(--glass-border)",
            background: "var(--glass-bg)",
          }}
        >
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
              padding: "6px 14px",
              borderRadius: "var(--radius-full)",
              background: "var(--accent-soft)",
              color: "var(--accent)",
              fontFamily: "var(--font-mono-family)",
              fontSize: "0.6875rem",
              fontWeight: 700,
              letterSpacing: "0.1em",
              textTransform: "uppercase",
            }}
          >
            <span
              style={{
                width: "6px",
                height: "6px",
                borderRadius: "50%",
                background: "var(--mint)",
                display: "inline-block",
              }}
            />
            <Sparkles size={13} />
            Coming soon
          </div>

          <h1
            style={{
              marginTop: "24px",
              fontFamily: "var(--font-display-family)",
              fontSize: "2rem",
              fontWeight: 700,
              letterSpacing: "-0.02em",
              color: "var(--text-1)",
            }}
          >
            Goals
          </h1>
          <p
            style={{
              maxWidth: "470px",
              marginTop: "10px",
              color: "var(--text-2)",
              fontSize: "0.9375rem",
              lineHeight: 1.6,
            }}
          >
            Pick a destination and we&apos;ll map the road. Set savings goals and
            watch momentum build toward each milestone.
          </p>

          <GoalPreview />

          <div
            className="mt-8 grid w-full grid-cols-2"
            style={{ gap: "10px" }}
          >
            {capabilities.map((c) => (
              <div
                key={c.title}
                style={{
                  padding: "16px 14px",
                  textAlign: "left",
                  borderRadius: "var(--radius-sm)",
                  border: "1px solid var(--glass-border)",
                  background: "var(--glass-bg-hover)",
                  transition: "all 0.25s var(--ease)",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = "translateY(-2px)";
                  e.currentTarget.style.borderColor = "var(--accent)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = "translateY(0)";
                  e.currentTarget.style.borderColor = "var(--glass-border)";
                }}
              >
                <div
                  style={{
                    width: "32px",
                    height: "32px",
                    borderRadius: "10px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    background: "var(--accent-soft)",
                    color: "var(--accent)",
                    marginBottom: "10px",
                  }}
                >
                  <c.icon size={16} />
                </div>
                <p
                  style={{
                    color: "var(--text-1)",
                    fontSize: "0.8125rem",
                    fontWeight: 600,
                    marginBottom: "4px",
                  }}
                >
                  {c.title}
                </p>
                <p
                  style={{
                    color: "var(--text-2)",
                    fontSize: "0.75rem",
                    lineHeight: 1.45,
                  }}
                >
                  {c.desc}
                </p>
              </div>
            ))}
          </div>

          <div style={{ width: "min(430px, 100%)", marginTop: "28px" }}>
            <p
              style={{
                color: "var(--text-2)",
                fontSize: "0.8125rem",
                fontWeight: 600,
                marginBottom: "10px",
              }}
            >
              Be first in line when it drops
            </p>
            <NotifyForm />
          </div>
        </section>
      </div>
    </AppShell>
  );
}