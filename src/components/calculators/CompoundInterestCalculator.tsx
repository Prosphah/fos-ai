"use client";

import { useState, useMemo } from "react";
import { CurrencyInput } from "@/components/ui/currency-input";
import { Percent } from "lucide-react";
import {
  CHART_H,
  CHART_W,
  buildPoints,
  formatCurrency,
  inputStyle,
  labelStyle,
  useAnimatedNumber,
  useFocusStyle,
  Segmented,
} from "./calculator-primitives";

const compoundOptions = [
  { value: "monthly", label: "Monthly" },
  { value: "quarterly", label: "Quarterly" },
  { value: "yearly", label: "Yearly" },
] as const;
type CompoundFreq = (typeof compoundOptions)[number]["value"];

export function CompoundInterestCalculator() {
  const [principal, setPrincipal] = useState<number>(0);
  const [rate, setRate] = useState<number>(0);
  const [duration, setDuration] = useState<number>(0);
  const [freq, setFreq] = useState<CompoundFreq>("monthly");

  const principalFocus = useFocusStyle();
  const rateFocus = useFocusStyle();
  const durationFocus = useFocusStyle();

  const calc = useMemo(() => {
    if (principal <= 0 || duration <= 0 || rate <= 0) return null;
    const n = freq === "monthly" ? 12 : freq === "quarterly" ? 4 : 1;
    const finalValue =
      principal * Math.pow(1 + rate / 100 / n, n * duration);
    const profit = finalValue - principal;

    const steps = Math.min(Math.ceil(duration * n), 60);
    const values: number[] = [];
    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      values.push(
        principal * Math.pow(1 + rate / 100 / n, n * (t * duration))
      );
    }

    return { finalValue, profit, values };
  }, [principal, rate, duration, freq]);

  const animFinal = useAnimatedNumber(calc?.finalValue ?? 0);
  const animProfit = useAnimatedNumber(calc?.profit ?? 0);

  const chartKey = `${principal}-${rate}-${duration}-${freq}`;

  const points = useMemo(() => {
    if (!calc || calc.values.length < 2) return "";
    return buildPoints(calc.values, CHART_W, CHART_H);
  }, [calc]);

  const hasInput = principal > 0 || rate > 0 || duration > 0;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
      <div>
        <label style={labelStyle}>Principal Amount</label>
        <div style={{ position: "relative", marginTop: "8px" }}>
          <span
            style={{
              position: "absolute",
              left: "16px",
              top: "50%",
              transform: "translateY(-50%)",
              fontSize: "1.125rem",
              fontWeight: 600,
              color: "var(--text-3)",
              pointerEvents: "none",
            }}
          >
            ₦
          </span>
          <CurrencyInput
            value={principal}
            onChange={setPrincipal}
            placeholder="0"
            style={{
              ...inputStyle,
              paddingLeft: "38px",
              fontSize: "1.5rem",
              fontWeight: 700,
              minHeight: "56px",
              border: principalFocus.border,
              boxShadow: principalFocus.shadow,
            }}
            {...principalFocus.bind}
          />
        </div>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: "12px",
          alignItems: "start",
        }}
      >
        <div>
          <label style={labelStyle}>Interest Rate</label>
          <div style={{ position: "relative", marginTop: "8px" }}>
            <input
              type="number"
              value={rate || ""}
              onChange={(e) => setRate(Math.min(100, Math.max(0, Number(e.target.value))))}
              placeholder="0"
              inputMode="decimal"
              style={{
                ...inputStyle,
                paddingRight: "34px",
                border: rateFocus.border,
                boxShadow: rateFocus.shadow,
              }}
              {...rateFocus.bind}
            />
            <span
              style={{
                position: "absolute",
                right: "14px",
                top: "50%",
                transform: "translateY(-50%)",
                fontSize: "0.875rem",
                color: "var(--text-3)",
                pointerEvents: "none",
              }}
            >
              %
            </span>
          </div>
        </div>

        <div>
          <label style={labelStyle}>Duration (years)</label>
          <div style={{ position: "relative", marginTop: "8px" }}>
            <input
              type="number"
              value={duration || ""}
              onChange={(e) => setDuration(Math.max(0, Number(e.target.value)))}
              placeholder="0"
              inputMode="numeric"
              style={{
                ...inputStyle,
                border: durationFocus.border,
                boxShadow: durationFocus.shadow,
              }}
              {...durationFocus.bind}
            />
          </div>
        </div>
      </div>

      <div>
        <label style={labelStyle}>Compounding Frequency</label>
        <div style={{ marginTop: "8px" }}>
          <Segmented options={compoundOptions} value={freq} onChange={setFreq} />
        </div>
      </div>

      {calc ? (
        <div
          key={chartKey}
          style={{
            borderRadius: "var(--radius)",
            border: "1px solid var(--glass-border)",
            background: "var(--glass-bg)",
            padding: "20px",
            overflow: "hidden",
            animation: "calculatorReveal 0.5s var(--ease-spring) both",
            position: "relative",
          }}
        >
          <div
            style={{
              position: "absolute",
              top: "-60%",
              left: "50%",
              transform: "translateX(-50%)",
              width: "220px",
              height: "220px",
              background: "radial-gradient(circle, var(--mint-soft), transparent 70%)",
              pointerEvents: "none",
            }}
          />

          <div
            style={{
              display: "flex",
              alignItems: "flex-start",
              justifyContent: "space-between",
              position: "relative",
            }}
          >
            <div>
              <p
                style={{
                  fontFamily: "var(--font-mono-family)",
                  fontSize: "0.6875rem",
                  fontWeight: 600,
                  color: "var(--text-3)",
                  textTransform: "uppercase",
                  letterSpacing: "0.1em",
                  marginBottom: "6px",
                }}
              >
                Final Value
              </p>
              <p
                style={{
                  fontFamily: "var(--font-display-family)",
                  fontSize: "1.875rem",
                  fontWeight: 700,
                  letterSpacing: "-0.02em",
                  color: "var(--text-1)",
                  lineHeight: 1.1,
                }}
              >
                {formatCurrency(Math.round(animFinal))}
              </p>
            </div>
          </div>

          {points && (
            <>
              <svg
                viewBox={`0 0 ${CHART_W} ${CHART_H}`}
                style={{
                  width: "100%",
                  height: "90px",
                  marginTop: "16px",
                  marginBottom: "8px",
                  display: "block",
                  overflow: "visible",
                }}
                preserveAspectRatio="none"
              >
                <defs>
                  <linearGradient id="ciFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--mint)" stopOpacity="0.25" />
                    <stop offset="100%" stopColor="var(--mint)" stopOpacity="0" />
                  </linearGradient>
                </defs>
                <polygon
                  points={`0,${CHART_H} ${points} ${CHART_W},${CHART_H}`}
                  fill="url(#ciFill)"
                  style={{ animation: "calculatorFade 0.8s var(--ease) both" }}
                />
                <polyline
                  points={points}
                  fill="none"
                  stroke="var(--mint)"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  pathLength={100}
                  style={{
                    strokeDasharray: 100,
                    animation: "calculatorDraw 0.9s var(--ease-spring) both",
                  }}
                />
              </svg>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  fontFamily: "var(--font-mono-family)",
                  fontSize: "0.625rem",
                  color: "var(--text-3)",
                  padding: "0 2px",
                }}
              >
                <span>Now</span>
                <span>{duration}y</span>
              </div>
            </>
          )}

          <div
            style={{
              marginTop: "14px",
              borderTop: "1px solid var(--glass-border)",
              paddingTop: "14px",
              display: "flex",
              flexDirection: "column",
              gap: "10px",
              position: "relative",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <span style={{ fontSize: "0.875rem", color: "var(--text-2)" }}>
                Principal
              </span>
              <span
                style={{
                  fontFamily: "var(--font-mono-family)",
                  fontSize: "0.875rem",
                  fontWeight: 600,
                  color: "var(--text-1)",
                }}
              >
                {formatCurrency(principal)}
              </span>
            </div>

            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <span style={{ fontSize: "0.875rem", color: "var(--text-2)" }}>
                Interest earned
              </span>
              <span
                style={{
                  fontFamily: "var(--font-mono-family)",
                  fontSize: "0.875rem",
                  fontWeight: 700,
                  color: "var(--mint)",
                }}
              >
                +{formatCurrency(Math.round(animProfit))}
              </span>
            </div>
          </div>
        </div>
      ) : (
        <div
          style={{
            borderRadius: "var(--radius)",
            border: "1px dashed var(--glass-border)",
            background: "var(--glass-bg)",
            padding: "28px 20px",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "8px",
            textAlign: "center",
          }}
        >
          <div
            style={{
              width: "40px",
              height: "40px",
              borderRadius: "12px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: "var(--accent-soft)",
              color: "var(--accent)",
            }}
          >
            <Percent size={18} />
          </div>
          <p
            style={{
              fontSize: "0.875rem",
              fontWeight: 600,
              color: "var(--text-1)",
            }}
          >
            {hasInput ? "Almost there" : "See your money grow"}
          </p>
          <p style={{ fontSize: "0.8125rem", color: "var(--text-2)", maxWidth: "240px" }}>
            {hasInput
              ? "Enter a rate and duration to see the full picture."
              : "Enter a principal, rate, and duration to see compound growth."}
          </p>
        </div>
      )}

    </div>
  );
}
