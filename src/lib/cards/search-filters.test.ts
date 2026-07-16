import { describe, expect, it } from "vitest"

import {
  buildCardSearchFacets,
  countAllSearchFilters,
  countSearchModalFilters,
  createEmptySearchFilters,
  resetSearchModalFilters,
  serializeSearchFilters,
  toggleSearchMultiFilter,
  type SearchFilters,
} from "./search-filters"

describe("search filter state", () => {
  it("toggles multi-select values without losing the other filters", () => {
    const initial = { ...createEmptySearchFilters(), set: "OP13" }
    const withLeader = toggleSearchMultiFilter(initial, "types", "LEADER")
    const withCharacter = toggleSearchMultiFilter(withLeader, "types", "CHARACTER")

    expect(withCharacter.types).toEqual(["LEADER", "CHARACTER"])
    expect(withCharacter.set).toBe("OP13")
    expect(toggleSearchMultiFilter(withCharacter, "types", "LEADER").types).toEqual([
      "CHARACTER",
    ])
  })

  it("resets modal facets atomically while preserving the set picker", () => {
    const filters: SearchFilters = {
      set: "OP13",
      rarities: ["SEC", "SR"],
      types: ["LEADER"],
      colors: ["Yellow"],
      variant: "parallel",
      minPrice: "100",
      maxPrice: "5000",
    }

    expect(resetSearchModalFilters(filters)).toEqual({
      ...createEmptySearchFilters(),
      set: "OP13",
    })
    expect(countSearchModalFilters(filters)).toBe(7)
    expect(countAllSearchFilters(filters)).toBe(8)
  })

  it("serializes comma filters and ignores non-positive prices", () => {
    expect(serializeSearchFilters({
      set: "OP13",
      rarities: ["SEC", "SR"],
      types: ["LEADER", "CHARACTER"],
      colors: ["Yellow", "multi"],
      variant: "regular",
      minPrice: "0",
      maxPrice: "5000",
    })).toEqual({
      set: "OP13",
      rarity: "SEC,SR",
      type: "LEADER,CHARACTER",
      color: "Yellow,multi",
      variant: "regular",
      minPrice: undefined,
      maxPrice: 5000,
    })
  })
})

describe("search facet availability", () => {
  it("collapses parallel rarity families and normalizes multi-color cards", () => {
    const facets = buildCardSearchFacets([
      {
        setId: 13,
        rarity: "P-SEC",
        cardType: "LEADER",
        colorEn: "Red/Green",
        isParallel: true,
      },
      {
        setId: 13,
        rarity: "SEC",
        cardType: "LEADER",
        colorEn: "Red/Green",
        isParallel: false,
      },
      {
        setId: 13,
        rarity: "R",
        cardType: "CHARACTER",
        colorEn: "Yellow",
        isParallel: false,
      },
      {
        setId: 14,
        rarity: "SP",
        cardType: "CHARACTER",
        colorEn: null,
        isParallel: true,
      },
    ])

    expect(facets).toEqual({
      setIds: [13, 14],
      rarities: ["R", "SEC", "SP"],
      types: ["CHARACTER", "LEADER"],
      colors: ["Yellow", "multi"],
      variants: ["regular", "parallel"],
    })
  })

  it("returns empty availability when the query has no matches", () => {
    expect(buildCardSearchFacets([])).toEqual({
      setIds: [],
      rarities: [],
      types: [],
      colors: [],
      variants: [],
    })
  })
})
