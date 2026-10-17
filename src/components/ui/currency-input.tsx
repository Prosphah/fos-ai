"use client";

import { useCallback, useMemo, useState } from "react";

interface CurrencyInputProps {
  value?: number;
  onChange?: (value: number) => void;
  onBlur?: () => void;
  name?: string;
  className?: string;
  placeholder?: string;
  disabled?: boolean;
  style?: React.CSSProperties;
  /** Lets the field point a <label for> at this input. */
  id?: string;
  "aria-describedby"?: string;
  "aria-invalid"?: boolean | "true" | "false";
  "aria-label"?: string;
  autoFocus?: boolean;
  /**
   * Composed with this input's own focus handling rather than replacing it, so a
   * caller can track focus for styling without losing select-on-focus or the
   * draft reset.
   */
  onFocus?: () => void;
  /**
   * Keeps one decimal point and still groups the digits before it, for amounts
   * that can carry pence, cents or kobo. Without this, integer mode turns a typed
   * 12.50 into 1250, so this must be on wherever the amount may have a fraction.
   */
  allowDecimals?: boolean;
  maxDecimals?: number;
}

/** Groups the digits of an integer string, leaving a blank one blank. */
function group(digits: string): string {
  const bare = digits.replace(/\D/g, "");
  return bare === "" ? "" : Number(bare).toLocaleString();
}

export function CurrencyInput({
  value,
  onChange,
  onBlur,
  name,
  className,
  placeholder,
  disabled,
  style,
  id,
  "aria-describedby": ariaDescribedBy,
  "aria-invalid": ariaInvalid,
  "aria-label": ariaLabel,
  autoFocus,
  onFocus,
  allowDecimals = false,
  maxDecimals = 2,
}: CurrencyInputProps) {
  // Held while typing so a trailing "." survives a keystroke. null means "derive
  // the text from the value", which is what the field shows when not being typed
  // into, so an externally changed value still wins.
  const [draft, setDraft] = useState<string | null>(null);

  const displayValue = useMemo(() => {
    if (draft !== null) {
      if (draft === "") return "";
      if (!allowDecimals) return group(draft);
      const dot = draft.indexOf(".");
      if (dot === -1) return group(draft);
      // Keep the "." and whatever follows it exactly as typed.
      return group(draft.slice(0, dot)) + draft.slice(dot);
    }

    if (value == null) return "";
    if (!allowDecimals) return Number(value).toLocaleString();
    const [whole, fraction] = String(value).split(".");
    const head = group(whole);
    return fraction === undefined ? head : `${head}.${fraction}`;
  }, [draft, value, allowDecimals]);

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const raw = e.target.value.replace(/,/g, "");

      let clean: string;
      if (allowDecimals) {
        const stripped = raw.replace(/[^\d.]/g, "");
        const dot = stripped.indexOf(".");
        if (dot === -1) {
          clean = stripped;
        } else {
          // Only the first dot survives; any later ones are dropped from the
          // fraction so a second dot can never be typed.
          const fraction = stripped
            .slice(dot + 1)
            .replace(/\./g, "")
            .slice(0, maxDecimals);
          clean = `${stripped.slice(0, dot)}.${fraction}`;
        }
      } else {
        clean = raw.replace(/[^0-9]/g, "");
      }

      setDraft(clean);
      const parsed = Number(clean);
      onChange?.(clean === "" || Number.isNaN(parsed) ? 0 : parsed);
    },
    [onChange, allowDecimals, maxDecimals]
  );

  const handleBlur = useCallback(() => {
    setDraft(null);
    onBlur?.();
  }, [onBlur]);

  const handleFocus = useCallback(
    (e: React.FocusEvent<HTMLInputElement>) => {
      e.target.select();
      onFocus?.();
    },
    [onFocus]
  );

  return (
    <input
      id={id}
      name={name}
      type="text"
      inputMode={allowDecimals ? "decimal" : "numeric"}
      value={displayValue}
      onChange={handleChange}
      onFocus={handleFocus}
      onBlur={handleBlur}
      placeholder={placeholder}
      disabled={disabled}
      autoFocus={autoFocus}
      aria-label={ariaLabel}
      aria-describedby={ariaDescribedBy}
      aria-invalid={ariaInvalid}
      className={className}
      style={style}
    />
  );
}