import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import TrendingLoading from "./loading";

describe("TrendingLoading", () => {
  it("matches the live control counts and responsive hit heights", () => {
    const markup = renderToStaticMarkup(<TrendingLoading />);

    expect(markup.match(/data-testid="trending-scope-option"/g)).toHaveLength(3);
    expect(markup.match(/data-testid="trending-period-option"/g)).toHaveLength(3);
    expect(markup).toContain("h-11");
    expect(markup).toContain("sm:h-8");
    expect(markup).toContain("md:h-7");
  });

  it("ships separate mobile-list and desktop-table anatomy", () => {
    const markup = renderToStaticMarkup(<TrendingLoading />);

    expect(markup).toContain('data-testid="trending-mobile-list"');
    expect(markup).toContain("sm:hidden");
    expect(markup).toContain('data-testid="trending-desktop-table"');
    expect(markup).toContain("hidden overflow-hidden sm:block");
    expect(markup).toContain("<table");
    expect(markup).toContain("<thead");
    expect(markup).toContain("<tbody");
  });
});
