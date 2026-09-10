"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { LogoIcon } from "@/components/brand/LogoIcon";

const promptChips = [
  "Am I over-risked?",
  "Refinance now?",
  "Emergency fund enough?",
];

export function InsightCard() {
  return (
    <div
      className="glass relative overflow-hidden"
      style={{
        borderLeft: "3px solid var(--accent)",
        padding: "22px",
        boxShadow:
          "0 0 0 1px rgba(105, 90, 255, 0.08), 0 0 20px -4px rgba(105, 90, 255, 0.12), 0 0 40px -8px rgba(105, 90, 255, 0.06)",
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "radial-gradient(ellipse 340px 220px at 85% 40%, var(--accent-softer), transparent 70%)",
          pointerEvents: "none",
        }}
      />

      <div className="relative">
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "10px",
            flexWrap: "wrap",
          }}
        >
          <div
            style={{
              width: "34px",
              height: "34px",
              borderRadius: "var(--radius-xs)",
              background: "linear-gradient(135deg, var(--accent), #4F3DC9)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "0 2px 12px var(--accent-glow)",
              flexShrink: 0,
              color: "#FFFFFF",
            }}
          >
            <LogoIcon size={24} />
          </div>
          <p
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              fontFamily: "var(--font-mono-family)",
              fontSize: "0.6875rem",
              fontWeight: 600,
              color: "var(--accent)",
              textTransform: "uppercase",
              letterSpacing: "0.1em",
            }}
          >
            AI Insight
          </p>
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              marginLeft: "auto",
              padding: "4px 10px",
              borderRadius: "var(--radius-full)",
              border: "1px solid var(--glass-border)",
              background: "var(--accent-soft)",
              color: "var(--accent)",
              fontFamily: "var(--font-mono-family)",
              fontSize: "0.625rem",
              fontWeight: 700,
              letterSpacing: "0.1em",
              textTransform: "uppercase",
            }}
          >
            <span
              style={{
                position: "relative",
                width: "6px",
                height: "6px",
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
            Soon
          </span>
        </div>

        <div className="mt-6 flex flex-col gap-8 lg:flex-row lg:items-center">
          <div className="flex-1">
            <h3
              style={{
                fontFamily: "var(--font-display-family)",
                fontSize: "1.25rem",
                fontWeight: 700,
                letterSpacing: "-0.02em",
                lineHeight: 1.35,
                color: "var(--text-1)",
              }}
            >
              Your next big opportunity, spotted by AI.
            </h3>
            <p
              style={{
                marginTop: "8px",
                maxWidth: "420px",
                fontSize: "0.875rem",
                lineHeight: 1.6,
                color: "var(--text-2)",
              }}
            >
              Coach will read your goals, budget, and portfolio — then walk you
              through the one change that matters most.
            </p>

            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                gap: "6px",
                marginTop: "16px",
              }}
            >
              {promptChips.map((chip) => (
                <span
                  key={chip}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    padding: "6px 12px",
                    borderRadius: "var(--radius-full)",
                    border: "1px solid var(--glass-border)",
                    background: "var(--glass-bg)",
                    color: "var(--text-2)",
                    fontSize: "0.75rem",
                    fontWeight: 500,
                    transition:
                      "color 0.2s var(--ease), border-color 0.2s var(--ease)",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.color = "var(--accent)";
                    e.currentTarget.style.borderColor = "var(--accent)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.color = "var(--text-2)";
                    e.currentTarget.style.borderColor = "var(--glass-border)";
                  }}
                >
                  {chip}
                </span>
              ))}
            </div>

            <Link
              href="/assistant"
              className="mt-6 inline-flex items-center"
              style={{
                gap: "6px",
                borderRadius: "var(--radius-xs)",
                border: "1px solid var(--glass-border)",
                padding: "9px 16px",
                fontSize: "0.8125rem",
                fontWeight: 600,
                color: "var(--text-1)",
                background: "var(--glass-bg)",
                backdropFilter: "blur(16px)",
                WebkitBackdropFilter: "blur(16px)",
                textDecoration: "none",
                transition:
                  "background 0.2s var(--ease), border-color 0.2s var(--ease)",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "var(--accent)";
                e.currentTarget.style.borderColor = "transparent";
                e.currentTarget.style.color = "#fff";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "var(--glass-bg)";
                e.currentTarget.style.borderColor = "var(--glass-border)";
                e.currentTarget.style.color = "var(--text-1)";
              }}
            >
              Preview Ask Coach
              <ArrowRight size={14} />
            </Link>
          </div>

          <div
            style={{
              width: "min(300px, 100%)",
              margin: "0 auto",
              alignSelf: "center",
              borderRadius: "16px",
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
                padding: "10px 14px",
                borderBottom: "1px solid var(--glass-border)",
              }}
            >
              <div
                style={{
                  width: "26px",
                  height: "26px",
                  borderRadius: "8px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  background: "linear-gradient(135deg, var(--accent), #8B7BFF)",
                  color: "#FFFFFF",
                }}
              >
                <LogoIcon size={19} />
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
            </div>

            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "8px",
                padding: "14px",
              }}
            >
              <div
                style={{
                  alignSelf: "flex-end",
                  maxWidth: "85%",
                  padding: "9px 12px",
                  borderRadius: "13px 13px 4px 13px",
                  background: "var(--accent)",
                  color: "#FFFFFF",
                  fontSize: "0.75rem",
                  lineHeight: 1.45,
                }}
              >
                Where should my extra <strong>$120</strong> a month go?
              </div>
              <div
                style={{
                  maxWidth: "90%",
                  padding: "9px 12px",
                  borderRadius: "13px 13px 13px 4px",
                  background: "var(--glass-bg)",
                  border: "1px solid var(--glass-border)",
                  fontSize: "0.75rem",
                  color: "var(--text-1)",
                  lineHeight: 1.45,
                }}
              >
                Investing it could lift your projected portfolio by{" "}
                <strong style={{ color: "var(--accent)" }}>~9%</strong> in 12
                months.
                <span style={{ display: "flex", gap: "3px", marginTop: "8px" }}>
                  {Array.from({ length: 6 }).map((_, i) => (
                    <span
                      key={i}
                      style={{
                        flex: 1,
                        height: "8px",
                        borderRadius: "var(--radius-full)",
                        background:
                          i < 4 ? "var(--mint)" : "var(--accent-soft)",
                        border: "1px solid var(--glass-border)",
                      }}
                    />
                  ))}
                </span>
              </div>
              <div
                aria-hidden
                style={{
                  display: "inline-flex",
                  gap: "4px",
                  alignSelf: "flex-start",
                  padding: "9px 12px",
                  borderRadius: "13px 13px 13px 4px",
                  background: "var(--glass-bg)",
                  border: "1px solid var(--glass-border)",
                }}
              >
                {[1, 2, 3].map((d) => (
                  <span
                    key={d}
                    className="animate-typing"
                    style={{
                      width: "5px",
                      height: "5px",
                      borderRadius: "50%",
                      background: "var(--text-2)",
                      animationDelay: `${d * 0.15}s`,
                    }}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}