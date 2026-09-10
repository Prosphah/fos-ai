"use client";

import { useState, useMemo } from "react";
import { CurrencyInput } from "@/components/ui/currency-input";
import { Target } from "lucide-react";
import {
  CHART_H,
  CHART_W,
  buildPoints,
  formatCurrency,
  inputStyle,
  labelStyle,
  useAnimatedNumber,
  useFocusStyle,
} from "./calculator-primitives";

function formatMonths(months: number): string {
  const y = Math.floor(months / 12);
  const m = Math.round(months % 12);
  if (y === 0) return `${m} months`;
  if (m === 0) return `${y} years`;
  return `${y} years, ${m} months`;
}

export function GoalPlanningCalculator() {
  const [targetAmount, setTargetAmount] = useState<number>(0);
  const [currentSavings, setCurrentSavings] = useState<number>(0);
  const [monthlyContribution, setMonthlyContribution] = useState<number>(0);
  const [expectedReturn, setExpectedReturn] = useState<number>(0);

  const targetFocus = useFocusStyle();
  const currentFocus = useFocusStyle();
  const monthlyFocus = useFocusStyle();
  const returnFocus = useFocusStyle();

  const calc = useMemo(() => {
    if (targetAmount <= 0 || monthlyContribution <= 0) return null;

    const gap = Math.max(0, targetAmount - currentSavings);
    const monthlyRate = expectedReturn / 100 / 12;

    if (gap === 0) {
      return {
        monthsToGoal: 0,
        totalSaved: currentSavings,
        months: 0,
        values: [currentSavings],
        reached: true,
      };
    }

    let balance = currentSavings;
    let months = 0;
    const values: number[] = [balance];

    while (balance < targetAmount && months < 600) {
      balance = balance * (1 + monthlyRate) + monthlyContribution;
      months++;
      if (months <= 60 || months % Math.ceil(months / 60) === 0) {
        values.push(balance);
      }
    }

    if (values[values.length - 1] < targetAmount) {
      values.push(balance);
    }

    return { monthsToGoal: months, totalSaved: balance, months, values, reached: balance >= targetAmount };
  }, [targetAmount, currentSavings, monthlyContribution, expectedReturn]);

  const animSaved = useAnimatedNumber(calc?.totalSaved ?? 0);

  const chartKey = `${targetAmount}-${currentSavings}-${monthlyContribution}-${expectedReturn}`;

  const points = useMemo(() => {
    if (!calc || calc.values.length < 2) return "";
    return buildPoints(calc.values, CHART_W, CHART_H);
  }, [calc]);

  const hasInput = targetAmount > 0 || currentSavings > 0 || monthlyContribution > 0;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
      <div>
        <label style={labelStyle}>Goal Amount</label>
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
            value={targetAmount}
            onChange={setTargetAmount}
            placeholder="0"
            style={{
              ...inputStyle,
              paddingLeft: "38px",
              fontSize: "1.5rem",
              fontWeight: 700,
              minHeight: "56px",
              border: targetFocus.border,
              boxShadow: targetFocus.shadow,
            }}
            {...targetFocus.bind}
          />
        </div>
      </div>

      <div>
        <label style={labelStyle}>Already Saved</label>
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
            value={currentSavings}
            onChange={setCurrentSavings}
            placeholder="0"
            style={{
              ...inputStyle,
              paddingLeft: "38px",
              border: currentFocus.border,
              boxShadow: currentFocus.shadow,
            }}
            {...currentFocus.bind}
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
          <label style={labelStyle}>Monthly Saving</label>
          <div style={{ position: "relative", marginTop: "8px" }}>
            <span
              style={{
                position: "absolute",
                left: "14px",
                top: "50%",
                transform: "translateY(-50%)",
                fontSize: "0.875rem",
                fontWeight: 600,
                color: "var(--text-3)",
                pointerEvents: "none",
              }}
            >
              ₦
            </span>
            <CurrencyInput
              value={monthlyContribution}
              onChange={setMonthlyContribution}
              placeholder="0"
              style={{
                ...inputStyle,
                paddingLeft: "32px",
                border: monthlyFocus.border,
                boxShadow: monthlyFocus.shadow,
              }}
              {...monthlyFocus.bind}
            />
          </div>
        </div>

        <div>
          <label style={labelStyle}>Expected Return</label>
          <div style={{ position: "relative", marginTop: "8px" }}>
            <input
              type="number"
              value={expectedReturn || ""}
              onChange={(e) =>
                setExpectedReturn(Math.min(100, Math.max(0, Number(e.target.value))))
              }
              placeholder="0"
              inputMode="decimal"
              style={{
                ...inputStyle,
                paddingRight: "34px",
                border: returnFocus.border,
                boxShadow: returnFocus.shadow,
              }}
              {...returnFocus.bind}
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

          <div style={{ position: "relative" }}>
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
              Time to Goal
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
              {calc.monthsToGoal === 0
                ? "Already there!"
                : calc.reached
                  ? formatMonths(calc.monthsToGoal)
                  : "Not reached within 50 years"}
            </p>
            <p
              style={{
                fontSize: "0.75rem",
                color: "var(--text-2)",
                marginTop: "4px",
              }}
            >
              Saving {formatCurrency(monthlyContribution)}/month
            </p>
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
                  <linearGradient id="goalFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--mint)" stopOpacity="0.25" />
                    <stop offset="100%" stopColor="var(--mint)" stopOpacity="0" />
                  </linearGradient>
                </defs>
                <polygon
                  points={`0,${CHART_H} ${points} ${CHART_W},${CHART_H}`}
                  fill="url(#goalFill)"
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
                <span>Goal</span>
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
                Target amount
              </span>
              <span
                style={{
                  fontFamily: "var(--font-mono-family)",
                  fontSize: "0.875rem",
                  fontWeight: 600,
                  color: "var(--text-1)",
                }}
              >
                {formatCurrency(targetAmount)}
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
                Projected savings
              </span>
              <span
                style={{
                  fontFamily: "var(--font-mono-family)",
                  fontSize: "0.875rem",
                  fontWeight: 700,
                  color: "var(--mint)",
                }}
              >
                {formatCurrency(Math.round(animSaved))}
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
            <Target size={18} />
          </div>
          <p
            style={{
              fontSize: "0.875rem",
              fontWeight: 600,
              color: "var(--text-1)",
            }}
          >
            {hasInput ? "Almost there" : "Set your savings goal"}
          </p>
          <p style={{ fontSize: "0.8125rem", color: "var(--text-2)", maxWidth: "240px" }}>
            {hasInput
              ? "Enter your monthly savings to see when you'll hit your goal."
              : "Set a target and see how long it takes to get there."}
          </p>
        </div>
      )}

    </div>
  );
}
