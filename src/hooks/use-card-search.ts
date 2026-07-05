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
  keepPreviousOnError = false,
}: {
  debounceMs?: number
  limit?: number
  typeFilter?: string
  /** Scope results to a game slug; omit (or "all") for every game. */
  game?: string
  /** Keep the previous results on a (non-abort) fetch error instead of clearing. */
  keepPreviousOnError?: boolean
} = {}) {
  const [query, setQuery] = useState("")
  const [results, setResults] = useState<CardSearchResult[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(false)

  useEffect(() => {
    const q = query.trim()
    // Abort superseded requests so out-of-order responses can't clobber the
    // freshest results (each debounced fetch owns its own controller).
    const controller = new AbortController()
    // All setState calls live in the debounce callback (never synchronously
    // in the effect body); short queries clear on the next tick.
    const t = window.setTimeout(() => {
      if (q.length < 2) {
        setResults([])
        setLoading(false)
        setError(false)
        return
      }
      setLoading(true)
      setError(false)
      void fetchCards({ search: q, limit, type: typeFilter, game }, { signal: controller.signal })
        .then((data) => {
          setResults((data.cards ?? []) as CardSearchResult[])
          setError(false)
        })
        .catch((err: unknown) => {
          if (err instanceof Error && err.name === "AbortError") return
          console.error("Card search failed:", err)
          if (!keepPreviousOnError) setResults([])
          setError(true)
        })
        .finally(() => setLoading(false))
    }, q.length < 2 ? 0 : debounceMs)

    return () => {
      window.clearTimeout(t)
      controller.abort()
    }
  }, [query, debounceMs, limit, typeFilter, game, keepPreviousOnError])

  const reset = useCallback(() => {
    setQuery("")
    setResults([])
    setError(false)
  }, [])

  return { query, setQuery, results, loading, error, reset }
}
