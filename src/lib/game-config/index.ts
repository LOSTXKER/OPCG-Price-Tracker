import { opcgConfig } from "./opcg";
import type { GameConfig } from "./types";

export type { GameConfig } from "./types";
export type {
  CardTypeOption,
  ColorOption,
  RarityOption,
  BoxPattern,
  PullRateConfig,
} from "./types";

const GAME_CONFIGS: Record<string, GameConfig> = {
  opcg: opcgConfig,
};

export function getGameConfig(slug: string): GameConfig | undefined {
  return GAME_CONFIGS[slug];
}

export function getAllGameConfigs(): GameConfig[] {
  return Object.values(GAME_CONFIGS);
}

export function getGameSlugs(): string[] {
  return Object.keys(GAME_CONFIGS);
}

export { opcgConfig };
