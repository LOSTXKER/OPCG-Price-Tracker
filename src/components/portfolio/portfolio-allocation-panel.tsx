"use client"

import Image from "next/image"
import Link from "next/link"

import { cn } from "@/lib/utils"
import { MASKED } from "@/lib/constants/ui"
import { useUIStore } from "@/stores/ui-store"
import { t } from "@/lib/i18n"
import { jpyToDisplayValue, formatDisplayValue, formatPct } from "@/lib/utils/currency"
import type { AllocationSlice } from "@/lib/types/portfolio"

export function PortfolioAllocationPanel({
  allocation,
  hideBalance = false,
  showHeading = true,
}: {
  allocation: AllocationSlice[]
  hideBalance?: boolean
  showHeading?: boolean
}) {
  const lang = useUIStore((s) => s.language)
  const currency = useUIStore((s) => s.currency)

  if (allocation.length === 0) return null

  return (
    <section data-slot="portfolio-allocation">
      {showHeading ? (
        <h2 className="mb-3 text-h5">{t(lang, "allocation")}</h2>
      ) : null}
      <div className="space-y-1">
        {allocation.map((slice, i) => {
          const displayValue = hideBalance
            ? MASKED
            : formatDisplayValue(jpyToDisplayValue(slice.value, currency), currency)
          const pctStr = `${formatPct(slice.percent, 1)}%`
          const isTop = i === 0
          const barWidth = `${Math.min(Math.max(slice.percent, 0), 100)}%`

          const inner = (
            <div className="flex min-w-0 items-center gap-3 py-2.5">
              <div
                className="relative aspect-[63/88] w-9 shrink-0 overflow-hidden rounded-md bg-muted ring-1 ring-hair"
                data-slot="portfolio-allocation-card-image"
              >
                {slice.imageUrl ? (
                  <Image
                    src={slice.imageUrl}
                    alt={slice.name}
                    fill
                    className="object-cover"
                    sizes="36px"
                  />
                ) : null}
              </div>

              <div className="min-w-0 flex-1">
                {/* Name · percent · value */}
                <div className="mb-1.5 flex items-baseline gap-2">
                  <span className="text-body-sm min-w-0 flex-1 truncate font-medium">
                    {slice.name}
                  </span>
                  <span className="text-meta shrink-0 font-price tabular-nums">
                    {pctStr}
                  </span>
                  <span className="text-price shrink-0">{displayValue}</span>
                </div>
                {/* Share bar */}
                <div className="h-1 overflow-hidden rounded-full bg-muted">
                  <div
                    aria-hidden="true"
                    className={cn(
                      "h-full rounded-full motion-safe:transition-all motion-safe:duration-[var(--dur-slow)]",
                      isTop ? "bg-foreground/40" : "bg-foreground/20",
                    )}
                    style={{ width: barWidth }}
                  />
                </div>
              </div>
            </div>
          )

          return slice.cardCode ? (
            <Link
              key={`${slice.name}-${i}`}
              href={`/opcg/cards/${slice.cardCode}`}
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
    </section>
  )
}
