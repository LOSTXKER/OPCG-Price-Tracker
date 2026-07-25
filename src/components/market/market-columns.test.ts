import { describe, expect, it } from "vitest"

import { buildMarketColumns, getMarketColumnLabel } from "./market-columns"

describe("market column registry", () => {
  it("defines the shared trend column as a Raw 30-day graph", () => {
    const columns = buildMarketColumns({ showViews: false })
    const graph = columns.find((column) => column.key === "sparkline")

    expect(graph).toMatchObject({
      labelKey: "sparkline30d",
      col: expect.stringContaining("lg:table-column"),
      cell: expect.stringContaining("lg:table-cell"),
    })
  })

  it("keeps period and translated labels identical across market tables", () => {
    const columns = buildMarketColumns({ showViews: false })

    expect(
      columns.map((column) => getMarketColumnLabel(column, "TH")),
    ).toContain("24h")
    expect(
      getMarketColumnLabel(
        columns.find((column) => column.key === "sparkline")!,
        "TH",
      ),
    ).toBe("กราฟ 30 วัน")
  })
})
