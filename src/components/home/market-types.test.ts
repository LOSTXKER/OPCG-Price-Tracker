import { describe, expect, it } from "vitest"

import {
  CHANGE_PERIODS,
  PERIOD_COLUMNS,
  parseSortColumn,
  periodForColumn,
  retargetSortForPeriod,
} from "./market-types"

describe("period ↔ change-column mapping", () => {
  it("maps every period to a column and back", () => {
    for (const period of CHANGE_PERIODS) {
      expect(periodForColumn(PERIOD_COLUMNS[period])).toBe(period)
    }
  })

  it("returns null for non-change columns", () => {
    expect(periodForColumn("price")).toBeNull()
    expect(periodForColumn("rarity")).toBeNull()
  })
})

describe("retargetSortForPeriod", () => {
  it("moves an active change sort to the new period, preserving direction", () => {
    expect(retargetSortForPeriod("change_desc", "7d")).toBe("change_7d_desc")
    expect(retargetSortForPeriod("change_7d_asc", "30d")).toBe("change_30d_asc")
    expect(retargetSortForPeriod("change_30d_desc", "24h")).toBe("change_desc")
  })

  it("stays put when the sort already matches the period", () => {
    expect(retargetSortForPeriod("change_7d_desc", "7d")).toBeNull()
  })

  it("leaves price/rarity/views sorts alone", () => {
    expect(retargetSortForPeriod("price_desc", "7d")).toBeNull()
    expect(retargetSortForPeriod("rarity_asc", "24h")).toBeNull()
    expect(retargetSortForPeriod("views_desc", "30d")).toBeNull()
  })
})

describe("parseSortColumn", () => {
  it("round-trips every change sort key", () => {
    expect(parseSortColumn("change_desc")).toEqual({ col: "change24h", dir: "desc" })
    expect(parseSortColumn("change_7d_asc")).toEqual({ col: "change7d", dir: "asc" })
    expect(parseSortColumn("views_desc")).toEqual({ col: null, dir: "desc" })
  })
})
