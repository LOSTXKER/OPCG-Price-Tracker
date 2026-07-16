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

const noop = () => undefined;

function renderList({ hasSparkline = false }: { hasSparkline?: boolean } = {}) {
  return renderToStaticMarkup(
    <WatchlistListView
      entries={[entry]}
      period="7d"
      editMode={false}
      selected={new Set()}
      onToggleSelect={noop}
      sparklines={hasSparkline ? { 1: [1, 2, 3] } : {}}
      hasAnySparkline={hasSparkline}
      onTogglePin={noop}
      onSetAlert={noop}
      onRemove={noop}
      removingIds={new Set()}
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
});
