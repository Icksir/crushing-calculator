"use client";

import * as React from "react";
import { NumericFormat, type NumericFormatProps } from "react-number-format";
import { cn } from "@/lib/utils";

type BaseProps = Omit<
  NumericFormatProps,
  "onValueChange" | "value" | "customInput" | "isAllowed" | "allowLeadingZeros" | "decimalScale" | "allowNegative"
>;

export interface NumericInputProps extends BaseProps {
  value: number | "" | null | undefined;
  onValueChange: (value: number | "") => void;
  min?: number;
  max?: number;
  allowNegative?: boolean;
  allowDecimals?: boolean;
  onEnter?: () => void;
  className?: string;
}

export const NumericInput = React.forwardRef<HTMLInputElement, NumericInputProps>(
  function NumericInput(
    {
      value,
      onValueChange,
      min,
      max,
      allowNegative = false,
      allowDecimals = false,
      onEnter,
      className,
      onKeyDown,
      onFocus,
      ...rest
    },
    ref
  ) {
    return (
      <NumericFormat
        getInputRef={ref}
        value={value === "" || value == null ? "" : value}
        onValueChange={(v) => {
          if (v.floatValue === undefined) {
            onValueChange("");
            return;
          }
          onValueChange(v.floatValue);
        }}
        isAllowed={(v) => {
          if (v.floatValue === undefined) return true;
          if (min !== undefined && v.floatValue < min) return false;
          if (max !== undefined && v.floatValue > max) return false;
          return true;
        }}
        allowNegative={allowNegative}
        allowLeadingZeros={false}
        decimalScale={allowDecimals ? undefined : 0}
        thousandSeparator={false}
        inputMode={allowDecimals ? "decimal" : "numeric"}
        onKeyDown={(e) => {
          if (e.key === "Enter" && onEnter) {
            onEnter();
          }
          onKeyDown?.(e);
        }}
        onFocus={(e) => {
          e.target.select();
          onFocus?.(e);
        }}
        className={cn(
          "file:text-foreground placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground dark:bg-input/30 border-input h-9 w-full min-w-0 rounded-md border bg-transparent px-3 py-1 text-base shadow-xs transition-[color,box-shadow] outline-none disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
          "focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]",
          "aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive",
          className
        )}
        {...rest}
      />
    );
  }
);
