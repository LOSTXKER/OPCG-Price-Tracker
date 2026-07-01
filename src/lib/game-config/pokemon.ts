import type { GameConfig } from "./types";

/**
 * Pokémon TCG — registered stub (REDESIGN.md P4). `comingSoon: true` so the
 * game switcher surfaces it (disabled) and `?game=pokemon` resolves to a
 * "coming soon" state instead of silently falling back to OPCG. Real sets /
 * rarities / card types / pull-rates + scrapers land when Pokémon data is
 * seeded (P4.2+). Card types use the approved widened enum (POKEMON / TRAINER /
 * ENERGY / STADIUM / SUPPORTER / TOOL) once data exists.
 */
export const pokemonConfig: GameConfig = {
  slug: "pokemon",
  name: "Pokémon Trading Card Game",
  nameEn: "Pokémon TCG",
  shortName: "Pokémon",
  comingSoon: true,
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
