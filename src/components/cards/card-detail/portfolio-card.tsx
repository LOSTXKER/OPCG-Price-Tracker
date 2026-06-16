import { Briefcase } from "lucide-react"

import { CardAddToPortfolio } from "@/components/cards/card-add-to-portfolio"
import { t, type Language } from "@/lib/i18n"

/**
 * Right-rail portfolio card — wraps the REAL add-to-portfolio flow. No fabricated
 * holdings/P&L on the live page (there's no per-grade holdings data here yet); the
 * itemized view lives on /portfolio. Outline button only — no second gold accent.
 */
export function CardPortfolioCard({
  cardId,
  cardName,
  lang,
}: {
  cardId: number
  cardName: string
  lang: Language
}) {
  return (
    <div className="surface-1 hairline rounded-2xl p-4">
      <div className="flex items-center gap-2">
        <span className="surface-2 flex size-8 items-center justify-center rounded-full text-muted-foreground">
          <Briefcase className="size-4" aria-hidden />
        </span>
        <div className="min-w-0">
          <p className="text-eyebrow">{t(lang, "myPortfolio")}</p>
          <p className="text-meta">{t(lang, "addToPortfolioDesc")}</p>
        </div>
      </div>
      <div className="mt-3">
        <CardAddToPortfolio cardId={cardId} cardName={cardName} variant="outline" className="w-full justify-center" />
      </div>
    </div>
  )
}
