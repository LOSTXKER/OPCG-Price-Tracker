import Image from "next/image"
import Link from "next/link"

import { cn } from "@/lib/utils"
import { Price } from "@/components/shared/price-inline"
import { RarityBadge } from "@/components/shared/rarity-badge"
import { Skeleton } from "@/components/ui/skeleton"
import { getCardName } from "@/lib/i18n"
import type { Language } from "@/stores/ui-store"
import type { SiblingCard } from "./card-detail"

interface SiblingGridProps {
  siblings: SiblingCard[]
  lang: Language
  cols: number
  smCols?: number
  /**
   * Card code of the main card on the page. Lets us draw a "current" outline
   * on its sibling tile and compute relative price diffs.
   */
  mainCardCode?: string
}

/**
 * Extract the variant suffix from a card code, e.g. ST26-005_p2 → "_p2".
 * Returns an empty string for the base print so the UI doesn't render a
 * useless extra chip on every regular card.
 */
function variantSuffix(code: string): string {
  const idx = code.indexOf("_")
  return idx === -1 ? "" : code.slice(idx)
}

export function SiblingGrid({
  siblings,
  lang,
  cols,
  smCols,
  mainCardCode,
}: SiblingGridProps) {
  return (
    <div
      className={cn(
        "grid gap-2 grid-cols-3",
        // Tailwind needs literal class names — switch on the prop instead of
        // building the class via interpolation so the JIT picks them up.
        cols === 4 && "sm:grid-cols-4",
        cols === 5 && "sm:grid-cols-5",
        cols === 6 && "sm:grid-cols-6",
        cols !== 4 && cols !== 5 && cols !== 6 && "sm:grid-cols-4",
        smCols === 5 && "md:grid-cols-5",
        smCols === 6 && "md:grid-cols-6",
        smCols === 8 && "md:grid-cols-8",
      )}
    >
      {siblings.map((s) => {
        const isCurrent = mainCardCode != null && s.cardCode === mainCardCode
        const suffix = variantSuffix(s.cardCode)

        return (
          <Link
            key={s.id}
            href={`/opcg/cards/${s.cardCode}`}
            className={cn(
              "group flex flex-col gap-1.5 text-center",
              isCurrent && "pointer-events-none",
            )}
            aria-current={isCurrent ? "page" : undefined}
          >
            <div
              className={cn(
                "surface-1 hairline ease-chrome relative aspect-[63/88] w-full overflow-hidden rounded-lg",
                isCurrent ? "ring-2 ring-primary/70" : "group-lift",
              )}
            >
              {s.imageUrl ? (
                <Image
                  src={s.imageUrl}
                  alt={getCardName(lang, s)}
                  fill
                  className="object-contain"
                  sizes="100px"
                />
              ) : (
                <Skeleton className="absolute inset-0 size-full" />
              )}
            </div>
            <div>
              <div className="flex items-center justify-center gap-1">
                <span className="surface-2 inline-block rounded-sm px-1 py-px font-price text-xs uppercase text-muted-foreground">
                  {s.set.code}
                  {suffix && (
                    <span className="ml-0.5 text-muted-foreground/70">
                      {suffix}
                    </span>
                  )}
                </span>
                <RarityBadge rarity={s.rarity} size="sm" />
              </div>
              {s.latestPriceJpy != null && (
                <p className="mt-0.5 font-price text-xs font-semibold">
                  <Price jpy={s.latestPriceJpy} />
                </p>
              )}
            </div>
          </Link>
        )
      })}
    </div>
  )
}
