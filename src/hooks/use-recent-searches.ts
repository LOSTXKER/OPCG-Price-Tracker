"use client"

import { useCallback, useEffect, useState } from "react"

const RECENT_KEY = "meecard-recent-searches"
const RECENT_MAX = 6

function readRecent(): string[] {
  if (typeof window === "undefined") return []
  try {
    const raw = window.localStorage.getItem(RECENT_KEY)
    const parsed = raw ? (JSON.parse(raw) as unknown) : []
    return Array.isArray(parsed) ? parsed.filter((x): x is string => typeof x === "string") : []
  } catch {
    return []
  }
}
function writeRecent(next: string[]) {
  try {
    window.localStorage.setItem(RECENT_KEY, JSON.stringify(next.slice(0, RECENT_MAX)))
  } catch {
    /* storage may be unavailable (private mode) — recent is best-effort */
  }
}

/**
 * Recent card-search terms, persisted in localStorage under ONE shared key across
 * every search surface (home hero · Cmd-K palette · inline CardSearch). Reads after
 * mount (SSR-safe, no hydration drift). `push` dedups case-insensitively, newest
 * first, capped at 6. Replaces the byte-identical readRecent/writeRecent + recent
 * state each surface used to carry (KIT-07).
 */
export function useRecentSearches() {
  const [recent, setRecent] = useState<string[]>([])

  useEffect(() => {
    // Read localStorage after mount (not during render) to avoid hydration drift;
    // the timeout keeps the setState out of the effect body per the repo lint rule.
    const tm = setTimeout(() => setRecent(readRecent()), 0)
    return () => clearTimeout(tm)
  }, [])

  /**
   * Re-read from storage — used by always-mounted surfaces (the Cmd-K modal) that
   * must pick up terms added by OTHER surfaces each time they reopen.
   */
  const refresh = useCallback(() => setRecent(readRecent()), [])

  const push = useCallback((value: string) => {
    const v = value.trim()
    if (!v) return
    setRecent((prev) => {
      const next = [v, ...prev.filter((r) => r.toLowerCase() !== v.toLowerCase())].slice(0, RECENT_MAX)
      writeRecent(next)
      return next
    })
  }, [])

  const remove = useCallback((value: string) => {
    setRecent((prev) => {
      const next = prev.filter((r) => r !== value)
      writeRecent(next)
      return next
    })
  }, [])

  const clear = useCallback(() => {
    setRecent([])
    writeRecent([])
  }, [])

  return { recent, push, remove, clear, refresh }
}
