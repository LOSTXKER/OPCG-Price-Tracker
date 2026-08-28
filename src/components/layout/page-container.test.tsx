import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { PageContainer } from "./page-container";

describe("PageContainer width contract", () => {
  it("uses the wider market canvas for ordinary pages", () => {
    const markup = renderToStaticMarkup(
      <PageContainer>Market content</PageContainer>,
    );

    expect(markup).toContain("max-w-[1400px]");
    expect(markup).toContain("px-5 md:px-6 lg:px-8");
    expect(markup).not.toContain("max-w-7xl");
  });

  it("keeps deliberate reading widths and the opt-in wide canvas distinct", () => {
    const reading = renderToStaticMarkup(
      <PageContainer width="reading">Article</PageContainer>,
    );
    const wide = renderToStaticMarkup(
      <PageContainer width="wide">Dense market</PageContainer>,
    );

    expect(reading).toContain("max-w-2xl");
    expect(wide).toContain("max-w-[1600px]");
  });

  it("does not reapply page gutters inside an owning shell", () => {
    const markup = renderToStaticMarkup(
      <PageContainer inShell>Shell content</PageContainer>,
    );

    expect(markup).not.toContain("px-5 md:px-6 lg:px-8");
  });
});
