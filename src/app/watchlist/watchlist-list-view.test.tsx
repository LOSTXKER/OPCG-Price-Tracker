import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

import { t } from "@/lib/i18n";

// The desktop row is fully clickable (router.push to the card) alongside the
// identity <Link> — this file renders via renderToStaticMarkup with no app
// router mounted, so useRouter needs a stub.
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: () => undefined }),
}));

import {
  WatchlistListView,
  type WatchlistHeaderCol,
} from "./watchlist-list-view";
import type { SortKey, WatchlistEntry } from "./watchlist-types";

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
  sortKey = "default" as SortKey,
  onHeaderSort,
}: {
  hasSparkline?: boolean;
  entries?: WatchlistEntry[];
  period?: "24h" | "7d" | "30d";
  sortKey?: SortKey;
  onHeaderSort?: (col: WatchlistHeaderCol) => void;
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
      sortKey={sortKey}
      onHeaderSort={onHeaderSort}
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

    // Mobile row (inline icons) + desktop resting WatchlistStatus (bare
    // icons, no bg circle) both use role="img" for pin/alert — 2 surfaces x
    // 2 icons.
    expect(markup.match(/role="img"/g)).toHaveLength(4);
    expect(markup).toContain(t("TH", "watchlistPinned"));
    expect(markup).toContain(t("TH", "watchlistHasAlert"));
  });

  it("keeps status icons out of the meta line when a card is neither pinned nor alerted", () => {
    const markup = renderList({ entries: [entry] });

    expect(markup).not.toContain(t("TH", "watchlistPinned"));
    expect(markup).not.toContain(t("TH", "watchlistHasAlert"));
  });

  it("renders every data column as a canonical SortableHeader with the active sort exposed", () => {
    const markup = renderList({ period: "7d", sortKey: "gain" });

    expect(markup).toContain("24H");
    expect(markup).toContain("7D");
    expect(markup).toContain("30D");
    // sortKey=gain + period=7d → the 7D column is the single descending header
    // (name/price/24h/30d stay aria-sort="none").
    expect(markup.match(/aria-sort="descending"/g)).toHaveLength(1);
    expect(markup.match(/aria-sort="none"/g)).toHaveLength(4);
    expect(markup).toContain("xl:table-cell");
  });

  it("marks the name column ascending when sorting A→Z", () => {
    const markup = renderList({ sortKey: "nameAz" });

    expect(markup.match(/aria-sort="ascending"/g)).toHaveLength(1);
    expect(markup.match(/aria-sort="descending"/g)).toBeNull();
  });

  it("never renders a ⋯ menu — mobile moves to long-press, desktop to hover icons", () => {
    const markup = renderList({ entries: [pinnedAlertedEntry] });

    expect(markup).not.toContain("lucide-more-horizontal");
  });

  it("shows the mobile list header (count + tap-sort price/change) instead of a count line in the toolbar", () => {
    const markup = renderList({ entries: [entry, pinnedAlertedEntry] });

    expect(markup).toContain(`2 ${t("TH", "cardUnit")}`);
    expect(markup.match(/aria-pressed="false"/g)?.length).toBeGreaterThanOrEqual(2);
    expect(markup).toContain(t("TH", "price"));
    expect(markup).toContain(t("TH", "change"));
  });

  it("marks the mobile 'change' tap-sort button pressed via the active period column, not a fixed column", () => {
    const markup = renderList({ period: "30d", sortKey: "gain" });

    // headerSort maps gain/loss to activeCol=period, and the mobile "change"
    // button's `column` prop IS the current period — so it (not "price")
    // reads pressed when a period sort is active.
    expect(markup).toMatch(/aria-pressed="true"[^>]*>เปลี่ยนแปลง/);
  });

  it("renders the delta as a chip on mobile rows (not a plain colored change)", () => {
    const markup = renderList({ entries: [entry] });

    expect(markup).toContain("min-w-[72px]");
  });

  it("stacks THB (primary) over demoted JPY on the desktop price cell", () => {
    const markup = renderList({ entries: [entry] });

    expect(markup).toContain("25 ฿");
    expect(markup).toContain("¥100");
  });
});
