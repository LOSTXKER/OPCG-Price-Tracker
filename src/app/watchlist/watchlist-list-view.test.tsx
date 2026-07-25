import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

import { t } from "@/lib/i18n";
import { formatUsdByCurrency } from "@/lib/utils/currency";
import type { GradeKey } from "@/lib/pricing/grade-tiers";

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
    psa10PriceUsd: 100,
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
  grade = "raw",
  editMode = false,
}: {
  hasSparkline?: boolean;
  entries?: WatchlistEntry[];
  period?: "24h" | "7d" | "30d";
  sortKey?: SortKey;
  onHeaderSort?: (col: WatchlistHeaderCol) => void;
  grade?: GradeKey;
  editMode?: boolean;
} = {}) {
  return renderToStaticMarkup(
    <WatchlistListView
      entries={entries}
      grade={grade}
      period={period}
      editMode={editMode}
      selected={new Set()}
      onToggleSelect={noop}
      sparklines={hasSparkline ? { 1: [1, 2, 3] } : {}}
      onSetAlert={noop}
      onRemove={noop}
      removingIds={new Set()}
      sortKey={sortKey}
      onHeaderSort={onHeaderSort}
    />,
  );
}

describe("watchlist market table view", () => {
  it("uses the same fixed desktop table anatomy and data columns as Home", () => {
    const markup = renderList();

    expect(markup).toContain('class="hidden overflow-x-auto sm:block"');
    expect(markup).toContain('class="w-full table-fixed text-left text-sm"');
    expect(markup).toContain('class="sticky top-0 z-10 bg-background"');
    expect(markup).toContain('class="w-[100px]"');
    expect(markup).toContain(t("TH", "set"));
    expect(markup).toContain(t("TH", "rarity"));
    expect(markup).toContain(t("TH", "sparkline30d"));
    expect(markup).not.toContain(t("TH", "watchlistFilterStatus"));
  });

  it("fills the 30-day graph column when Raw data has at least two points", () => {
    const markup = renderList({ hasSparkline: true });

    expect(markup).toContain(t("TH", "sparkline30d"));
    expect(markup).toContain("<polyline");
  });

  it("shows only the alert glyph inline (the pin system is gone)", () => {
    const markup = renderList({ entries: [pinnedAlertedEntry] });

    // The old circular badges sat absolutely positioned on top of the artwork.
    expect(markup).not.toContain("ring-2 ring-background");

    // Mobile inline bell only — the desktop bell is now the always-visible
    // action button itself (no resting glyph swap). No pin glyphs anywhere.
    expect(markup.match(/role="img"/g)).toHaveLength(1);
    expect(markup).not.toContain(t("TH", "watchlistPinned"));
    expect(markup).toContain(t("TH", "watchlistHasAlert"));
  });

  it("keeps status icons out of the meta line when a card has no alert", () => {
    const markup = renderList({ entries: [entry] });

    expect(markup).not.toContain(t("TH", "watchlistHasAlert"));
  });

  it("renders every data column as a canonical SortableHeader with the active sort exposed", () => {
    const markup = renderList({ period: "7d", sortKey: "gain" });

    expect(markup).toContain("24h");
    expect(markup).toContain("7d");
    expect(markup).toContain("30d");
    // sortKey=gain + period=7d → the 7D column is the single descending header
    // (name/price/24h/30d stay aria-sort="none").
    expect(markup.match(/aria-sort="descending"/g)).toHaveLength(1);
    expect(markup.match(/aria-sort="none"/g)).toHaveLength(4);
    expect(markup).toContain("lg:table-cell");
  });

  it("marks the name column ascending when sorting A→Z", () => {
    const markup = renderList({ sortKey: "nameAz" });

    expect(markup.match(/aria-sort="ascending"/g)).toHaveLength(1);
    expect(markup.match(/aria-sort="descending"/g)).toBeNull();
  });

  it("keeps the visible mobile row menu and desktop management actions", () => {
    const markup = renderList({ entries: [pinnedAlertedEntry] });

    expect(markup).toContain('data-slot="dropdown-menu-trigger"');
    expect(markup).toContain(t("TH", "moreActions"));
    expect(markup).toContain(t("TH", "removeFromWatchlist"));
  });

  it("turns links and actions into one full-row selection target in edit mode", () => {
    const markup = renderList({ editMode: true });

    expect(markup).not.toContain('href="/opcg/sets/op01"');
    expect(markup).not.toContain('href="/opcg/cards/OP01-001"');
    expect(markup).toContain("size-11");
    expect(markup).toContain("md:size-9");
    expect(markup).not.toContain(t("TH", "removeFromWatchlist"));
  });

  it("shows the mobile list header (tap-sort price/change) — the count moved to the tab badge", () => {
    const markup = renderList({ entries: [entry, pinnedAlertedEntry] });

    expect(markup).not.toContain(`2 ${t("TH", "cardUnit")}`);
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

  it("renders the mobile delta as the same plain market value used on Home", () => {
    const markup = renderList({ entries: [entry] });

    expect(markup).not.toContain("min-w-[72px]");
    expect(markup).not.toContain("rounded-md px-1.5 py-0.5");
  });

  it("shows THB only on the desktop price cell (JPY was cut by owner decision)", () => {
    const markup = renderList({ entries: [entry] });

    expect(markup).toContain("25 ฿");
    expect(markup).not.toContain("¥100");
  });

  it("keeps the Raw table anatomy in PSA 10 while showing unavailable market history honestly", () => {
    const markup = renderList({
      hasSparkline: true,
      entries: [pinnedAlertedEntry],
      grade: "psa_10",
    });

    expect(markup).toContain(formatUsdByCurrency(100, "THB").primary);
    expect(markup).toContain("24h");
    expect(markup).toContain("7d");
    expect(markup).toContain("30d");
    expect(markup).toContain(t("TH", "change"));
    expect(markup).toContain(t("TH", "sparkline30d"));
    expect(markup).not.toContain("<polyline");
    expect(markup).not.toContain("+2.0%");
    expect(markup).toContain(`${t("TH", "watchlistHasAlert")} · Raw`);
    // Non-Raw change columns are plain headings, not sortable buttons.
    expect(markup.match(/aria-sort="none"/g)).toHaveLength(2);
  });

  it.each([
    ["psa_9", 50],
    ["psa_8", 32],
    ["bgs_95", 115],
  ] as const)("shows derived %s prices without an estimate badge", (grade, usd) => {
    const markup = renderList({ entries: [entry], grade });

    expect(markup).toContain(formatUsdByCurrency(usd, "THB").primary);
    expect(markup).not.toContain("est.");
    expect(markup).not.toContain(t("TH", "sampleEstimate"));
    expect(markup).not.toContain("+2.0%");
  });

});
