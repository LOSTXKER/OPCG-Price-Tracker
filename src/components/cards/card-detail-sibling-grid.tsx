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
}

export function SiblingGrid({ siblings, lang, cols, smCols }: SiblingGridProps) {
  return (
    <div
      className={cn(
        "grid gap-2 grid-cols-3",
        cols === 4 ? "sm:grid-cols-4" : cols === 5 ? "sm:grid-cols-5" : "sm:grid-cols-4",
        smCols === 5 && "md:grid-cols-5",
      )}
    >
      {siblings.map((s) => (
        <Link
          key={s.id}
          href={`/cards/${s.cardCode}`}
          className="group flex flex-col gap-1.5 text-center transition-transform duration-200 hover:-translate-y-0.5"
        >
          <div className="panel relative aspect-[63/88] w-full overflow-hidden">
            {s.imageUrl ? (
              <Image src={s.imageUrl} alt={getCardName(lang, s)} fill className="object-contain" sizes="100px" />
            ) : (
              <Skeleton className="absolute inset-0 size-full" />
            )}
          </div>
          <div>
            <span className="inline-block rounded bg-muted px-1 py-px font-price text-xs uppercase text-muted-foreground">
              {s.set.code}
            </span>
            <RarityBadge rarity={s.rarity} size="sm" />
            {s.latestPriceJpy != null && (
              <p className="mt-0.5 font-price text-xs font-semibold">
                <Price jpy={s.latestPriceJpy} />
              </p>
            )}
          </div>
        </Link>
      ))}
    </div>
  )
}
