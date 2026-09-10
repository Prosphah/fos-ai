"use client";

import { useState } from "react";
import { AppShell } from "@/components/layout/AppShell";
import {
  TrendingUp,
  Percent,
  ArrowDownRight,
  Sunset,
  Target,
  BarChart3,
  Shield,
  Globe,
  Receipt,
} from "lucide-react";
import { CalculatorSheet } from "@/components/calculators/CalculatorSheet";
import { RoiCalculator } from "@/components/calculators/RoiCalculator";
import { CompoundInterestCalculator } from "@/components/calculators/CompoundInterestCalculator";
import { InflationCalculator } from "@/components/calculators/InflationCalculator";
import { RetirementCalculator } from "@/components/calculators/RetirementCalculator";
import { GoalPlanningCalculator } from "@/components/calculators/GoalPlanningCalculator";
import { DcaCalculator } from "@/components/calculators/DcaCalculator";
import { EmergencyFundCalculator } from "@/components/calculators/EmergencyFundCalculator";
import { CurrencyConverter } from "@/components/calculators/CurrencyConverter";
import { TaxCalculator } from "@/components/calculators/TaxCalculator";

const calculators = [
  {
    id: "roi",
    name: "ROI Calculator",
    description: "See how your investment grows over time",
    icon: TrendingUp,
    gradient: "linear-gradient(135deg, var(--accent), #4F3DC9)",
    sheetShadow: "0 4px 16px rgba(79, 61, 201, 0.4)",
    component: RoiCalculator,
    title: "ROI Calculator",
    sheetDescription:
      "Projecting how your investment could grow — just estimates, not financial advice.",
  },
  {
    id: "compound-interest",
    name: "Compound Interest",
    description: "Watch the power of compounding work for you",
    icon: Percent,
    gradient: "linear-gradient(135deg, #10B981, #059669)",
    sheetShadow: "0 4px 16px rgba(16, 185, 129, 0.4)",
    component: CompoundInterestCalculator,
    title: "Compound Interest Calculator",
    sheetDescription:
      "See how your money grows when interest earns interest.",
  },
  {
    id: "inflation",
    name: "Inflation",
    description: "Understand how inflation erodes purchasing power",
    icon: ArrowDownRight,
    gradient: "linear-gradient(135deg, #EF4444, #DC2626)",
    sheetShadow: "0 4px 16px rgba(239, 68, 68, 0.4)",
    component: InflationCalculator,
    title: "Inflation Calculator",
    sheetDescription:
      "See how much your money will really be worth in the future.",
  },
  {
    id: "retirement",
    name: "Retirement",
    description: "Plan for a comfortable retirement",
    icon: Sunset,
    gradient: "linear-gradient(135deg, #F59E0B, #D97706)",
    sheetShadow: "0 4px 16px rgba(245, 158, 11, 0.4)",
    component: RetirementCalculator,
    title: "Retirement Calculator",
    sheetDescription:
      "Project how your savings could grow by the time you retire.",
  },
  {
    id: "goal-planning",
    name: "Goal Planning",
    description: "Set a savings target and see when you'll reach it",
    icon: Target,
    gradient: "linear-gradient(135deg, #8B5CF6, #7C3AED)",
    sheetShadow: "0 4px 16px rgba(139, 92, 246, 0.4)",
    component: GoalPlanningCalculator,
    title: "Goal Planning Calculator",
    sheetDescription:
      "Set a financial goal and find out how long it takes to get there.",
  },
  {
    id: "dca",
    name: "Dollar Cost Averaging",
    description: "See how regular investing builds wealth",
    icon: BarChart3,
    gradient: "linear-gradient(135deg, #06B6D4, #0891B2)",
    sheetShadow: "0 4px 16px rgba(6, 182, 212, 0.4)",
    component: DcaCalculator,
    title: "DCA Calculator",
    sheetDescription:
      "See how investing a fixed amount regularly smooths out market volatility.",
  },
  {
    id: "emergency-fund",
    name: "Emergency Fund",
    description: "Calculate your 6-12 month safety net",
    icon: Shield,
    gradient: "linear-gradient(135deg, #14B8A6, #0D9488)",
    sheetShadow: "0 4px 16px rgba(20, 184, 166, 0.4)",
    component: EmergencyFundCalculator,
    title: "Emergency Fund Calculator",
    sheetDescription:
      "Find out how much you need to cover 6-12 months of expenses.",
  },
  {
    id: "currency",
    name: "Currency Converter",
    description: "Convert between NGN, USD, GBP, and EUR",
    icon: Globe,
    gradient: "linear-gradient(135deg, #3B82F6, #2563EB)",
    sheetShadow: "0 4px 16px rgba(59, 130, 246, 0.4)",
    component: CurrencyConverter,
    title: "Currency Converter",
    sheetDescription:
      "Convert between Nigerian Naira and major currencies.",
  },
  {
    id: "tax",
    name: "PAYE & Net Income",
    description: "Estimate Nigerian income tax and take-home income",
    icon: Receipt,
    gradient: "linear-gradient(135deg, #F97316, #EA580C)",
    sheetShadow: "0 4px 16px rgba(249, 115, 22, 0.4)",
    component: TaxCalculator,
    title: "Tax Calculator",
    sheetDescription:
      "Nigerian PAYE tax calculation with standard reliefs.",
  },
];

export default function ToolsPage() {
  const [activeSheet, setActiveSheet] = useState<string | null>(null);

  return (
    <AppShell>
      <div style={{ maxWidth: "640px", margin: "0 auto" }}>
        {/* Header */}
        <div style={{ marginBottom: "28px" }}>
          <h1
            style={{
              fontFamily: "var(--font-display-family)",
              fontSize: "1.5rem",
              fontWeight: 700,
              letterSpacing: "-0.02em",
              color: "var(--text-1)",
              marginBottom: "6px",
            }}
          >
            Tools
          </h1>
          <p style={{ fontSize: "0.875rem", color: "var(--text-2)" }}>
            Financial calculators to help you make informed decisions.
          </p>
        </div>

        {/* Calculator grid */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(2, 1fr)",
            gap: "10px",
          }}
        >
          {calculators.map((calc) => {
            const Icon = calc.icon;
            return (
              <button
                key={calc.id}
                type="button"
                onClick={() => setActiveSheet(calc.id)}
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "flex-start",
                  gap: "10px",
                  padding: "18px 16px",
                  background: "var(--glass-bg)",
                  backdropFilter: "blur(16px)",
                  WebkitBackdropFilter: "blur(16px)",
                  border: "1px solid var(--glass-border)",
                  borderRadius: "var(--radius-sm)",
                  textAlign: "left",
                  transition: "all 0.25s var(--ease)",
                  cursor: "pointer",
                  width: "100%",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "var(--glass-bg-hover)";
                  e.currentTarget.style.borderColor = "var(--glass-border-hover)";
                  e.currentTarget.style.transform = "translateY(-2px)";
                  e.currentTarget.style.boxShadow = "var(--shadow-glow)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "var(--glass-bg)";
                  e.currentTarget.style.borderColor = "var(--glass-border)";
                  e.currentTarget.style.transform = "translateY(0)";
                  e.currentTarget.style.boxShadow = "none";
                }}
              >
                <div
                  style={{
                    width: "38px",
                    height: "38px",
                    borderRadius: "10px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    background: calc.gradient,
                    color: "#fff",
                    boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
                    flexShrink: 0,
                  }}
                >
                  <Icon size={18} />
                </div>
                <div>
                  <p
                    style={{
                      fontSize: "0.8125rem",
                      fontWeight: 600,
                      lineHeight: 1.3,
                      color: "var(--text-1)",
                      marginBottom: "2px",
                    }}
                  >
                    {calc.name}
                  </p>
                  <p
                    style={{
                      fontSize: "0.6875rem",
                      color: "var(--text-3)",
                      lineHeight: 1.4,
                    }}
                  >
                    {calc.description}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Calculator sheets */}
      {calculators.map((calc) => {
        const Component = calc.component;
        return (
          <CalculatorSheet
            key={calc.id}
            open={activeSheet === calc.id}
            onOpenChange={(open) => {
              if (!open) setActiveSheet(null);
            }}
            title={calc.title}
            description={calc.sheetDescription}
            icon={calc.icon}
            iconGradient={calc.gradient}
            iconShadow={calc.sheetShadow}
          >
            <Component />
          </CalculatorSheet>
        );
      })}
    </AppShell>
  );
}
