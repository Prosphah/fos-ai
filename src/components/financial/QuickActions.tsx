"use client";

import { useState } from "react";
import { DollarSign, TrendingUp, Monitor } from "lucide-react";
import { RoiCalculatorSheet } from "@/components/calculators/RoiCalculatorSheet";
import { StockAnalyzerSheet } from "@/components/financial/StockAnalyzerSheet";

function ChatIcon({ size = 20 }: { size?: number }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width={size} height={size}>
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
    </svg>
  );
}

export function QuickActions() {
  const [roiOpen, setRoiOpen] = useState(false);
  const [stockAnalyzerOpen, setStockAnalyzerOpen] = useState(false);

  return (
    <>
      <div>
        <p
          style={{
            fontFamily: "var(--font-mono-family)",
            fontSize: "0.6875rem",
            fontWeight: 600,
            color: "var(--text-3)",
            textTransform: "uppercase",
            letterSpacing: "0.1em",
            marginBottom: "12px",
          }}
        >
          Quick Actions
        </p>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "10px",
          }}
        >
          <a
            href="/assistant"
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: "8px",
              padding: "20px 12px",
              background: "var(--glass-bg)",
              backdropFilter: "blur(16px)",
              WebkitBackdropFilter: "blur(16px)",
              border: "1px solid var(--glass-border)",
              borderRadius: "var(--radius-sm)",
              textAlign: "center",
              transition: "all 0.25s var(--ease)",
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
                width: "42px",
                height: "42px",
                borderRadius: "12px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                background: "var(--accent-soft)",
                color: "var(--accent)",
              }}
            >
              <ChatIcon size={20} />
            </div>
            <span
              style={{
                fontSize: "0.8125rem",
                fontWeight: 600,
                lineHeight: 1.3,
                color: "var(--text-1)",
              }}
            >
              Ask Coach
            </span>
          </a>

          <button
            onClick={() => setRoiOpen(true)}
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: "8px",
              padding: "20px 12px",
              background: "var(--glass-bg)",
              backdropFilter: "blur(16px)",
              WebkitBackdropFilter: "blur(16px)",
              border: "1px solid var(--glass-border)",
              borderRadius: "var(--radius-sm)",
              textAlign: "center",
              transition: "all 0.25s var(--ease)",
              cursor: "pointer",
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
                width: "42px",
                height: "42px",
                borderRadius: "12px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                background: "var(--accent-soft)",
                color: "var(--accent)",
              }}
            >
              <DollarSign size={20} />
            </div>
            <span
              style={{
                fontSize: "0.8125rem",
                fontWeight: 600,
                lineHeight: 1.3,
                color: "var(--text-1)",
              }}
            >
              Calculate ROI
            </span>
          </button>

          <button
            onClick={() => setStockAnalyzerOpen(true)}
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: "8px",
              padding: "20px 12px",
              background: "var(--glass-bg)",
              backdropFilter: "blur(16px)",
              WebkitBackdropFilter: "blur(16px)",
              border: "1px solid var(--glass-border)",
              borderRadius: "var(--radius-sm)",
              textAlign: "center",
              transition: "all 0.25s var(--ease)",
              cursor: "pointer",
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
                width: "42px",
                height: "42px",
                borderRadius: "12px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                background: "var(--accent-soft)",
                color: "var(--accent)",
              }}
            >
              <TrendingUp size={20} />
            </div>
            <span
              style={{
                fontSize: "0.8125rem",
                fontWeight: 600,
                lineHeight: 1.3,
                color: "var(--text-1)",
              }}
            >
              Analyze Stock
            </span>
          </button>

          <a
            href="/money-manager/accounts"
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: "8px",
              padding: "20px 12px",
              background: "var(--glass-bg)",
              backdropFilter: "blur(16px)",
              WebkitBackdropFilter: "blur(16px)",
              border: "1px solid var(--glass-border)",
              borderRadius: "var(--radius-sm)",
              textAlign: "center",
              transition: "all 0.25s var(--ease)",
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
                width: "42px",
                height: "42px",
                borderRadius: "12px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                background: "var(--accent-soft)",
                color: "var(--accent)",
              }}
            >
              <Monitor size={20} />
            </div>
            <span
              style={{
                fontSize: "0.8125rem",
                fontWeight: 600,
                lineHeight: 1.3,
                color: "var(--text-1)",
              }}
            >
              Update Accounts
            </span>
          </a>
        </div>
      </div>

      <RoiCalculatorSheet open={roiOpen} onOpenChange={setRoiOpen} />
      <StockAnalyzerSheet open={stockAnalyzerOpen} onOpenChange={setStockAnalyzerOpen} />
    </>
  );
}
