import type {
  AssetRow,
  HistoryPoint,
  PortfolioStats,
} from "@/lib/types/portfolio"

const DAY_MS = 24 * 60 * 60 * 1000

export type PortfolioCopyCoverage = {
  totalCopyCount: number
  coveredCopyCount: number
  percent: number
  complete: boolean
}

export type PortfolioInsightHistoryPoint = HistoryPoint & {
  source: "snapshot" | "live"
  valuationStatus: "recorded" | "complete" | "partial"
  valuationCoverage: PortfolioCopyCoverage | null
}

export type MergePortfolioHistoryOptions = {
  now?: Date
  liveLabel?: string
  /** Calendar used to decide whether a snapshot and the live value share a day. */
  timeZone?: string
}

type LivePortfolioStats = Pick<
  PortfolioStats,
  | "estimatedValueJpy"
  | "recordedCostJpy"
  | "totalCopyCount"
  | "valuedCopyCount"
  | "costedCopyCount"
  | "valuationComplete"
>

export type PortfolioConcentrationGroup = {
  cardId: number
  /** First row supplies card identity; quantity/value below are group totals. */
  asset: AssetRow
  quantity: number
  valueJpy: number
  percent: number | null
}

export type PortfolioConcentration = {
  groups: PortfolioConcentrationGroup[]
  totalValueJpy: number
  top1ValueJpy: number
  top3ValueJpy: number
  top1Percent: number | null
  top3Percent: number | null
  coverage: PortfolioCopyCoverage
}

export type Portfolio24hPerformance = {
  /** Withheld unless every physical copy has reconstructable 24h data. */
  impactJpy: number | null
  returnPct: number | null
  currentValueJpy: number | null
  previousValueJpy: number | null
  coverage: PortfolioCopyCoverage
}

export type PortfolioTrackedSpan = {
  startedAt: string | null
  latestAt: string | null
  /** Inclusive calendar-day span: one point tracked today is one day. */
  daySpan: number
  pointCount: number
  snapshotCount: number
}

function positiveQuantity(quantity: number): number {
  return Number.isFinite(quantity) && quantity > 0 ? quantity : 0
}

function isKnownPrice(price: number | null): price is number {
  return price !== null && Number.isFinite(price) && price >= 0
}

function getCoverage(
  totalCopyCount: number,
  coveredCopyCount: number,
): PortfolioCopyCoverage {
  return {
    totalCopyCount,
    coveredCopyCount,
    percent:
      totalCopyCount > 0 ? (coveredCopyCount / totalCopyCount) * 100 : 0,
    complete:
      totalCopyCount > 0 && coveredCopyCount === totalCopyCount,
  }
}

function calendarDayKey(date: Date, timeZone?: string): string {
  if (!timeZone) {
    return [
      date.getFullYear(),
      String(date.getMonth() + 1).padStart(2, "0"),
      String(date.getDate()).padStart(2, "0"),
    ].join("-")
  }

  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date)
  const part = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((entry) => entry.type === type)?.value ?? ""

  return `${part("year")}-${part("month")}-${part("day")}`
}

function validDatedPoints<T extends HistoryPoint>(
  points: readonly T[],
): Array<{ point: T; timestamp: number }> {
  return points
    .map((point) => ({ point, timestamp: new Date(point.date).getTime() }))
    .filter(({ timestamp }) => Number.isFinite(timestamp))
}

/**
 * Merge persisted snapshots with today's live valuation without inventing a
 * historical line. A live zero is retained only when at least one physical
 * copy really has a known zero price; no priced copies means no live point.
 */
export function mergePortfolioHistoryWithLive(
  history: readonly HistoryPoint[],
  stats: LivePortfolioStats,
  options: MergePortfolioHistoryOptions = {},
): PortfolioInsightHistoryPoint[] {
  const now = options.now ?? new Date()
  const snapshotsByDay = new Map<string, PortfolioInsightHistoryPoint>()

  for (const { point } of validDatedPoints(history).sort(
    (a, b) => a.timestamp - b.timestamp,
  )) {
    snapshotsByDay.set(calendarDayKey(new Date(point.date), options.timeZone), {
      ...point,
      source: "snapshot",
      valuationStatus: "recorded",
      valuationCoverage: null,
    })
  }

  const merged = [...snapshotsByDay.values()].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
  )
  const canPlotLive =
    Number.isFinite(now.getTime()) &&
    stats.totalCopyCount > 0 &&
    stats.valuedCopyCount > 0 &&
    Number.isFinite(stats.estimatedValueJpy) &&
    stats.estimatedValueJpy >= 0

  if (!canPlotLive) return merged

  const liveDay = calendarDayKey(now, options.timeZone)
  const sameDayIndex = merged.findIndex(
    (point) =>
      calendarDayKey(new Date(point.date), options.timeZone) === liveDay,
  )
  const preceding = merged
    .filter(
      (point) =>
        calendarDayKey(new Date(point.date), options.timeZone) !== liveDay &&
        new Date(point.date).getTime() < now.getTime(),
    )
    .at(-1)
  const coverage = getCoverage(stats.totalCopyCount, stats.valuedCopyCount)
  const precedingCopyCount = preceding?.totalCopyCount ?? null
  const livePoint: PortfolioInsightHistoryPoint = {
    label:
      options.liveLabel ??
      now.toLocaleDateString(undefined, { month: "short", day: "numeric" }),
    date: now.toISOString(),
    value: stats.estimatedValueJpy,
    cost: stats.recordedCostJpy,
    netInvested: stats.recordedCostJpy,
    cardCount: stats.totalCopyCount,
    totalCopyCount: stats.totalCopyCount,
    costedCopyCount: stats.costedCopyCount,
    isInflow:
      preceding != null &&
      (precedingCopyCount != null
        ? stats.totalCopyCount > precedingCopyCount
        : stats.recordedCostJpy > preceding.netInvested),
    source: "live",
    valuationStatus: stats.valuationComplete ? "complete" : "partial",
    valuationCoverage: coverage,
  }

  if (sameDayIndex >= 0) merged[sameDayIndex] = livePoint
  else merged.push(livePoint)

  return merged.sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
  )
}

/** Filter by elapsed time rather than by an arbitrary number of stored rows. */
export function filterPortfolioHistoryByDays<T extends HistoryPoint>(
  points: readonly T[],
  days: number,
  now: Date = new Date(),
): T[] {
  if (!Number.isFinite(days) || days <= 0 || !Number.isFinite(now.getTime())) {
    return []
  }

  const latest = now.getTime()
  const cutoff = latest - days * DAY_MS
  return validDatedPoints(points)
    .filter(({ timestamp }) => timestamp >= cutoff && timestamp <= latest)
    .sort((a, b) => a.timestamp - b.timestamp)
    .map(({ point }) => point)
}

/**
 * Measure the real calendar span represented by the plotted points. The count
 * keeps live points separate from persisted snapshots for honest UI copy.
 */
export function getPortfolioTrackedSpan(
  points: readonly HistoryPoint[],
  options: Pick<MergePortfolioHistoryOptions, "timeZone"> = {},
): PortfolioTrackedSpan {
  const dated = validDatedPoints(points).sort(
    (a, b) => a.timestamp - b.timestamp,
  )
  if (dated.length === 0) {
    return {
      startedAt: null,
      latestAt: null,
      daySpan: 0,
      pointCount: 0,
      snapshotCount: 0,
    }
  }

  const first = dated[0]
  const last = dated.at(-1) as (typeof dated)[number]
  const firstDay = calendarDayKey(new Date(first.point.date), options.timeZone)
  const lastDay = calendarDayKey(new Date(last.point.date), options.timeZone)
  const toUtcDay = (day: string) => Date.parse(`${day}T00:00:00.000Z`)
  const pointCount = new Set(
    dated.map(({ point }) =>
      calendarDayKey(new Date(point.date), options.timeZone),
    ),
  ).size

  return {
    startedAt: first.point.date,
    latestAt: last.point.date,
    daySpan:
      Math.round((toUtcDay(lastDay) - toUtcDay(firstDay)) / DAY_MS) + 1,
    pointCount,
    snapshotCount: dated.filter(({ point }) => {
      const source = (point as Partial<PortfolioInsightHistoryPoint>).source
      return source !== "live"
    }).length,
  }
}

/** Group holding rows by card id so different conditions do not double-count. */
export function getPortfolioConcentration(
  assets: readonly AssetRow[],
): PortfolioConcentration {
  const grouped = new Map<
    number,
    Omit<PortfolioConcentrationGroup, "percent">
  >()
  let totalCopyCount = 0
  let coveredCopyCount = 0
  let totalValueJpy = 0

  for (const asset of assets) {
    const quantity = positiveQuantity(asset.quantity)
    if (quantity === 0) continue
    totalCopyCount += quantity

    const currentPrice = asset.currentPrice
    const knownPrice = isKnownPrice(currentPrice)
    const valueJpy = knownPrice ? currentPrice * quantity : 0
    if (knownPrice) {
      coveredCopyCount += quantity
      totalValueJpy += valueJpy
    }

    const existing = grouped.get(asset.cardId)
    if (existing) {
      existing.quantity += quantity
      existing.valueJpy += valueJpy
    } else {
      grouped.set(asset.cardId, {
        cardId: asset.cardId,
        asset,
        quantity,
        valueJpy,
      })
    }
  }

  const coverage = getCoverage(totalCopyCount, coveredCopyCount)
  const canCalculateShare = coverage.complete && totalValueJpy > 0
  const groups = [...grouped.values()]
    .sort(
      (a, b) =>
        b.valueJpy - a.valueJpy || a.asset.cardCode.localeCompare(b.asset.cardCode),
    )
    .map((group) => ({
      ...group,
      percent: canCalculateShare
        ? (group.valueJpy / totalValueJpy) * 100
        : null,
    }))
  const top1ValueJpy = groups[0]?.valueJpy ?? 0
  const top3ValueJpy = groups
    .slice(0, 3)
    .reduce((sum, group) => sum + group.valueJpy, 0)

  return {
    groups,
    totalValueJpy,
    top1ValueJpy,
    top3ValueJpy,
    top1Percent: canCalculateShare
      ? (top1ValueJpy / totalValueJpy) * 100
      : null,
    top3Percent: canCalculateShare
      ? (top3ValueJpy / totalValueJpy) * 100
      : null,
    coverage,
  }
}

/**
 * Reconstruct one holding's previous value from the stored current value and
 * 24h percentage. A -100% move is not reversible and remains uncovered.
 */
export function getAsset24hImpactJpy(
  currentPrice: number | null,
  priceChange24h: number | null,
  quantity: number,
): number | null {
  if (
    !isKnownPrice(currentPrice) ||
    priceChange24h === null ||
    !Number.isFinite(priceChange24h) ||
    priceChange24h <= -100 ||
    positiveQuantity(quantity) === 0
  ) {
    return null
  }

  const impact =
    (currentPrice * priceChange24h * quantity) / (100 + priceChange24h)
  return Number.isFinite(impact) ? impact : null
}

/**
 * Aggregate 24h movement only when every physical copy is covered. Known rows
 * are deliberately not exposed as a portfolio total when coverage is partial.
 */
export function getPortfolio24hPerformance(
  assets: readonly AssetRow[],
): Portfolio24hPerformance {
  let totalCopyCount = 0
  let coveredCopyCount = 0
  let currentValueJpy = 0
  let impactJpy = 0

  for (const asset of assets) {
    const quantity = positiveQuantity(asset.quantity)
    if (quantity === 0) continue
    totalCopyCount += quantity

    const impact = getAsset24hImpactJpy(
      asset.currentPrice,
      asset.priceChange24h,
      quantity,
    )
    if (impact === null || !isKnownPrice(asset.currentPrice)) continue

    coveredCopyCount += quantity
    currentValueJpy += asset.currentPrice * quantity
    impactJpy += impact
  }

  const coverage = getCoverage(totalCopyCount, coveredCopyCount)
  if (!coverage.complete) {
    return {
      impactJpy: null,
      returnPct: null,
      currentValueJpy: null,
      previousValueJpy: null,
      coverage,
    }
  }

  const previousValueJpy = currentValueJpy - impactJpy
  return {
    impactJpy,
    returnPct:
      previousValueJpy > 0 ? (impactJpy / previousValueJpy) * 100 : null,
    currentValueJpy,
    previousValueJpy,
    coverage,
  }
}
