import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { t } from "@/lib/i18n";

import { WatchlistPeriodControl } from "./watchlist-summary";
import { DEFAULT_FILTERS } from "./watchlist-types";
import { WatchlistFilterPanel, WatchlistToolbar } from "./watchlist-toolbar";

const noop = () => undefined;

describe("watchlist filter panel", () => {
  it("uses one keyboard-navigable movement group and pressed status toggles", () => {
    const markup = renderToStaticMarkup(
      <WatchlistFilterPanel
        lang="TH"
        filters={DEFAULT_FILTERS}
        onFiltersChange={() => undefined}
      />,
    );

    expect(markup).toContain('role="radiogroup"');
    expect(markup.match(/role="radio"/g)).toHaveLength(3);
    expect(markup.match(/aria-checked="true"/g)).toHaveLength(1);
    // One status toggle left (แจ้งเตือน) — the pin filter left with the pin system.
    expect(markup.match(/aria-pressed="false"/g)).toHaveLength(1);
    expect(markup).toContain('data-compact-visual="true"');
    expect(markup).toContain("md:h-7");
    expect(markup).not.toContain("sm:h-11");
  });
});

describe("watchlist result controls", () => {
  it("renders three period choices and exposes the selected range", () => {
    const markup = renderToStaticMarkup(
      <WatchlistPeriodControl period="7d" onPeriodChange={noop} />,
    );

    expect(markup).toContain('role="radiogroup"');
    expect(markup.match(/role="radio"/g)).toHaveLength(3);
    expect(markup.match(/aria-checked="true"/g)).toHaveLength(1);
    expect(markup).toMatch(/aria-checked="true"[^>]*><span[^>]*>7d<\/span>/);
    expect(markup).toContain("24h");
    expect(markup).toContain("30d");
    expect(markup).toContain("lucide-trending-up-down");
    expect(markup).toContain('data-compact-visual="true"');
    expect(markup).toContain("before:inset-y-1");
    expect(markup).toContain("md:h-7");
    expect(markup).not.toContain("sm:h-11");
  });

  it("replaces normal result controls with the selection bar in edit mode", () => {
    const commonProps = {
      filters: DEFAULT_FILTERS,
      onFiltersChange: noop,
      search: "",
      onSearchChange: noop,
      setOptions: [],
      resultCount: 4,
      itemCount: 4,
      limit: Number.POSITIVE_INFINITY,
      onToggleEditMode: noop,
      selectedCount: 2,
      allVisibleSelected: false,
      onToggleSelectAll: noop,
      onBulkRemove: noop,
    };

    const normalMarkup = renderToStaticMarkup(
      <WatchlistToolbar {...commonProps} editMode={false} />,
    );
    const selectionMarkup = renderToStaticMarkup(
      <WatchlistToolbar {...commonProps} editMode />,
    );

    // Normal mode shows the always-visible search field; selection mode
    // swaps everything for the calm bar (count · select all · delete · cancel).
    expect(normalMarkup).toContain(t("TH", "watchlistSearchPlaceholder"));
    expect(selectionMarkup).not.toContain(t("TH", "watchlistSearchPlaceholder"));
    expect(selectionMarkup).toContain(t("TH", "watchlistRemoveSelected"));
    expect(selectionMarkup).toContain(t("TH", "cancel"));
    expect(selectionMarkup).not.toContain(t("TH", "watchlistClearSelection"));
  });

  it("cuts the view toggle and sort dropdown — sort lives at the list headers now", () => {
    const markup = renderToStaticMarkup(
      <WatchlistToolbar
        filters={DEFAULT_FILTERS}
        onFiltersChange={noop}
        search=""
        onSearchChange={noop}
        setOptions={[]}
        resultCount={4}
        itemCount={4}
        limit={Number.POSITIVE_INFINITY}
        editMode={false}
        onToggleEditMode={noop}
        selectedCount={0}
        allVisibleSelected={false}
        onToggleSelectAll={noop}
        onBulkRemove={noop}
      />,
    );

    expect(markup).not.toContain("lucide-layout-grid");
    expect(markup).not.toContain(t("TH", "watchlistSortBy"));
    expect(markup).not.toContain(t("TH", "watchlistSortDefault"));
    // The period pill moved to the list header; the select toggle is labeled
    // "เลือก" (not the ambiguous "แก้ไข").
    expect(markup).not.toContain(">24h<");
    expect(markup).toContain(t("TH", "watchlistSelectMode"));
    expect(markup).not.toContain(t("TH", "watchlistEditMode"));
  });

});
