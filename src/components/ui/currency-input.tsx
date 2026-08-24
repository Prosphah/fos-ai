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
      name={name}
      type="text"
      inputMode="numeric"
      value={displayValue}
      onChange={handleChange}
      onFocus={handleFocus}
      onBlur={onBlur}
      placeholder={placeholder}
      disabled={disabled}
      className={className}
      style={style}
    />
  );
}
