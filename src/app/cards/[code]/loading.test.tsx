import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import CardDetailLoading from "./loading";

describe("card detail loading", () => {
  it("contains the wide grade rail on phones and matches the runtime chart height", () => {
    const markup = renderToStaticMarkup(<CardDetailLoading />);

    expect(markup).toContain("max-w-full");
    expect(markup).toContain("overflow-hidden");
    expect(markup).toContain("h-[210px]");
    expect(markup).toContain("sm:h-[280px]");
    expect(markup).toContain("lg:h-[320px]");
    expect(markup).not.toContain("h-72");
  });
});
