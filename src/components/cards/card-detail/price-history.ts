import { PRICE_SOURCE } from "@/lib/constants/prices"
import { jpyToThb } from "@/lib/utils/currency"

export type PriceHistoryPoint = {
  /** ISO timestamp of the observation kept for that UTC day. */
  dateIso: string
  priceJpy: number
  priceThb: number
  /** % change vs the previous (older) kept point — null for the oldest one. */
  changePct: number | null
}

export type PriceHistoryWindow = {
  days: number
  lowJpy: number
  highJpy: number
  avgJpy: number
  lowThb: number
  highThb: number
  avgThb: number
  count: number
}

export type PriceHistorySummary = {
  /** Newest first, one row per UTC day, capped at `maxPoints`. */
  points: PriceHistoryPoint[]
  windows: PriceHistoryWindow[]
  latestIso: string | null
}

const PRICE_HISTORY_WINDOWS = [7, 30, 90]

/**
 * Real price history for the card page: one raw (ungraded) reference point per
 * UTC day plus 7/30/90-day low/high/average, derived from the `CardPrice` rows
 * the page already fetched (`buildChartData` output).
 *
 * Windows are measured back from the newest observation rather than `Date.now()`
 * so the output is deterministic (the page is ISR-cached) and still meaningful
 * when a card has not been rescraped recently.
 *
 * Deliberately prisma-free so it stays unit-testable and importable from a
 * server component without dragging the DB client along.
 */
export function derivePriceHistory(
  rows: {
    scrapedAt: string
    priceJpy: number | null
    priceThb: number | null
    source?: string
    gradeCondition?: string | null
  }[],
  options?: { maxPoints?: number },
): PriceHistorySummary {
  const maxPoints = options?.maxPoints ?? 10

  const raw = rows.filter((r) => !r.gradeCondition && r.priceJpy != null && r.priceJpy > 0)
  const yuyutei = raw.filter((r) => r.source === PRICE_SOURCE.YUYUTEI)
  const pool = yuyutei.length > 0 ? yuyutei : raw

  // Newest observation wins for a given UTC day.
  const byDay = new Map<string, { scrapedAt: string; priceJpy: number; priceThb: number | null }>()
  for (const r of pool) {
    const day = r.scrapedAt.slice(0, 10)
    const existing = byDay.get(day)
    if (!existing || new Date(r.scrapedAt).getTime() > new Date(existing.scrapedAt).getTime()) {
      byDay.set(day, {
        scrapedAt: r.scrapedAt,
        priceJpy: r.priceJpy as number,
        priceThb: r.priceThb,
      })
    }
  }

  const ascending = [...byDay.values()].sort(
    (a, b) => new Date(a.scrapedAt).getTime() - new Date(b.scrapedAt).getTime(),
  )
  if (ascending.length === 0) return { points: [], windows: [], latestIso: null }

  const latest = ascending[ascending.length - 1]!
  const latestMs = new Date(latest.scrapedAt).getTime()

  const points: PriceHistoryPoint[] = ascending
    .map((entry, i) => {
      const prev = i > 0 ? ascending[i - 1]! : null
      return {
        dateIso: entry.scrapedAt,
        priceJpy: entry.priceJpy,
        priceThb:
          entry.priceThb != null && entry.priceThb > 0
            ? Math.round(entry.priceThb)
            : Math.round(jpyToThb(entry.priceJpy)),
        changePct:
          prev && prev.priceJpy > 0
            ? Math.round(((entry.priceJpy - prev.priceJpy) / prev.priceJpy) * 1000) / 10
            : null,
      }
    })
    .reverse()
    .slice(0, maxPoints)

  const windows: PriceHistoryWindow[] = []
  for (const days of PRICE_HISTORY_WINDOWS) {
    const cutoff = latestMs - days * 86_400_000
    const inWindow = ascending.filter((e) => new Date(e.scrapedAt).getTime() >= cutoff)
    if (inWindow.length < 2) continue
    const values = inWindow.map((e) => e.priceJpy)
    const lowJpy = Math.min(...values)
    const highJpy = Math.max(...values)
    const avgJpy = Math.round(values.reduce((sum, v) => sum + v, 0) / values.length)
    windows.push({
      days,
      lowJpy,
      highJpy,
      avgJpy,
      lowThb: Math.round(jpyToThb(lowJpy)),
      highThb: Math.round(jpyToThb(highJpy)),
      avgThb: Math.round(jpyToThb(avgJpy)),
      count: inWindow.length,
    })
  }

  return { points, windows, latestIso: latest.scrapedAt }
}
