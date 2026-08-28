"use client"

import { useEffect, useState } from "react"

import { apiGet, apiTry } from "@/lib/api/client"

/** One card in the palette's empty-state discovery sections. */
export type SpotlightCard = {
  cardCode: string
  nameJp: string
  nameEn: string | null
  nameTh: string | null
  rarity: string
  imageUrl: string | null
  latestPriceJpy: number | null
  latestPriceThb: number | null
  priceChange24h: number | null
  set: { code: string } | null
}

type SpotlightData = { popular: SpotlightCard[]; movers: SpotlightCard[] }

// Module-level cache: the palette opens many times per visit but this data
// only changes with the daily scrape — one fetch per page lifetime is enough.
let cached: SpotlightData | null = null
let inflight: Promise<SpotlightData | null> | null = null

/**
 * Discovery content for the search palette's empty state (CoinMarketCap-style:
 * most-viewed chips + 24h movers). Fetches on the first `open`, then serves
 * the cached data for the rest of the page's life. Failure degrades to empty
 * sections (the palette still works as a plain search box) and the next open
 * retries.
 */
export function useSearchSpotlight(open: boolean) {
  const [data, setData] = useState<SpotlightData | null>(cached)

  useEffect(() => {
    if (!open || cached) return
    inflight ??= apiTry(apiGet<SpotlightData>("/api/cards/spotlight")).then((result) => {
      cached = result
      if (!result) inflight = null
      return result
    })
    let alive = true
    void inflight.then((result) => {
      if (alive && result) setData(result)
    })
    return () => {
      alive = false
    }
  }, [open])

  return {
    popular: data?.popular ?? [],
    movers: data?.movers ?? [],
  }
}
