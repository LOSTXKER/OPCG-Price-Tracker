import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { ConditionFilter } from "./market-feed-shared";

describe("ConditionFilter", () => {
  it("uses the canonical scrollable single-choice control", () => {
    const markup = renderToStaticMarkup(
      <ConditionFilter
        grades={["raw", "psa"]}
        active="raw"
        onSelect={() => undefined}
        label="สภาพ"
        render={(value) => value}
      />,
    );

    expect(markup).toContain('role="radiogroup"');
    expect(markup.match(/role="radio"/g)).toHaveLength(3);
    expect(markup.match(/aria-checked="true"/g)).toHaveLength(1);
    expect(markup).toContain("overflow-x-auto");
    expect(markup).not.toContain("aria-pressed");
  });
});
