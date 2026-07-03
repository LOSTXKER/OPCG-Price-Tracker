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
  className,
}: {
  label?: string
  footer?: string
  children: React.ReactNode
  /** Overrides the default page-level inset (`px-4 sm:px-6`) — e.g. a fixed
   *  `px-4` inside a narrow sheet where the sm: bump would waste width. */
  className?: string
}) {
  return (
    <div className={cn("px-4 sm:px-6", className)}>
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
  active,
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
  /** Current-route highlight (nav menus) — honey-tints the title + icon circle. */
  active?: boolean
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
              active ? "bg-primary/15 text-primary" : (iconClassName ?? "bg-primary/12 text-primary"),
            )}
          >
            <Icon className="size-4" />
          </span>
        ) : undefined
      }
      title={
        <span className={cn(destructive && "text-destructive", active && "font-semibold text-primary")}>
          {title}
        </span>
      }
      subtitle={subtitle}
      trailing={trailing}
      chevron={navigable && chevron}
    />
  )
}
