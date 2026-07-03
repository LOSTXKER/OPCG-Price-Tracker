"use client"

import Link from "next/link"
import { ChevronRight } from "lucide-react"
import type { LucideIcon } from "lucide-react"

import { cn } from "@/lib/utils"

/**
 * iOS "grouped inset table view" — the primary list grammar for Settings/More
 * and any collection of navigable rows. A rounded-2xl card holding
 * hairline-divided rows, each with an optional leading icon-in-a-circle,
 * title/subtitle, trailing content, and a chevron when the row navigates.
 */
export function GroupedSection({
  label,
  footer,
  children,
}: {
  label?: string
  footer?: string
  children: React.ReactNode
}) {
  return (
    <div className="px-4 sm:px-6">
      {label && <p className="mb-2 px-1 text-eyebrow">{label}</p>}
      <div className="hairline overflow-hidden rounded-2xl bg-card">
        <div className="divide-y divide-[var(--p-hair)]">{children}</div>
      </div>
      {footer && <p className="mt-2 px-1 text-meta">{footer}</p>}
    </div>
  )
}

export function GroupedRow({
  icon: Icon,
  iconClassName,
  title,
  subtitle,
  trailing,
  href,
  onClick,
  chevron = true,
  destructive,
}: {
  icon?: LucideIcon
  /** Background/text classes for the icon's circle — defaults to a quiet honey wash. */
  iconClassName?: string
  title: string
  subtitle?: string
  trailing?: React.ReactNode
  href?: string
  onClick?: () => void
  /** Show the trailing chevron. Auto-true when `href`/`onClick` is set. */
  chevron?: boolean
  destructive?: boolean
}) {
  const navigable = !!(href || onClick)

  const inner = (
    <div className="flex min-h-[52px] items-center gap-3 px-4 py-2.5">
      {Icon && (
        <span
          className={cn(
            "flex size-7 shrink-0 items-center justify-center rounded-lg",
            iconClassName ?? "bg-primary/12 text-primary",
          )}
        >
          <Icon className="size-4" />
        </span>
      )}
      <div className="min-w-0 flex-1">
        <p className={cn("truncate text-body-sm font-medium", destructive && "text-destructive")}>{title}</p>
        {subtitle && <p className="truncate text-meta">{subtitle}</p>}
      </div>
      {trailing}
      {navigable && chevron && <ChevronRight className="size-4 shrink-0 text-muted-foreground/50" />}
    </div>
  )

  if (href) {
    return (
      <Link href={href} className="ease-chrome block transition-colors active:bg-muted/60">
        {inner}
      </Link>
    )
  }
  if (onClick) {
    return (
      <button type="button" onClick={onClick} className="ease-chrome block w-full text-left transition-colors active:bg-muted/60">
        {inner}
      </button>
    )
  }
  return inner
}
