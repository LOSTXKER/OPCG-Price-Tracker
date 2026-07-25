"use client"

import { forwardRef, useMemo, type CSSProperties } from "react"

import { getCardName, getLocale, t, type Language } from "@/lib/i18n"
import { clientEnv } from "@/lib/env"
import { MASKED } from "@/lib/constants/ui"
import { BRAND_GOLD, BRAND_PRIMARY } from "@/lib/constants/brand"
import {
  formatJpyAmount,
  formatPct,
  type Currency,
} from "@/lib/utils/currency"
import type { AssetRow } from "@/lib/types/portfolio"

import { holdingValue, pnlCalc, sortAssets } from "./assets-table/utils"

export const PORTFOLIO_SHARE_SIZE = {
  width: 1080,
  height: 1350,
} as const

export type PortfolioSharePreset = "full" | "percent" | "collection"

export type PortfolioShareSections = {
  monetaryValues: boolean
  performance: boolean
  costBasis: boolean
  allocation: boolean
  holdings: boolean
  holdingPrices: boolean
  counts: boolean
  date: boolean
}

export const PORTFOLIO_SHARE_PRESETS = {
  full: {
    monetaryValues: true,
    performance: true,
    costBasis: true,
    allocation: true,
    holdings: true,
    holdingPrices: true,
    counts: true,
    date: true,
  },
  percent: {
    monetaryValues: false,
    performance: true,
    costBasis: false,
    allocation: true,
    holdings: true,
    holdingPrices: false,
    counts: false,
    date: true,
  },
  collection: {
    monetaryValues: false,
    performance: false,
    costBasis: false,
    allocation: false,
    holdings: true,
    holdingPrices: false,
    counts: true,
    date: true,
  },
} as const satisfies Record<
  PortfolioSharePreset,
  PortfolioShareSections
>

const PAD = 64
const SHARE_COLORS = {
  background: "#17110D",
  foreground: "#F8F1E8",
  muted: "#B19D8B",
  gallery: "#F3E8DB",
  galleryInk: "#2B211A",
  galleryMuted: "#816B59",
  cardBack: "#2A2019",
  neutral: "#D8C9BA",
  up: "#45C882",
  down: "#F07C72",
  allocation: ["#E6BA5C", "#C9835B", "#8FA889", "#8D78A8", "#77665A"],
} as const

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
  sections?: PortfolioShareSections
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
      assets,
      lang,
      currency,
      brand = "Meecard",
      hideBalance = false,
      maskText = MASKED,
      sections = PORTFOLIO_SHARE_PRESETS.full,
    },
    ref,
  ) {
    const locale = getLocale(lang)
    const hasPerformance = performanceComplete && unrealizedPnl != null
    const hasRoi = hasPerformance && unrealizedPnlPercent != null
    const safePnl = unrealizedPnl ?? 0
    const safeRoi = unrealizedPnlPercent ?? 0
    const direction = getDirection(safePnl)
    const showPerformance = sections.performance && hasPerformance
    const showRoi = showPerformance && hasRoi
    const showCostBasis =
      sections.monetaryValues && sections.costBasis && hasPerformance
    const showHoldingPrices =
      sections.monetaryValues && sections.holdingPrices
    const collectionEmphasis =
      !sections.monetaryValues &&
      !sections.performance &&
      !sections.allocation

    const top = useMemo(
      () => {
        const seen = new Set<number>()
        return sortAssets(assets, "value", "desc")
          .filter((row) => {
            if (seen.has(row.cardId)) return false
            seen.add(row.cardId)
            return true
          })
          .slice(0, 4)
      },
      [assets],
    )
    const portfolioMix = useMemo(
      () => getPortfolioMix(assets, lang),
      [assets, lang],
    )

    const totalCopyCount = assets.reduce(
      (sum, row) => sum + Math.max(0, row.quantity),
      0,
    )
    const dateStamp = new Date().toLocaleDateString(locale, {
      day: "numeric",
      month: "short",
      year: "numeric",
    })
    const valueText =
      valuedCopyCount === 0 ? "—" : formatJpyAmount(totalValueJpy, currency)
    const valueParts =
      valuedCopyCount === 0
        ? { amount: "—", symbol: "", symbolFirst: false }
        : splitCurrencyAmount(valueText, currency)
    const valueScale = getValueScale(valueText)
    const nameScale = getNameScale(portfolioName)
    const host = getBrandHost()
    const showAllocation = sections.allocation && portfolioMix.length > 0
    const showVisualBody = showAllocation || sections.holdings
    const galleryColumns =
      collectionEmphasis && top.length === 4 ? 2 : top.length

    return (
      <div
        ref={ref}
        data-slot="portfolio-share-card"
        data-theme="portfolio-snapshot"
        data-money-values={sections.monetaryValues}
        className="relative isolate overflow-hidden"
        style={
          {
            width: PORTFOLIO_SHARE_SIZE.width,
            height: PORTFOLIO_SHARE_SIZE.height,
            color: SHARE_COLORS.foreground,
            background: SHARE_COLORS.background,
            fontFamily:
              "var(--font-sans, system-ui, -apple-system, 'Segoe UI', sans-serif)",
            "--share-honey": BRAND_GOLD,
            "--share-espresso": BRAND_PRIMARY,
          } as CSSProperties
        }
      >
        <div
          aria-hidden
          className="absolute inset-y-0 left-0"
          style={{ width: 12, background: BRAND_GOLD }}
        />
        <div
          className="relative flex h-full w-full flex-col"
          style={{ padding: PAD }}
        >
          <header className="flex items-start justify-between">
            <div className="flex items-center" style={{ gap: 18 }}>
              {/* Same-origin asset: reliable in both preview and html-to-image. */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/meecard.png"
                alt={brand}
                width={66}
                height={61}
                loading="eager"
                className="shrink-0 object-contain"
                style={{ width: 66, height: 61 }}
              />
              <div>
                <p
                  className="font-bold uppercase"
                  style={{ fontSize: 20, letterSpacing: 4, color: BRAND_GOLD }}
                >
                  {brand}
                </p>
                <p
                  className="mt-1 font-semibold uppercase"
                  style={{
                    fontSize: 14,
                    letterSpacing: 3.2,
                    color: SHARE_COLORS.muted,
                  }}
                >
                  Collector portfolio
                </p>
              </div>
            </div>
            <div className="text-right">
              <p
                className="font-semibold uppercase"
                style={{
                  fontSize: 14,
                  letterSpacing: 2.5,
                  color: SHARE_COLORS.muted,
                }}
              >
                {t(lang, "portfolioSnapshot")}
              </p>
              {sections.date ? (
                <p
                  data-slot="portfolio-share-date"
                  className="mt-2"
                  style={{ fontSize: 21, color: SHARE_COLORS.foreground }}
                >
                  {dateStamp}
                </p>
              ) : null}
              <p
                className={sections.date ? "mt-1" : "mt-2"}
                style={{
                  fontSize: 14,
                  letterSpacing: 2,
                  color: BRAND_GOLD,
                }}
              >
                {currency}
              </p>
            </div>
          </header>

          <main
            className="flex min-h-0 flex-1 flex-col"
            style={showVisualBody ? undefined : { justifyContent: "center" }}
          >
            <section
              data-slot="portfolio-share-hero"
              className={showVisualBody ? "mt-9" : ""}
            >
              <p
                data-slot="portfolio-share-name"
                data-fit={nameScale.label}
                className="max-w-[900px] overflow-hidden font-extrabold tracking-tight"
                style={{
                  fontSize: nameScale.fontSize,
                  lineHeight: 1.04,
                  maxHeight: nameScale.maxHeight,
                  overflowWrap: "anywhere",
                }}
              >
                {portfolioName}
              </p>

              {sections.monetaryValues ? (
                <>
                  <p
                    className="mt-6 font-semibold uppercase"
                    style={{
                      fontSize: 16,
                      letterSpacing: 3,
                      color: SHARE_COLORS.muted,
                    }}
                  >
                    {t(
                      lang,
                      valuationComplete
                        ? "portfolioValue"
                        : "portfolioEstimatedValue",
                    )}
                  </p>
                  <div
                    data-slot="portfolio-share-value"
                    data-fit={valueScale.label}
                    className="mt-1 flex max-w-full items-baseline overflow-hidden font-price font-extrabold tracking-tight tabular-nums"
                    style={{ gap: 14, lineHeight: 1 }}
                  >
                    {!valuationComplete && valuedCopyCount > 0 ? (
                      <span
                        aria-hidden
                        style={{ fontSize: 54, color: BRAND_GOLD }}
                      >
                        ≈
                      </span>
                    ) : null}
                    {valueParts.symbolFirst &&
                    valueParts.symbol &&
                    !hideBalance ? (
                      <span
                        style={{
                          fontSize: valueScale.symbolSize,
                          color: SHARE_COLORS.muted,
                        }}
                      >
                        {valueParts.symbol}
                      </span>
                    ) : null}
                    <span style={{ fontSize: valueScale.fontSize }}>
                      {hideBalance ? maskText : valueParts.amount}
                    </span>
                    {!valueParts.symbolFirst &&
                    valueParts.symbol &&
                    !hideBalance ? (
                      <span
                        style={{
                          fontSize: valueScale.symbolSize,
                          color: SHARE_COLORS.muted,
                        }}
                      >
                        {valueParts.symbol}
                      </span>
                    ) : null}
                  </div>
                </>
              ) : showRoi ? (
                <div
                  data-slot="portfolio-share-performance"
                  className="mt-6"
                >
                  <p
                    className="font-semibold uppercase"
                    style={{
                      fontSize: 16,
                      letterSpacing: 3,
                      color: SHARE_COLORS.muted,
                    }}
                  >
                    {t(lang, "roi")}
                  </p>
                  <p
                    data-slot="portfolio-share-roi"
                    data-trend={direction}
                    className="mt-1 font-price font-extrabold tracking-tight tabular-nums"
                    style={{
                      fontSize: 112,
                      lineHeight: 1,
                      color:
                        direction === "up"
                          ? SHARE_COLORS.up
                          : direction === "down"
                            ? SHARE_COLORS.down
                            : SHARE_COLORS.neutral,
                    }}
                  >
                    {safeRoi > 0 ? "+" : ""}
                    {formatPct(safeRoi, 2)}%
                  </p>
                </div>
              ) : null}

              {sections.monetaryValues &&
              (showPerformance || showCostBasis) ? (
                <div
                  data-slot="portfolio-share-performance"
                  className="mt-5 flex flex-wrap items-stretch"
                  style={{ gap: 14 }}
                >
                  {showPerformance ? (
                    <MetricPill
                      slot="portfolio-share-pnl"
                      label={t(lang, "unrealizedPnl")}
                      value={
                        hideBalance
                          ? maskText
                          : `${safePnl > 0 ? "+" : ""}${formatJpyAmount(
                              safePnl,
                              currency,
                            )}`
                      }
                      direction={direction}
                    />
                  ) : null}
                  {showRoi ? (
                    <MetricPill
                      slot="portfolio-share-roi"
                      label={t(lang, "roi")}
                      value={`${safeRoi > 0 ? "+" : ""}${formatPct(
                        safeRoi,
                        2,
                      )}%`}
                      direction={direction}
                    />
                  ) : null}
                  {showCostBasis ? (
                    <MetricPill
                      slot="portfolio-share-cost-basis"
                      label={t(lang, "costBasis")}
                      value={
                        hideBalance
                          ? maskText
                          : formatJpyAmount(totalCostJpy, currency)
                      }
                      direction="neutral"
                    />
                  ) : null}
                </div>
              ) : null}

              {sections.counts &&
              !valuationComplete &&
              totalCopyCount > 0 &&
              (sections.monetaryValues || showAllocation) ? (
                <p
                  className="mt-3"
                  style={{ fontSize: 18, color: SHARE_COLORS.muted }}
                >
                  {t(lang, "dataCoverage")} {valuedCopyCount}/{totalCopyCount}
                </p>
              ) : null}
            </section>

            {showAllocation ? (
              <PortfolioMixPanel
                items={portfolioMix}
                lang={lang}
                expanded={!sections.holdings}
              />
            ) : null}

            {sections.holdings ? (
              <section
                data-slot="portfolio-share-gallery"
                className="flex min-h-0 flex-1 flex-col overflow-hidden"
                style={{
                  marginTop: showAllocation ? 20 : 30,
                  borderRadius: 42,
                  padding: collectionEmphasis
                    ? "30px 24px 34px"
                    : "26px 30px 30px",
                  color: SHARE_COLORS.galleryInk,
                  background: SHARE_COLORS.gallery,
                }}
              >
                <div className="flex items-center justify-between">
                  <p
                    className="font-bold uppercase"
                    style={{ fontSize: 16, letterSpacing: 3 }}
                  >
                    {t(lang, "topHoldings")}
                  </p>
                  {sections.counts ? (
                    <p
                      data-slot="portfolio-share-gallery-counts"
                      style={{
                        fontSize: 17,
                        color: SHARE_COLORS.galleryMuted,
                      }}
                    >
                      {assets.length} {t(lang, "holdingItemsShort")} ·{" "}
                      {totalCopyCount} {t(lang, "cardCopiesShort")}
                    </p>
                  ) : null}
                </div>

                {top.length > 0 ? (
                  <div className="flex min-h-0 flex-1 items-center justify-center">
                    <div
                      className="grid items-end justify-center"
                      style={{
                        gridTemplateColumns: `repeat(${galleryColumns}, ${getGalleryCardWidth(
                          top.length,
                          collectionEmphasis,
                        )}px)`,
                        columnGap: getGalleryGap(
                          top.length,
                          collectionEmphasis,
                        ),
                        rowGap:
                          collectionEmphasis && top.length === 4 ? 10 : 22,
                      }}
                    >
                      {top.map((row, index) => (
                        <HoldingSpotlight
                          key={row.itemId}
                          row={row}
                          index={index}
                          count={top.length}
                          lang={lang}
                          currency={currency}
                          hideBalance={hideBalance}
                          maskText={maskText}
                          showPrice={showHoldingPrices}
                          showPerformance={showPerformance}
                          showQuantity={sections.counts}
                          emphasized={collectionEmphasis}
                        />
                      ))}
                    </div>
                  </div>
                ) : (
                  <div
                    className="flex min-h-0 flex-1 flex-col items-center justify-center text-center"
                    style={{ color: SHARE_COLORS.galleryMuted }}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src="/meecard.png"
                      alt=""
                      width={150}
                      height={138}
                      loading="eager"
                      style={{ width: 150, height: 138, objectFit: "contain" }}
                    />
                    <p className="mt-4 font-bold" style={{ fontSize: 26 }}>
                      {t(lang, "emptyPortfolio")}
                    </p>
                  </div>
                )}
              </section>
            ) : null}
          </main>

          <footer
            className="mt-6 flex items-center justify-between border-t pt-5"
            style={{
              borderColor: "rgba(248, 241, 232, 0.16)",
              fontSize: 18,
              color: SHARE_COLORS.muted,
            }}
          >
            {sections.counts ? (
              <span className="flex items-center" style={{ gap: 10 }}>
                <span
                  data-slot="portfolio-share-holding-count"
                  className="font-semibold"
                >
                  {assets.length} {t(lang, "holdingItemsShort")}
                </span>
                <span aria-hidden style={{ opacity: 0.45 }}>
                  ·
                </span>
                <span
                  data-slot="portfolio-share-copy-count"
                  className="font-semibold"
                >
                  {totalCopyCount} {t(lang, "cardCopiesShort")}
                </span>
              </span>
            ) : (
              <span className="font-semibold">{t(lang, "madeWithMeecard")}</span>
            )}
            <span
              className="font-bold uppercase"
              style={{
                color: BRAND_GOLD,
                letterSpacing: 2.2,
              }}
            >
              {host}
            </span>
          </footer>
        </div>
      </div>
    )
  },
)

type Direction = "up" | "down" | "neutral"

function MetricPill({
  slot,
  label,
  value,
  direction,
}: {
  slot:
    | "portfolio-share-pnl"
    | "portfolio-share-roi"
    | "portfolio-share-cost-basis"
  label: string
  value: string
  direction: Direction
}) {
  const color =
    direction === "up"
      ? SHARE_COLORS.up
      : direction === "down"
        ? SHARE_COLORS.down
        : SHARE_COLORS.neutral
  const background =
    direction === "up"
      ? "rgba(69, 200, 130, 0.12)"
      : direction === "down"
        ? "rgba(240, 124, 114, 0.12)"
        : "rgba(248, 241, 232, 0.08)"
  const marker = direction === "up" ? "▲ " : direction === "down" ? "▼ " : ""

  return (
    <div
      data-slot={slot}
      data-component="portfolio-share-metric"
      data-trend={direction}
      className="flex items-baseline rounded-full"
      style={{ gap: 12, padding: "10px 18px", background }}
    >
      <span
        className="font-semibold uppercase"
        style={{
          fontSize: 14,
          letterSpacing: 1.8,
          color: SHARE_COLORS.muted,
        }}
      >
        {label}
      </span>
      <span
        className="font-price font-bold tabular-nums"
        style={{ fontSize: 23, color }}
      >
        {marker}
        {value}
      </span>
    </div>
  )
}

type PortfolioMixItem = {
  key: string
  label: string
  percent: number
  color: string
}

function PortfolioMixPanel({
  items,
  lang,
  expanded,
}: {
  items: PortfolioMixItem[]
  lang: Language
  expanded: boolean
}) {
  return (
    <section
      data-slot="portfolio-share-allocation"
      className={
        expanded
          ? "mt-10 flex min-h-0 flex-1 flex-col justify-center"
          : "mt-5"
      }
      style={{
        border: "1px solid rgba(248, 241, 232, 0.12)",
        borderRadius: expanded ? 38 : 30,
        padding: expanded ? "46px 42px" : "22px 28px 24px",
        background: "rgba(248, 241, 232, 0.055)",
      }}
    >
      <div className="flex items-center justify-between">
        <p
          className="font-bold uppercase"
          style={{ fontSize: 16, letterSpacing: 3 }}
        >
          {t(lang, "portfolioMix")}
        </p>
        <p
          className="font-price font-bold tabular-nums"
          style={{ fontSize: 17, color: SHARE_COLORS.muted }}
        >
          100%
        </p>
      </div>

      <div
        aria-hidden
        className="mt-4 flex w-full overflow-hidden rounded-full"
        style={{
          height: expanded ? 26 : 18,
          gap: 3,
          background: "rgba(248, 241, 232, 0.08)",
        }}
      >
        {items.map((item) => (
          <span
            key={item.key}
            style={{
              width: `${item.percent}%`,
              minWidth: item.percent > 0 ? 4 : 0,
              background: item.color,
            }}
          />
        ))}
      </div>

      <div
        className="mt-4 grid"
        style={{
          gridTemplateColumns:
            items.length <= 2 || expanded
              ? "repeat(2, minmax(0, 1fr))"
              : `repeat(${Math.min(items.length, 5)}, minmax(0, 1fr))`,
          gap: expanded ? "22px 34px" : "12px 18px",
        }}
      >
        {items.map((item) => (
          <div
            key={item.key}
            className="flex min-w-0 items-center"
            style={{ gap: 10 }}
          >
            <span
              aria-hidden
              className="shrink-0 rounded-full"
              style={{
                width: expanded ? 16 : 12,
                height: expanded ? 16 : 12,
                background: item.color,
              }}
            />
            <span
              className="min-w-0 truncate font-mono font-semibold"
              style={{
                fontSize: expanded ? 20 : 15,
                color: SHARE_COLORS.foreground,
              }}
            >
              {item.label}
            </span>
            <span
              className="ml-auto shrink-0 font-price font-bold tabular-nums"
              style={{
                fontSize: expanded ? 22 : 16,
                color: SHARE_COLORS.neutral,
              }}
            >
              {formatPct(item.percent, 1)}%
            </span>
          </div>
        ))}
      </div>
    </section>
  )
}

function HoldingSpotlight({
  row,
  index,
  count,
  lang,
  currency,
  hideBalance,
  maskText,
  showPrice,
  showPerformance,
  showQuantity,
  emphasized,
}: {
  row: AssetRow
  index: number
  count: number
  lang: Language
  currency: Currency
  hideBalance: boolean
  maskText: string
  showPrice: boolean
  showPerformance: boolean
  showQuantity: boolean
  emphasized: boolean
}) {
  const name = getCardName(lang, row)
  const width = getGalleryCardWidth(count, emphasized)
  const artHeight = Math.round((width * 88) / 63)
  const imageSrc = getShareImageSrc(row.imageUrl)
  const value = row.currentPrice == null ? null : holdingValue(row)
  const pnl = pnlCalc(row)
  const pnlDirection = getDirection(pnl?.pct ?? 0)
  const rotation = getCardRotation(index, count)

  return (
    <figure
      data-slot="portfolio-share-holding"
      data-card-id={row.cardId}
      className="min-w-0"
      style={{ width }}
    >
      <div
        data-slot="portfolio-share-card-art"
        className="relative overflow-hidden"
        style={{
          width,
          height: artHeight,
          border: "8px solid #FFFFFF",
          borderRadius: 18,
          background: SHARE_COLORS.cardBack,
          boxShadow: "0 18px 34px rgba(23, 17, 13, 0.24)",
          transform: `rotate(${rotation}deg)`,
        }}
      >
        <div
          data-slot="portfolio-share-card-fallback"
          className="absolute inset-0 flex flex-col items-center justify-center text-center"
          style={{
            padding: 20,
            color: SHARE_COLORS.foreground,
            background: SHARE_COLORS.cardBack,
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/meecard.png"
            alt=""
            width={Math.round(width * 0.38)}
            height={Math.round(width * 0.35)}
            loading="eager"
            style={{
              width: Math.round(width * 0.38),
              height: Math.round(width * 0.35),
              objectFit: "contain",
            }}
          />
          <span
            className="mt-4 font-mono font-bold"
            style={{ fontSize: count <= 2 ? 22 : 17, color: BRAND_GOLD }}
          >
            {getShareCardCode(row)}
          </span>
          <span
            className="mt-2 font-semibold uppercase"
            style={{
              fontSize: count <= 2 ? 16 : 13,
              letterSpacing: 2,
              color: SHARE_COLORS.muted,
            }}
          >
            {row.rarity}
          </span>
        </div>
        {imageSrc ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={imageSrc}
            alt={name}
            width={width}
            height={artHeight}
            loading="eager"
            decoding="async"
            fetchPriority={index < 2 ? "high" : "auto"}
            className="absolute inset-0 h-full w-full object-cover"
            onError={(event) => {
              event.currentTarget.hidden = true
              event.currentTarget.dataset.failed = "true"
            }}
          />
        ) : null}
      </div>

      <figcaption
        className="min-w-0"
        style={{ padding: count <= 2 ? "22px 4px 0" : "18px 2px 0" }}
      >
        <p
          className="overflow-hidden font-bold"
          style={{
            display: "-webkit-box",
            minHeight: count <= 2 ? 58 : 48,
            fontSize: count <= 2 ? 25 : 20,
            lineHeight: 1.16,
            WebkitBoxOrient: "vertical",
            WebkitLineClamp: 2,
          }}
        >
          {name}
        </p>
        <p
          className="mt-2 font-mono"
          style={{ fontSize: count <= 2 ? 17 : 14, color: SHARE_COLORS.galleryMuted }}
        >
          {getShareCardCode(row)}
          {showQuantity ? (
            <span
              data-slot="portfolio-share-holding-quantity"
              className="ml-2 font-sans font-semibold"
              style={{ color: SHARE_COLORS.galleryInk, opacity: 0.66 }}
            >
              ×{row.quantity}
            </span>
          ) : null}
        </p>
        {showPrice || (showPerformance && pnl?.pct != null) ? (
          <div
            className="mt-2 flex min-w-0 items-baseline justify-between"
            style={{ gap: 8 }}
          >
            {showPrice ? (
              <span
                data-slot="portfolio-share-holding-price"
                className="min-w-0 truncate font-price font-bold tabular-nums"
                style={{ fontSize: count <= 2 ? 23 : 18 }}
              >
                {value == null
                  ? "—"
                  : hideBalance
                    ? maskText
                    : formatJpyAmount(value, currency)}
              </span>
            ) : null}
            {showPerformance && pnl?.pct != null ? (
              <span
                data-trend={pnlDirection}
                className="shrink-0 font-price font-bold tabular-nums"
                style={{
                  fontSize: count <= 2 ? 18 : 15,
                  color:
                    pnlDirection === "up"
                      ? "#177B4A"
                      : pnlDirection === "down"
                        ? "#C6473E"
                        : SHARE_COLORS.galleryMuted,
                }}
              >
                {pnl.pct > 0 ? "+" : ""}
                {formatPct(pnl.pct)}%
              </span>
            ) : null}
          </div>
        ) : null}
      </figcaption>
    </figure>
  )
}

function getDirection(value: number): Direction {
  if (value > 0) return "up"
  if (value < 0) return "down"
  return "neutral"
}

function getPortfolioMix(
  assets: AssetRow[],
  lang: Language,
): PortfolioMixItem[] {
  const byCard = new Map<
    number,
    { label: string; value: number; firstIndex: number }
  >()

  assets.forEach((row, index) => {
    if (row.currentPrice == null) return
    const value = Math.max(0, holdingValue(row))
    const existing = byCard.get(row.cardId)
    if (existing) {
      existing.value += value
      return
    }
    byCard.set(row.cardId, {
      label: getShareCardCode(row),
      value,
      firstIndex: index,
    })
  })

  const ranked = [...byCard.entries()]
    .map(([cardId, item]) => ({ cardId, ...item }))
    .filter((item) => item.value > 0)
    .sort((left, right) => {
      const byValue = right.value - left.value
      return byValue !== 0 ? byValue : left.firstIndex - right.firstIndex
    })
  const total = ranked.reduce((sum, item) => sum + item.value, 0)
  if (total <= 0) return []

  const visible = ranked.slice(0, 4).map((item, index) => ({
    key: String(item.cardId),
    label: item.label,
    percent: (item.value / total) * 100,
    color: SHARE_COLORS.allocation[index],
  }))
  const remainder = ranked
    .slice(4)
    .reduce((sum, item) => sum + item.value, 0)

  if (remainder > 0) {
    visible.push({
      key: "other",
      label: t(lang, "otherHoldings"),
      percent: (remainder / total) * 100,
      color: SHARE_COLORS.allocation[4],
    })
  }

  return visible
}

function getGalleryCardWidth(count: number, emphasized = false): number {
  if (emphasized) {
    if (count <= 1) return 380
    if (count === 2) return 330
    if (count === 3) return 260
    return 240
  }
  if (count <= 1) return 320
  if (count === 2) return 280
  if (count === 3) return 225
  return 190
}

function getGalleryGap(count: number, emphasized: boolean): number {
  if (emphasized && count >= 4) return 28
  if (count >= 4) return 18
  if (count === 3) return 22
  return 28
}

function getShareCardCode(row: AssetRow): string {
  const baseCode = row.baseCode ?? row.cardCode
  const parallel = row.cardCode.match(/_p(\d+)$/iu)?.[1]
  return parallel ? `${baseCode} · P${parallel}` : baseCode
}

function getCardRotation(index: number, count: number): number {
  const rotations: Record<number, number[]> = {
    1: [0],
    2: [-2.2, 2.2],
    3: [-2.5, 0, 2.5],
    4: [-2.6, -0.9, 0.9, 2.6],
  }
  return rotations[count]?.[index] ?? 0
}

function getShareImageSrc(src: string | null): string | null {
  if (!src) return null
  if (
    src.startsWith("/") ||
    src.startsWith("data:") ||
    src.startsWith("blob:")
  ) {
    return src
  }
  return `/_next/image?url=${encodeURIComponent(src)}&w=640&q=75`
}

function splitCurrencyAmount(
  formatted: string,
  currency: Currency,
): { amount: string; symbol: string; symbolFirst: boolean } {
  if (currency === "THB") {
    return {
      amount: formatted.replace(/\s*฿$/u, ""),
      symbol: "฿",
      symbolFirst: false,
    }
  }
  const symbol = currency === "USD" ? "$" : "¥"
  return {
    amount:
      currency === "USD"
        ? formatted.replace(/^\$/u, "")
        : formatted.replace(/^¥/u, ""),
    symbol,
    symbolFirst: true,
  }
}

function getValueScale(value: string): {
  label: "roomy" | "default" | "compact" | "tight"
  fontSize: number
  symbolSize: number
} {
  const length = value.length
  if (length <= 11) return { label: "roomy", fontSize: 128, symbolSize: 52 }
  if (length <= 16) return { label: "default", fontSize: 110, symbolSize: 46 }
  if (length <= 20) return { label: "compact", fontSize: 94, symbolSize: 40 }
  return { label: "tight", fontSize: 78, symbolSize: 34 }
}

function getNameScale(value: string): {
  label: "roomy" | "default" | "compact"
  fontSize: number
  maxHeight: number
} {
  if (value.length <= 22) {
    return { label: "roomy", fontSize: 58, maxHeight: 62 }
  }
  if (value.length <= 44) {
    return { label: "default", fontSize: 48, maxHeight: 100 }
  }
  return { label: "compact", fontSize: 40, maxHeight: 84 }
}

function getBrandHost(): string {
  try {
    const host = new URL(clientEnv().NEXT_PUBLIC_APP_URL).host
    if (/^(localhost|127\.0\.0\.1)(:\d+)?$/u.test(host)) return "meecard.app"
    return host.replace(/^www\./u, "")
  } catch {
    return "meecard.app"
  }
}
