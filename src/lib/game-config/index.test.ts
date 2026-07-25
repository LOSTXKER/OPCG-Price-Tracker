import { describe, expect, it } from "vitest";

import {
  getActiveGameConfigs,
  getAllGameConfigs,
  getLaunchReadyGameConfigs,
  hasMultipleActiveGames,
  isGameLaunchReady,
  isGameSlugLaunchReady,
  opcgConfig,
  pokemonConfig,
  type GameConfig,
  type GameReleaseReadiness,
} from "@/lib/game-config";

function configWithRelease(release: GameReleaseReadiness): GameConfig {
  return {
    ...opcgConfig,
    slug: "release-test",
    release,
  };
}

describe("game launch gate", () => {
  it("keeps the roadmap registry separate from the public launch-ready catalog", () => {
    expect(getAllGameConfigs().map((game) => game.slug)).toEqual([
      "opcg",
      "pokemon",
    ]);
    expect(getLaunchReadyGameConfigs()).toEqual([opcgConfig]);
    expect(getActiveGameConfigs()).toEqual([opcgConfig]);
    expect(hasMultipleActiveGames()).toBe(false);
    expect(isGameLaunchReady(pokemonConfig)).toBe(false);
    expect(isGameSlugLaunchReady("opcg")).toBe(true);
    expect(isGameSlugLaunchReady("pokemon")).toBe(false);
    expect(isGameSlugLaunchReady("unknown")).toBe(false);
  });

  it("opens only when the product, data, and routing gates are all ready", () => {
    expect(
      isGameLaunchReady(
        configWithRelease({
          status: "LIVE",
          data: "READY",
          routes: "READY",
        }),
      ),
    ).toBe(true);
  });

  it.each<[string, GameReleaseReadiness]>([
    [
      "product",
      { status: "ROADMAP", data: "READY", routes: "READY" },
    ],
    [
      "data",
      { status: "LIVE", data: "STUB", routes: "READY" },
    ],
    [
      "routing",
      { status: "LIVE", data: "READY", routes: "BLOCKED" },
    ],
  ])("fails closed when the %s gate is not ready", (_gate, release) => {
    expect(isGameLaunchReady(configWithRelease(release))).toBe(false);
  });
});
