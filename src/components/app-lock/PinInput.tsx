"use client";

import { forwardRef, useState, useRef, useEffect, useCallback, useImperativeHandle, KeyboardEvent } from "react";

export interface PinInputHandle {
  clear: () => void;
}

interface Props {
  length?: number;
  onComplete: (pin: string) => void;
  error?: string;
  disabled?: boolean;
}

export const PinInput = forwardRef<PinInputHandle, Props>(function PinInput(
  { length = 4, onComplete, error, disabled },
  ref
) {
  const [digits, setDigits] = useState<string[]>(Array(length).fill(""));
  const [focusedIndex, setFocusedIndex] = useState<number | null>(null);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const firstInput = inputRefs.current[0];
    firstInput?.focus();
    const t = setTimeout(() => {
      firstInput?.focus();
    }, 200);
    return () => {
      clearTimeout(t);
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  const handleChange = (index: number, value: string) => {
    if (disabled) return;
    if (!/^\d*$/.test(value)) return;

    if (timerRef.current) clearTimeout(timerRef.current);

    const newDigits = [...digits];
    newDigits[index] = value.slice(-1);
    setDigits(newDigits);

    if (value && index < length - 1) {
      inputRefs.current[index + 1]?.focus();
    }

    const pin = newDigits.join("");
    if (pin.length === length && !newDigits.includes("")) {
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => {
        onComplete(pin);
      }, 300);
    }
  };

  const handleKeyDown = (index: number, e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !digits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, length);
    if (!pasted) return;

    const newDigits = [...digits];
    for (let i = 0; i < pasted.length && i < length; i++) {
      newDigits[i] = pasted[i];
    }
    setDigits(newDigits);

    const nextEmpty = newDigits.findIndex((d) => !d);
    const focusIndex = nextEmpty === -1 ? length - 1 : nextEmpty;
    inputRefs.current[focusIndex]?.focus();

    const pin = newDigits.join("");
    if (pin.length === length && !newDigits.includes("")) {
      if (timerRef.current) clearTimeout(timerRef.current);
      onComplete(pin);
    }
  };

  const clearPin = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setDigits(Array(length).fill(""));
    inputRefs.current[0]?.focus();
  }, [length]);

  useImperativeHandle(ref, () => ({ clear: clearPin }), [clearPin]);

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "16px" }}>
      <div style={{ display: "flex", gap: "12px" }}>
        {digits.map((digit, i) => (
          <input
            key={i}
            ref={(el) => { inputRefs.current[i] = el; }}
            type="password"
            inputMode="numeric"
            maxLength={1}
            value={digit}
            autoFocus={i === 0}
            onChange={(e) => handleChange(i, e.target.value)}
            onKeyDown={(e) => handleKeyDown(i, e)}
            onPaste={handlePaste}
            onFocus={() => setFocusedIndex(i)}
            onBlur={() => setFocusedIndex(null)}
            disabled={disabled}
            style={{
              width: "56px",
              height: "64px",
              textAlign: "center",
              fontSize: "1.5rem",
              fontWeight: 600,
              fontFamily: "var(--font-display-family)",
              borderRadius: "var(--radius-sm)",
              border: `1.5px solid ${error ? "var(--rose)" : focusedIndex === i || digit ? "var(--accent)" : "var(--glass-border)"}`,
              background: digit ? "var(--accent-soft)" : "var(--glass-bg)",
              color: "var(--text-1)",
              outline: "none",
              boxShadow: focusedIndex === i ? "0 0 0 3px var(--accent-soft)" : "none",
              transition: "all 0.2s var(--ease)",
              caretColor: "transparent",
            }}
          />
        ))}
      </div>
      {error && (
        <p style={{ fontSize: "0.8125rem", color: "var(--rose)", textAlign: "center" }}>
          {error}
        </p>
      )}
    </div>
  );
});
