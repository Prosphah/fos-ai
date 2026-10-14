/**
 * FOS·AI interface previews, shown at phone size.
 *
 * Most people buying Money Mastery Code will open this page on a phone,
 * so the previews are rendered as phones rather than wide desktop
 * frames. Seeing the product at the size they would actually hold it
 * is the point.
 *
 * Authored once at 390x844, the app's real logical viewport, then scaled
 * by .phone-canvas. Every screen uses the app's own bottom nav, and
 * every figure is sample data.
 */

import type { ReactNode } from "react";
import {
  ArrowDownLeft,
  ArrowUpRight,
  BatteryFull,
  Calculator,
  ChartLine,
  DollarSign,
  Gauge,
  LayoutDashboard,
  PiggyBank,
  Search,
  Signal,
  Sparkles,
  Target,
  Wallet,
  Wifi,
  X,
  type LucideIcon,
} from "lucide-react";

import { LogoIcon } from "@/components/brand/LogoIcon";

/* The product keeps its own violet identity. These are the real screens. */
const screen = "bg-[#08080F] text-[#F1F0F5]";
const panel = "rounded-2xl border border-white/[0.08] bg-white/[0.035]";
const ACCENT = "#695AFF";
const ACCENT_LIGHT = "#A78BFA";

const NAV: { name: string; icon: LucideIcon | null }[] = [
  { name: "Briefing", icon: LayoutDashboard },
  { name: "Accounts", icon: DollarSign },
  { name: "FOS AI", icon: null },
  { name: "Goals", icon: Target },
  { name: "Tools", icon: Calculator },
];

function StatusBar() {
  return (
    <div className="flex h-11 items-center justify-between px-7 pt-1">
      <span className="text-[13px] font-semibold tabular-nums text-white/90">9:41</span>
      <div className="flex items-center gap-1.5">
        <Signal size={13} className="text-white/80" />
        <Wifi size={13} className="text-white/80" />
        <BatteryFull size={15} className="text-white/80" />
      </div>
    </div>
  );
}

function BottomNav({ active }: { active: string }) {
  return (
    <div className="shrink-0 border-t border-white/[0.07] bg-[#08080F]/95 px-2 pb-5 pt-2">
      <div className="flex items-stretch">
        {NAV.map((item) => {
          const isActive = item.name === active;
          const Icon = item.icon;

          return (
            <div
              key={item.name}
              className="flex flex-1 flex-col items-center justify-center gap-1"
              style={{ color: isActive ? ACCENT_LIGHT : "rgba(255,255,255,0.34)" }}
            >
              {Icon ? (
                <Icon size={21} />
              ) : (
                <span
                  className="grid h-6 w-6 place-items-center rounded-[7px]"
                  style={{
                    background: isActive ? ACCENT : "transparent",
                    border: isActive ? "none" : "1px solid rgba(255,255,255,0.14)",
                  }}
                >
                  <LogoIcon size={14} style={{ color: isActive ? "#FFFFFF" : undefined }} />
                </span>
              )}
              <span className="text-[9px] font-semibold">{item.name}</span>
            </div>
          );
        })}
      </div>
      <div className="mx-auto mt-2 h-1 w-28 rounded-full bg-white/25" />
    </div>
  );
}

function Device({
  children,
  nav,
  sheet,
}: {
  children: ReactNode;
  nav?: string;
  sheet?: ReactNode;
}) {
  return (
    <div className="phone-stage">
      <div className="phone-canvas">
        <div
          className="relative h-full w-full rounded-[54px] p-[11px]"
          style={{
            background: "linear-gradient(160deg, #3A3A3E 0%, #161618 42%, #2C2C30 100%)",
            boxShadow:
              "0 2px 3px rgba(255,255,255,0.14) inset, 0 40px 80px -20px rgba(0,0,0,0.65), 0 0 0 1px rgba(0,0,0,0.5)",
          }}
        >
          {/* Screen */}
          <div
            className={`relative flex h-full w-full flex-col overflow-hidden rounded-[44px] ${screen}`}
          >
            <StatusBar />

            <div className="relative min-h-0 flex-1 overflow-hidden">
              {children}
              {sheet}
            </div>

            {nav ? <BottomNav active={nav} /> : null}

            {/* Dynamic island */}
            <span className="pointer-events-none absolute left-1/2 top-2.5 h-[30px] w-[104px] -translate-x-1/2 rounded-full bg-black ring-1 ring-white/[0.07]" />
          </div>

          {/* Side buttons */}
          <span className="absolute right-[-2px] top-[188px] h-14 w-[3px] rounded-r-sm bg-white/25" />
          <span className="absolute left-[-2px] top-[150px] h-9 w-[3px] rounded-l-sm bg-white/25" />
          <span className="absolute left-[-2px] top-[200px] h-14 w-[3px] rounded-l-sm bg-white/25" />
        </div>
      </div>
    </div>
  );
}

/* ── Shared briefing content, reused behind the stock sheet ── */

function BriefingBody() {
  return (
    <div className="space-y-3 p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[12px] text-white/40">Good afternoon</p>
          <p className="mt-0.5 text-[15px] font-semibold">Chidi</p>
        </div>
        <span className="rounded-full border border-emerald-300/20 bg-emerald-300/[0.08] px-2 py-1 text-[10px] font-medium text-emerald-200">
          Moderate risk
        </span>
      </div>

      <div className="grid grid-cols-[auto_1fr] gap-3">
        <div className={`${panel} flex flex-col items-center px-4 py-4`}>
          <div className="relative h-[70px] w-[70px]">
            <svg viewBox="0 0 100 100" className="h-full w-full -rotate-90">
              <circle cx="50" cy="50" r="42" fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth="11" />
              <circle
                cx="50"
                cy="50"
                r="42"
                fill="none"
                stroke={ACCENT}
                strokeWidth="11"
                strokeLinecap="round"
                strokeDasharray={`${0.64 * 264} 264`}
              />
            </svg>
            <div className="absolute inset-0 grid place-items-center">
              <span className="text-[18px] font-semibold">62</span>
            </div>
          </div>
          <p className="mt-2.5 text-[10px] text-white/35">Health score</p>
        </div>

        <div className="grid grid-cols-2 gap-2">
          {[
            { label: "Income", value: "₦420k", icon: ArrowDownLeft, tone: "text-emerald-300" },
            { label: "Expenses", value: "₦310k", icon: ArrowUpRight, tone: "text-rose-300" },
            { label: "Savings rate", value: "26%", icon: PiggyBank, tone: "" },
            { label: "Net worth", value: "₦1.24m", icon: Wallet, tone: "text-emerald-300" },
          ].map((metric) => {
            const Icon = metric.icon;
            return (
              <div key={metric.label} className={`${panel} px-2.5 py-2.5`}>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-white/35">{metric.label}</span>
                  <Icon size={11} className={metric.tone} style={metric.tone ? undefined : { color: ACCENT_LIGHT }} />
                </div>
                <p className="mt-1 text-[14px] font-semibold">{metric.value}</p>
              </div>
            );
          })}
        </div>
      </div>

      <div className={`${panel} p-3.5`}>
        <div className="flex items-center justify-between">
          <p className="text-[11px] text-white/40">Net worth</p>
          <p className="text-[10px] text-emerald-300">+₦180k this year</p>
        </div>
        <svg viewBox="0 0 300 60" className="mt-2.5 h-14 w-full" preserveAspectRatio="none">
          <defs>
            <linearGradient id="nw" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={ACCENT} stopOpacity="0.4" />
              <stop offset="100%" stopColor={ACCENT} stopOpacity="0" />
            </linearGradient>
          </defs>
          <path
            d="M0 50 L30 46 L60 48 L90 38 L120 40 L150 30 L180 33 L210 22 L240 24 L270 13 L300 8 L300 60 L0 60 Z"
            fill="url(#nw)"
          />
          <path
            d="M0 50 L30 46 L60 48 L90 38 L120 40 L150 30 L180 33 L210 22 L240 24 L270 13 L300 8"
            fill="none"
            stroke="#8B7BFF"
            strokeWidth="1.6"
          />
        </svg>
        <div className="flex justify-between text-[9px] text-white/25">
          <span>Jan</span>
          <span>Apr</span>
          <span>Jul</span>
          <span>Oct</span>
        </div>
      </div>

      <div className={`${panel} p-3.5`}>
        <p className="text-[11px] text-white/40">Risk overview</p>
        <div className="mt-2.5 grid grid-cols-3 gap-2">
          {[
            { label: "Debt", value: "Low", tone: "text-emerald-300" },
            { label: "Liquidity", value: "Watch", tone: "text-amber-300" },
            { label: "Portfolio", value: "Moderate", tone: "" },
          ].map((card) => (
            <div key={card.label}>
              <p className="text-[10px] text-white/30">{card.label}</p>
              <p
                className={`mt-1 text-[12px] font-medium ${card.tone}`}
                style={card.tone ? undefined : { color: ACCENT_LIGHT }}
              >
                {card.value}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function Sheet({ children }: { children: ReactNode }) {
  return (
    <div className="absolute inset-0 z-10 flex flex-col">
      <div className="min-h-0 flex-1 bg-black/55" />
      <div
        className="rounded-t-[28px] border-t border-white/10 px-5 pb-8 pt-2.5"
        style={{
          background: "linear-gradient(180deg, #15151B 0%, #0C0C12 100%)",
          boxShadow: "0 -24px 60px rgba(0,0,0,0.6)",
        }}
      >
        <span className="mx-auto block h-1 w-9 rounded-full bg-white/20" />
        {children}
      </div>
    </div>
  );
}

function SheetHeader({ title }: { title: string }) {
  return (
    <div className="mt-4 flex items-center justify-between">
      <p className="text-[14px] font-semibold">{title}</p>
      <X size={15} className="text-white/30" />
    </div>
  );
}

/* ── 1. Briefing ───────────────────────────────────────────── */

export function BriefingPhone() {
  return (
    <Device nav="Briefing">
      <BriefingBody />
    </Device>
  );
}

/* ── 2. Money manager, record sheet open ───────────────────── */

export function RecordSheetPhone() {
  return (
    <Device>
      <div className="p-4">
        <div className="flex items-center justify-between">
          <p className="text-[15px] font-semibold">Money Manager</p>
          <p className="text-[11px] text-white/35">October</p>
        </div>

        <div className="mt-3 grid grid-cols-3 gap-2">
          {[
            { label: "Income", value: "₦420,000", tone: "text-emerald-300" },
            { label: "Expense", value: "₦310,400", tone: "text-rose-300" },
            { label: "Saved", value: "₦109,600", tone: `text-[${ACCENT_LIGHT}]` },
          ].map((item) => (
            <div key={item.label} className={`${panel} px-2.5 py-2.5`}>
              <p className="text-[10px] text-white/35">{item.label}</p>
              <p className={`mt-1 text-[13px] font-semibold ${item.tone}`}>{item.value}</p>
            </div>
          ))}
        </div>

        <div className={`${panel} mt-3 p-3.5`}>
          <div className="flex items-center justify-between">
            <p className="text-[11px] text-white/40">Budget used</p>
            <p className="text-[11px] text-white/50">₦310k of ₦450k</p>
          </div>
          <div className="mt-2.5 h-1.5 overflow-hidden rounded-full bg-white/10">
            <div className="h-full w-[69%] rounded-full" style={{ background: ACCENT }} />
          </div>
          <div className="mt-3.5 space-y-2.5">
            {[
              { name: "Food", pct: 82, tone: "bg-amber-300" },
              { name: "Transport", pct: 54, tone: "" },
              { name: "Data and airtime", pct: 31, tone: "bg-emerald-300" },
            ].map((row) => (
              <div key={row.name} className="flex items-center gap-2.5">
                <span className="w-[104px] shrink-0 text-[10px] text-white/45">{row.name}</span>
                <div className="h-1 flex-1 overflow-hidden rounded-full bg-white/10">
                  <div
                    className={`h-full rounded-full ${row.tone}`}
                    style={row.tone ? { width: `${row.pct}%` } : { width: `${row.pct}%`, background: ACCENT }}
                  />
                </div>
                <span className="w-7 shrink-0 text-right text-[10px] tabular-nums text-white/30">
                  {row.pct}%
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className={`${panel} mt-3 px-3.5 py-2.5`}>
          <div className="flex items-center justify-between text-[10px]">
            <span className="text-white/40">Last recorded</span>
            <span className="text-emerald-300">Groceries, ₦12,400</span>
          </div>
        </div>
      </div>

      <Sheet>
        <SheetHeader title="Record a transaction" />

        <div className="mt-4 grid grid-cols-3 gap-1.5">
          {["Income", "Expense", "Transfer"].map((tab) => (
            <div
              key={tab}
              className={`rounded-xl py-2 text-center text-[11px] ${
                tab === "Expense" ? "text-white" : "border border-white/10 text-white/45"
              }`}
              style={tab === "Expense" ? { background: ACCENT } : undefined}
            >
              {tab}
            </div>
          ))}
        </div>

        <div className="mt-3 grid grid-cols-2 gap-2.5">
          {[
            { label: "Amount", value: "₦ 4,500.00" },
            { label: "Category", value: "Food" },
            { label: "Account", value: "Current" },
            { label: "Date", value: "14 Oct" },
          ].map((field) => (
            <div
              key={field.label}
              className="rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2.5"
            >
              <p className="text-[9px] text-white/30">{field.label}</p>
              <p className="mt-1 text-[12px]">{field.value}</p>
            </div>
          ))}
        </div>

        <div
          className="mt-4 rounded-xl py-3 text-center text-[12px] font-semibold text-white"
          style={{ background: ACCENT }}
        >
          Save transaction
        </div>

        <p className="mt-3 text-center text-[10px] text-white/25">
          Rule 102 check, logged today
        </p>
      </Sheet>
    </Device>
  );
}

/* ── 3. Stock analyzer, sheet open over the briefing ───────── */

export function StockAnalyzerPhone() {
  return (
    <Device>
      <BriefingBody />

      <Sheet>
        <div className="mt-4 flex items-center gap-2.5 rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2.5">
          <Search size={14} className="text-white/30" />
          <span className="text-[12.5px] text-white/85">AAPL</span>
          <span className="ml-auto text-[9.5px] text-white/25">Apple Inc. · NASDAQ</span>
        </div>

        <div className="mt-3.5 flex items-end justify-between">
          <div>
            <p className="text-[26px] font-semibold tracking-tight">$228.41</p>
            <p className="mt-0.5 text-[11px] text-emerald-300">+1.84% today</p>
          </div>
          <div className="pb-1 text-right">
            <p className="text-[9.5px] text-white/30">Market cap</p>
            <p className="text-[13px] font-semibold">$3.42T</p>
          </div>
        </div>

        <div className="mt-3 grid grid-cols-3 gap-2">
          {[
            { label: "P/E ratio", value: "34.2" },
            { label: "52w high", value: "$237.49" },
            { label: "52w low", value: "$164.08" },
          ].map((item) => (
            <div key={item.label} className={`${panel} px-2.5 py-2.5`}>
              <p className="text-[9.5px] text-white/35">{item.label}</p>
              <p className="mt-1 text-[13px] font-semibold tabular-nums">{item.value}</p>
            </div>
          ))}
        </div>

        <div className={`${panel} mt-2.5 p-3.5`}>
          <div className="flex items-center justify-between">
            <p className="text-[11px] text-white/40">Composite risk</p>
            <span className="rounded-full border border-amber-300/25 bg-amber-300/[0.08] px-2 py-0.5 text-[9.5px] text-amber-200">
              Moderate
            </span>
          </div>
          <div className="mt-2.5 h-1.5 overflow-hidden rounded-full bg-white/10">
            <div className="h-full w-[46%] rounded-full bg-gradient-to-r from-emerald-300 to-amber-300" />
          </div>
        </div>

        <div
          className="mt-2.5 rounded-2xl border p-3.5"
          style={{ borderColor: `${ACCENT}59`, background: `${ACCENT}12` }}
        >
          <div className="flex items-center gap-2">
            <Sparkles size={13} style={{ color: ACCENT_LIGHT }} />
            <p className="text-[11px] font-semibold">FOS·AI Coach</p>
          </div>
          <p className="mt-2 text-[11px] leading-[1.65] text-white/60">
            At 34 times earnings the market is already paying for growth, so your upside
            depends on that growth arriving rather than on the price being cheap.
          </p>
          <p className="mt-2 text-[9.5px] text-white/30">
            Education, not advice. Read with your own research.
          </p>
        </div>
      </Sheet>
    </Device>
  );
}

/* ── 4. Tools ──────────────────────────────────────────────── */

export function ToolsPhone() {
  const tools = [
    { icon: ChartLine, name: "Compound interest" },
    { icon: Gauge, name: "Emergency fund" },
    { icon: Calculator, name: "ROI" },
    { icon: Wallet, name: "PAYE and net income" },
    { icon: PiggyBank, name: "Goal planning" },
    { icon: LayoutDashboard, name: "Dollar cost averaging" },
    { icon: Sparkles, name: "Inflation" },
    { icon: Wallet, name: "Retirement" },
    { icon: ChartLine, name: "Currency" },
  ];

  return (
    <Device nav="Tools">
      <div className="p-4">
        <p className="text-[15px] font-semibold">Tools</p>
        <p className="mt-1 text-[11px] text-white/50">
          Nine calculators for the numbers the course teaches.
        </p>

        <div className="mt-4 grid grid-cols-3 gap-2">
          {tools.map((tool) => {
            const Icon = tool.icon;
            return (
              <div
                key={tool.name}
                className="rounded-xl border border-white/[0.08] bg-white/[0.035] p-2.5"
              >
                <span
                  className="grid h-7 w-7 place-items-center rounded-lg"
                  style={{ background: `${ACCENT}26`, color: ACCENT_LIGHT }}
                >
                  <Icon size={14} />
                </span>
                <p className="mt-2 text-[10px] leading-tight text-white/65">{tool.name}</p>
              </div>
            );
          })}
        </div>

        <div className={`${panel} mt-3.5 p-3.5`}>
          <p className="text-[11px] text-white/40">Compound interest</p>
          <div className="mt-2.5 flex items-end gap-3">
            <div>
              <p className="text-[10px] text-white/30">Invested</p>
              <p className="mt-1 text-[14px] font-semibold">₦500,000</p>
            </div>
            <ArrowUpRight size={13} className="mb-1.5 rotate-90 text-white/25" />
            <div>
              <p className="text-[10px] text-white/30">After 10 years at 15%</p>
              <p className="mt-1 text-[14px] font-semibold text-emerald-300">₦2.07m</p>
            </div>
          </div>
        </div>

        <div className={`${panel} mt-2.5 p-3.5`}>
          <p className="text-[11px] text-white/40">Emergency fund</p>
          <p className="mt-2 text-[12px] text-white/60">
            Six months of expenses at your current spending.
          </p>
          <p className="mt-2 text-[15px] font-semibold">₦155,200</p>
        </div>
      </div>
    </Device>
  );
}
