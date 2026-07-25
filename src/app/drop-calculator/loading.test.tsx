import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import DropCalculatorLoading from "./loading";

describe("DropCalculatorLoading", () => {
  it("mirrors the wizard and responsive card workspace without the removed set gate", () => {
    const markup = renderToStaticMarkup(<DropCalculatorLoading />);

    expect(markup.match(/data-testid="drop-wizard-loading"/g)).toHaveLength(1);
    expect(markup.match(/data-testid="drop-workspace-loading"/g)).toHaveLength(1);
    expect(markup).toContain("grid-cols-3");
    expect(markup).toContain("sm:grid-cols-4");
    expect(markup).toContain("lg:grid-cols-5");
    expect(markup).toContain("xl:grid-cols-6");
    expect(markup).toContain("hidden w-52");
    expect(markup).toContain("aspect-[63/88]");
    expect(markup).toContain("size-6");
    expect(markup).toContain("pt-3");
    expect(markup).toContain("sm:pt-5");
    expect(markup).toContain("mb-4 sm:mb-5");
    expect(markup).not.toContain("drop-empty-loading");
    expect(markup).not.toContain("shadow-[var(--panel-shadow)]");
    expect(markup).not.toContain("py-12");
    expect(markup).not.toContain("h-12 w-72");
  });
});
