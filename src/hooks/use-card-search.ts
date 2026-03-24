"use client"

import { useEffect, useState } from "react"

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
    const params = new URLSearchParams({ search: q, limit: String(limit) })
    if (typeFilter) params.set("type", typeFilter)

    const t = window.setTimeout(() => {
      void fetch(`/api/cards?${params}`)
        .then((r) => r.json())
        .then((j: { cards: CardSearchResult[] }) => setResults(j.cards ?? []))
        .catch(() => setResults([]))
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
