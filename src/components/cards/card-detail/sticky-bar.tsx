"use client"

import { CardAddToPortfolio } from "@/components/cards/card-add-to-portfolio"
import { t, type Language } from "@/lib/i18n"
import { GradeValue } from "./grade-value"
import type { GradeDatum } from "./grades"

/**
 * Mobile-only sticky action bar (REDESIGN §4). Keeps the primary "Add to
 * Portfolio" CTA + the SELECTED grade's price thumb-reachable while the user
 * scrolls the long card-detail page. Tracks the hero (selected grade) so the
 * pinned number never contradicts the price the user is looking at. Sits ABOVE
 * the global bottom-nav (chrome route); desktop hides this bar.
 */
export function CardDetailStickyBar({
  cardId,
  cardName,
  datum,
  gradeLabel,
  lang,
}: {
  cardId: number
  cardName: string
  datum: GradeDatum
  gradeLabel: string
  lang: Language
}) {
  return (
    <div className="frost hairline-t fixed inset-x-0 bottom-[calc(3.5rem_+_env(safe-area-inset-bottom))] z-40 md:hidden">
      <div className="mx-auto flex max-w-lg items-center justify-between gap-3 px-4 py-2.5">
        <div className="min-w-0">
          <p className="text-meta leading-tight">
            {gradeLabel} · {t(lang, "marketPrice")}
          </p>
          <GradeValue datum={datum} size="md" className="text-foreground" />
        </div>
        <CardAddToPortfolio
          cardId={cardId}
          cardName={cardName}
          className="h-11 shrink-0 justify-center px-6"
        />
      </div>
    </div>
  )
}
