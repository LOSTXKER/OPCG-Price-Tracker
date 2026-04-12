"use client"

import { useEffect, useState } from "react"

export type SettingsPayload = {
  id: string
  displayName: string | null
  avatarUrl: string | null
  tier: string
  tierExpiresAt: string | null
  trialUsed: boolean
  trialStartedAt: string | null
  stripeCustomerId: boolean
  stripeSubscriptionId: boolean
  honeyPoints: number
  honeyLifetimeEarned: number
  honeyPendingActions: boolean
  lineConnected: boolean
  emailAlerts: boolean
  lineAlerts: boolean
  weeklyDigest: boolean
  [key: string]: unknown
}

let _cache: SettingsPayload | null = null
let _promise: Promise<SettingsPayload | null> | null = null
let _listeners = new Set<() => void>()

function notify() {
  _listeners.forEach((fn) => fn())
}

function doFetch(): Promise<SettingsPayload | null> {
  if (_promise) return _promise
  _promise = fetch("/api/settings")
    .then((r) => (r.ok ? r.json() : null))
    .then((data: SettingsPayload | null) => {
      _cache = data
      _promise = null
      notify()
      return data
    })
    .catch(() => {
      _promise = null
      return null
    })
  return _promise
}

export function invalidateSettings() {
  _cache = null
  _promise = null
}

export function refetchSettings() {
  invalidateSettings()
  return doFetch()
}

export function useSettings() {
  const [settings, setSettings] = useState<SettingsPayload | null>(_cache)
  const [loaded, setLoaded] = useState(_cache !== null)

  useEffect(() => {
    const sync = () => {
      setSettings(_cache)
      setLoaded(_cache !== null)
    }
    _listeners.add(sync)

    if (!_cache && !_promise) {
      doFetch()
    } else if (_cache) {
      sync()
    }

    return () => { _listeners.delete(sync) }
  }, [])

  return { settings, loaded, refetch: refetchSettings }
}
