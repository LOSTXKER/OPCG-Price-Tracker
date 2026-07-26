import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { t } from "@/lib/i18n";

import { ViewModeControl } from "./view-mode-control";

describe("ViewModeControl", () => {
  it("keeps a 44px hit box and lets the thumb nest inside the track", () => {
    const markup = renderToStaticMarkup(
      <ViewModeControl
        modes={["list", "grid"]}
        value="list"
        onChange={() => undefined}
      />,
    );

    expect(markup).toContain('role="radiogroup"');
    expect(markup).toContain('data-compact-visual="true"');
    expect(markup.match(/role="radio"/g)).toHaveLength(2);
    expect(markup.match(/aria-checked="true"/g)).toHaveLength(1);

    expect(markup).toContain("h-11");
    expect(markup).toContain("min-w-11");
    // Track: inset 4px from the 44px hit box. Thumb: 6px, i.e. 2px INSIDE the
    // track, so their edges/radii never coincide (that read as lopsided).
    expect(markup).toContain("before:inset-y-1 ");
    expect(markup).toContain("before:inset-y-1.5");
    expect(markup).toContain("before:inset-x-0.5");
    // No per-caller inset overrides any more — the kit owns the nesting.
    expect(markup).not.toContain("[&amp;_button]:before:inset-x-1");
    expect(markup).not.toContain("md:[&amp;_button]:before:inset-x-0");
    expect(markup).toContain("md:h-7");
    expect(markup).toContain("md:min-w-0");
    expect(markup).toContain("[&amp;_svg]:size-4");
  });

  it("keeps localized labels in ARIA without rendering a hidden flex child", () => {
    const markup = renderToStaticMarkup(
      <ViewModeControl
        modes={["table", "grid"]}
        value="grid"
        onChange={() => undefined}
      />,
    );

    const tableLabel = t("TH", "table");
    const gridLabel = t("TH", "grid");

    expect(markup).toContain(`aria-label="${tableLabel} / ${gridLabel}"`);
    expect(markup).toContain(`aria-label="${tableLabel}"`);
    expect(markup).toContain(`aria-label="${gridLabel}"`);
    expect(markup).not.toContain("sr-only");
    expect(markup).not.toContain('class="truncate"');
  });

  it("renders localized text only when labels are requested", () => {
    const markup = renderToStaticMarkup(
      <ViewModeControl
        modes={["table", "grid"]}
        value="grid"
        onChange={() => undefined}
        showLabels
      />,
    );

    expect(markup).toContain(`<span class="truncate">${t("TH", "table")}</span>`);
    expect(markup).toContain(`<span class="truncate">${t("TH", "grid")}</span>`);
    expect(markup).toContain("[&amp;_button]:w-20");
    expect(markup).toContain("[&amp;_button]:min-w-20");
  });
});
