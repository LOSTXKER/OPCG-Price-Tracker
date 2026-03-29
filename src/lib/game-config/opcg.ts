import { OPCG_SETS } from "@/lib/constants/sets";
import { BASE_RARITIES, PARALLEL_RARITIES } from "@/lib/constants/rarities";
import type { GameConfig } from "./types";

export const opcgConfig: GameConfig = {
  slug: "opcg",
  name: "ONE PIECE CARD GAME",
  nameEn: "One Piece Card Game",

  sets: OPCG_SETS,

  baseRarities: BASE_RARITIES,
  parallelRarities: PARALLEL_RARITIES,

  cardTypes: [
    { code: "LEADER", label: "Leader" },
    { code: "CHARACTER", label: "Character" },
    { code: "EVENT", label: "Event" },
    { code: "STAGE", label: "Stage" },
    { code: "DON", label: "DON!!" },
  ],

  colors: [
    { code: "Red", label: "Red", bg: "bg-red-500" },
    { code: "Blue", label: "Blue", bg: "bg-blue-500" },
    { code: "Green", label: "Green", bg: "bg-green-500" },
    { code: "Purple", label: "Purple", bg: "bg-purple-500" },
    { code: "Black", label: "Black", bg: "bg-gray-800" },
    { code: "Yellow", label: "Yellow", bg: "bg-yellow-400" },
    { code: "multi", label: "Multi", bg: "bg-gradient-to-r from-red-400 to-blue-400" },
  ],

  rarityFilterOptions: [
    { code: "SEC", label: "SEC" },
    { code: "SR", label: "SR" },
    { code: "R", label: "R" },
    { code: "UC", label: "UC" },
    { code: "C", label: "C" },
    { code: "L", label: "Leader" },
    { code: "SP", label: "SP" },
    { code: "TR", label: "TR" },
    { code: "DON", label: "DON" },
  ],

  pullRate: {
    packsPerBox: 24,
    cardsPerPack: 6,
    boxesPerCarton: 12,
    boxPatterns: [
      { name: "SEC Box", nameJp: "シークレット1枚箱", prob: 0.33, sec: 1, parallel: 0, sr: 3 },
      { name: "Parallel 1 Box", nameJp: "パラレル1枚箱", prob: 0.42, sec: 0, parallel: 1, sr: 3 },
      { name: "Parallel 2 Box", nameJp: "パラレル2枚箱", prob: 0.25, sec: 0, parallel: 2, sr: 3 },
    ],
    expectedParallelSlotsPerBox: 0.33 * 0 + 0.42 * 1 + 0.25 * 2,
    fallbackAvgPerBox: { C: 72, UC: 24, R: 24 },
  },

  officialCardImageBase: "https://www.onepiece-cardgame.com/images/cardlist/card",

  officialProductUrl: (setCode: string) =>
    `https://www.onepiece-cardgame.com/products/boosters/${setCode.toLowerCase()}.php`,
};
