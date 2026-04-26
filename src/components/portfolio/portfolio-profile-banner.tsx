"use client"

import { useCallback, useEffect, useState } from "react"

export interface PrivacyFlags {
  userId: string
  handle: string | null
  showCollection: boolean
  profileVisibility: string
  showListings: boolean
  showDecks: boolean
  showStats: boolean
  hidePortfolioPrices: boolean
  hidePortfolioQty: boolean
  profileSummaryOnly: boolean
}

export function useProfileVisibility() {
  const [flags, setFlags] = useState<PrivacyFlags | null>(null)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    let cancelled = false
    fetch("/api/me")
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (cancelled || !data?.user) return
        setFlags({
          userId: data.user.id,
          handle: data.user.handle ?? null,
          showCollection: data.user.showCollection ?? true,
          profileVisibility: data.user.profileVisibility ?? "public",
          showListings: data.user.showListings ?? true,
          showDecks: data.user.showDecks ?? true,
          showStats: data.user.showStats ?? true,
          hidePortfolioPrices: data.user.hidePortfolioPrices ?? false,
          hidePortfolioQty: data.user.hidePortfolioQty ?? false,
          profileSummaryOnly: data.user.profileSummaryOnly ?? false,
        })
      })
      .catch(() => {})
    return () => { cancelled = true }
  }, [])

  const patchField = useCallback(async (field: string, value: unknown) => {
    setSaving(true)
    try {
      await fetch("/api/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ [field]: value }),
      })
      setFlags((f) => f ? { ...f, [field]: value } : f)
    } catch {
      // revert handled by caller
    } finally {
      setSaving(false)
    }
  }, [])

  const toggleCollection = useCallback(async () => {
    if (!flags || saving) return
    const next = !flags.showCollection
    setFlags((f) => f ? { ...f, showCollection: next } : f)
    setSaving(true)
    try {
      await fetch("/api/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ showCollection: next }),
      })
    } catch {
      setFlags((f) => f ? { ...f, showCollection: !next } : f)
    } finally {
      setSaving(false)
    }
  }, [flags, saving])

  const profileHref = flags
    ? flags.handle
      ? `/@${flags.handle}`
      : `/profile/${flags.userId}`
    : null

  return {
    ready: flags !== null,
    flags,
    isVisible: flags?.showCollection ?? false,
    saving,
    toggle: toggleCollection,
    patchField,
    profileHref,
  }
}
