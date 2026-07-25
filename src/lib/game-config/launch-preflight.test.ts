import { describe, expect, it } from "vitest";

import {
  getGameDataReadinessIssues,
  opcgConfig,
  pokemonConfig,
  type GameDataReadinessSnapshot,
} from "@/lib/game-config";

const readySnapshot: GameDataReadinessSnapshot = {
  rowExists: true,
  databaseActive: true,
  linkedSetCount: 1,
  linkedCardCount: 1,
  pricedCardCount: 1,
};

describe("game data launch preflight", () => {
  it("accepts a READY game when its row is active and has sets, cards, and prices", () => {
    expect(getGameDataReadinessIssues(opcgConfig, readySnapshot)).toEqual([]);
  });

  it.each<
    [
      string,
      Partial<GameDataReadinessSnapshot>,
      string,
    ]
  >([
    [
      "Game row",
      { rowExists: false },
      "opcg: missing Game row",
    ],
    [
      "active database flag",
      { databaseActive: false },
      "opcg: Game.isActive must be true to mirror release.data",
    ],
    [
      "linked set",
      { linkedSetCount: 0 },
      "opcg: no sets are linked to the Game row",
    ],
    [
      "linked card",
      { linkedCardCount: 0 },
      "opcg: no cards are linked through a game-owned set",
    ],
    [
      "priced card",
      { pricedCardCount: 0 },
      "opcg: no game-owned cards have a positive market price",
    ],
  ])("rejects a READY game without its required %s", (_requirement, patch, issue) => {
    expect(
      getGameDataReadinessIssues(opcgConfig, {
        ...readySnapshot,
        ...patch,
      }),
    ).toContain(issue);
  });

  it("accepts a STUB game only while its database row remains inactive", () => {
    const stubSnapshot: GameDataReadinessSnapshot = {
      rowExists: true,
      databaseActive: false,
      linkedSetCount: 0,
      linkedCardCount: 0,
      pricedCardCount: 0,
    };

    expect(getGameDataReadinessIssues(pokemonConfig, stubSnapshot)).toEqual([]);
    expect(
      getGameDataReadinessIssues(pokemonConfig, {
        ...stubSnapshot,
        databaseActive: true,
      }),
    ).toEqual([
      "pokemon: Game.isActive must be false to mirror release.data",
    ]);
  });
});
