import type { ReactNode } from "react"

import { MASKED } from "@/lib/constants/ui"
import { getLocale, t, type Language } from "@/lib/i18n"
import { cn } from "@/lib/utils"
import { formatCount } from "@/lib/utils/currency"

export type PortfolioManagerSummaryData = {
  totalValueJpy: number
  portfolioCount: number
  valuedCopyCount: number
  valuationComplete: boolean
}

/** A quiet cross-portfolio total for the manager toolbar. It is intentionally
 * absent for zero/one portfolio, where the same number would only be repeated. */
export function PortfolioManagerSummary({
  data,
  lang,
  formatMoney,
  masked = false,
  maskText = MASKED,
  className,
}: {
  data: PortfolioManagerSummaryData
  lang: Language
  formatMoney: (valueJpy: number) => string
  masked?: boolean
  maskText?: string
  className?: string
}) {
  const locale = getLocale(lang)
  const portfolioCount = t(lang, "portfolioCountOnly").replace(
    "{n}",
    formatCount(data.portfolioCount, locale),
  )

  let value: ReactNode
  if (masked) {
    value = maskText
  } else if (data.valuedCopyCount === 0) {
    value = <span aria-label={t(lang, "portfolioValueUnavailable")}>—</span>
  } else {
    value = (
      <span
        aria-label={
          data.valuationComplete
            ? undefined
            : `${t(lang, "portfolioValuePartial")}: ${formatMoney(data.totalValueJpy)}`
        }
        title={data.valuationComplete ? undefined : t(lang, "portfolioValuePartial")}
      >
        {!data.valuationComplete && "≈ "}
        {formatMoney(data.totalValueJpy)}
      </span>
    )
  }

  return (
    <p
      className={cn(
        "flex min-w-0 flex-wrap items-center gap-x-1.5 gap-y-0.5 text-body-sm tabular-nums",
        className,
      )}
      data-slot="portfolio-manager-summary"
    >
      <span className="text-muted-foreground">{portfolioCount}</span>
      <span className="text-muted-foreground" aria-hidden>
        ·
      </span>
      <span className="text-muted-foreground">{t(lang, "portfolioEstimatedValue")}</span>
      <span className="font-semibold text-foreground">{value}</span>
    </p>
  )
}
