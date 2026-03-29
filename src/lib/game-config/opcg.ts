import { OPCG_SETS } from "@/lib/constants/sets";
import { BASE_RARITIES, PARALLEL_RARITIES } from "@/lib/constants/rarities";
import { CARD_TYPES, CARD_COLORS } from "@/lib/constants/card-config";
import type { GameConfig } from "./types";

export const opcgConfig: GameConfig = {
  slug: "opcg",
  name: "ONE PIECE CARD GAME",
  nameEn: "One Piece Card Game",

  sets: OPCG_SETS,

  baseRarities: BASE_RARITIES,
  parallelRarities: PARALLEL_RARITIES,

  cardTypes: CARD_TYPES.map((ct) => ({ code: ct.code, label: ct.label.EN })),

  colors: CARD_COLORS.map((cc) => ({ code: cc.value, label: cc.label.EN, bg: cc.bgClass })),

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
