import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { SetTypeFilter } from "./sets-page-client";

describe("SetTypeFilter", () => {
  it("renders a horizontally scrollable canonical rail with count badges", () => {
    const markup = renderToStaticMarkup(
      <SetTypeFilter
        options={[
          { value: "ALL", label: "ทั้งหมด", count: 12 },
          { value: "BOOSTER", label: "Booster Pack", count: 8 },
          { value: "STARTER", label: "Starter Deck", count: 4 },
        ]}
        value="BOOSTER"
        onChange={() => undefined}
        ariaLabel="กรองชุดการ์ด"
      />,
    );

    expect(markup).toContain('role="radiogroup"');
    expect(markup).toContain('aria-label="กรองชุดการ์ด"');
    expect(markup).toContain('aria-checked="true"');
    expect(markup).toContain('aria-checked="false"');
    expect(markup).toContain("overflow-x-auto");
    expect(markup).toContain("w-max");
    expect(markup).toContain("tabular-nums");
    expect(markup).toContain(">12<");
    expect(markup).toContain(">8<");
    expect(markup).toContain(">4<");
    expect(markup).not.toContain("aria-pressed");
  });
});
