import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { YuyuteiStatusFilter } from "./yuyutei-match-client";

describe("YuyuteiStatusFilter", () => {
  it("renders status colors and counts through the canonical horizontal rail", () => {
    const markup = renderToStaticMarkup(
      <YuyuteiStatusFilter
        counts={{ suggested: 4, pending: 3, matched: 2, rejected: 1 }}
        value="matched"
        onChange={() => undefined}
      />,
    );

    expect(markup).toContain('role="radiogroup"');
    expect(markup).toContain('aria-label="กรองตามสถานะ"');
    expect(markup).toContain('aria-checked="true"');
    expect(markup).toContain('aria-checked="false"');
    expect(markup).toContain("overflow-x-auto");
    expect(markup).toContain("w-max");
    expect(markup).toContain("h-11");
    expect(markup).toContain("bg-success");
    expect(markup).toContain(">10<");
    expect(markup).toContain(">2<");
    expect(markup).not.toContain("aria-pressed");
  });
});
