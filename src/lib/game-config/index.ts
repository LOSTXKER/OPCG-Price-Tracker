import { opcgConfig } from "./opcg";
import { pokemonConfig } from "./pokemon";
import type { GameConfig } from "./types";

export type { GameConfig, DeckRules } from "./types";
export type {
  CardTypeOption,
  ColorOption,
  RarityOption,
  BoxPattern,
  PullRateConfig,
} from "./types";

const GAME_CONFIGS: Record<string, GameConfig> = {
  opcg: opcgConfig,
  pokemon: pokemonConfig,
};

export function getGameConfig(slug: string): GameConfig | undefined {
  return GAME_CONFIGS[slug];
}

/** All registered games, including `comingSoon` ones (for the switcher UI). */
export function getAllGameConfigs(): GameConfig[] {
  return Object.values(GAME_CONFIGS);
}

/** Only browsable games (exclude `comingSoon`) — use for queries / routing. */
export function getActiveGameConfigs(): GameConfig[] {
  return Object.values(GAME_CONFIGS).filter((g) => !g.comingSoon);
}

export function getGameSlugs(): string[] {
  return Object.keys(GAME_CONFIGS);
}

export { opcgConfig, pokemonConfig };
