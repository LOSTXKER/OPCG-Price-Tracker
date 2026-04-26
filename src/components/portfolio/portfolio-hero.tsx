"use client"

import { Price } from "@/components/shared/price-inline"
import { cn } from "@/lib/utils"
import { useUIStore } from "@/stores/ui-store"
import { t } from "@/lib/i18n"
import { formatJpyAmount, formatPct } from "@/lib/utils/currency"

interface PortfolioHeroProps {
  totalValueJpy: number
  totalCostJpy: number
  unrealizedPnl: number
  unrealizedPnlPercent: number
  hideBalance?: boolean
  portfolioName?: string
  cardCount?: number
  history?: { label: string; value: number }[]
  bestPerformer?: { name: string; pnl: number; pnlPercent: number } | null
  worstPerformer?: { name: string; pnl: number; pnlPercent: number } | null
}

export function PortfolioHero({
  totalValueJpy,
  totalCostJpy,
  unrealizedPnl,
  unrealizedPnlPercent,
  hideBalance,
  portfolioName,
  cardCount,
  history,
  bestPerformer,
  worstPerformer,
}: PortfolioHeroProps) {
  const lang = useUIStore((s) => s.language)
  const currency = useUIStore((s) => s.currency)

  const historyData = history?.map((d) => d.value) ?? []
  const hasCost = totalCostJpy > 0

  const performersDiffer =
    bestPerformer && worstPerformer && bestPerformer.name !== worstPerformer.name

  return (
    <div className="panel panel-hero overflow-hidden rounded-xl">
      <div className="p-5 sm:p-6">
        {/* Portfolio name + card count */}
        {portfolioName && (
          <div className="mb-4 flex items-center gap-2.5">
            <span className="text-base font-bold tracking-tight">{portfolioName}</span>
            {cardCount != null && cardCount > 0 && (
              <span className="rounded-full bg-primary/12 px-2.5 py-0.5 text-xs font-bold tabular-nums text-primary">
                {cardCount}
              </span>
            )}
          </div>
        )}

        {/* Value + PnL badge */}
        <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground/70">
          {t(lang, "portfolioValue")}
        </p>
        <div className="mt-1.5 flex flex-wrap items-baseline gap-3">
          <span className="font-price text-3xl font-extrabold tabular-nums tracking-tighter sm:text-[2.75rem] sm:leading-none">
            {hideBalance ? "••••••" : <Price jpy={totalValueJpy} />}
          </span>
          {hasCost && (
            <span className={cn(
              "rounded-full px-2.5 py-1 text-xs font-bold tabular-nums",
              unrealizedPnl >= 0
                ? "bg-price-up/12 text-price-up"
                : "bg-price-down/12 text-price-down"
            )}>
              {unrealizedPnl >= 0 ? "+" : ""}{formatPct(unrealizedPnlPercent, 2)}%
            </span>
          )}
        </div>

        {/* PnL amount + Cost */}
        {hasCost && (
          <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-1.5 text-[13px]">
            <span className="text-muted-foreground">
              {t(lang, "unrealizedPnl")}{" "}
              <span className={cn(
                "font-price font-bold tabular-nums",
                unrealizedPnl >= 0 ? "text-price-up" : "text-price-down"
              )}>
                {hideBalance ? "••••" : (
                  <>
                    {unrealizedPnl >= 0 ? "+" : ""}
                    {formatJpyAmount(unrealizedPnl, currency)}
                  </>
                )}
              </span>
            </span>
            <span className="hidden h-3.5 w-px bg-border/50 sm:block" />
            <span className="text-muted-foreground">
              {t(lang, "costBasis")}{" "}
              <span className="font-price font-semibold tabular-nums text-foreground/80">
                {hideBalance ? "••••" : formatJpyAmount(totalCostJpy, currency)}
              </span>
            </span>
          </div>
        )}

        {/* Sparkline */}
        {historyData.length >= 2 && (
          <div className="mt-4 h-10 w-full sm:w-3/5">
            <MiniSparkline
              data={historyData.slice(-14)}
              width={320}
              height={40}
              className="h-full w-full opacity-80"
            />
          </div>
        )}
      </div>

      {/* Best / Worst performers */}
      {hasCost && performersDiffer && (
        <div className="grid grid-cols-2 gap-px border-t border-primary/10 bg-border/10">
          <div className="stat-card px-5 py-3">
            <p className="text-[11px] font-medium text-muted-foreground/70">
              {t(lang, "bestPerformer")}
            </p>
            <p className="mt-1 truncate text-sm font-semibold leading-tight">{bestPerformer!.name}</p>
            <p className="mt-0.5 font-price text-xs font-semibold tabular-nums text-price-up">
              +{formatPct(bestPerformer!.pnlPercent)}%
            </p>
          </div>
          <div className="stat-card px-5 py-3">
            <p className="text-[11px] font-medium text-muted-foreground/70">
              {t(lang, "worstPerformer")}
            </p>
            <p className="mt-1 truncate text-sm font-semibold leading-tight">{worstPerformer!.name}</p>
            <p className="mt-0.5 font-price text-xs font-semibold tabular-nums text-price-down">
              {formatPct(worstPerformer!.pnlPercent)}%
            </p>
          </div>
        </div>
      )}
    </div>
  )
}

interface MiniSparklineProps {
  data: number[]
  width?: number
  height?: number
  className?: string
}

export function MiniSparkline({ data, width = 180, height = 24, className }: MiniSparklineProps) {
  if (data.length < 2) return null
  const min = Math.min(...data)
  const max = Math.max(...data)
  const range = max - min || 1
  const points = data
    .map((v, i) => {
      const x = (i / (data.length - 1)) * width
      const y = height - ((v - min) / range) * (height - 2) - 1
      return `${x},${y}`
    })
    .join(" ")
  const up = data[data.length - 1] >= data[0]
  const gradientId = up ? "sparkGradUp" : "sparkGradDown"
  const fillPoints = `0,${height} ${points} ${width},${height}`
  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      preserveAspectRatio="none"
      className={className}
    >
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={up ? "var(--color-price-up)" : "var(--color-price-down)"} stopOpacity="0.15" />
          <stop offset="100%" stopColor={up ? "var(--color-price-up)" : "var(--color-price-down)"} stopOpacity="0" />
        </linearGradient>
      </defs>
      <polygon
        fill={`url(#${gradientId})`}
        points={fillPoints}
      />
      <polyline
        fill="none"
        stroke={up ? "var(--color-price-up)" : "var(--color-price-down)"}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
        points={points}
      />
    </svg>
  )
}
