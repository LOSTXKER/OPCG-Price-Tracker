"use client"

import { usePathname } from "next/navigation"

import { useUIStore } from "@/stores/ui-store"

import { useAdAudience } from "./ad-audience-provider"
import {
  DIRECT_INVENTORY,
  resolveAdProvider,
} from "./direct-campaigns"
import { DirectSponsorCreative } from "./direct-sponsor-creative"
import { GoogleAdMockup } from "./google-ad-mockup"
import {
  getEligibleAdInventory,
  type AdZone,
} from "./inventory"

const EAGER_IMAGE_ZONES = new Set<AdZone>([
  "global-bottom-anchor",
  "card-detail-chart-rail",
])

export function shouldRenderAdSlot(
  audience: ReturnType<typeof useAdAudience>,
  contentAvailable: boolean,
): boolean {
  return audience === "VISIBLE" && contentAvailable
}

export function AdInventorySlot({
  zone,
  contentAvailable = true,
  className,
  presentation = "BLOCK",
  tableColumnCount,
}: {
  zone: AdZone
  contentAvailable?: boolean
  className?: string
  presentation?: "BLOCK" | "TABLE_ROW"
  tableColumnCount?: number
}) {
  const pathname = usePathname()
  const lang = useUIStore((state) => state.language)
  const audience = useAdAudience()

  if (!shouldRenderAdSlot(audience, contentAvailable)) return null

  const definition = getEligibleAdInventory(zone, pathname)
  if (!definition) return null

  const directInventory = DIRECT_INVENTORY[zone]
  const provider = resolveAdProvider(definition, directInventory)
  const creative =
    provider === "DIRECT" && directInventory ? (
      <DirectSponsorCreative
        definition={definition}
        campaign={directInventory.campaign}
        lang={lang}
        className={className}
      />
    ) : (
      <GoogleAdMockup
        definition={definition}
        lang={lang}
        className={className}
        eager={EAGER_IMAGE_ZONES.has(zone)}
      />
    )

  if (presentation === "TABLE_ROW") {
    if (!tableColumnCount) return null
    return (
      <tr data-ad-presentation="table-row">
        <td colSpan={tableColumnCount} className="px-3 py-6">
          {creative}
        </td>
      </tr>
    )
  }

  return creative
}
