import { describe, expect, it } from "vitest";

import { isPriceHistoryRangeLocked } from "./price-range-control";

describe("card detail price-history range gates", () => {
  it("keeps Free at 30 days", () => {
    expect(isPriceHistoryRangeLocked("7D", 30)).toBe(false);
    expect(isPriceHistoryRangeLocked("1M", 30)).toBe(false);
    expect(isPriceHistoryRangeLocked("3M", 30)).toBe(true);
    expect(isPriceHistoryRangeLocked("1Y", 30)).toBe(true);
    expect(isPriceHistoryRangeLocked("All", 30)).toBe(true);
  });

  it("keeps Pro at one year and Pro+ unlimited", () => {
    expect(isPriceHistoryRangeLocked("1Y", 365)).toBe(false);
    expect(isPriceHistoryRangeLocked("All", 365)).toBe(true);
    expect(isPriceHistoryRangeLocked("All", Infinity)).toBe(false);
  });
});
