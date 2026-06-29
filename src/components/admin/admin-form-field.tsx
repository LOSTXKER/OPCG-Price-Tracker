"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

/**
 * Standard form field wrapper used in admin manager forms.
 * Replaces the inline `<div className="space-y-1.5"><label>…<Input/></div>`
 * pattern duplicated across every Honey CRUD form.
 *
 * For more advanced layouts you can compose:
 *   <AdminFormField label="โค้ด" hint="ไม่ซ้ำ" error={error}>
 *     <Input ... />
 *   </AdminFormField>
 */
export interface AdminFormFieldProps {
  label?: React.ReactNode;
  hint?: React.ReactNode;
  /** Inline error message. Overrides `hint` when present. */
  error?: React.ReactNode;
  /** Mark the field as required (adds an asterisk to the label). */
  required?: boolean;
  /** Stretch field across grid columns. */
  span?: 1 | 2 | 3 | "full";
  className?: string;
  children: React.ReactNode;
}

const SPAN_CLASSES: Record<NonNullable<AdminFormFieldProps["span"]>, string> = {
  1: "",
  2: "sm:col-span-2",
  3: "sm:col-span-2 lg:col-span-3",
  full: "col-span-full",
};

export function AdminFormField({
  label,
  hint,
  error,
  required,
  span = 1,
  className,
  children,
}: AdminFormFieldProps) {
  return (
    <div className={cn("space-y-1.5", SPAN_CLASSES[span], className)}>
      {label !== undefined && (
        <label className="text-label">
          {label}
          {required && <span className="ml-0.5 text-destructive">*</span>}
        </label>
      )}
      {children}
      {error ? (
        <p className="text-meta text-destructive">{error}</p>
      ) : hint ? (
        <p className="text-meta">{hint}</p>
      ) : null}
    </div>
  );
}

/**
 * Inline checkbox form field. Renders the label next to the checkbox
 * (instead of above it) since that matches the existing admin pattern.
 */
export function AdminCheckboxField({
  label,
  span = 1,
  className,
  ...rest
}: {
  label: React.ReactNode;
  span?: AdminFormFieldProps["span"];
  className?: string;
} & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <label
      className={cn(
        "flex items-center gap-2 text-sm",
        SPAN_CLASSES[span ?? 1],
        className,
      )}
    >
      <input
        type="checkbox"
        className="h-4 w-4 rounded border-border"
        {...rest}
      />
      {label}
    </label>
  );
}
