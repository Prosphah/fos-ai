"use client";

import { useCallback } from "react";

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
}: CurrencyInputProps) {
  const displayValue = value != null ? Number(value).toLocaleString() : "";

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const raw = e.target.value.replace(/,/g, "").replace(/[^0-9]/g, "");
      onChange?.(raw ? Number(raw) : 0);
    },
    [onChange]
  );

  const handleFocus = useCallback((e: React.FocusEvent<HTMLInputElement>) => {
    e.target.select();
  }, []);

  return (
    <input
      id={id}
      name={name}
      type="text"
      inputMode="numeric"
      value={displayValue}
      onChange={handleChange}
      onFocus={handleFocus}
      onBlur={onBlur}
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
