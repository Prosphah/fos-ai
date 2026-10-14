"use client";

import { useCallback, useMemo, useState } from "react";
import { Delete, X } from "lucide-react";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { evaluate, formatCalcValue } from "@/lib/calculator";

interface Props {
  /** Current amount from the form, used to prefill on mount. */
  initialValue?: number;
  /** Called when the user confirms. Receives the calculated amount. */
  onDone: (value: number) => void;
  onClose: () => void;
}

type KeyKind = "digit" | "op" | "zeros" | "action" | "done";
/** Visual weight. "=" shares the operator tone so it does not read as a
 *  different kind of action from + - x / ; Done is the only filled control. */
type Tone = "digit" | "operator" | "utility";

interface Key {
  kind: KeyKind;
  label: string;
  tone: Tone;
  value?: string;
  action?: "clear" | "backspace" | "equals";
  zeros?: string;
  /** 1-based grid placement. */
  col: number;
  row: number;
  colSpan?: number;
  rowSpan?: number;
  ariaLabel?: string;
}

// 22 keys filling a balanced 4 x 6 grid (24 cells) with no gaps:
// "+" is the tall operator spanning two rows, "Done" fills the two cells that
// "000" used to occupy. Digit and operator positions match the phone
// calculators people already have muscle memory for.
const KEYS: Key[] = [
  { kind: "action", label: "AC", action: "clear", tone: "utility", col: 1, row: 1 },
  { kind: "op", label: "%", value: "%", tone: "operator", col: 2, row: 1 },
  { kind: "op", label: "÷", value: "/", tone: "operator", col: 3, row: 1 },
  { kind: "action", label: "⌫", action: "backspace", tone: "utility", col: 4, row: 1, ariaLabel: "Delete" },

  { kind: "digit", label: "7", tone: "digit", col: 1, row: 2 },
  { kind: "digit", label: "8", tone: "digit", col: 2, row: 2 },
  { kind: "digit", label: "9", tone: "digit", col: 3, row: 2 },
  { kind: "op", label: "×", value: "x", tone: "operator", col: 4, row: 2 },

  { kind: "digit", label: "4", tone: "digit", col: 1, row: 3 },
  { kind: "digit", label: "5", tone: "digit", col: 2, row: 3 },
  { kind: "digit", label: "6", tone: "digit", col: 3, row: 3 },
  { kind: "op", label: "−", value: "-", tone: "operator", col: 4, row: 3 },

  { kind: "digit", label: "1", tone: "digit", col: 1, row: 4 },
  { kind: "digit", label: "2", tone: "digit", col: 2, row: 4 },
  { kind: "digit", label: "3", tone: "digit", col: 3, row: 4 },
  // Tall operator: "+" doubles in size rather than spending a key slot on
  // parentheses. Error prevention - bigger targets, fewer mis-taps.
  { kind: "op", label: "+", value: "+", tone: "operator", col: 4, row: 4, rowSpan: 2 },

  { kind: "digit", label: "0", tone: "digit", col: 1, row: 5 },
  { kind: "zeros", label: "00", zeros: "00", tone: "utility", col: 2, row: 5 },
  { kind: "zeros", label: "000", zeros: "000", tone: "utility", col: 3, row: 5 },

  { kind: "digit", label: ".", tone: "digit", col: 1, row: 6 },
  { kind: "done", label: "Done", tone: "operator", col: 2, row: 6, colSpan: 2 },
  { kind: "action", label: "=", action: "equals", tone: "operator", col: 4, row: 6 },
];

const MAX_DIGITS = 12;

const TONE_COLOR: Record<Tone, string> = {
  digit: "var(--text-1)",
  operator: "var(--accent)",
  utility: "var(--text-2)",
};

/** Prefill expression from the current amount, e.g. 1500 -> "1500". */
function seedExpression(initialValue?: number): string {
  if (initialValue == null || !Number.isFinite(initialValue) || initialValue <= 0) return "";
  return formatCalcValue(initialValue).replace(/,/g, "");
}

export function CalculatorSheet({ initialValue, onDone, onClose }: Props) {
  // Mounted only while open, so the amount field value is read once here
  // instead of synced through an effect.
  const [expression, setExpression] = useState(() => seedExpression(initialValue));
  const [error, setError] = useState("");

  const preview = useMemo(() => {
    if (expression.trim() === "") return null;
    const result = evaluate(expression);
    return result.ok ? result.value : null;
  }, [expression]);

  const handleKey = useCallback((key: Key) => {
    if (key.kind === "done") {
      const result = evaluate(expression);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      // Amounts must be positive. The schema enforces this, so clamp here
      // rather than letting the calculator inject a value the form rejects.
      onDone(result.value > 0 ? result.value : 0);
      onClose();
      return;
    }

    setError("");
    setExpression((current) => {
      if (key.kind === "action") {
        if (key.action === "clear") return "";
        if (key.action === "backspace") return current.slice(0, -1);

        // "=" resolves now and lets the user keep working from the answer.
        const result = evaluate(current);
        if (!result.ok) {
          setError(result.error);
          return current;
        }
        return formatCalcValue(result.value).replace(/,/g, "");
      }

      if (key.kind === "zeros") {
        // Bulk zero entry: typing "15" then "000" gives 15000 in one tap
        // instead of three. Skip after a decimal point, where trailing zeros
        // are already meaningless, and respect the digit ceiling.
        const lastNumber = current.split(/[+\-*/%x]/).pop() ?? "";
        if (lastNumber.includes(".")) return current;
        const digits = lastNumber.replace(/[^0-9]/g, "").length;
        if (digits + key.zeros!.length > MAX_DIGITS) return current;
        return current + key.zeros;
      }

      if (key.kind === "digit") {
        // Keep malformed input out of the parser: no second decimal point.
        const lastNumber = current.split(/[+\-*/%x]/).pop() ?? "";
        if (key.label === "." && lastNumber.includes(".")) return current;
        if (lastNumber.replace(/[^0-9]/g, "").length >= MAX_DIGITS) return current;
      }

      // Collapse a trailing operator so "2500++500" cannot happen.
      if (key.kind === "op" && /[+\-*/%]$/.test(current)) {
        return current.slice(0, -1) + key.value;
      }

      return current + (key.kind === "digit" ? key.label : key.value);
    });
  }, [expression, onDone, onClose]);

  const handleSheetChange = useCallback(
    (next: boolean) => {
      if (!next) onClose();
    },
    [onClose]
  );

  const canFinish = preview != null;

  return (
    <Sheet open onOpenChange={handleSheetChange}>
      <SheetContent
        side="bottom"
        showCloseButton={false}
        className="rounded-t-2xl border-t"
        style={{
          borderColor: "var(--glass-border)",
          background: "var(--glass-bg)",
          backdropFilter: "blur(24px) saturate(1.5)",
          WebkitBackdropFilter: "blur(24px) saturate(1.5)",
          // Flat surface: the sheet's default bottom glow competes with the
          // keypad for attention.
          boxShadow: "none",
          gap: "0",
        }}
      >
        <SheetHeader className="flex-row items-center justify-between px-5 pt-3 pb-0">
          <SheetTitle style={{ fontSize: "0.9375rem", fontWeight: 600, color: "var(--text-1)" }}>
            Calculator
          </SheetTitle>
          <button
            onClick={onClose}
            aria-label="Close calculator"
            className="-mr-1 shrink-0 text-text-secondary hover:text-text-primary"
          >
            <X size={18} />
          </button>
          {/* Kept for screen readers, hidden visually to save vertical space. */}
          <SheetDescription className="sr-only">
            Basic operations and percentages. Enter a calculation, then press Done to use the total as the amount.
          </SheetDescription>
        </SheetHeader>

        {/* Display */}
        <div className="px-5 pt-2">
          <div
            aria-live="polite"
            style={{
              borderRadius: "var(--radius-sm)",
              border: "1px solid var(--glass-border)",
              background: "var(--bg-card)",
              padding: "8px 12px",
              display: "flex",
              flexDirection: "column",
              gap: "2px",
              textAlign: "right",
            }}
          >
            <div
              style={{
                fontFamily: "var(--font-mono-family)",
                fontSize: "0.75rem",
                color: error ? "var(--rose)" : "var(--text-3)",
                wordBreak: "break-all",
                minHeight: "1.125rem",
              }}
            >
              {error || expression || "0"}
            </div>
            <div
              style={{
                fontSize: "1.5rem",
                fontWeight: 700,
                lineHeight: 1.15,
                color: "var(--text-1)",
                fontVariantNumeric: "tabular-nums",
              }}
            >
              {canFinish ? formatCalcValue(preview) : "—"}
            </div>
          </div>
        </div>

        {/* Keypad: six equal rows sharing whatever height is left, so every key
            is the same size and the sheet never overflows. minHeight 0 lets the
            grid compress instead of forcing a scrollbar. */}
        <div
          className="min-h-0 flex-1 overflow-y-auto px-5 pt-2 pb-4"
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
            gridTemplateRows: "repeat(6, minmax(44px, 1fr))",
            gap: "6px",
          }}
        >
          {KEYS.map((key) => {
            const isDone = key.kind === "done";
            const isTall = (key.rowSpan ?? 1) > 1;

            return (
              <button
                key={key.label}
                onClick={() => handleKey(key)}
                disabled={isDone && !canFinish}
                aria-label={key.ariaLabel ?? key.label}
                style={{
                  gridColumn: `${key.col} / span ${key.colSpan ?? 1}`,
                  gridRow: `${key.row} / span ${key.rowSpan ?? 1}`,
                  minWidth: 0,
                  minHeight: 0,
                  borderRadius: "var(--radius-sm)",
                  border: `1px solid ${isDone ? "var(--accent)" : "var(--glass-border)"}`,
                  background: isDone ? "var(--accent)" : "var(--glass-bg)",
                  color: isDone ? "#fff" : TONE_COLOR[key.tone],
                  fontSize: key.kind === "zeros" ? "0.875rem" : isDone ? "1.0625rem" : key.tone === "utility" ? "0.9375rem" : "1.25rem",
                  fontWeight: isDone ? 600 : key.tone === "utility" ? 500 : 600,
                  boxShadow: "none",
                  opacity: isDone && !canFinish ? 0.45 : 1,
                  transition: "transform 0.08s var(--ease)",
                  WebkitTapHighlightColor: "transparent",
                }}
                className={`flex items-center justify-center active:scale-[0.97] ${
                  isTall ? "text-[1.75rem]" : ""
                }`}
              >
                {key.kind === "action" && key.action === "backspace" ? (
                  <Delete size={17} />
                ) : (
                  key.label
                )}
              </button>
            );
          })}
        </div>
      </SheetContent>
    </Sheet>
  );
}