import { load } from "cheerio";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import {
  AlertSectionHeading,
  AlertsManagerSkeleton,
} from "./alerts-manager-client";

describe("AlertSectionHeading", () => {
  it("uses a compact semantic h2 and keeps the section count visible", () => {
    const markup = renderToStaticMarkup(
      <AlertSectionHeading id="active-alerts-heading" title="Active" count={3} />,
    );

    // Count sits inline next to the label (tab-badge grammar), inside the h2.
    expect(markup).toContain('id="active-alerts-heading"');
    expect(markup).toContain("text-h5");
    expect(markup).toMatch(/<h2[^>]*>Active<span[^>]*>3<\/span><\/h2>/);
    expect(markup).not.toContain("<h3");
  });

  it("reserves the compact game scope inside the alerts toolbar while loading", () => {
    const markup = renderToStaticMarkup(<AlertsManagerSkeleton />);
    const $ = load(markup);
    const sectionHead = $('[data-slot="alerts-skeleton-section-head"]');
    const toolbar = $('[data-slot="alerts-skeleton-toolbar"]');

    expect(sectionHead).toHaveLength(1);
    expect(toolbar).toHaveLength(1);
    expect(sectionHead.find('[data-slot="alerts-skeleton-toolbar"]')).toHaveLength(
      1,
    );
    expect(
      toolbar.find('[data-slot="alerts-skeleton-game-filter"]'),
    ).toHaveLength(1);
    expect(toolbar.find('[data-slot="alerts-skeleton-search"]')).toHaveLength(1);
    expect(markup).toContain('data-slot="alerts-skeleton-game-filter"');
    expect(markup).toContain("h-11");
    expect(markup).toContain("sm:h-9");
    expect(markup).toContain("rounded-lg");
  });
});
