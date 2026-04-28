"use client";

import { cn } from "@/lib/utils";

/**
 * Shared section header for the /honey page. Replaces the "eyebrow + h3 + meta + pill"
 * pattern that was duplicated across nine places. The eyebrow is intentionally dropped
 * (it added noise without information); descriptions are optional and should only be
 * used when they give a real instruction, not when they restate the title.
 */
export function SectionHeader({
  title,
  description,
  pill,
  className,
}: {
  title: React.ReactNode;
  description?: React.ReactNode;
  pill?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex items-start justify-between gap-2 px-1", className)}>
      <div className="min-w-0">
        <h2 className="text-h3">{title}</h2>
        {description && <p className="mt-0.5 text-meta">{description}</p>}
      </div>
      {pill && <div className="shrink-0">{pill}</div>}
    </div>
  );
}

/**
 * Standard pill variant used as the right-side affordance of `SectionHeader`.
 * Matches the muted/neutral pill we use across the page — `tone="primary"` is the
 * one allowed accent (Honey).
 */
export function HeaderPill({
  icon: Icon,
  children,
  tone = "muted",
  className,
}: {
  icon?: React.ElementType;
  children: React.ReactNode;
  tone?: "muted" | "primary";
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex items-center gap-1.5 rounded-full px-2.5 py-1 text-sm font-semibold",
        tone === "primary"
          ? "bg-primary/10 text-primary"
          : "bg-muted/50 text-muted-foreground",
        className,
      )}
    >
      {Icon && <Icon className="size-3.5" />}
      <span className="tabular-nums">{children}</span>
    </div>
  );
}
