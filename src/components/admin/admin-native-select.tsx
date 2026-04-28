"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

/**
 * Native `<select>` styled to match the rest of the admin form fields.
 * Replaces the duplicated `filterSelectClass` Tailwind string scattered
 * across achievements/shop/transactions/missions managers.
 *
 * Use plain `<option>` children, or pass `options` for the common case.
 *
 * Note: This is intentionally a native control (not the Radix `Select`
 * from `@/components/ui/select`) — admin forms that nest a `<select>`
 * inside a `<form>` and rely on `change`/`keydown` semantics work better
 * with the native element. Use the Radix `Select` (via `AdminFilterSelect`)
 * for filter toolbars where richer styling matters.
 */

export type AdminNativeSelectOption = {
  value: string;
  label: string;
  disabled?: boolean;
};

export interface AdminNativeSelectProps
  extends Omit<React.SelectHTMLAttributes<HTMLSelectElement>, "size" | "children"> {
  options?: ReadonlyArray<AdminNativeSelectOption>;
  placeholder?: string;
  size?: "sm" | "md";
  children?: React.ReactNode;
}

export const AdminNativeSelect = React.forwardRef<
  HTMLSelectElement,
  AdminNativeSelectProps
>(function AdminNativeSelect(
  { options, placeholder, size = "md", className, children, ...rest },
  ref,
) {
  return (
    <select
      ref={ref}
      className={cn(
        "w-full rounded-lg border border-input bg-transparent px-3 outline-none transition-colors focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/40 dark:bg-input/30",
        size === "sm" ? "h-8 py-1 text-xs" : "h-9 py-1.5 text-sm",
        className,
      )}
      {...rest}
    >
      {placeholder ? (
        <option value="" disabled={rest.value !== ""}>
          {placeholder}
        </option>
      ) : null}
      {options?.map((opt) => (
        <option key={opt.value} value={opt.value} disabled={opt.disabled}>
          {opt.label}
        </option>
      ))}
      {children}
    </select>
  );
});
