"use client";

import { ArrowUpRight, BrainCircuit } from "lucide-react";

export function InsightCard() {
  return (
    <div
      className="glass relative overflow-hidden"
      style={{
        borderLeft: "3px solid var(--accent)",
        padding: "22px",
        boxShadow:
          "0 0 0 1px rgba(139, 92, 246, 0.08), 0 0 20px -4px rgba(139, 92, 246, 0.12), 0 0 40px -8px rgba(139, 92, 246, 0.06)",
      }}
    >
      {/* Top-left radial glow */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: "radial-gradient(ellipse 300px 200px at 80% 50%, var(--accent-softer), transparent 70%)",
          pointerEvents: "none",
        }}
      />
      {/* Bottom-right radial glow */}
      <div
        style={{
          position: "absolute",
          bottom: "-30%",
          right: "-10%",
          width: "180px",
          height: "180px",
          background: "radial-gradient(circle, var(--accent-softer), transparent 70%)",
          pointerEvents: "none",
        }}
      />

      <div className="relative flex flex-col items-center gap-8 lg:flex-row">
        {/* Text */}
        <div className="flex-1">
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
              marginBottom: "10px",
            }}
          >
            <BrainCircuit size={14} />
            AI Insight
          </p>

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
            Your biggest opportunity is increasing your monthly investment.
          </h3>

          <p
            className="mt-2 max-w-md"
            style={{
              fontSize: "0.875rem",
              lineHeight: 1.65,
              color: "var(--text-2)",
              fontStyle: "italic",
              position: "relative",
              zIndex: 1,
            }}
          >
            Based on your current financial behaviour, increasing your monthly
            investment by <strong style={{ color: "var(--text-1)" }}>$120</strong> could
            boost your projected portfolio value by roughly{" "}
            <strong style={{ color: "var(--text-1)" }}>9%</strong> over the next twelve
            months.
          </p>

          <button
            className="mt-6 inline-flex items-center"
            style={{
              gap: "6px",
              borderRadius: "var(--radius-xs)",
              border: "1px solid var(--glass-border)",
              padding: "8px 16px",
              fontSize: "0.8125rem",
              fontWeight: 500,
              color: "var(--text-1)",
              background: "var(--glass-bg)",
              backdropFilter: "blur(16px)",
              WebkitBackdropFilter: "blur(16px)",
              transition: "background 0.2s var(--ease), border-color 0.2s var(--ease)",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "var(--glass-bg-hover)";
              e.currentTarget.style.borderColor = "var(--glass-border-hover)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "var(--glass-bg)";
              e.currentTarget.style.borderColor = "var(--glass-border)";
            }}
          >
            View Full Analysis
            <ArrowUpRight size={14} />
          </button>
        </div>

        {/* Decorative icon cluster */}
        <div
          className="relative flex shrink-0 items-center justify-center"
          style={{ width: "140px", height: "140px" }}
        >
          <div
            style={{
              position: "absolute",
              inset: 0,
              background: "radial-gradient(circle, var(--accent-softer), transparent 70%)",
              filter: "blur(30px)",
            }}
          />
          <div
            style={{
              position: "absolute",
              width: "64px",
              height: "64px",
              transform: "rotate(12deg)",
              borderRadius: "var(--radius-sm)",
              border: "1px solid var(--glass-border)",
              background: "var(--glass-bg)",
            }}
          />
          <div
            style={{
              position: "relative",
              width: "48px",
              height: "48px",
              borderRadius: "var(--radius-sm)",
              background: "linear-gradient(135deg, var(--accent), #6D28D9)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "0 4px 16px var(--accent-glow)",
            }}
          >
            <BrainCircuit size={24} color="#fff" />
          </div>
        </div>
      </div>
    </div>
  );
}
