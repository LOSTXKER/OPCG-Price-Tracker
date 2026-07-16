"use client"

import { forwardRef, useMemo } from "react"

import { getCardName, getLocale, t, type Language } from "@/lib/i18n"
import { clientEnv } from "@/lib/env"
import { MASKED } from "@/lib/constants/ui"
import {
  formatJpyAmount,
  formatPct,
  type Currency,
} from "@/lib/utils/currency"
import type { AssetRow } from "@/lib/types/portfolio"

import { holdingValue, pnlCalc, sortAssets } from "./assets-table/utils"

const WIDTH = 1080
const HEIGHT = 1350
const PAD = 72
const SPARK_WIDTH = WIDTH - PAD * 2
const SPARK_HEIGHT = 220

interface PortfolioShareCardProps {
  portfolioName: string
  totalValueJpy: number
  totalCostJpy: number
  unrealizedPnl: number | null
  unrealizedPnlPercent: number | null
  valuedCopyCount: number
  valuationComplete: boolean
  performanceComplete: boolean
  history: { label: string; value: number }[]
  assets: AssetRow[]
  lang: Language
  currency: Currency
  brand?: string
  hideBalance?: boolean
  maskText?: string
}

export const PortfolioShareCard = forwardRef<HTMLDivElement, PortfolioShareCardProps>(
  function PortfolioShareCard(
    {
      portfolioName,
      totalValueJpy,
      totalCostJpy,
      unrealizedPnl,
      unrealizedPnlPercent,
      valuedCopyCount,
      valuationComplete,
      performanceComplete,
      history,
      assets,
      lang,
      currency,
      brand = "Meecard",
      hideBalance = false,
      maskText = MASKED,
    },
    ref,
  ) {
    const locale = getLocale(lang)
    const hasPerformance = performanceComplete && unrealizedPnl != null
    const hasRoi = hasPerformance && unrealizedPnlPercent != null
    const safePnl = unrealizedPnl ?? 0
    const safeRoi = unrealizedPnlPercent ?? 0
    const isUp = safePnl >= 0

    const top = useMemo(
      () => sortAssets(assets, "value", "desc").slice(0, 4),
      [assets],
    )

    const sparkData = history.slice(-30).map((d) => d.value)
    const dateStamp = new Date().toLocaleDateString(locale, {
      day: "numeric",
      month: "short",
      year: "numeric",
    })

    return (
      <div
        ref={ref}
        className="relative isolate overflow-hidden bg-card text-foreground"
        style={{
          width: WIDTH,
          height: HEIGHT,
          fontFamily:
            "var(--font-sans, system-ui, -apple-system, 'Segoe UI', sans-serif)",
        }}
      >
        <div
          className="relative flex h-full w-full flex-col"
          style={{ padding: PAD }}
        >
          <header className="flex items-start justify-between">
            <div className="flex items-start" style={{ gap: 22 }}>
              <div
                aria-hidden
                className="flex shrink-0 items-center justify-center font-extrabold"
                style={{
                  width: 64,
                  height: 64,
                  borderRadius: 20,
                  fontSize: 34,
                  color: "#2a1b08",
                  background: "var(--color-primary)",
                  boxShadow: "0 8px 24px color-mix(in srgb, var(--color-primary) 35%, transparent)",
                }}
              >
                M
              </div>
              <div>
                <p
                  className="font-semibold uppercase tracking-[0.2em] text-muted-foreground"
                  style={{ fontSize: 18, letterSpacing: 4 }}
                >
                  {brand} · Portfolio
                </p>
                <p
                  className="mt-3 font-extrabold tracking-tight"
                  style={{ fontSize: 56, lineHeight: 1.05 }}
                >
                  {portfolioName}
                </p>
              </div>
            </div>
            <div className="text-right">
              <p
                className="font-semibold uppercase tracking-[0.2em] text-muted-foreground/70"
                style={{ fontSize: 14, letterSpacing: 3 }}
              >
                {t(lang, valuationComplete ? "portfolioValue" : "portfolioEstimatedValue")}
              </p>
              <p
                className="mt-2 text-muted-foreground"
                style={{ fontSize: 22 }}
              >
                {dateStamp}
              </p>
            </div>
          </header>

          <div className="mt-12 flex flex-wrap items-baseline gap-x-8 gap-y-4">
            <span
              className="font-extrabold tracking-tight tabular-nums"
              style={{ fontSize: 132, lineHeight: 1 }}
            >
              {hideBalance
                ? maskText
                : valuedCopyCount === 0
                  ? "—"
                  : `${valuationComplete ? "" : "≈ "}${formatJpyAmount(totalValueJpy, currency)}`}
            </span>
            {hasRoi && (
              <span
                className="rounded-full px-6 py-2 font-bold tabular-nums"
                style={{
                  fontSize: 36,
                  background: hideBalance
                    ? "color-mix(in srgb, var(--color-muted-foreground) 10%, transparent)"
                    : isUp
                      ? "color-mix(in srgb, var(--color-price-up) 14%, transparent)"
                      : "color-mix(in srgb, var(--color-price-down) 14%, transparent)",
                  color: hideBalance
                    ? "var(--color-muted-foreground)"
                    : isUp
                      ? "var(--color-price-up-on-soft)"
                      : "var(--color-price-down-on-soft)",
                }}
              >
                {hideBalance ? (
                  maskText
                ) : (
                  <>
                    {isUp ? "▲ " : "▼ "}
                    {isUp ? "+" : ""}
                    {formatPct(safeRoi, 2)}%
                  </>
                )}
              </span>
            )}
          </div>

          {hasPerformance && (
            <div
              className="mt-5 flex flex-wrap items-center text-muted-foreground"
              style={{ fontSize: 26, gap: 28 }}
            >
              <span>
                <span className="text-muted-foreground/70">
                  {t(lang, "unrealizedPnl")}
                </span>{" "}
                <span
                  className="font-bold tabular-nums"
                  style={{
                    color: hideBalance
                      ? "var(--color-foreground)"
                      : isUp
                        ? "var(--color-price-up-text)"
                        : "var(--color-price-down-text)",
                  }}
                >
                  {hideBalance ? (
                    maskText
                  ) : (
                    <>
                      {isUp ? "▲ " : "▼ "}
                      {isUp ? "+" : ""}
                      {formatJpyAmount(safePnl, currency)}
                    </>
                  )}
                </span>
              </span>
              <span aria-hidden style={{ opacity: 0.3 }}>
                ·
              </span>
              <span>
                <span className="text-muted-foreground/70">
                  {t(lang, "costBasis")}
                </span>{" "}
                <span className="font-semibold tabular-nums text-foreground/80">
                  {hideBalance ? maskText : formatJpyAmount(totalCostJpy, currency)}
                </span>
              </span>
            </div>
          )}

          {performanceComplete && sparkData.length >= 2 && (
            <div className="mt-12">
              <ShareSparkline
                data={sparkData}
                width={SPARK_WIDTH}
                height={SPARK_HEIGHT}
                up={isUp}
              />
            </div>
          )}

          <div className="mt-auto pt-12">
            {top.length > 0 && (
              <div>
                <p
                  className="font-semibold uppercase tracking-[0.2em] text-muted-foreground/70"
                  style={{ fontSize: 16, letterSpacing: 3 }}
                >
                  {t(lang, "topHoldings")}
                </p>
                <div
                  className="mt-5 grid"
                  style={{
                    gridTemplateColumns:
                      top.length === 1 ? "1fr" : "repeat(2, minmax(0, 1fr))",
                    gap: 20,
                  }}
                >
                  {top.map((row) => (
                    <HoldingTile
                      key={row.itemId}
                      row={row}
                      lang={lang}
                      currency={currency}
                      hideBalance={hideBalance}
                      maskText={maskText}
                    />
                  ))}
                </div>
              </div>
            )}

            <footer
              className="mt-9 flex items-center justify-between border-t border-hair pt-5 text-muted-foreground/70"
              style={{ fontSize: 18 }}
            >
              <span>
                {assets.length} {t(lang, "card")}
              </span>
              <span className="font-semibold tracking-wide">
                {clientEnv().NEXT_PUBLIC_APP_URL.replace(/^https?:\/\//, "")}/portfolio
              </span>
            </footer>
          </div>
        </div>
      </div>
    )
  },
)

function HoldingTile({
  row,
  lang,
  currency,
  hideBalance,
  maskText,
}: {
  row: AssetRow
  lang: Language
  currency: Currency
  hideBalance: boolean
  maskText: string
}) {
  const name = getCardName(lang, row)
  const value = holdingValue(row)
  const pnl = pnlCalc(row)

  return (
    <div
      className="flex items-center overflow-hidden rounded-2xl bg-muted/40 ring-1 ring-border/30"
      style={{ gap: 20, padding: 16 }}
    >
      <div
        className="relative shrink-0 overflow-hidden rounded-xl bg-muted ring-1 ring-border/20"
        style={{ width: 96, height: 96 }}
      >
        {row.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={row.imageUrl}
            alt={name}
            crossOrigin="anonymous"
            className="h-full w-full object-contain"
          />
        ) : null}
      </div>
      <div className="min-w-0 flex-1">
        <p
          className="truncate font-semibold"
          style={{ fontSize: 22, lineHeight: 1.2 }}
        >
          {name}
        </p>
        <p
          className="mt-1 font-mono text-muted-foreground/70"
          style={{ fontSize: 15 }}
        >
          {row.baseCode ?? row.cardCode}
          <span
            className="ml-2 font-sans"
            style={{ color: "var(--color-foreground)", opacity: 0.5 }}
          >
            ×{row.quantity}
          </span>
        </p>
        <div
          className="mt-2 flex items-baseline justify-between"
          style={{ gap: 12 }}
        >
          <span
            className="font-bold tabular-nums"
            style={{ fontSize: 24 }}
          >
            {hideBalance ? maskText : formatJpyAmount(value, currency)}
          </span>
          {pnl?.pct != null ? (
            <span
              className="font-semibold tabular-nums"
              style={{
                fontSize: 18,
                color: hideBalance
                  ? "var(--color-foreground)"
                  : pnl.pct >= 0
                    ? "var(--color-price-up-text)"
                    : "var(--color-price-down-text)",
              }}
            >
              {hideBalance ? (
                maskText
              ) : (
                <>
                  {pnl.pct >= 0 ? "+" : ""}
                  {formatPct(pnl.pct)}%
                </>
              )}
            </span>
          ) : null}
        </div>
      </div>
    </div>
  )
}

function ShareSparkline({
  data,
  width,
  height,
  up,
}: {
  data: number[]
  width: number
  height: number
  up: boolean
}) {
  const min = Math.min(...data)
  const max = Math.max(...data)
  const range = max - min || 1
  const stroke = up ? "var(--color-price-up)" : "var(--color-price-down)"

  const points = data
    .map((v, i) => {
      const x = (i / (data.length - 1)) * width
      const y = height - ((v - min) / range) * (height - 8) - 4
      return `${x},${y}`
    })
    .join(" ")
  const fillPoints = `0,${height} ${points} ${width},${height}`
  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      preserveAspectRatio="none"
    >
      <polygon points={fillPoints} fill={stroke} fillOpacity={0.1} />
      <polyline
        points={points}
        fill="none"
        stroke={stroke}
        strokeWidth={5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}
