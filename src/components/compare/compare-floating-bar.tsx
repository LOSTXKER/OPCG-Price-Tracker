"use client"

import { useEffect, useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { AnimatePresence, motion } from "framer-motion"
import { Scale, X } from "lucide-react"
import { buttonVariants } from "@/components/ui/button"
import { useCompareStore } from "@/stores/compare-store"
import { useUIStore } from "@/stores/ui-store"
import { t } from "@/lib/i18n"
import { cn } from "@/lib/utils"

const MAX_SLOTS = 6

export function CompareFloatingBar() {
  const items = useCompareStore((s) => s.items)
  const remove = useCompareStore((s) => s.remove)
  const clear = useCompareStore((s) => s.clear)
  const lang = useUIStore((s) => s.language)

  const [hydrated, setHydrated] = useState(false)
  useEffect(() => setHydrated(true), [])

  if (!hydrated) return null

  const emptySlots = MAX_SLOTS - items.length

  return (
    <AnimatePresence>
      {items.length > 0 && (
        <motion.div
          initial={{ y: "100%" }}
          animate={{ y: 0 }}
          exit={{ y: "100%" }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
          className="fixed inset-x-0 bottom-0 z-40 border-t bg-background/80 backdrop-blur-xl"
        >
          <div className="mx-auto flex max-w-5xl items-center gap-3 px-4 py-3">
            {/* Card thumbnails */}
            <div className="flex items-center gap-2 overflow-x-auto">
              {items.map((item) => (
                <div key={item.cardCode} className="group/thumb relative shrink-0">
                  <div className="relative h-[60px] w-[43px] overflow-hidden rounded-md border bg-muted">
                    {item.imageUrl ? (
                      <Image
                        src={item.imageUrl}
                        alt={item.name}
                        fill
                        className="object-cover"
                        sizes="43px"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center text-[8px] text-muted-foreground">
                        {item.cardCode}
                      </div>
                    )}
                  </div>
                  <button
                    onClick={() => remove(item.cardCode)}
                    className="absolute -right-1.5 -top-1.5 hidden size-4 items-center justify-center rounded-full bg-destructive text-white group-hover/thumb:flex"
                    aria-label={t(lang, "removeFromCompare")}
                  >
                    <X className="size-2.5" />
                  </button>
                  <p className="mt-0.5 w-[43px] truncate text-center text-[9px] text-muted-foreground">
                    {item.cardCode}
                  </p>
                </div>
              ))}

              {/* Empty slots */}
              {Array.from({ length: emptySlots }).map((_, i) => (
                <div
                  key={`empty-${i}`}
                  className="hidden h-[60px] w-[43px] shrink-0 items-center justify-center rounded-md border border-dashed border-muted-foreground/20 sm:flex"
                >
                  <Scale className="size-3 text-muted-foreground/30" />
                </div>
              ))}
            </div>

            <div className="ml-auto flex shrink-0 items-center gap-2">
              <button
                onClick={clear}
                className="text-xs text-muted-foreground hover:text-foreground"
              >
                {t(lang, "clearAll")}
              </button>
              <Link
                href="/compare"
                className={cn(
                  buttonVariants({ size: "sm" }),
                  items.length < 2 && "pointer-events-none opacity-50"
                )}
              >
                {t(lang, "compareNow")} ({items.length})
              </Link>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
