"use client"

import type { ReactNode } from "react"

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
  const isUp = unrealizedPnl >= 0
  const showSparkline = historyData.length >= 2

  const glowColor = hasCost
    ? isUp
      ? "var(--color-price-up)"
      : "var(--color-price-down)"
    : "var(--color-primary)"

  return (
    <div className="panel relative isolate overflow-hidden rounded-xl ring-1 ring-border/30">
      {/* Ambient PnL-tinted glow, subtle */}
      <div
        aria-hidden
        className="pointer-events-none absolute -right-16 -top-20 size-48 rounded-full opacity-[0.14] blur-3xl sm:-right-24 sm:-top-24 sm:size-72 sm:opacity-[0.18]"
        style={{ background: glowColor }}
      />

      {/* Sparkline as background, fades in from the right */}
      {showSparkline && (
        <div
          aria-hidden
          className="pointer-events-none absolute inset-y-0 right-0 hidden w-3/5 sm:block"
          style={{
            maskImage:
              "linear-gradient(to right, transparent 0%, transparent 22%, black 100%)",
            WebkitMaskImage:
              "linear-gradient(to right, transparent 0%, transparent 22%, black 100%)",
          }}
        >
          <MiniSparkline
            data={historyData.slice(-30)}
            width={520}
            height={180}
            className="h-full w-full opacity-40"
          />
        </div>
      )}

      <div className="relative p-5 sm:p-6">
        {/* Eyebrow */}
        <p className="text-eyebrow text-muted-foreground/70">
          {t(lang, "portfolioValue")}
        </p>

        {/* Headline value + PnL pill */}
        <div className="mt-2 flex flex-wrap items-baseline gap-x-3 gap-y-2">
          <span className="font-price text-display">
            {hideBalance ? "••••••" : <Price jpy={totalValueJpy} />}
          </span>
          {hasCost && (
            <span
              className={cn(
                "rounded-full px-3 py-1 text-sm font-bold tabular-nums sm:px-2.5 sm:text-xs",
                hideBalance
                  ? "bg-muted text-muted-foreground/60"
                  : isUp
                    ? "bg-price-up/12 text-price-up"
                    : "bg-price-down/12 text-price-down",
              )}
            >
              {hideBalance ? (
                "••"
              ) : (
                <>
                  {isUp ? "+" : ""}
                  {formatPct(unrealizedPnlPercent, 2)}%
                </>
              )}
            </span>
          )}
        </div>

        {/* Stat row */}
        {hasCost && (
          <div className="mt-5 flex flex-wrap items-stretch gap-x-5 gap-y-3 sm:mt-6 sm:gap-x-7">
            <Stat label={t(lang, "unrealizedPnl")}>
              <span
                className={cn(
                  "font-price text-sm font-bold tabular-nums",
                  isUp ? "text-price-up" : "text-price-down",
                )}
              >
                {hideBalance ? (
                  "••••"
                ) : (
                  <>
                    {isUp ? "+" : ""}
                    {formatJpyAmount(unrealizedPnl, currency)}
                  </>
                )}
              </span>
            </Stat>

            <StatDivider />

            <Stat label={t(lang, "costBasis")}>
              <span className="font-price text-sm font-semibold tabular-nums text-foreground/85">
                {hideBalance ? "••••" : formatJpyAmount(totalCostJpy, currency)}
              </span>
            </Stat>

            {performersDiffer && (
              <>
                <StatDivider />
                <Stat label={t(lang, "bestPerformer")}>
                  <span className="flex items-baseline gap-1.5">
                    <span className="max-w-[8rem] truncate text-sm font-semibold text-foreground/90">
                      {bestPerformer!.name}
                    </span>
                    <span
                      className={cn(
                        "font-price text-xs font-bold tabular-nums",
                        hideBalance ? "text-muted-foreground/40" : "text-price-up",
                      )}
                    >
                      {hideBalance
                        ? "••"
                        : `+${formatPct(bestPerformer!.pnlPercent)}%`}
                    </span>
                  </span>
                </Stat>

                <StatDivider />

                <Stat label={t(lang, "worstPerformer")}>
                  <span className="flex items-baseline gap-1.5">
                    <span className="max-w-[8rem] truncate text-sm font-semibold text-foreground/90">
                      {worstPerformer!.name}
                    </span>
                    <span
                      className={cn(
                        "font-price text-xs font-bold tabular-nums",
                        hideBalance ? "text-muted-foreground/40" : "text-price-down",
                      )}
                    >
                      {hideBalance
                        ? "••"
                        : `${formatPct(worstPerformer!.pnlPercent)}%`}
                    </span>
                  </span>
                </Stat>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

function Stat({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex min-w-0 flex-col gap-0.5">
      <span className="text-eyebrow text-muted-foreground/60">{label}</span>
      <div className="leading-tight">{children}</div>
    </div>
  )
}

function StatDivider() {
  return (
    <div
      aria-hidden
      className="hidden w-px self-stretch bg-border/40 sm:block"
    />
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
