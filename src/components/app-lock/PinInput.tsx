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
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    inputRefs.current[0]?.focus();
  }, []);

  const handleChange = (index: number, value: string) => {
    if (disabled) return;
    if (!/^\d*$/.test(value)) return;

    const newDigits = [...digits];
    newDigits[index] = value.slice(-1);
    setDigits(newDigits);

    if (value && index < length - 1) {
      inputRefs.current[index + 1]?.focus();
    }

    const pin = newDigits.join("");
    if (pin.length === length && !newDigits.includes("")) {
      onComplete(pin);
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
      onComplete(pin);
    }
  };

  const clearPin = useCallback(() => {
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
            onChange={(e) => handleChange(i, e.target.value)}
            onKeyDown={(e) => handleKeyDown(i, e)}
            onPaste={handlePaste}
            disabled={disabled}
            style={{
              width: "56px",
              height: "64px",
              textAlign: "center",
              fontSize: "1.5rem",
              fontWeight: 600,
              fontFamily: "var(--font-display-family)",
              borderRadius: "var(--radius-sm)",
              border: `1.5px solid ${error ? "var(--rose)" : digit ? "var(--accent)" : "var(--glass-border)"}`,
              background: digit ? "var(--accent-soft)" : "var(--glass-bg)",
              color: "var(--text-1)",
              outline: "none",
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
