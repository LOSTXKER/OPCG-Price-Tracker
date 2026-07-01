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

/** Per-game tint color for crest/glow/frame accents. Falls back to the honey
 *  baseline (`--primary`) for games without a skin, so OPCG shows zero tint
 *  delta. Safe to drop into inline `background`/`color-mix` — never onto a
 *  fill/CTA/focus ring (that would only look right for the baseline game). */
export function getGameAccentTint(slug: string): string {
  return getGameConfig(slug)?.accentTint ?? "var(--primary)";
}

export { opcgConfig, pokemonConfig };
