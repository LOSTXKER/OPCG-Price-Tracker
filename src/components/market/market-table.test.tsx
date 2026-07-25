import { renderToStaticMarkup } from "react-dom/server"
import { describe, expect, it } from "vitest"

import type { CardRow } from "@/components/home/market-types"

import type { MarketColumn } from "./market-columns"
import { MarketTable } from "./market-table"

const COLUMNS: MarketColumn[] = [
  {
    key: "card",
    col: "",
    cell: "",
    labelKey: "card",
  },
]

const CARDS: CardRow[] = Array.from({ length: 9 }, (_, index) => ({
  id: index + 1,
  cardCode: `TST-${String(index + 1).padStart(3, "0")}`,
  nameJp: `Card ${index + 1}`,
  rarity: "C",
  isParallel: false,
}))

describe("MarketTable inset composition", () => {
  it("places the mobile block and valid desktop row between cards 8 and 9", () => {
    const markup = renderToStaticMarkup(
      <MarketTable
        cards={CARDS}
        rankOffset={0}
        columns={COLUMNS}
        sparklines={{}}
        sortCol={null}
        sortDir="desc"
        onColumnSort={() => undefined}
        isPending={false}
        skeletonRows={8}
        emptyText="No data"
        showMobileSort={false}
        insetAfter={8}
        mobileInset={<div data-slot="mobile-market-inset" />}
        tableInset={
          <tr data-slot="desktop-market-inset">
            <td colSpan={COLUMNS.length} />
          </tr>
        }
      />,
    )

    const mobileInset = markup.indexOf('data-slot="mobile-market-inset"')
    const desktopInset = markup.indexOf('data-slot="desktop-market-inset"')

    expect(mobileInset).toBeGreaterThan(markup.indexOf("TST-008"))
    expect(markup.indexOf("TST-009")).toBeGreaterThan(mobileInset)

    expect(desktopInset).toBeGreaterThan(
      markup.lastIndexOf("TST-008", desktopInset),
    )
    expect(markup.indexOf("TST-009", desktopInset)).toBeGreaterThan(
      desktopInset,
    )
    expect(markup).toContain(
      '<tr data-slot="desktop-market-inset"><td colSpan="1"></td></tr>',
    )
  })
})
