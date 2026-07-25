"use client"

import Image from "next/image"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { AnimatePresence, motion } from "framer-motion"
import { X } from "lucide-react"
import { useCompareStore } from "@/stores/compare-store"
import { useHydrated } from "@/hooks/use-hydrated"
import { useUIStore } from "@/stores/ui-store"
import { t } from "@/lib/i18n"
import { cn } from "@/lib/utils"
import { stripGamePrefix } from "@/lib/game/constants"

const MAX_VISIBLE = 4

/**
 * Minimal floating "cart" for the compare flow. Renders as a single pill at
 * the bottom-center of the screen with overlapping card thumbnails and a
 * primary "Compare now" CTA. Empty tier slots are intentionally not shown
 * here — that's the job of the /compare rail.
 */
export function CompareFloatingBar() {
  const items = useCompareStore((s) => s.items)
  const seen = useCompareStore((s) => s.seen)
  const clear = useCompareStore((s) => s.clear)
  const lang = useUIStore((s) => s.language)
  const pathname = usePathname()

  const hydrated = useHydrated()

  if (!hydrated) return null
  if (stripGamePrefix(pathname) === "/compare") return null
  if (seen) return null
  if (items.length === 0) return null

  const visible = items.slice(0, MAX_VISIBLE)
  const overflow = Math.max(items.length - MAX_VISIBLE, 0)
  const ready = items.length >= 2

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: 32, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 32, opacity: 0 }}
        transition={{ type: "spring", damping: 22, stiffness: 280 }}
        className="pointer-events-none fixed inset-x-0 bottom-[calc(5rem+var(--floating-ad-clearance))] z-40 flex justify-center px-4 md:bottom-[calc(1.5rem+var(--floating-ad-clearance))]"
      >
        <div
          className={cn(
            "pointer-events-auto inline-flex items-center gap-3 rounded-full border bg-background py-1.5 pl-2 pr-1.5 shadow-[var(--elev-raised)]",
            "ring-1 ring-black/5",
          )}
        >
          {/* Overlapping card thumbnails */}
          <div className="flex items-center -space-x-2">
            {visible.map((item) => (
              <div
                key={item.cardCode}
                className="relative size-9 overflow-hidden rounded-full border-2 border-background bg-muted"
                title={item.name}
              >
                {item.imageUrl ? (
                  <Image
                    src={item.imageUrl}
                    alt={item.name}
                    fill
                    className="object-cover"
                    sizes="36px"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center text-overlay font-mono text-muted-foreground">
                    {item.cardCode.slice(0, 4)}
                  </div>
                )}
              </div>
            ))}
            {overflow > 0 && (
              <div className="relative flex size-9 items-center justify-center rounded-full border-2 border-background bg-muted text-xs font-semibold text-muted-foreground">
                +{overflow}
              </div>
            )}
          </div>

          {/* Compare CTA */}
          <Link
            href="/opcg/compare"
            aria-disabled={!ready}
            className={cn(
              "inline-flex h-9 items-center gap-1.5 rounded-full bg-primary px-4 text-sm font-semibold text-primary-foreground motion-base",
              "hover:bg-primary/90",
              !ready && "pointer-events-none opacity-50",
            )}
          >
            {t(lang, "compareNow")}
            <span className="text-xs font-normal opacity-80">
              ({items.length})
            </span>
          </Link>

          {/* Clear */}
          <button
            type="button"
            onClick={clear}
            aria-label={t(lang, "clearAll")}
            className="flex size-8 items-center justify-center rounded-full text-muted-foreground motion-base hover:bg-muted hover:text-foreground"
          >
            <X className="size-4" />
          </button>
        </div>
      </motion.div>
    </AnimatePresence>
  )
}
