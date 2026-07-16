import { describe, expect, it } from "vitest";

import {
  buildWatchlistTabHref,
  getWatchlistTab,
} from "./watchlist-tab-query";

describe("watchlist tab query", () => {
  it("defaults to cards and preserves unrelated query when opening alerts", () => {
    const params = new URLSearchParams("demo=multigame&source=more");

    expect(getWatchlistTab(params)).toBe("cards");
    expect(buildWatchlistTabHref("/watchlist", params, "alerts")).toBe(
      "/watchlist?demo=multigame&source=more&tab=alerts",
    );
  });

  it("removes only tab when returning to cards", () => {
    const params = new URLSearchParams("tab=alerts&demo=multigame");

    expect(getWatchlistTab(params)).toBe("alerts");
    expect(buildWatchlistTabHref("/watchlist", params, "cards")).toBe(
      "/watchlist?demo=multigame",
    );
  });
});
