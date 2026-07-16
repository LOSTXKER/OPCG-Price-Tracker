import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { FilterButton, ToolbarSortDropdown } from "./toolbar";

describe("toolbar outline appearance", () => {
  it("keeps the shared filter and sort defaults soft", () => {
    const filterMarkup = renderToStaticMarkup(
      createElement(FilterButton, null, "Filters"),
    );
    const sortMarkup = renderToStaticMarkup(
      createElement(ToolbarSortDropdown, {
        options: [{ key: "price", label: "Price" }],
        activeKey: "price",
        activeDir: "desc",
        onChange: () => undefined,
      }),
    );

    for (const markup of [filterMarkup, sortMarkup]) {
      expect(markup).toContain(
        "border-transparent bg-muted/50 text-foreground/80",
      );
      expect(markup).not.toContain(
        "border-border bg-background text-foreground",
      );
    }
  });

  it("keeps the filter hit target through the chrome breakpoint while painting a bounded frame", () => {
    const markup = renderToStaticMarkup(
      createElement(
        FilterButton,
        { appearance: "outline", active: false },
        "Filters",
      ),
    );

    expect(markup).toContain("h-11");
    expect(markup).toContain("min-w-11");
    expect(markup).toContain("h-9");
    expect(markup).toContain("md:h-auto");
    expect(markup).toContain("md:min-w-0");
    expect(markup).not.toContain("sm:h-auto");
    expect(markup).not.toContain("sm:min-w-0");
    expect(markup).toContain("whitespace-nowrap");
    expect(markup).toContain("border-border");
    expect(markup).toContain("bg-background");
    expect(markup).toContain("text-foreground");
    expect(markup).toContain("focus-visible:ring-2");
  });

  it("keeps the active filter state distinct from the outlined idle state", () => {
    const markup = renderToStaticMarkup(
      createElement(
        FilterButton,
        { appearance: "outline", active: true, count: 2 },
        "Filters",
      ),
    );

    expect(markup).toContain("border-primary/30");
    expect(markup).toContain("bg-primary/15");
    expect(markup).toContain("bg-primary text-primary-foreground");
  });

  it("uses the same md-bound bounded frame for the sort trigger", () => {
    const markup = renderToStaticMarkup(
      createElement(ToolbarSortDropdown, {
        appearance: "outline",
        options: [{ key: "price", label: "Price" }],
        activeKey: "price",
        activeDir: "desc",
        onChange: () => undefined,
      }),
    );

    expect(markup).toContain("h-11");
    expect(markup).toContain("min-w-11");
    expect(markup).toContain("h-9");
    expect(markup).toContain("md:h-auto");
    expect(markup).toContain("md:min-w-0");
    expect(markup).not.toContain("sm:h-auto");
    expect(markup).not.toContain("sm:min-w-0");
    expect(markup).toContain("border-border");
    expect(markup).toContain("bg-background");
    expect(markup).toContain("text-foreground");
  });

  it("preserves the stable-width layout boundary at sm", () => {
    const markup = renderToStaticMarkup(
      createElement(ToolbarSortDropdown, {
        stableMobileWidth: true,
        options: [{ key: "price", label: "Price" }],
        activeKey: "price",
        activeDir: "desc",
        onChange: () => undefined,
      }),
    );

    expect(markup).toContain("w-40 sm:w-auto");
    expect(markup).toContain("md:h-auto");
  });
});
