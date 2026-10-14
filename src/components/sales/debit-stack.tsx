/**
 * The hero alerts.
 *
 * A stack of debit and credit alerts, the kind everyone in the target
 * audience already sees in their lock screen. That recognition is the
 * whole job: it puts the reader inside their own month without a single
 * word of explanation.
 *
 * No heading, no caption, no commentary. The alerts are the illustration.
 *
 * Ordinary monthly spend. Housing is left out on purpose because rent is
 * an annual worry, not a monthly one, and including it made the picture
 * wrong rather than sad. What is left is the part that quietly eats a
 * salary, and the amount that survives it.
 *
 * Server rendered on purpose: it sits above the fold, so it must not wait
 * on hydration. The entrance reuses the existing CSS-only .reveal
 * animation, which already collapses under prefers-reduced-motion.
 */

import {
  ArrowDownLeft,
  ArrowUpRight,
  Banknote,
  Bus,
  GraduationCap,
  HeartPulse,
  Shirt,
  Signal,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

type Alert = {
  amount: number;
  label: string;
  time: string;
  icon: LucideIcon;
};

const income = 180_000;

const debits: Alert[] = [
  { amount: 52_000, label: "Fuel and transport", time: "2h ago", icon: Bus },
  { amount: 44_500, label: "Groceries and food", time: "6h ago", icon: Banknote },
  { amount: 38_000, label: "School fees", time: "Yesterday", icon: GraduationCap },
  { amount: 20_000, label: "Clothing and household", time: "Yesterday", icon: Shirt },
  { amount: 14_200, label: "Medical and pharmacy", time: "Mon", icon: HeartPulse },
  { amount: 10_000, label: "Data, airtime and subscriptions", time: "Mon", icon: Signal },
];

const spent = debits.reduce((sum, alert) => sum + alert.amount, 0);
const left = income - spent;

const naira = new Intl.NumberFormat("en-NG", {
  style: "currency",
  currency: "NGN",
  maximumFractionDigits: 0,
});

function Card({
  amount,
  label,
  time,
  icon: Icon,
  credit = false,
  delay,
  tilt,
}: Alert & { credit?: boolean; delay: number; tilt: number }) {
  return (
    <div
      className="reveal relative flex items-center gap-3 rounded-[20px] border px-3.5 py-3"
      style={{
        borderColor: credit ? "var(--sales-border-hover)" : "var(--sales-border)",
        background: "var(--sales-surface-hover)",
        backdropFilter: "blur(20px) saturate(1.4)",
        WebkitBackdropFilter: "blur(20px) saturate(1.4)",
        boxShadow:
          "inset 0 1px 0 rgba(255,255,255,0.06), 0 6px 18px -8px rgba(0,0,0,0.28)",
        animationDelay: `${delay}s`,
        rotate: `${tilt}deg`,
      }}
    >
      <span
        className="grid h-9 w-9 shrink-0 place-items-center rounded-[10px]"
        style={{
          background: credit ? "var(--sales-accent-soft)" : "var(--sales-surface)",
          color: credit ? "var(--sales-accent)" : "var(--sales-text-2)",
          boxShadow: "inset 0 1px 0 rgba(255,255,255,0.05)",
        }}
      >
        <Icon size={17} />
      </span>

      <div className="min-w-0 flex-1">
        <div className="flex items-baseline justify-between gap-2">
          <span
            className="text-[10.5px] font-medium uppercase tracking-[0.1em]"
            style={{ color: credit ? "var(--sales-accent)" : "var(--sales-text-3)" }}
          >
            {credit ? "Credit" : "Debit"}
          </span>
          <span className="shrink-0 text-[11px]" style={{ color: "var(--sales-text-3)" }}>
            {time}
          </span>
        </div>
        <p
          className="mt-0.5 font-mono text-[15px] font-semibold leading-tight tabular-nums"
          style={{ color: credit ? "var(--sales-accent)" : "var(--sales-text-1)" }}
        >
          {credit ? "+" : "−"}
          {naira.format(amount)}
        </p>
        <p className="truncate text-[12.5px] leading-5" style={{ color: "var(--sales-text-2)" }}>
          {label}
        </p>
      </div>
    </div>
  );
}

export function DebitStack() {
  return (
    <div className="flex w-full max-w-[400px] flex-col gap-2">
      <Card
        amount={income}
        label="Income"
        time="1st of the month"
        icon={ArrowDownLeft}
        credit
        delay={0.05}
        tilt={-0.5}
      />

      {debits.map((alert, index) => (
        <Card
          key={alert.label}
          {...alert}
          delay={0.12 + index * 0.07}
          tilt={index % 2 === 0 ? 0.45 : -0.35}
        />
      ))}

      <div className="reveal mt-1 flex items-center gap-3 px-1" style={{ animationDelay: "0.55s" }}>
        <span
          className="grid h-9 w-9 shrink-0 place-items-center rounded-[10px]"
          style={{
            background: "var(--sales-accent-soft)",
            color: "var(--sales-accent)",
            boxShadow: "inset 0 1px 0 rgba(255,255,255,0.05)",
          }}
        >
          <ArrowUpRight size={17} />
        </span>
        <div className="min-w-0 flex-1">
          <span
            className="text-[10.5px] font-medium uppercase tracking-[0.1em]"
            style={{ color: "var(--sales-text-3)" }}
          >
            Left
          </span>
          <p
            className="font-mono text-[17px] font-semibold leading-tight tabular-nums"
            style={{ color: "var(--sales-text-1)" }}
          >
            {naira.format(left)}
          </p>
        </div>
      </div>
    </div>
  );
}