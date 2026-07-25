import type { Language } from "@/lib/i18n"

import type {
  AdInventoryDefinition,
  AdKind,
  AdZone,
} from "./inventory"

type LocalizedCopy = Record<Language, string>

export type DirectCampaign = {
  advertiser: string
  headline: LocalizedCopy
  body: LocalizedCopy
  cta: LocalizedCopy
  href: `https://${string}`
}

export type DirectInventoryState = {
  status: "ACTIVE"
  campaign: DirectCampaign
}

/**
 * Empty by default. Add a zone only after a real campaign has been approved.
 * Absence means the slot falls back to its Google mock without exposing an
 * "available sponsor space" message to visitors.
 */
export const DIRECT_INVENTORY: Partial<
  Record<AdZone, DirectInventoryState>
> = {}

export function resolveAdProvider(
  definition: AdInventoryDefinition,
  directInventory: DirectInventoryState | undefined,
): AdKind {
  if (
    definition.strategy === "DIRECT_THEN_GOOGLE" &&
    directInventory?.status === "ACTIVE"
  ) {
    return "DIRECT"
  }

  return "GOOGLE_MOCK"
}
