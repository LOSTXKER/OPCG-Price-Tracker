/** Shared 4-col layout for market tables (recent sales + Meecard asks). Col 1 =
 *  source/seller · col 2 = date · col 3 = condition · col 4 = price. */
/** Mock feed length — recent sales sample table. */
export const MARKET_FEED_MOCK_COUNT = 12
/** Mock feed length — Meecard asks (longer so scroll is obvious). */
export const MARKET_FEED_MOCK_LISTINGS_COUNT = 18

export const MARKET_TABLE_CLASS = "w-full table-fixed border-collapse"

/** Desktop table body viewport — ~5 rows; scrollbar gutter keeps price off the edge. */
export const marketFeedTableScroll =
  "max-h-[20rem] overflow-y-auto overscroll-y-contain [scrollbar-gutter:stable]"

/** Mobile list viewport — ~5 taller rows; hint overlay instead of scrollbar. */
export const marketFeedListScroll =
  "no-sb max-h-[24rem] overflow-y-auto overscroll-y-contain divide-y divide-hair px-1"

export const marketFeedStickyHead =
  "sticky top-0 z-[1] bg-background shadow-[inset_0_-1px_0_0_var(--p-hair)]"

export function MarketTableColGroup() {
  return (
    <colgroup>
      <col style={{ width: "34%" }} />
      <col style={{ width: "17%" }} />
      <col style={{ width: "21%" }} />
      <col style={{ width: "28%" }} />
    </colgroup>
  )
}

export const marketThLead = "py-2.5 pl-1 pr-3 text-left"
export const marketThPrice = "py-2.5 pl-2 pr-4 text-right tabular-nums"
export const marketTdLead = "py-3 pl-1 pr-3"
export const marketTdPrice = "py-3 pl-2 pr-4 text-right tabular-nums"

/** Primary cell — 18px icon + label (source logo or seller avatar). */
export const marketPrimaryCell = "flex min-w-0 items-center gap-2"
