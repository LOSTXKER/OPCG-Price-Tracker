import { load } from "cheerio";
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

  it.each(["psa_10", "psa_9", "psa_8", "bgs_95"] as const)(
    "hides Raw-only movement and alert facets in %s mode",
    (grade) => {
      const markup = renderToStaticMarkup(
        <WatchlistFilterPanel
          lang="TH"
          filters={DEFAULT_FILTERS}
          onFiltersChange={noop}
          grade={grade}
        />,
      );

      expect(markup).not.toContain(t("TH", "watchlistFilterMovement"));
      expect(markup).not.toContain(t("TH", "watchlistFilterStatus"));
      expect(markup).not.toContain(t("TH", "watchlistFilterAlerts"));
    },
  );
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

  it("keeps the toolbar during select mode and marks the toggle pressed (actions live on the sticky bar)", () => {
    const commonProps = {
      filters: DEFAULT_FILTERS,
      onFiltersChange: noop,
      search: "",
      onSearchChange: noop,
      setOptions: [],
      onToggleEditMode: noop,
      grade: "raw" as const,
      onGradeChange: noop,
    };

    const normalMarkup = renderToStaticMarkup(
      <WatchlistToolbar {...commonProps} editMode={false} />,
    );
    const selectionMarkup = renderToStaticMarkup(
      <WatchlistToolbar {...commonProps} editMode />,
    );

    // Search/filter stay usable while selecting — no banner swap.
    expect(selectionMarkup).toContain(t("TH", "watchlistSearchPlaceholder"));
    expect(selectionMarkup).toContain('aria-pressed="true"');
    expect(normalMarkup).not.toContain('aria-pressed="true"');
    // The bulk actions moved off the toolbar entirely.
    expect(selectionMarkup).not.toContain(t("TH", "watchlistRemoveSelected"));
  });

  it("cuts the view toggle and sort dropdown — sort lives at the list headers now", () => {
    const markup = renderToStaticMarkup(
      <WatchlistToolbar
        filters={DEFAULT_FILTERS}
        onFiltersChange={noop}
        search=""
        onSearchChange={noop}
        setOptions={[]}
        editMode={false}
        onToggleEditMode={noop}
        grade="raw"
        onGradeChange={noop}
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
    expect(markup).toContain(`aria-label="${t("TH", "chooseGrade")}"`);
    expect(markup).toContain("Raw");
  });

  it("integrates the game scope with the same responsive toolbar", () => {
    const markup = renderToStaticMarkup(
      <WatchlistToolbar
        scope={<span data-slot="scope-probe">Game scope</span>}
        filters={DEFAULT_FILTERS}
        onFiltersChange={noop}
        search=""
        onSearchChange={noop}
        setOptions={[]}
        editMode={false}
        onToggleEditMode={noop}
        grade="raw"
        onGradeChange={noop}
      />,
    );
    const $ = load(markup);
    const toolbar = $('[data-slot="watchlist-toolbar"]');

    expect(toolbar).toHaveLength(1);
    expect(toolbar.find('[data-slot="watchlist-game-scope"]')).toHaveLength(1);
    expect(toolbar.find('[data-slot="scope-probe"]')).toHaveLength(1);
    expect(toolbar.find('[data-slot="watchlist-toolbar-controls"]')).toHaveLength(1);
    expect(toolbar.attr("class")).toContain(
      "sm:grid-cols-[auto_minmax(0,1fr)]",
    );
    expect(toolbar.attr("class")).toContain(
      "lg:grid-cols-[auto_minmax(0,1fr)_auto]",
    );
    expect(
      toolbar.find('[data-slot="watchlist-toolbar-search"]'),
    ).toHaveLength(1);
    expect(
      toolbar.find('[data-slot="watchlist-toolbar-actions"]'),
    ).toHaveLength(1);
  });

});
