"use client";

import * as React from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Floating bulk-action bar used by matching/list pages.
 * Renders fixed at the bottom-center of the viewport when one or more
 * items are selected.
 *
 * Layout:
 *   [{count} item label] | [actions] | [×]
 *
 * Pages can either:
 * - Pass actions via the `actions` prop (full control), or
 * - Use the `<AdminBulkAction>` helper for a consistent look
 */

interface AdminBulkBarProps {
  selectedCount: number;
  onClear: () => void;
  /** Custom label, e.g. "เลือก {n} รายการ". Receives the count. */
  label?: (count: number) => string;
  /** Place either raw children or a comma-separated set of `<AdminBulkAction>`s here. */
  children?: React.ReactNode;
  className?: string;
}

export function AdminBulkBar({
  selectedCount,
  onClear,
  label,
  children,
  className,
}: AdminBulkBarProps) {
  if (selectedCount <= 0) return null;
  const displayLabel = label
    ? label(selectedCount)
    : `${selectedCount} รายการที่เลือก`;
  return (
    <div
      className={cn(
        "fixed bottom-6 left-1/2 z-40 flex -translate-x-1/2 items-center gap-3 rounded-xl border border-border bg-popover px-5 py-3 shadow-2xl animate-in slide-in-from-bottom-4 fade-in duration-[var(--dur-base)]",
        className,
      )}
    >
      <span className="text-sm font-medium tabular-nums">{displayLabel}</span>
      <div className="h-5 w-px bg-border" />
      {children}
      <div className="h-5 w-px bg-border" />
      <button
        onClick={onClear}
        className="rounded-md p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        aria-label="ยกเลิกการเลือก"
      >
        <X className="size-4" />
      </button>
    </div>
  );
}

/**
 * Standardized button used inside `<AdminBulkBar>`. Supports a few semantic
 * variants matching the existing Yuyutei/SNKRDUNK colors.
 */
export type AdminBulkActionVariant =
  | "default"
  | "primary"
  | "violet"
  | "violet-outline"
  | "success"
  | "danger"
  | "danger-outline";

const VARIANT_CLASS: Record<AdminBulkActionVariant, string> = {
  default:
    "border border-border bg-background text-foreground hover:bg-muted",
  primary:
    "bg-primary text-primary-foreground hover:bg-primary/90",
  violet:
    "bg-violet-600 text-white hover:bg-violet-700",
  "violet-outline":
    "border border-violet-500/40 text-violet-600 hover:bg-violet-500/10",
  success: "bg-green-600 text-white hover:bg-green-700",
  danger:
    "border border-red-500/30 text-red-500 hover:bg-red-500/10",
  "danger-outline":
    "border border-red-500/30 text-red-500 hover:bg-red-500/10",
};

export interface AdminBulkActionProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: AdminBulkActionVariant;
  icon?: React.ReactNode;
}

export function AdminBulkAction({
  variant = "default",
  icon,
  className,
  children,
  ...rest
}: AdminBulkActionProps) {
  return (
    <button
      {...rest}
      className={cn(
        "flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors disabled:opacity-30",
        VARIANT_CLASS[variant],
        className,
      )}
    >
      {icon}
      {children}
    </button>
  );
}
