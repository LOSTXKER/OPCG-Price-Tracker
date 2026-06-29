import Image from "next/image"
import Link from "next/link"
import { ArrowRight, Layers } from "lucide-react"
import { Price } from "@/components/shared/price-inline"
import { RarityBadge } from "@/components/shared/rarity-badge"
import { t, getCardName, getSetName } from "@/lib/i18n"
import { cn } from "@/lib/utils"
import type { Language } from "@/stores/ui-store"
import type { RelatedCard } from "./card-detail"

interface CardDetailRelatedProps {
  relatedCards: RelatedCard[]
  set: { code: string; name: string; nameEn?: string | null; nameTh?: string | null }
  lang: Language
}

export function CardDetailRelated({ relatedCards, set, lang }: CardDetailRelatedProps) {
  const setDisplayName = getSetName(lang, set)

  return (
    <div>
      {relatedCards.length > 0 && (
        <>
          <div className="mb-3 flex items-center justify-between gap-2">
            <h2 className="min-w-0 break-words text-h3">
              {t(lang, "otherCardsFrom")} {setDisplayName}
            </h2>
            <Link
              href={`/sets/${set.code}`}
              className="text-meta motion-base hover:text-foreground"
            >
              {t(lang, "viewAll")} →
            </Link>
          </div>
          <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6">
            {relatedCards.map((rc) => {
              const rcName = getCardName(lang, rc)
              return (
                <Link
                  key={rc.id}
                  href={`/cards/${rc.cardCode}`}
                  className="group flex flex-col"
                >
                  <div className="surface-1 hairline ease-chrome relative aspect-[63/88] w-full overflow-hidden rounded-lg group-lift">
                    {rc.imageUrl ? (
                      <Image
                        src={rc.imageUrl}
                        alt={rcName}
                        fill
                        className="object-contain"
                        sizes="(max-width: 640px) 30vw, (max-width: 768px) 22vw, (max-width: 1024px) 18vw, 14vw"
                      />
                    ) : (
                      <div className="size-full bg-muted" />
                    )}
                  </div>
                  <div className="mt-1.5">
                    <p className="truncate text-xs font-medium leading-tight">{rcName}</p>
                    <div className="mt-0.5 flex items-center gap-1">
                      <RarityBadge rarity={rc.rarity} size="sm" />
                    </div>
                    {rc.latestPriceJpy != null && (
                      <p className="mt-0.5 font-price text-xs font-semibold">
                        <Price jpy={rc.latestPriceJpy} />
                      </p>
                    )}
                  </div>
                </Link>
              )
            })}
          </div>
        </>
      )}

      <Link
        href={`/sets/${set.code}`}
        className={cn(
          "ease-chrome hairline-t flex items-center justify-center gap-2 pt-4 text-sm font-medium text-muted-foreground hover:text-foreground",
          relatedCards.length > 0 && "mt-6",
        )}
      >
        <Layers className="size-4" />
        {t(lang, "viewAllCardsIn")} {set.code.toUpperCase()}
        <ArrowRight className="size-4" />
      </Link>
    </div>
  )
}
