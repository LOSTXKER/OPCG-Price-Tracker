import { describe, expect, it } from "vitest";

import {
  isActiveGamePrefix,
  isNavActive,
  stripGamePrefix,
} from "@/lib/game/constants";

describe("game route normalization", () => {
  it.each([
    ["/opcg/sets", "/sets"],
    ["/opcg/cards/OP09-093", "/cards/OP09-093"],
    ["/all/search", "/search"],
    ["/portfolio", "/portfolio"],
  ])("normalizes %s to %s", (pathname, expected) => {
    expect(stripGamePrefix(pathname)).toBe(expected);
  });

  it("matches canonical nav hrefs against game-prefixed paths", () => {
    expect(isNavActive("/opcg/sets/OP09", "/opcg/sets")).toBe(true);
    expect(
      isNavActive("/opcg/cards/OP09-093", "/opcg/sets", ["/cards"]),
    ).toBe(true);
  });

  it("does not expose a second game merely by changing its UI config", () => {
    expect(isActiveGamePrefix("opcg")).toBe(true);
    expect(isActiveGamePrefix("pokemon")).toBe(false);
  });
});
