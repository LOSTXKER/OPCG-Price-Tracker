import { usdToJpy } from "@/lib/utils/currency"

/**
 * A settled-sale row for the "ประวัติการซื้อขายล่าสุด" feed.
 *
 * These are REAL observations now: the SNKRDUNK scraper already writes
 * `CardPrice` rows with `type = SOLD` (last sold price, per grade), so the feed
 * that used to be filled with `mockRecentSales` is built from the database
 * instead. Nothing about the schema changed — the data was always being stored,
 * it just was not read back.
 *
 * Caveat that the UI copy has to respect: `scrapedAt` is when WE recorded the
 * price, not the instant the card changed hands. A source reports "last sold
 * price"; the honest reading of a row is "on this date the last recorded sale
 * stood at this price".
 */
export type SaleRow = {
  source: string
  /** Human label for the condition column, e.g. "PSA 10" or "Raw". */
  condition: string
  /** Grading family for the logo/chip ("psa" | "bgs" | "cgc" | "ars"); null = ungraded. */
  family: string | null
  priceJpy: number
  soldAtIso: string
}

export type SoldPriceRow = {
  source: string
  gradeCondition: string | null
  priceJpy: number | null
  priceUsd: number | null
  scrapedAt: string
}

const GRADING_FAMILY = /^(psa|bgs|cgc|ars)\b/i

function familyOf(gradeCondition: string | null): string | null {
  const match = gradeCondition?.match(GRADING_FAMILY)
  return match ? match[1]!.toLowerCase() : null
}

function toJpy(row: SoldPriceRow): number | null {
  if (row.priceJpy != null && row.priceJpy > 0) return row.priceJpy
  if (row.priceUsd != null && row.priceUsd > 0) return usdToJpy(row.priceUsd)
  return null
}

/**
 * Collapse the raw SOLD rows into a readable feed.
 *
 * Every scrape re-records the source's "last sold price", so the same sale shows
 * up again and again with a newer timestamp. Consecutive rows that share source
 * + grade + price are therefore one event, and the OLDEST timestamp in that run
 * is the closest thing we have to when it actually sold.
 */
export function deriveSoldFeed(
  rows: SoldPriceRow[],
  options?: { limit?: number },
): SaleRow[] {
  const limit = options?.limit ?? 12

  // Newest first — the caller's query order is not trusted.
  const sorted = [...rows].sort(
    (a, b) => new Date(b.scrapedAt).getTime() - new Date(a.scrapedAt).getTime(),
  )

  const out: SaleRow[] = []
  // Per source+grade, the run of identical prices currently being collapsed.
  const open = new Map<string, { index: number; priceJpy: number }>()

  for (const row of sorted) {
    const priceJpy = toJpy(row)
    if (priceJpy == null) continue

    const key = `${row.source}|${row.gradeCondition ?? ""}`
    const current = open.get(key)

    if (current && current.priceJpy === priceJpy) {
      // Same price still standing — walk the run's date back to this older row.
      out[current.index]!.soldAtIso = row.scrapedAt
      continue
    }

    open.set(key, { index: out.length, priceJpy })
    out.push({
      source: row.source,
      condition: row.gradeCondition?.trim() || "Raw",
      family: familyOf(row.gradeCondition),
      priceJpy,
      soldAtIso: row.scrapedAt,
    })
  }

  return out.slice(0, limit)
}
