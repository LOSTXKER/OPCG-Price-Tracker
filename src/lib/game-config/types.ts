import type { SetInfo } from "@/lib/constants/sets";
import type { RarityInfo } from "@/lib/constants/rarities";

export interface CardTypeOption {
  code: string;
  label: string;
}

export interface ColorOption {
  code: string;
  label: string;
  bg: string;
}

export interface RarityOption {
  code: string;
  label: string;
}

export interface BoxPattern {
  name: string;
  nameJp: string;
  prob: number;
  sec: number;
  parallel: number;
  sr: number;
}

export interface PullRateConfig {
  packsPerBox: number;
  cardsPerPack: number;
  boxesPerCarton: number;
  boxPatterns: readonly BoxPattern[];
  expectedParallelSlotsPerBox: number;
  fallbackAvgPerBox: Record<string, number>;
}

export interface DeckRules {
  /** Main deck size (OPCG 50, Pokémon 60). */
  mainDeckSize?: number;
  /** Max copies of a non-basic card. */
  maxCopies?: number;
  /** OPCG requires exactly one Leader; Pokémon does not. */
  requiresLeader?: boolean;
}

export interface GameReleaseReadiness {
  /**
   * Product/config gate. ROADMAP games may appear in the canonical Header
   * switcher as a teaser, but can never become the active catalog.
   */
  status: "ROADMAP" | "LIVE";
  /**
   * Data-plane gate. Flip to READY only after the Game row, linked sets/cards
   * and required price data pass the server-side launch preflight.
   */
  data: "STUB" | "READY";
  /**
   * Routing gate. Flip to READY only after every game-owned route/query/nav
   * path is scoped correctly. Public routing still requires all three gates.
   */
  routes: "BLOCKED" | "READY";
}

export interface GameConfig {
  slug: string;
  name: string;
  nameEn: string;
  /** Short label for the game-switcher pill (e.g. "OPCG", "Pokémon"). */
  shortName?: string;
  /** Friendly label for the unified MINE game rail (e.g. "One Piece"). */
  filterName?: string;
  /** Single source of truth for roadmap visibility, data readiness and routing. */
  release: GameReleaseReadiness;
  /** Thin per-game tint layered OVER the honey baseline (crest dot / top-glow /
   *  card-frame only — never a repaint of fills/CTA/focus). Omit for the baseline
   *  game so it falls back to `--primary` and reads as no skin. */
  accentTint?: string;
  sets: SetInfo[];
  baseRarities: RarityInfo[];
  parallelRarities: RarityInfo[];
  cardTypes: CardTypeOption[];
  colors: ColorOption[];
  rarityFilterOptions: RarityOption[];
  pullRate: PullRateConfig;
  /** Per-game capability flags — gate nav entries / features. */
  supportsMarketplace?: boolean;
  supportsMeta?: boolean;
  supportsTierList?: boolean;
  deckRules?: DeckRules;
  officialCardImageBase?: string;
  officialProductUrl?: (setCode: string) => string;
}
