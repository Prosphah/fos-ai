"use client";

import { useState, useMemo } from "react";
import { CurrencyInput } from "@/components/ui/currency-input";
import { TrendingUp } from "lucide-react";
import {
  CHART_H,
  CHART_W,
  Segmented,
  buildPoints,
  formatCurrency,
  inputStyle,
  labelStyle,
  useAnimatedNumber,
  useFocusStyle,
} from "./calculator-primitives";

/* ── Main component ─────────────────────────────────────────── */

const compoundOptions = [
  { value: "monthly", label: "Monthly" },
  { value: "quarterly", label: "Quarterly" },
  { value: "yearly", label: "Yearly" },
] as const;
type CompoundFreq = (typeof compoundOptions)[number]["value"];

type Unit = "years" | "months";

export function RoiCalculator() {
  const [principal, setPrincipal] = useState<number>(0);
  const [rate, setRate] = useState<number>(0);
  const [duration, setDuration] = useState<number>(0);
  const [unit, setUnit] = useState<Unit>("years");
  const [freq, setFreq] = useState<CompoundFreq>("yearly");

  const principalFocus = useFocusStyle();
  const rateFocus = useFocusStyle();
  const durationFocus = useFocusStyle();

  const calc = useMemo(() => {
    const years = unit === "years" ? duration : duration / 12;
    const n =
      freq === "monthly" ? 12 : freq === "quarterly" ? 4 : 1;
    if (principal <= 0 || years <= 0) return null;

    const nominal = rate / 100;
    const finalValue =
      n === 1
        ? principal * Math.pow(1 + nominal, years)
        : principal * Math.pow(1 + nominal / n, n * years);

    const profit = finalValue - principal;
    const roi = (profit / principal) * 100;

    // per-period values for chart (cap at 60 points)
    const cap = Math.ceil(years * (n === 12 ? 12 : n === 4 ? 4 : 1));
    const steps = Math.min(cap, 60);
    const values: number[] = [];
    if (steps > 0) {
      for (let i = 0; i <= steps; i++) {
        const t = (i / steps) * years;
        values.push(
          n === 1
            ? principal * Math.pow(1 + nominal, t)
            : principal * Math.pow(1 + nominal / n, n * t)
        );
      }
    }

    return { finalValue, profit, roi, years, values };
  }, [principal, rate, duration, unit, freq]);

  const animFinal = useAnimatedNumber(calc?.finalValue ?? 0);
  const animProfit = useAnimatedNumber(calc?.profit ?? 0);
  const animRoi = useAnimatedNumber(calc?.roi ?? 0);

  const chartKey = useMemo(
    () => `${principal}-${rate}-${duration}-${unit}-${freq}`,
    [principal, rate, duration, unit, freq]
  );

  const points = useMemo(() => {
    if (!calc || calc.values.length < 2) return "";
    return buildPoints(calc.values, CHART_W, CHART_H);
  }, [calc]);

  const hasInput = principal > 0 || rate > 0 || duration > 0;
  const incomplete = hasInput && !calc;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
      {/* Hero amount input */}
      <div>
        <label style={labelStyle}>Initial Investment</label>
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

      {/* Rate + duration */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: "12px",
          alignItems: "start",
        }}
      >
        <div>
          <label style={labelStyle}>Annual Rate</label>
          <div style={{ position: "relative", marginTop: "8px" }}>
            <input
              type="number"
              value={rate || ""}
              onChange={(e) =>
                setRate(Math.min(1000, Math.max(-99.9, Number(e.target.value))))
              }
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
          <label style={labelStyle}>Duration</label>
          <div
            style={{
              position: "relative",
              marginTop: "8px",
              display: "flex",
              gap: "8px",
            }}
          >
            <input
              type="number"
              value={duration || ""}
              onChange={(e) =>
                setDuration(Math.max(0, Number(e.target.value)))
              }
              placeholder="0"
              inputMode="numeric"
              style={{
                ...inputStyle,
                flex: 1,
                minWidth: 0,
                border: durationFocus.border,
                boxShadow: durationFocus.shadow,
              }}
              {...durationFocus.bind}
            />
            <button
              type="button"
              onClick={() =>
                setUnit((u) => (u === "years" ? "months" : "years"))
              }
              style={{
                flexShrink: 0,
                padding: "0 12px",
                borderRadius: "var(--radius-xs)",
                border: "1px solid var(--glass-border)",
                background: "var(--glass-bg)",
                fontSize: "0.75rem",
                fontWeight: 600,
                fontFamily: "var(--font-mono-family)",
                color: "var(--accent)",
                cursor: "pointer",
                transition: "all 0.2s var(--ease)",
                whiteSpace: "nowrap",
              }}
            >
              {unit}
            </button>
          </div>
        </div>
      </div>

      {/* Compound frequency */}
      <div>
        <label style={labelStyle}>Compounding</label>
        <div style={{ marginTop: "8px" }}>
          <Segmented options={compoundOptions} value={freq} onChange={setFreq} />
        </div>
      </div>

      {/* Results / empty state */}
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
              background:
                calc.profit >= 0
                  ? "radial-gradient(circle, var(--mint-soft), transparent 70%)"
                  : "radial-gradient(circle, var(--rose-soft), transparent 70%)",
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
                Projected Value
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
              <p
                style={{
                  fontSize: "0.75rem",
                  color: "var(--text-2)",
                  marginTop: "4px",
                }}
              >
                After {duration % 1 === 0 ? duration : duration.toFixed(1)}{" "}
                {unit} at {rate}%{" "}
                {freq === "yearly" ? "per year" : `${freq} compounding`}
              </p>
            </div>

            <span
              style={{
                fontFamily: "var(--font-mono-family)",
                fontSize: "0.8125rem",
                fontWeight: 700,
                padding: "6px 12px",
                borderRadius: "var(--radius-full)",
                letterSpacing: "0.02em",
                background:
                  calc.profit >= 0 ? "var(--mint-soft)" : "var(--rose-soft)",
                color: calc.profit >= 0 ? "var(--mint)" : "var(--rose)",
                flexShrink: 0,
                display: "flex",
                alignItems: "center",
                gap: "5px",
              }}
            >
              <TrendingUp size={13} />
              {animRoi >= 0 ? "+" : ""}
              {Math.abs(animRoi).toFixed(1)}%
            </span>
          </div>

          {/* Chart */}
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
                  <linearGradient id="roiFill" x1="0" y1="0" x2="0" y2="1">
                    <stop
                      offset="0%"
                      stopColor={calc.profit >= 0 ? "var(--mint)" : "var(--rose)"}
                      stopOpacity="0.25"
                    />
                    <stop
                      offset="100%"
                      stopColor={calc.profit >= 0 ? "var(--mint)" : "var(--rose)"}
                      stopOpacity="0"
                    />
                  </linearGradient>
                </defs>
                <polygon
                  points={`0,${CHART_H} ${points} ${CHART_W},${CHART_H}`}
                  fill="url(#roiFill)"
                  style={{ animation: "calculatorFade 0.8s var(--ease) both" }}
                />
                <polyline
                  points={points}
                  fill="none"
                  stroke={calc.profit >= 0 ? "var(--mint)" : "var(--rose)"}
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
                <span>
                  {unit === "years" ? `${calc.years}y` : `${duration}mo`}
                </span>
              </div>
            </>
          )}

          {/* Breakdown */}
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
                Invested amount
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
                Total {calc.profit >= 0 ? "gain" : "loss"}
              </span>
              <span
                style={{
                  fontFamily: "var(--font-mono-family)",
                  fontSize: "0.875rem",
                  fontWeight: 700,
                  color: calc.profit >= 0 ? "var(--mint)" : "var(--rose)",
                }}
              >
                {calc.profit >= 0 ? "+" : "-"}
                {formatCurrency(Math.round(Math.abs(animProfit)))}
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
            <TrendingUp size={18} />
          </div>
          <p
            style={{
              fontSize: "0.875rem",
              fontWeight: 600,
              color: "var(--text-1)",
            }}
          >
            {incomplete
              ? "Almost there"
              : "Start your projection"}
          </p>
          <p style={{ fontSize: "0.8125rem", color: "var(--text-2)", maxWidth: "240px" }}>
            {incomplete
              ? "Add the amount you plan to invest to see the full picture."
              : "Enter an amount, rate, and duration to see how your money could grow."}
          </p>
        </div>
      )}

    </div>
  );
}