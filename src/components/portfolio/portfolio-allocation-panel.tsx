"use client"

import Link from "next/link"

import { cn } from "@/lib/utils"
import { useUIStore } from "@/stores/ui-store"
import { t } from "@/lib/i18n"
import { jpyToDisplayValue, formatDisplayValue, formatPct } from "@/lib/utils/currency"
import type { AllocationSlice } from "@/lib/types/portfolio"

export function PortfolioAllocationPanel({ allocation }: { allocation: AllocationSlice[] }) {
  const lang = useUIStore((s) => s.language)
  const currency = useUIStore((s) => s.currency)

  if (allocation.length === 0) return null

  // Flat section — whitespace + hairline separation, no panel box (matches the
  // home/card-detail editorial grammar).
  return (
    <div className="border-t border-[var(--p-hair)] pt-5">
      <p className="text-eyebrow mb-3">{t(lang, "allocation")}</p>
      <div className="divide-y divide-[var(--p-hair)]">
        {allocation.map((slice, i) => {
          const displayValue = formatDisplayValue(
            jpyToDisplayValue(slice.value, currency),
            currency,
          )
          const pctStr = `${formatPct(slice.percent, 1)}%`
          const isTop = i === 0
          const barWidth = `${Math.min(Math.max(slice.percent, 0), 100)}%`

          const inner = (
            <div className="min-w-0 py-2.5">
              {/* Name · percent · value */}
              <div className="mb-1.5 flex items-baseline gap-2">
                <span className="text-body-sm min-w-0 flex-1 truncate font-medium">
                  {slice.name}
                </span>
                <span className="text-meta shrink-0 tabular-nums">{pctStr}</span>
                <span className="text-price shrink-0">{displayValue}</span>
              </div>
              {/* Share bar */}
              <div className="h-1 overflow-hidden rounded-full bg-muted">
                <div
                  aria-hidden="true"
                  className={cn(
                    "h-full rounded-full motion-safe:transition-all motion-safe:duration-300",
                    isTop ? "bg-foreground/40" : "bg-foreground/20",
                  )}
                  style={{ width: barWidth }}
                />
              </div>
            </div>
          )

          return slice.cardCode ? (
            <Link
              key={`${slice.name}-${i}`}
              href={`/cards/${slice.cardCode}`}
              className="ease-chrome block rounded-lg px-1 transition-colors hover:bg-muted/40"
            >
              {inner}
            </Link>
          ) : (
            <div key={`${slice.name}-${i}`} className="px-1">
              {inner}
            </div>
          )
        })}
      </div>
    </div>
  )
}
