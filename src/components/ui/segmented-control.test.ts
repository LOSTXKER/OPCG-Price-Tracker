import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { createElement } from "react";

import { SegmentedControl, getSegmentedNavigationTarget } from "./segmented-control";

const options = [
  { disabled: false },
  { disabled: true },
  { disabled: false },
  { disabled: false },
];

describe("getSegmentedNavigationTarget", () => {
  it("moves forward and backward while skipping disabled options", () => {
    expect(getSegmentedNavigationTarget(options, 0, "ArrowRight")).toBe(2);
    expect(getSegmentedNavigationTarget(options, 2, "ArrowLeft")).toBe(0);
    expect(getSegmentedNavigationTarget(options, 2, "ArrowDown")).toBe(3);
    expect(getSegmentedNavigationTarget(options, 2, "ArrowUp")).toBe(0);
  });

  it("wraps at both ends", () => {
    expect(getSegmentedNavigationTarget(options, 3, "ArrowRight")).toBe(0);
    expect(getSegmentedNavigationTarget(options, 0, "ArrowLeft")).toBe(3);
  });

  it("supports Home and End", () => {
    expect(getSegmentedNavigationTarget(options, 2, "Home")).toBe(0);
    expect(getSegmentedNavigationTarget(options, 0, "End")).toBe(3);
  });

  it("returns null when every option is disabled", () => {
    expect(
      getSegmentedNavigationTarget(
        [{ disabled: true }, { disabled: true }],
        0,
        "ArrowRight",
      ),
    ).toBeNull();
  });
});

describe("SegmentedControl compact visual", () => {
  it("keeps the mobile hit target while insetting the painted frame", () => {
    const markup = renderToStaticMarkup(
      createElement(SegmentedControl, {
        compactVisual: true,
        options: [
          { value: "raw", label: "Raw" },
          { value: "psa10", label: "PSA 10" },
          { value: "psa9", label: "PSA 9", disabled: true },
        ],
        value: "raw",
        onChange: () => undefined,
        ariaLabel: "Price mode",
      }),
    );

    expect(markup).toContain('role="radiogroup"');
    expect(markup).toContain('data-compact-visual="true"');
    expect(markup).toContain("h-11");
    expect(markup).toContain("before:inset-y-1");
    expect(markup).toContain("before:bg-primary/15");
    expect(markup).toContain("md:before:hidden");
    expect(markup).toContain("md:min-w-0");
    expect(markup).toContain('role="radio"');
    expect(markup).toContain('aria-checked="true"');
    expect(markup).toContain('aria-checked="false"');
    expect(markup).toContain('disabled=""');
  });

  it("uses the compact touch-safe frame by default for period pills", () => {
    const markup = renderToStaticMarkup(
      createElement(SegmentedControl, {
        variant: "pill",
        size: "sm",
        options: [
          { value: "24h", label: "24h" },
          { value: "7d", label: "7d" },
          { value: "30d", label: "30d" },
        ],
        value: "7d",
        onChange: () => undefined,
        ariaLabel: "Price period",
      }),
    );

    expect(markup).toContain('data-compact-visual="true"');
    expect(markup).toContain("before:inset-y-1");
    expect(markup).toContain("md:h-7");
    expect(markup).toContain("md:min-w-0");
    expect(markup).not.toContain("sm:h-7");
  });

  it("allows prominent pill selectors to opt out of the compact frame", () => {
    const markup = renderToStaticMarkup(
      createElement(SegmentedControl, {
        variant: "pill",
        compactVisual: false,
        options: [
          { value: "monthly", label: "Monthly" },
          { value: "yearly", label: "Yearly" },
        ],
        value: "monthly",
        onChange: () => undefined,
      }),
    );

    expect(markup).not.toContain("data-compact-visual");
    expect(markup).toContain("h-11");
    expect(markup).toContain("min-w-11");
    expect(markup).toContain("md:h-7");
    expect(markup).toContain("md:min-w-0");
    expect(markup).not.toContain("sm:h-7");
    expect(markup).not.toContain("before:inset-y-1");
  });
});
