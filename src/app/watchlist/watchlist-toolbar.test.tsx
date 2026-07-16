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
    expect(markup.match(/aria-pressed="false"/g)).toHaveLength(2);
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
      view: "list" as const,
      onViewChange: noop,
      period: "7d" as const,
      onPeriodChange: noop,
      sortKey: "default" as const,
      onSortChange: noop,
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
      onClearSelection: noop,
      onBulkRemove: noop,
    };

    const normalMarkup = renderToStaticMarkup(
      <WatchlistToolbar {...commonProps} editMode={false} />,
    );
    const selectionMarkup = renderToStaticMarkup(
      <WatchlistToolbar {...commonProps} editMode />,
    );

    expect(normalMarkup).toContain(">24h<");
    expect(selectionMarkup).not.toContain(">24h<");
    expect(selectionMarkup).toContain(t("TH", "watchlistRemoveSelected"));
    expect(selectionMarkup).toContain(t("TH", "watchlistEditDone"));
  });
});
