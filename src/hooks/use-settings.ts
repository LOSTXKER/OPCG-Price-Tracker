"use client"

import { useEffect, useSyncExternalStore } from "react"

import { apiGet, apiTry } from "@/lib/api/client"
import { createSharedResource } from "@/lib/api/shared-resource"

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

const resource = createSharedResource<SettingsPayload>(() =>
  apiTry(apiGet<SettingsPayload>("/api/settings")),
)

export function invalidateSettings() {
  resource.invalidate()
}

export function refetchSettings() {
  return resource.refetch()
}

const getServerSnapshot = () => null

export function useSettings() {
  const settings = useSyncExternalStore(resource.subscribe, resource.get, getServerSnapshot)

  useEffect(() => {
    resource.ensure()
  }, [])

  return { settings, loaded: settings !== null, refetch: refetchSettings }
}
