import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { t } from "@/lib/i18n";

import PortfolioDetailLoading from "./loading";

describe("portfolio detail route loading", () => {
  it("reserves the localized page header before the detail skeleton", () => {
    const markup = renderToStaticMarkup(<PortfolioDetailLoading />);

    expect(markup).toContain(t("TH", "portfolioNav"));
    expect(markup).toContain(t("TH", "portfolioPageDesc"));
    expect(markup).toContain('data-slot="portfolio-detail-skeleton"');
    expect(markup.indexOf(t("TH", "portfolioNav"))).toBeLessThan(
      markup.indexOf('data-slot="portfolio-detail-skeleton"'),
    );
  });
});
