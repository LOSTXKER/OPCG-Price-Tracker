import { describe, expect, it } from "vitest";

import { getSetAdHeadingGroupIndex } from "./set-detail-content";

describe("set detail ad heading boundary", () => {
  it("places the ad before the first heading with at least 12 preceding cards", () => {
    expect(getSetAdHeadingGroupIndex([12, 4])).toBe(1);
    expect(getSetAdHeadingGroupIndex([5, 7, 4])).toBe(2);
    expect(getSetAdHeadingGroupIndex([5, 6, 1, 4])).toBe(3);
  });

  it("does not render when the threshold is reached without a following heading", () => {
    expect(getSetAdHeadingGroupIndex([12])).toBeNull();
    expect(getSetAdHeadingGroupIndex([5, 7])).toBeNull();
    expect(getSetAdHeadingGroupIndex([11, 4])).toBeNull();
  });
});
