import { load } from "cheerio";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { WatchlistMockPreview } from "./watchlist-mock-preview";
import { WatchlistSkeleton } from "./watchlist-skeleton";

describe("watchlist tab loading parity", () => {
  it.each([
    ["preview", <WatchlistMockPreview key="preview" lang="TH" />],
    ["skeleton", <WatchlistSkeleton key="skeleton" />],
  ])("keeps the %s rail at 44px mobile and 40px desktop", (_, node) => {
    const markup = renderToStaticMarkup(node);

    expect(markup).toContain("h-11");
    expect(markup).toContain("md:h-10");
  });

  it.each([
    [
      "preview",
      <WatchlistMockPreview key="preview" lang="TH" />,
      "watchlist-preview-toolbar",
      "watchlist-preview-game-filter",
      "watchlist-preview-mobile-search",
      "watchlist-preview-mobile-grade",
    ],
    [
      "skeleton",
      <WatchlistSkeleton key="skeleton" />,
      "watchlist-skeleton-toolbar",
      "watchlist-skeleton-game-filter",
      "watchlist-skeleton-mobile-search",
      "watchlist-skeleton-mobile-grade",
    ],
  ])(
    "integrates the %s game context before search and grade",
    (_, node, toolbarSlot, gameSlot, searchSlot, gradeSlot) => {
      const markup = renderToStaticMarkup(node);
      const positions = [gameSlot, searchSlot, gradeSlot].map((slot) =>
        markup.indexOf(`data-slot="${slot}"`),
      );
      const $ = load(markup);
      const toolbar = $(`[data-slot="${toolbarSlot}"]`);

      expect(positions.every((position) => position >= 0)).toBe(true);
      expect(positions).toEqual([...positions].sort((a, b) => a - b));
      expect(toolbar).toHaveLength(1);
      expect(toolbar.find(`[data-slot="${gameSlot}"]`)).toHaveLength(1);
      expect(toolbar.attr("class")).toContain(
        "sm:grid-cols-[auto_minmax(0,1fr)]",
      );
      expect(toolbar.attr("class")).toContain(
        "lg:grid-cols-[auto_minmax(0,1fr)_auto]",
      );
    },
  );

  it("shows a compact aggregate trigger without advertising unavailable games", () => {
    const markup = renderToStaticMarkup(<WatchlistMockPreview lang="TH" />);

    expect(markup).toContain('data-slot="game-scope-select"');
    expect(markup).toContain('aria-label="กรองตามเกม: ทุกเกม"');
    expect(markup).toContain("ทุกเกม");
    expect(markup).not.toContain("Pokémon");
    expect(markup).not.toContain('role="radiogroup"');
  });
});
