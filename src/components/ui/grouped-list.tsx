"use client"

import type { LucideIcon } from "lucide-react"

import { cn } from "@/lib/utils"

import { ListRow } from "./list-row"

/**
 * iOS "grouped inset table view" — the primary list grammar for Settings/More
 * and any collection of navigable rows (proven out in `/proto/ios`). A
 * rounded-2xl card holding hairline-divided rows.
 *
 * `GroupedRow` renders on top of the app's existing `ListRow` primitive
 * (REDESIGN.md §4.3) rather than duplicating its row markup — it only adds
 * the icon-in-a-circle leading convenience and a `destructive` title color,
 * so the whole app still has exactly ONE row implementation underneath.
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

  return (
    <ListRow
      href={href}
      onClick={onClick}
      className="min-h-[52px] px-4 py-2.5"
      leading={
        Icon ? (
          <span
            className={cn(
              "flex size-7 items-center justify-center rounded-lg",
              iconClassName ?? "bg-primary/12 text-primary",
            )}
          >
            <Icon className="size-4" />
          </span>
        ) : undefined
      }
      title={<span className={cn(destructive && "text-destructive")}>{title}</span>}
      subtitle={subtitle}
      trailing={trailing}
      chevron={navigable && chevron}
    />
  )
}
