import type { GameConfig } from "./types";

/**
 * Pokémon TCG — registered roadmap stub (REDESIGN.md P4). It stays visible in
 * the canonical Header switcher, but the release gate keeps it out of active
 * selectors, cookies and catalog routes until both data and routing are ready.
 * Real sets / rarities / card types / pull-rates + scrapers land when Pokémon
 * data is seeded (P4.2+). Card types use the approved widened enum (POKEMON /
 * TRAINER / ENERGY / STADIUM / SUPPORTER / TOOL) once data exists.
 */
export const pokemonConfig: GameConfig = {
  slug: "pokemon",
  name: "Pokémon Trading Card Game",
  nameEn: "Pokémon TCG",
  logoUrl: "/games/pokemon-logo.png",
  shortName: "Pokémon",
  filterName: "Pokémon",
  release: {
    status: "ROADMAP",
    data: "STUB",
    routes: "BLOCKED",
  },
  accentTint: "#F2C744", // thin yellow skin over honey (whisper, not repaint)

  sets: [],
  baseRarities: [],
  parallelRarities: [],
  cardTypes: [],
  colors: [],
  rarityFilterOptions: [],

  pullRate: {
    packsPerBox: 0,
    cardsPerPack: 0,
    boxesPerCarton: 0,
    boxPatterns: [],
    expectedParallelSlotsPerBox: 0,
    fallbackAvgPerBox: {},
  },

  deckRules: { mainDeckSize: 60, maxCopies: 4, requiresLeader: false },
};
