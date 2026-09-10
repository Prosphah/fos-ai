"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  Bot,
  Check,
  ChartNoAxesColumn,
  ShieldCheck,
  Sparkles,
  Target,
  TrendingUp,
  User,
} from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { Button } from "@/components/ui/button";
import { joinWaitlist } from "@/app/actions/waitlist";

const capabilities = [
  {
    icon: Target,
    title: "Goal-first answers",
    desc: "Every reply is grounded in your goals and current plan.",
  },
  {
    icon: TrendingUp,
    title: "What-if scenarios",
    desc: "Stress-test a big purchase or a market dip before it happens.",
  },
  {
    icon: ShieldCheck,
    title: "Reality checks",
    desc: "Spot blind spots in your emergency fund, coverage, and risk.",
  },
  {
    icon: ChartNoAxesColumn,
    title: "Built for your numbers",
    desc: "Practical guidance tied to your accounts, budgets, and portfolio.",
  },
];

function NotifyForm() {
  const [email, setEmail] = useState("");
  const [joined, setJoined] = useState(false);
  const [waitlistError, setWaitlistError] = useState("");

  if (joined) {
    return (
      <div
        className="reveal"
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
        You&apos;re on the list — we&apos;ll ping you the moment Coach goes live.
      </div>
    );
  }

  return (
    <form
      onSubmit={async (e) => {
        e.preventDefault();
        setWaitlistError("");
        try {
          const result = await joinWaitlist({ email, feature: "assistant" as const });
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

export default function AssistantPage() {
  return (
    <AppShell>
      <div style={{ maxWidth: "760px", margin: "0 auto", width: "100%" }}>
        <Link
          href="/briefing"
          className="reveal"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "6px",
            color: "var(--text-3)",
            fontSize: "0.8125rem",
            textDecoration: "none",
            marginBottom: "28px",
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
          className="reveal delay-1"
          style={{
            position: "relative",
            overflow: "hidden",
            minHeight: "520px",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            textAlign: "center",
            padding: "56px 40px",
            borderRadius: "var(--radius)",
            border: "1px solid var(--glass-border)",
            background: "var(--glass-bg)",
            backdropFilter: "blur(20px) saturate(1.3)",
            WebkitBackdropFilter: "blur(20px) saturate(1.3)",
            boxShadow: "var(--shadow-card)",
          }}
        >
          <div
            className="animate-orb-drift"
            aria-hidden
            style={{
              position: "absolute",
              top: "-80px",
              left: "-60px",
              width: "280px",
              height: "280px",
              borderRadius: "50%",
              background:
                "radial-gradient(circle, var(--accent-glow), transparent 70%)",
              filter: "blur(30px)",
              pointerEvents: "none",
            }}
          />
          <div
            className="animate-orb-drift-reverse"
            aria-hidden
            style={{
              position: "absolute",
              bottom: "-100px",
              right: "-70px",
              width: "320px",
              height: "320px",
              borderRadius: "50%",
              background:
                "radial-gradient(circle, var(--mint-soft), transparent 70%)",
              filter: "blur(40px)",
              pointerEvents: "none",
            }}
          />

          <div
            style={{
              position: "relative",
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
              padding: "6px 14px",
              borderRadius: "var(--radius-full)",
              border: "1px solid var(--glass-border)",
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
                position: "relative",
                width: "7px",
                height: "7px",
                borderRadius: "50%",
                background: "var(--mint)",
                display: "inline-block",
              }}
            >
              <span
                className="animate-ping-soft"
                aria-hidden
                style={{
                  position: "absolute",
                  inset: 0,
                  borderRadius: "50%",
                  background: "var(--mint)",
                }}
              />
            </span>
            <Sparkles size={13} />
            Coming soon
          </div>

          <div
            className="reveal delay-2"
            style={{
              position: "relative",
              width: "min(430px, 100%)",
              marginTop: "32px",
              textAlign: "left",
              borderRadius: "18px",
              border: "1px solid var(--glass-border)",
              background: "color-mix(in srgb, var(--bg) 40%, transparent)",
              boxShadow: "var(--shadow-card)",
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
                  background: "linear-gradient(135deg, var(--accent), #8B7BFF)",
                  color: "#FFFFFF",
                }}
              >
                <Bot size={17} />
              </div>
              <span
                style={{
                  color: "var(--text-1)",
                  fontSize: "0.8125rem",
                  fontWeight: 600,
                }}
              >
                Coach
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
                online
              </span>
            </div>

            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "10px",
                padding: "16px",
              }}
            >
              <div>
                <p
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                    color: "var(--text-3)",
                    fontSize: "0.625rem",
                    textTransform: "uppercase",
                    letterSpacing: "0.08em",
                    marginBottom: "5px",
                  }}
                >
                  <User size={11} />
                  You
                </p>
                <div
                  style={{
                    maxWidth: "82%",
                    padding: "10px 14px",
                    borderRadius: "14px 14px 4px 14px",
                    background: "var(--accent)",
                    color: "#FFFFFF",
                    fontSize: "0.8125rem",
                    lineHeight: 1.45,
                  }}
                >
                  Should I grow my emergency fund from 4 to 6 months?
                </div>
              </div>

              <div>
                <p
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                    color: "var(--text-3)",
                    fontSize: "0.625rem",
                    textTransform: "uppercase",
                    letterSpacing: "0.08em",
                    marginBottom: "5px",
                  }}
                >
                  <Bot size={11} />
                  Coach
                </p>
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "10px",
                    maxWidth: "88%",
                    padding: "10px 14px",
                    borderRadius: "14px 14px 14px 4px",
                    background: "var(--glass-bg)",
                    border: "1px solid var(--glass-border)",
                    fontSize: "0.8125rem",
                    color: "var(--text-1)",
                    lineHeight: 1.45,
                  }}
                >
                  <span>
                    Good instinct. Your income is steady, and padding the buffer
                    would keep you calm through a longer dip:
                  </span>
                  <span
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "4px",
                    }}
                  >
                    {Array.from({ length: 6 }).map((_, i) => (
                      <span
                        key={i}
                        style={{
                          flex: 1,
                          height: "10px",
                          borderRadius: "var(--radius-full)",
                          background:
                            i < 4
                              ? "var(--mint)"
                              : "var(--accent-soft)",
                          border: "1px solid var(--glass-border)",
                        }}
                      />
                    ))}
                  </span>
                  <span
                    style={{
                      color: "var(--text-2)",
                      fontSize: "0.6875rem",
                    }}
                  >
                    4 months today → 6 months recommended
                  </span>
                </div>
              </div>

              <div
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "4px",
                  alignSelf: "flex-start",
                  padding: "10px 14px",
                  borderRadius: "14px 14px 14px 4px",
                  background: "var(--glass-bg)",
                  border: "1px solid var(--glass-border)",
                }}
                aria-hidden
              >
                {[1, 2, 3].map((d) => (
                  <span
                    key={d}
                    className="animate-typing"
                    style={{
                      width: "6px",
                      height: "6px",
                      borderRadius: "50%",
                      background: "var(--text-2)",
                      animationDelay: `${d * 0.15}s`,
                    }}
                  />
                ))}
              </div>
            </div>
          </div>

          <h1
            className="reveal delay-3"
            style={{
              position: "relative",
              marginTop: "36px",
              fontFamily: "var(--font-display-family)",
              fontSize: "2.5rem",
              fontWeight: 700,
              letterSpacing: "-0.02em",
              background:
                "linear-gradient(92deg, var(--text-1) 30%, var(--accent))",
              WebkitBackgroundClip: "text",
              backgroundClip: "text",
              color: "transparent",
            }}
          >
            Ask Coach
          </h1>
          <p
            className="reveal delay-4"
            style={{
              position: "relative",
              maxWidth: "470px",
              marginTop: "12px",
              color: "var(--text-2)",
              fontSize: "0.9375rem",
              lineHeight: 1.6,
            }}
          >
            Your personal finance guide is being prepared. Ask practical
            questions and get guidance grounded in your goals, budget, and
            portfolio.
          </p>

          <div
            className="reveal delay-5"
            style={{
              position: "relative",
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
              gap: "10px",
              marginTop: "32px",
              width: "100%",
            }}
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
                  e.currentTarget.style.boxShadow = "var(--shadow-glow)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = "translateY(0)";
                  e.currentTarget.style.borderColor = "var(--glass-border)";
                  e.currentTarget.style.boxShadow = "none";
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

          <div
            className="reveal delay-6"
            style={{
              position: "relative",
              width: "min(430px, 100%)",
              marginTop: "32px",
            }}
          >
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