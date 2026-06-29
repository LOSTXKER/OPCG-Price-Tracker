"use client"

import Link from "next/link"
import { ChevronRight } from "lucide-react"
import type { ReactNode } from "react"

import { cn } from "@/lib/utils"

/**
 * Canonical interactive list row (REDESIGN.md §4.3). The single mobile
 * table-fallback / list primitive: guaranteed 56px tap target (`min-h-14`),
 * focus-visible ring, and leading / title / subtitle / trailing slots. Renders
 * as a Link (href), button (onClick), or div. Use this instead of hand-rolling
 * `flex items-center gap-3 px-4 py-3` rows so density + a11y stay consistent.
 */
export type ListRowProps = {
  href?: string
  onClick?: () => void
  /** Leading visual — image/avatar (caller sizes it). */
  leading?: ReactNode
  title: ReactNode
  /** Secondary line (code, meta, badges). Rendered muted via `.text-meta`. */
  subtitle?: ReactNode
  /** Trailing slot — price / value / action, right-aligned. */
  trailing?: ReactNode
  /** Show a trailing chevron affordance (center-clickable, ≥60% opacity). */
  chevron?: boolean
  className?: string
  ariaLabel?: string
}

const ROW =
  "flex min-h-14 w-full items-center gap-3 px-4 py-3 text-left motion-base hover:bg-muted/70 active:bg-muted/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40 focus-visible:ring-inset"

export function ListRow({
  href,
  onClick,
  leading,
  title,
  subtitle,
  trailing,
  chevron,
  className,
  ariaLabel,
}: ListRowProps) {
  const body = (
    <>
      {leading != null && <div className="shrink-0">{leading}</div>}
      <div className="min-w-0 flex-1">
        <div className="truncate text-sm font-medium leading-tight">{title}</div>
        {subtitle != null && (
          <div className="mt-0.5 flex items-center gap-1.5 text-meta">{subtitle}</div>
        )}
      </div>
      {trailing != null && <div className="shrink-0 text-right">{trailing}</div>}
      {chevron && (
        <ChevronRight aria-hidden className="size-4 shrink-0 text-muted-foreground/60" />
      )}
    </>
  )

  if (href) {
    return (
      <Link href={href} className={cn(ROW, className)} aria-label={ariaLabel}>
        {body}
      </Link>
    )
  }
  if (onClick) {
    return (
      <button type="button" onClick={onClick} className={cn(ROW, className)} aria-label={ariaLabel}>
        {body}
      </button>
    )
  }
  return <div className={cn(ROW, className)}>{body}</div>
}
