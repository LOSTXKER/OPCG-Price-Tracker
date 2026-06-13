"use client"

import { useCallback, useEffect, useState } from "react"

import { apiGet, apiPatch, apiTry } from "@/lib/api/client"

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
    void (async () => {
      const data = await apiTry(
        apiGet<{ user?: Partial<PrivacyFlags> & { id: string } } | null>("/api/me"),
      )
      if (cancelled || !data?.user) return
      const user = data.user
      setFlags({
        userId: user.id,
        handle: user.handle ?? null,
        showCollection: user.showCollection ?? true,
        profileVisibility: user.profileVisibility ?? "public",
        showListings: user.showListings ?? true,
        showDecks: user.showDecks ?? true,
        showStats: user.showStats ?? true,
        hidePortfolioPrices: user.hidePortfolioPrices ?? false,
        hidePortfolioQty: user.hidePortfolioQty ?? false,
        profileSummaryOnly: user.profileSummaryOnly ?? false,
      })
    })()
    return () => { cancelled = true }
  }, [])

  const patchField = useCallback(async (field: string, value: unknown) => {
    setSaving(true)
    // revert handled by caller; apiTry swallows failures
    const ok = await apiTry(apiPatch("/api/me", { [field]: value }))
    if (ok !== null) {
      setFlags((f) => f ? { ...f, [field]: value } : f)
    }
    setSaving(false)
  }, [])

  const toggleCollection = useCallback(async () => {
    if (!flags || saving) return
    const next = !flags.showCollection
    setFlags((f) => f ? { ...f, showCollection: next } : f)
    setSaving(true)
    try {
      await apiPatch("/api/me", { showCollection: next })
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
