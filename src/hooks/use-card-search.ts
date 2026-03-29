"use client"

import { useEffect, useState } from "react"
import { fetchCards } from "@/lib/api/fetch-cards"

export type CardSearchResult = {
  id: number
  cardCode: string
  baseCode?: string | null
  nameJp: string
  nameEn?: string | null
  rarity?: string
  imageUrl: string | null
  latestPriceJpy: number | null
  cardType?: string
}

export function useCardSearch({
  debounceMs = 300,
  limit = 20,
  typeFilter,
}: {
  debounceMs?: number
  limit?: number
  typeFilter?: string
} = {}) {
  const [query, setQuery] = useState("")
  const [results, setResults] = useState<CardSearchResult[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const q = query.trim()
    if (q.length < 2) {
      setResults([])
      return
    }

    setLoading(true)

    const t = window.setTimeout(() => {
      void fetchCards({ search: q, limit, type: typeFilter })
        .then((data) => setResults((data.cards ?? []) as CardSearchResult[]))
        .catch((err: unknown) => {
          if (err instanceof Error && err.name !== "AbortError") console.error("Card search failed:", err)
          setResults([])
        })
        .finally(() => setLoading(false))
    }, debounceMs)

    return () => {
      window.clearTimeout(t)
      setLoading(false)
    }
  }, [query, debounceMs, limit, typeFilter])

  const reset = () => {
    setQuery("")
    setResults([])
  }

  return { query, setQuery, results, loading, reset }
}
