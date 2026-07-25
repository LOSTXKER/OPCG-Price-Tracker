import { opcgConfig } from "./opcg";
import { pokemonConfig } from "./pokemon";
import type { GameConfig } from "./types";

export type { GameConfig, DeckRules, GameReleaseReadiness } from "./types";
export type {
  CardTypeOption,
  ColorOption,
  RarityOption,
  BoxPattern,
  PullRateConfig,
} from "./types";
export {
  getGameDataReadinessIssues,
  type GameDataReadinessSnapshot,
} from "./launch-preflight";

const GAME_CONFIGS: Record<string, GameConfig> = {
  opcg: opcgConfig,
  pokemon: pokemonConfig,
};

export function getGameConfig(slug: string): GameConfig | undefined {
  return GAME_CONFIGS[slug];
}

/** All registered games, including roadmap entries shown only in the Header. */
export function getAllGameConfigs(): GameConfig[] {
  return Object.values(GAME_CONFIGS);
}

/** Data-plane readiness only. Server seed/preflight mirrors this to Game.isActive. */
export function isGameDataReady(config: GameConfig): boolean {
  return config.release.data === "READY";
}

/**
 * Public launch gate. A game must pass product/config, data and routing gates
 * together before it can enter active selectors, cookies or URL namespaces.
 */
export function isGameLaunchReady(config: GameConfig): boolean {
  return (
    config.release.status === "LIVE" &&
    isGameDataReady(config) &&
    config.release.routes === "READY"
  );
}

/** Fail-closed slug check for data-derived UI state and request boundaries. */
export function isGameSlugLaunchReady(slug: string): boolean {
  const config = getGameConfig(slug);
  return config != null && isGameLaunchReady(config);
}

/** Only publicly browsable games — canonical source for selectors and routing. */
export function getLaunchReadyGameConfigs(): GameConfig[] {
  return Object.values(GAME_CONFIGS).filter(isGameLaunchReady);
}

/** Compatibility name retained for existing callers; "active" means launch-ready. */
export function getActiveGameConfigs(): GameConfig[] {
  return getLaunchReadyGameConfigs();
}

/** True only when an in-page selector can offer a real choice. */
export function hasMultipleActiveGames(): boolean {
  return getLaunchReadyGameConfigs().length >= 2;
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
