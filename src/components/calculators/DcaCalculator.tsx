"use client";

import { useState, useMemo } from "react";
import { CurrencyInput } from "@/components/ui/currency-input";
import { BarChart3 } from "lucide-react";
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

export function DcaCalculator() {
  const [monthlyAmount, setMonthlyAmount] = useState<number>(0);
  const [years, setYears] = useState<number>(0);
  const [expectedReturn, setExpectedReturn] = useState<number>(0);

  const amountFocus = useFocusStyle();
  const yearsFocus = useFocusStyle();
  const returnFocus = useFocusStyle();

  const calc = useMemo(() => {
    if (monthlyAmount <= 0 || years <= 0 || expectedReturn <= 0) return null;

    const monthlyRate = expectedReturn / 100 / 12;
    const boundedYears = Math.min(years, 100);
    const totalMonths = boundedYears * 12;
    let futureValue = 0;
    const steps = Math.min(totalMonths, 60);
    const values: number[] = [0];
    const investedValues: number[] = [0];
    let nextSample = 1;

    for (let month = 1; month <= totalMonths; month++) {
      futureValue = (futureValue + monthlyAmount) * (1 + monthlyRate);
      if (nextSample <= steps && month >= Math.round((nextSample / steps) * totalMonths)) {
        values.push(futureValue);
        investedValues.push(monthlyAmount * month);
        nextSample++;
      }
    }

    const totalInvested = monthlyAmount * totalMonths;
    const profit = futureValue - totalInvested;
    const roi = (profit / totalInvested) * 100;

    return { futureValue, totalInvested, profit, roi, values, investedValues };
  }, [monthlyAmount, years, expectedReturn]);

  const animFuture = useAnimatedNumber(calc?.futureValue ?? 0);
  const animInvested = useAnimatedNumber(calc?.totalInvested ?? 0);
  const animProfit = useAnimatedNumber(calc?.profit ?? 0);

  const chartKey = `${monthlyAmount}-${years}-${expectedReturn}`;

  const chartScale = useMemo(() => {
    if (!calc) return null;
    const combined = [...calc.values, ...calc.investedValues];
    return { min: Math.min(...combined, 0), max: Math.max(...combined, 1) };
  }, [calc]);

  const points = useMemo(() => {
    if (!calc || !chartScale || calc.values.length < 2) return "";
    return buildPoints(calc.values, CHART_W, CHART_H, chartScale);
  }, [calc, chartScale]);

  const investedPoints = useMemo(() => {
    if (!calc || !chartScale || calc.investedValues.length < 2) return "";
    return buildPoints(calc.investedValues, CHART_W, CHART_H, chartScale);
  }, [calc, chartScale]);

  const hasInput = monthlyAmount > 0 || years > 0 || expectedReturn > 0;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
      <div>
        <label style={labelStyle}>Monthly Investment</label>
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
            value={monthlyAmount}
            onChange={setMonthlyAmount}
            placeholder="0"
            style={{
              ...inputStyle,
              paddingLeft: "38px",
              fontSize: "1.5rem",
              fontWeight: 700,
              minHeight: "56px",
              border: amountFocus.border,
              boxShadow: amountFocus.shadow,
            }}
            {...amountFocus.bind}
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
          <label style={labelStyle}>Duration (years)</label>
          <div style={{ position: "relative", marginTop: "8px" }}>
            <input
              type="number"
              value={years || ""}
              onChange={(e) => setYears(Math.max(0, Number(e.target.value)))}
              placeholder="0"
              inputMode="numeric"
              style={{
                ...inputStyle,
                border: yearsFocus.border,
                boxShadow: yearsFocus.shadow,
              }}
              {...yearsFocus.bind}
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
                {formatCurrency(Math.round(animFuture))}
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
                background: "var(--mint-soft)",
                color: "var(--mint)",
                flexShrink: 0,
                display: "flex",
                alignItems: "center",
                gap: "5px",
              }}
            >
              +{calc.roi.toFixed(1)}%
            </span>
          </div>

          {points && investedPoints && (
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
                  <linearGradient id="dcaFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--mint)" stopOpacity="0.25" />
                    <stop offset="100%" stopColor="var(--mint)" stopOpacity="0" />
                  </linearGradient>
                </defs>
                <polygon
                  points={`0,${CHART_H} ${points} ${CHART_W},${CHART_H}`}
                  fill="url(#dcaFill)"
                  style={{ animation: "calculatorFade 0.8s var(--ease) both" }}
                />
                <polyline
                  points={investedPoints}
                  fill="none"
                  stroke="var(--text-3)"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeDasharray="4 4"
                  opacity={0.5}
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
                <span>Start</span>
                <span>{years}y</span>
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
                Total invested
              </span>
              <span
                style={{
                  fontFamily: "var(--font-mono-family)",
                  fontSize: "0.875rem",
                  fontWeight: 600,
                  color: "var(--text-1)",
                }}
              >
                {formatCurrency(Math.round(animInvested))}
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
            <BarChart3 size={18} />
          </div>
          <p
            style={{
              fontSize: "0.875rem",
              fontWeight: 600,
              color: "var(--text-1)",
            }}
          >
            {hasInput ? "Almost there" : "See DCA in action"}
          </p>
          <p style={{ fontSize: "0.8125rem", color: "var(--text-2)", maxWidth: "240px" }}>
            {hasInput
              ? "Enter all values to see how regular investing grows."
              : "See how investing a fixed amount regularly builds wealth."}
          </p>
        </div>
      )}

    </div>
  );
}
