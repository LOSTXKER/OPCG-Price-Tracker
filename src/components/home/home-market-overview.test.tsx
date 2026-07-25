import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { HomeMarketScopeControl } from "./home-market-overview";

describe("HomeMarketScopeControl", () => {
  it("uses the canonical single-choice semantics without changing the underline rail", () => {
    const markup = renderToStaticMarkup(
      <HomeMarketScopeControl
        tabs={[
          { id: "all", label: "ทั้งหมด", defaultSort: "price_desc" },
          { id: "popular", label: "ยอดนิยม", defaultSort: "views_desc" },
        ]}
        value="popular"
        onChange={() => undefined}
        ariaLabel="กรองรายการ"
      />,
    );

    expect(markup).toContain('role="radiogroup"');
    expect(markup).toContain('aria-label="กรองรายการ"');
    expect(markup).toContain('role="radio"');
    expect(markup).toContain('aria-checked="true"');
    expect(markup).toContain('aria-checked="false"');
    expect(markup).toContain("overflow-x-auto");
    expect(markup).toContain("border-b");
    expect(markup).toContain("ทั้งหมด");
    expect(markup).toContain("ยอดนิยม");
    expect(markup).not.toContain("aria-pressed");
  });
});
