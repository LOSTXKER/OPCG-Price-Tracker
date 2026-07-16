import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { t } from "@/lib/i18n";

import { WatchlistListView } from "./watchlist-list-view";
import type { WatchlistEntry } from "./watchlist-types";

const entry: WatchlistEntry = {
  id: 1,
  cardId: 1,
  pinnedAt: null,
  addedAt: "2026-07-16T00:00:00.000Z",
  hasActiveAlert: false,
  card: {
    id: 1,
    cardCode: "OP01-001",
    baseCode: null,
    nameJp: "カード",
    nameEn: "Card",
    nameTh: "การ์ด",
    rarity: "SR",
    imageUrl: null,
    latestPriceJpy: 100,
    latestPriceThb: 25,
    priceChange24h: 1,
    priceChange7d: 2,
    priceChange30d: 3,
    set: {
      code: "OP01",
      game: {
        slug: "opcg",
        name: "One Piece Card Game",
        nameEn: "One Piece Card Game",
        logoUrl: null,
      },
    },
  },
};

const pinnedAlertedEntry: WatchlistEntry = {
  ...entry,
  id: 2,
  cardId: 2,
  pinnedAt: "2026-07-10T00:00:00.000Z",
  hasActiveAlert: true,
};

const noop = () => undefined;

function renderList({
  hasSparkline = false,
  entries = [entry],
  period = "7d" as const,
  onPeriodSort,
}: {
  hasSparkline?: boolean;
  entries?: WatchlistEntry[];
  period?: "24h" | "7d" | "30d";
  onPeriodSort?: (period: "24h" | "7d" | "30d") => void;
} = {}) {
  return renderToStaticMarkup(
    <WatchlistListView
      entries={entries}
      period={period}
      editMode={false}
      selected={new Set()}
      onToggleSelect={noop}
      sparklines={hasSparkline ? { 1: [1, 2, 3] } : {}}
      hasAnySparkline={hasSparkline}
      onTogglePin={noop}
      onSetAlert={noop}
      onRemove={noop}
      removingIds={new Set()}
      onPeriodSort={onPeriodSort}
    />,
  );
}

describe("watchlist flat list view", () => {
  it("keeps the desktop table on the page canvas and omits empty utility columns", () => {
    const markup = renderList();

    expect(markup).toContain('class="hidden sm:block"');
    expect(markup).not.toContain('class="panel hidden');
    expect(markup).not.toContain(t("TH", "priceHistory"));
    expect(markup).not.toContain(t("TH", "watchlistFilterStatus"));
  });

  it("restores the history column only when sparkline data is useful", () => {
    const markup = renderList({ hasSparkline: true });

    expect(markup).toContain(t("TH", "priceHistory"));
    expect(markup).toContain("<polyline");
  });

  it("drops the overlapping thumbnail badges and moves pin/alert inline next to the card code", () => {
    const markup = renderList({ entries: [pinnedAlertedEntry] });

    // The old circular badges sat absolutely positioned on top of the artwork.
    expect(markup).not.toContain("ring-2 ring-background");

    // Mobile CardIdentity (inline icons) + desktop WatchlistStatus (circle
    // icons) both use role="img" for pin/alert — 2 surfaces x 2 icons.
    expect(markup.match(/role="img"/g)).toHaveLength(4);
    expect(markup).toContain(t("TH", "watchlistPinned"));
    expect(markup).toContain(t("TH", "watchlistHasAlert"));
  });

  it("keeps status icons out of the meta line when a card is neither pinned nor alerted", () => {
    const markup = renderList({ entries: [entry] });

    expect(markup).not.toContain(t("TH", "watchlistPinned"));
    expect(markup).not.toContain(t("TH", "watchlistHasAlert"));
  });

  it("renders 24H/7D/30D as sortable desktop column headers with the active period highlighted", () => {
    const onPeriodSort = () => undefined;
    const markup = renderList({ period: "7d", onPeriodSort });

    expect(markup).toContain(">24H<");
    expect(markup).toContain(">7D<");
    expect(markup).toContain(">30D<");
    expect(markup.match(/aria-pressed="true"/g)).toHaveLength(1);
    expect(markup.match(/aria-pressed="false"/g)).toHaveLength(2);
    expect(markup).toContain("xl:table-cell");
  });
});
