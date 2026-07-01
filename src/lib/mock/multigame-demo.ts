"use client"

import { useSyncExternalStore } from "react"

import type { ItemRow } from "@/hooks/use-portfolio-api"
import type { GameRef } from "@/lib/types/portfolio"
import type { WatchlistEntry } from "@/app/watchlist/watchlist-types"
import type { PriceAlertItem } from "@/components/alerts/alert-types"

/**
 * DEMO-ONLY multi-game mock. Pokémon has no real data yet, but the multi-game
 * MINE UI (game chips, per-row badges, scope label) only becomes visible with
 * ≥2 games. Append `?demo=multigame` to /portfolio, /watchlist, or
 * /settings/alerts to splice these synthetic Pokémon entries into the fetched
 * lists — CLIENT-ONLY, never touches the DB or real users, reversible by
 * dropping the query param. Delete this file + its call sites once real Pokémon
 * data lands.
 */
const noopSubscribe = () => () => {}

export function useMultigameDemo(): boolean {
  // useSyncExternalStore reads the query param straight from the client snapshot
  // (false on the server), so it's hydration-safe WITHOUT a setState-in-effect —
  // and dodges useSearchParams()'s Suspense/CSR-bailout on these static shells.
  return useSyncExternalStore(
    noopSubscribe,
    () => new URLSearchParams(window.location.search).get("demo") === "multigame",
    () => false,
  )
}

const POKEMON: GameRef = {
  slug: "pokemon",
  name: "Pokémon Trading Card Game",
  nameEn: "Pokémon TCG",
  logoUrl: null,
}

// Negative ids so mock rows never collide with real ones. Display-only —
// mutating a mock row would 404 against the API, which is acceptable for a demo.
export const MOCK_POKEMON_PORTFOLIO_ITEMS: ItemRow[] = [
  {
    id: -9001,
    quantity: 2,
    purchasePrice: 12000,
    condition: "NM",
    card: {
      id: -9001,
      cardCode: "SV1a-205",
      baseCode: "SV1a-205",
      nameJp: "リザードンex",
      nameEn: "Charizard ex",
      imageUrl: null,
      rarity: "SAR",
      latestPriceJpy: 18500,
      latestPriceThb: null,
      priceChange24h: 3.2,
      priceChange7d: 8.4,
      set: { game: POKEMON },
    },
  },
  {
    id: -9002,
    quantity: 1,
    purchasePrice: 5200,
    condition: "NM",
    card: {
      id: -9002,
      cardCode: "SV4a-201",
      baseCode: "SV4a-201",
      nameJp: "ピカチュウex",
      nameEn: "Pikachu ex",
      imageUrl: null,
      rarity: "SAR",
      latestPriceJpy: 6900,
      latestPriceThb: null,
      priceChange24h: -1.1,
      priceChange7d: 2.0,
      set: { game: POKEMON },
    },
  },
  {
    id: -9003,
    quantity: 4,
    purchasePrice: 700,
    condition: "NM",
    card: {
      id: -9003,
      cardCode: "SV3-125",
      baseCode: "SV3-125",
      nameJp: "ミュウex",
      nameEn: "Mew ex",
      imageUrl: null,
      rarity: "RR",
      latestPriceJpy: 1250,
      latestPriceThb: null,
      priceChange24h: 0.5,
      priceChange7d: -0.8,
      set: { game: POKEMON },
    },
  },
]

export const MOCK_POKEMON_WATCHLIST: WatchlistEntry[] = [
  {
    id: -9101,
    cardId: -9101,
    pinnedAt: null,
    addedAt: "2026-06-20T00:00:00.000Z",
    hasActiveAlert: false,
    card: {
      id: -9101,
      cardCode: "SV2a-200",
      baseCode: "SV2a-200",
      nameJp: "リザードンex",
      nameEn: "Charizard ex",
      nameTh: null,
      rarity: "UR",
      imageUrl: null,
      latestPriceJpy: 24000,
      latestPriceThb: null,
      priceChange24h: 1.4,
      priceChange7d: 5.0,
      priceChange30d: 12.0,
      set: { code: "SV2a", game: POKEMON },
    },
  },
  {
    id: -9102,
    cardId: -9102,
    pinnedAt: "2026-06-22T00:00:00.000Z",
    addedAt: "2026-06-18T00:00:00.000Z",
    hasActiveAlert: true,
    card: {
      id: -9102,
      cardCode: "SV5a-072",
      baseCode: "SV5a-072",
      nameJp: "ミライドンex",
      nameEn: "Miraidon ex",
      nameTh: null,
      rarity: "RR",
      imageUrl: null,
      latestPriceJpy: 890,
      latestPriceThb: null,
      priceChange24h: -2.3,
      priceChange7d: -4.1,
      priceChange30d: 3.2,
      set: { code: "SV5a", game: POKEMON },
    },
  },
]

export const MOCK_POKEMON_ALERTS: PriceAlertItem[] = [
  {
    id: -9201,
    userId: "demo",
    cardId: -9201,
    targetPrice: 20000,
    direction: "ABOVE",
    channels: ["EMAIL"],
    isActive: true,
    triggeredAt: null,
    createdAt: "2026-06-25T00:00:00.000Z",
    card: {
      id: -9201,
      cardCode: "SV1a-205",
      baseCode: "SV1a-205",
      nameJp: "リザードンex",
      nameEn: "Charizard ex",
      nameTh: null,
      rarity: "SAR",
      imageUrl: null,
      latestPriceJpy: 18500,
      latestPriceThb: null,
      set: { code: "SV1a", name: "スカーレットex", nameEn: "Scarlet ex", nameTh: null, game: POKEMON },
    },
  },
  {
    id: -9202,
    userId: "demo",
    cardId: -9202,
    targetPrice: 1000,
    direction: "BELOW",
    channels: ["LINE", "EMAIL"],
    isActive: true,
    triggeredAt: null,
    createdAt: "2026-06-27T00:00:00.000Z",
    card: {
      id: -9202,
      cardCode: "SV3-125",
      baseCode: "SV3-125",
      nameJp: "ミュウex",
      nameEn: "Mew ex",
      nameTh: null,
      rarity: "RR",
      imageUrl: null,
      latestPriceJpy: 1250,
      latestPriceThb: null,
      set: { code: "SV3", name: "黒炎の支配者", nameEn: "Ruler of the Black Flame", nameTh: null, game: POKEMON },
    },
  },
]
