"use client"

import { useCallback, useEffect, useState } from "react"
import { fetchCards } from "@/lib/api/fetch-cards"

export type CardSearchResult = {
  id: number
  cardCode: string
  baseCode?: string | null
  nameJp: string
  nameEn?: string | null
  rarity: string
  imageUrl: string | null
  set?: { code: string; name?: string }
  latestPriceJpy: number | null
  latestPriceThb?: number | null
  cardType?: string
}

export function useCardSearch({
  debounceMs = 300,
  limit = 20,
  typeFilter,
  game,
}: {
  debounceMs?: number
  limit?: number
  typeFilter?: string
  /** Scope results to a game slug; omit (or "all") for every game. */
  game?: string
} = {}) {
  const [query, setQuery] = useState("")
  const [results, setResults] = useState<CardSearchResult[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const q = query.trim()
    // All setState calls live in the debounce callback (never synchronously
    // in the effect body); short queries clear on the next tick.
    const t = window.setTimeout(() => {
      if (q.length < 2) {
        setResults([])
        setLoading(false)
        return
      }
      setLoading(true)
      void fetchCards({ search: q, limit, type: typeFilter, game })
        .then((data) => setResults((data.cards ?? []) as CardSearchResult[]))
        .catch((err: unknown) => {
          if (err instanceof Error && err.name !== "AbortError") console.error("Card search failed:", err)
          setResults([])
        })
        .finally(() => setLoading(false))
    }, q.length < 2 ? 0 : debounceMs)

    return () => window.clearTimeout(t)
  }, [query, debounceMs, limit, typeFilter, game])

  const reset = useCallback(() => {
    setQuery("")
    setResults([])
  }, [])

  return { query, setQuery, results, loading, reset }
}
