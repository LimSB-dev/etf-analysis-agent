"use client";

import { useState, useEffect, useCallback } from "react";

export type ThresholdVariantType = "buy" | "sell";

export interface ThresholdPercentInputProps {
  value: number;
  onChange: (value: number) => void;
  min: number;
  max: number;
  variant: ThresholdVariantType;
  fallbackWhenInvalid?: number;
  id?: string;
  "aria-invalid"?: boolean;
  "aria-describedby"?: string;
  className?: string;
  /** compact = 작은 인라인 스타일(전략 시뮬), default = 일반 폼 스타일(마이페이지) */
  size?: "compact" | "default";
  unitLabel?: string;
}

const ALLOWED_PATTERN = /^-?\d*\.?\d*$/;

function isValidInput(val: string): boolean {
  return (
    val === "" ||
    val === "-" ||
    val === "-." ||
    ALLOWED_PATTERN.test(val)
  );
}

export const ThresholdPercentInput = ({
  value,
  onChange,
  min,
  max,
  variant,
  fallbackWhenInvalid,
  id,
  "aria-invalid": ariaInvalid,
  "aria-describedby": ariaDescribedby,
  className = "",
  size = "default",
  unitLabel = "%",
}: ThresholdPercentInputProps) => {
  const [displayStr, setDisplayStr] = useState(() => value.toString());
  const [isFocused, setIsFocused] = useState(false);

  useEffect(() => {
    if (!isFocused) {
      setDisplayStr(value.toString());
    }
  }, [value, isFocused]);

  const commit = useCallback(() => {
    const num = Number.parseFloat(displayStr);
    const fallback =
      fallbackWhenInvalid ?? (variant === "buy" ? -1 : 1);
    const resolved = Number.isFinite(num) ? num : fallback;
    const clamped = Math.max(min, Math.min(max, resolved));
    onChange(clamped);
    setDisplayStr(clamped.toString());
  }, [displayStr, min, max, onChange, variant, fallbackWhenInvalid]);

  const handleBlur = useCallback(() => {
    setIsFocused(false);
    commit();
  }, [commit]);

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      let val = e.target.value;
      if (displayStr === "0" && val === "0-") {
        val = "-";
      }
      if (isValidInput(val)) {
        setDisplayStr(val);
      }
    },
    [displayStr],
  );

  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.currentTarget.blur();
    }
  }, []);

  const sizeClasses =
    size === "compact"
      ? "w-11 px-1.5 py-0.5 text-xs text-center font-mono font-semibold"
      : "w-20 px-2 py-1.5 text-sm";
  const variantClasses =
    variant === "buy"
      ? "text-green-700 dark:text-green-400 focus:ring-green-500 focus:border-green-500"
      : "text-red-700 dark:text-red-400 focus:ring-red-500 focus:border-red-500";

  return (
    <div className="flex items-center gap-2">
      <input
        type="text"
        inputMode="decimal"
        id={id}
        value={displayStr}
        onChange={handleChange}
        onFocus={() => {
          setIsFocused(true);
          setDisplayStr(value.toString());
        }}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        aria-invalid={ariaInvalid}
        aria-describedby={ariaDescribedby}
        className={`rounded border border-gray-300 bg-white dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100 focus:outline-none focus:ring-1 focus:border-transparent ${sizeClasses} ${variantClasses} ${className}`.trim()}
      />
      {unitLabel ? (
        <span className="shrink-0 text-sm text-gray-500 dark:text-gray-400" aria-hidden>
          {unitLabel}
        </span>
      ) : null}
    </div>
  );
};
