import { describe, expect, it } from "vitest";

import {
  ROUTABLE_GAME_PREFIXES,
  isActiveGamePrefix,
  isNavActive,
  stripGamePrefix,
} from "@/lib/game/constants";
import { getLaunchReadyGameConfigs } from "@/lib/game-config";

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

  it("derives the routable namespace set from the launch-ready registry", () => {
    const launchReadySlugs = getLaunchReadyGameConfigs().map(
      (game) => game.slug,
    );

    expect([...ROUTABLE_GAME_PREFIXES].sort()).toEqual(
      [...launchReadySlugs].sort(),
    );
  });
});
