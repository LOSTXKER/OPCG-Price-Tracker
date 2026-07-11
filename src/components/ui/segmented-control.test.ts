import { describe, expect, it } from "vitest";

import { getSegmentedNavigationTarget } from "./segmented-control";

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
