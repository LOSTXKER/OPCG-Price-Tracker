"use client"

import { useState, type ReactNode } from "react"
import { X } from "lucide-react"
import { usePathname } from "next/navigation"

import { useHydrated } from "@/hooks/use-hydrated"
import { t } from "@/lib/i18n"
import { useUIStore } from "@/stores/ui-store"
import { IconButton } from "@/components/ui/icon-button"

import {
  useAdAudience,
  useAdPageContentAvailable,
  type AdAudienceState,
} from "./ad-audience-provider"
import {
  AdInventorySlot,
  shouldRenderAdSlot,
} from "./ad-inventory-slot"
import { getEligibleAdInventory } from "./inventory"

export const FLOATING_AD_DISMISS_KEY =
  "meecard:ads:bottom-anchor:dismissed:v1"

type SessionStorageLike = Pick<Storage, "getItem" | "setItem">

export function shouldRenderFloatingBottomAd({
  hydrated,
  dismissed,
  audience,
  contentAvailable,
  eligible,
}: {
  hydrated: boolean
  dismissed: boolean
  audience: AdAudienceState
  contentAvailable: boolean
  eligible: boolean
}): boolean {
  return (
    hydrated &&
    !dismissed &&
    eligible &&
    shouldRenderAdSlot(audience, contentAvailable)
  )
}

export function isFloatingAdDismissed(
  storage: SessionStorageLike | null,
): boolean {
  if (!storage) return false

  try {
    return storage.getItem(FLOATING_AD_DISMISS_KEY) === "1"
  } catch {
    return false
  }
}

export function persistFloatingAdDismissal(
  storage: SessionStorageLike | null,
): void {
  if (!storage) return

  try {
    storage.setItem(FLOATING_AD_DISMISS_KEY, "1")
  } catch {
    // Storage can be blocked in hardened/private browser contexts. The local
    // React state still closes the ad for the current page in that case.
  }
}

function getBrowserSessionStorage(): SessionStorageLike | null {
  try {
    return window.sessionStorage
  } catch {
    return null
  }
}

export function FloatingAdFrame({
  children,
  dismissLabel,
  onDismiss,
}: {
  children: ReactNode
  dismissLabel: string
  onDismiss: () => void
}) {
  return (
    <>
      <div
        aria-hidden
        data-floating-ad-spacer
        className="h-[var(--floating-ad-clearance)] shrink-0"
      />
      <div className="pointer-events-none fixed inset-x-0 bottom-[calc(4rem+env(safe-area-inset-bottom)+0.5rem)] z-ad px-3 md:bottom-4 md:px-4">
        <div
          data-floating-ad-dock
          className="pointer-events-auto relative mx-auto w-full max-w-[320px] sm:max-w-[728px]"
        >
          {children}
          <IconButton
            aria-label={dismissLabel}
            onClick={onDismiss}
            size="sm"
            variant="solid"
            className="absolute -right-2 -top-3 z-10 rounded-full bg-background text-foreground shadow-[var(--elev-raised)]"
          >
            <X className="size-4" aria-hidden />
          </IconButton>
        </div>
      </div>
    </>
  )
}

export function FloatingBottomAd() {
  const hydrated = useHydrated()
  const pathname = usePathname()
  const audience = useAdAudience()
  const contentAvailable = useAdPageContentAvailable()
  const lang = useUIStore((state) => state.language)
  const [dismissed, setDismissed] = useState(false)
  const eligible = Boolean(
    getEligibleAdInventory("global-bottom-anchor", pathname),
  )

  if (!shouldRenderFloatingBottomAd({
    hydrated,
    dismissed,
    audience,
    contentAvailable,
    eligible,
  })) {
    return null
  }

  const storage = getBrowserSessionStorage()
  if (isFloatingAdDismissed(storage)) return null

  function dismiss() {
    persistFloatingAdDismissal(storage)
    setDismissed(true)
  }

  return (
    <FloatingAdFrame dismissLabel={t(lang, "adDismissLabel")} onDismiss={dismiss}>
      <AdInventorySlot
        zone="global-bottom-anchor"
        className="shadow-[var(--elev-overlay)]"
      />
    </FloatingAdFrame>
  )
}
