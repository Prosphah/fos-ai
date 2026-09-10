"use client";

import { useState, useMemo } from "react";
import { CurrencyInput } from "@/components/ui/currency-input";
import { Sunset } from "lucide-react";

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

export function RetirementCalculator() {
  const [currentAge, setCurrentAge] = useState<number>(0);
  const [retirementAge, setRetirementAge] = useState<number>(0);
  const [monthlySavings, setMonthlySavings] = useState<number>(0);
  const [annualReturn, setAnnualReturn] = useState<number>(0);

  const ageFocus = useFocusStyle();
  const retAgeFocus = useFocusStyle();
  const savingsFocus = useFocusStyle();
  const returnFocus = useFocusStyle();

  const calc = useMemo(() => {
    if (
      currentAge <= 0 ||
      retirementAge <= currentAge ||
      monthlySavings <= 0 ||
      annualReturn <= 0
    )
      return null;

    const yearsToRetirement = retirementAge - currentAge;
    const monthlyRate = annualReturn / 100 / 12;
    const totalMonths = yearsToRetirement * 12;

    let futureValue = 0;
    for (let i = 0; i < totalMonths; i++) {
      futureValue = (futureValue + monthlySavings) * (1 + monthlyRate);
    }

    const totalContributed = monthlySavings * totalMonths;
    const investmentGrowth = futureValue - totalContributed;

    const steps = Math.min(totalMonths, 60);
    const values: number[] = [];
    for (let i = 0; i <= steps; i++) {
      const m = Math.round((i / steps) * totalMonths);
      let v = 0;
      for (let j = 0; j < m; j++) {
        v = (v + monthlySavings) * (1 + monthlyRate);
      }
      values.push(v);
    }

    return { futureValue, totalContributed, investmentGrowth, yearsToRetirement, values };
  }, [currentAge, retirementAge, monthlySavings, annualReturn]);

  const animFuture = useAnimatedNumber(calc?.futureValue ?? 0);
  const animContributed = useAnimatedNumber(calc?.totalContributed ?? 0);
  const animGrowth = useAnimatedNumber(calc?.investmentGrowth ?? 0);

  const chartKey = `${currentAge}-${retirementAge}-${monthlySavings}-${annualReturn}`;

  const points = useMemo(() => {
    if (!calc || calc.values.length < 2) return "";
    return buildPoints(calc.values, CHART_W, CHART_H);
  }, [calc]);

  const hasInput = currentAge > 0 || retirementAge > 0 || monthlySavings > 0 || annualReturn > 0;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: "12px",
          alignItems: "start",
        }}
      >
        <div>
          <label style={labelStyle}>Current Age</label>
          <div style={{ position: "relative", marginTop: "8px" }}>
            <input
              type="number"
              value={currentAge || ""}
              onChange={(e) => setCurrentAge(Math.max(0, Math.min(100, Number(e.target.value))))}
              placeholder="0"
              inputMode="numeric"
              style={{
                ...inputStyle,
                border: ageFocus.border,
                boxShadow: ageFocus.shadow,
              }}
              {...ageFocus.bind}
            />
          </div>
        </div>

        <div>
          <label style={labelStyle}>Retirement Age</label>
          <div style={{ position: "relative", marginTop: "8px" }}>
            <input
              type="number"
              value={retirementAge || ""}
              onChange={(e) => setRetirementAge(Math.max(0, Math.min(100, Number(e.target.value))))}
              placeholder="0"
              inputMode="numeric"
              style={{
                ...inputStyle,
                border: retAgeFocus.border,
                boxShadow: retAgeFocus.shadow,
              }}
              {...retAgeFocus.bind}
            />
          </div>
        </div>
      </div>

      <div>
        <label style={labelStyle}>Monthly Savings</label>
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
            value={monthlySavings}
            onChange={setMonthlySavings}
            placeholder="0"
            style={{
              ...inputStyle,
              paddingLeft: "38px",
              fontSize: "1.5rem",
              fontWeight: 700,
              minHeight: "56px",
              border: savingsFocus.border,
              boxShadow: savingsFocus.shadow,
            }}
            {...savingsFocus.bind}
          />
        </div>
      </div>

      <div>
        <label style={labelStyle}>Expected Annual Return</label>
        <div style={{ position: "relative", marginTop: "8px" }}>
          <input
            type="number"
            value={annualReturn || ""}
            onChange={(e) =>
              setAnnualReturn(Math.min(100, Math.max(0, Number(e.target.value))))
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
              Projected Retirement Fund
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
              {formatCurrency(Math.round(animFuture))}
            </p>
            <p
              style={{
                fontSize: "0.75rem",
                color: "var(--text-2)",
                marginTop: "4px",
              }}
            >
              In {calc.yearsToRetirement} years at {annualReturn}% annual return
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
                  <linearGradient id="retFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--mint)" stopOpacity="0.25" />
                    <stop offset="100%" stopColor="var(--mint)" stopOpacity="0" />
                  </linearGradient>
                </defs>
                <polygon
                  points={`0,${CHART_H} ${points} ${CHART_W},${CHART_H}`}
                  fill="url(#retFill)"
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
                <span>Now (age {currentAge})</span>
                <span>Retire (age {retirementAge})</span>
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
                Total contributed
              </span>
              <span
                style={{
                  fontFamily: "var(--font-mono-family)",
                  fontSize: "0.875rem",
                  fontWeight: 600,
                  color: "var(--text-1)",
                }}
              >
                {formatCurrency(Math.round(animContributed))}
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
                Investment growth
              </span>
              <span
                style={{
                  fontFamily: "var(--font-mono-family)",
                  fontSize: "0.875rem",
                  fontWeight: 700,
                  color: "var(--mint)",
                }}
              >
                +{formatCurrency(Math.round(animGrowth))}
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
            <Sunset size={18} />
          </div>
          <p
            style={{
              fontSize: "0.875rem",
              fontWeight: 600,
              color: "var(--text-1)",
            }}
          >
            {hasInput ? "Almost there" : "Plan your retirement"}
          </p>
          <p style={{ fontSize: "0.8125rem", color: "var(--text-2)", maxWidth: "240px" }}>
            {hasInput
              ? "Enter your monthly savings to see the full projection."
              : "See how your savings could grow by the time you retire."}
          </p>
        </div>
      )}

    </div>
  );
}
