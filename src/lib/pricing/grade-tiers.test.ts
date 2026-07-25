import { describe, expect, it } from "vitest"

import {
  GLOBAL_GRADE_TIERS,
  GRADE_TIERS,
  getGradePriceUsd,
  getGradePriceValue,
  hasGradePrice,
  isModeledGrade,
  isRawGrade,
} from "./grade-tiers"

describe("shared grade tiers", () => {
  it("keeps certification grades separate from card condition and records data truth", () => {
    expect(GRADE_TIERS.map((tier) => tier.key)).toEqual([
      "raw",
      "psa_10",
      "psa_9",
      "psa_8",
      "bgs_95",
    ])
    expect(GLOBAL_GRADE_TIERS).toHaveLength(5)
    expect(GRADE_TIERS.filter((tier) => tier.dataKind === "real").map((tier) => tier.key)).toEqual([
      "raw",
      "psa_10",
    ])
    expect(GRADE_TIERS.filter((tier) => tier.dataKind === "modeled").map((tier) => tier.key)).toEqual([
      "psa_9",
      "psa_8",
      "bgs_95",
    ])
    expect(GRADE_TIERS.every((tier) => !("condition" in tier))).toBe(true)
  })

  it("derives modeled USD prices from the PSA 10 anchor", () => {
    expect(getGradePriceUsd(100, "raw")).toBeNull()
    expect(getGradePriceUsd(100, "psa_10")).toBe(100)
    expect(getGradePriceUsd(100, "psa_9")).toBe(50)
    expect(getGradePriceUsd(100, "psa_8")).toBe(32)
    expect(getGradePriceUsd(100, "bgs_95")).toBe(115)
    expect(getGradePriceUsd(0, "psa_9")).toBeNull()
    expect(getGradePriceUsd(Number.NaN, "psa_9")).toBeNull()
  })

  it("resolves native values and availability without mixing currencies", () => {
    const anchors = { rawPriceJpy: 12_000, psa10PriceUsd: 80 }

    expect(getGradePriceValue(anchors, "raw")).toEqual({
      amount: 12_000,
      currency: "JPY",
      dataKind: "real",
      source: "YUYUTEI",
    })
    expect(getGradePriceValue(anchors, "psa_9")).toEqual({
      amount: 40,
      currency: "USD",
      dataKind: "modeled",
      source: "SNKRDUNK",
    })
    expect(hasGradePrice({ rawPriceJpy: null, psa10PriceUsd: 80 }, "raw")).toBe(false)
    expect(hasGradePrice({ rawPriceJpy: null, psa10PriceUsd: 80 }, "bgs_95")).toBe(true)
    expect(isRawGrade("raw")).toBe(true)
    expect(isModeledGrade("psa_10")).toBe(false)
    expect(isModeledGrade("bgs_95")).toBe(true)
  })
})
