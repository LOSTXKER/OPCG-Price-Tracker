import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { resolveSnkrdunkStatusSelection, StatsBar } from "./match-ui";

describe("StatsBar", () => {
  it("renders a touch-safe canonical status rail with colors and counts", () => {
    const markup = renderToStaticMarkup(
      <StatsBar
        counts={{ pending: 3, matched: 2, rejected: 1 }}
        activeFilter="pending"
        onFilter={() => undefined}
      />,
    );

    expect(markup).toContain('role="radiogroup"');
    expect(markup).toContain('aria-label="กรองตามสถานะ"');
    expect(markup).toContain('aria-checked="true"');
    expect(markup).toContain('aria-checked="false"');
    expect(markup).toContain("overflow-x-auto");
    expect(markup).toContain("w-max");
    expect(markup).toContain("h-11");
    expect(markup).toContain("bg-warning");
    expect(markup).toContain(">6<");
    expect(markup).toContain(">3<");
    expect(markup).not.toContain("aria-pressed");
  });
});

describe("resolveSnkrdunkStatusSelection", () => {
  it("preserves the existing click-active-to-clear behavior", () => {
    expect(resolveSnkrdunkStatusSelection("pending", "pending")).toBe("");
    expect(resolveSnkrdunkStatusSelection("pending", "matched")).toBe("matched");
    expect(resolveSnkrdunkStatusSelection("matched", "")).toBe("");
  });
});
