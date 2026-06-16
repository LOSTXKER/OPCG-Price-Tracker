"use client"

import Link from "next/link"
import { ChevronRight, ShieldCheck, ShoppingBag, Tag } from "lucide-react"

import { t, type Language } from "@/lib/i18n"
import { cn } from "@/lib/utils"

/**
 * Buy / sell entry point for the current grade. The primary action keeps the
 * user on this page and jumps to the live asks area; the seller action can
 * deep-link to the marketplace flow when that flag opens.
 */
export function CardBuySell({
  lang,
  gradeLabel,
  listingCount = 0,
  buyHref = "#card-trade-section",
  sellHref = "/seller/listings/new",
  className,
}: {
  lang: Language
  gradeLabel?: string
  listingCount?: number
  buyHref?: string
  sellHref?: string
  className?: string
}) {
  const hasListings = listingCount > 0

  return (
    <div className={cn("space-y-3", className)}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-eyebrow">{t(lang, "tradePanelTitle")}</p>
          <p className="mt-1 text-meta">{t(lang, "tradePanelDesc")}</p>
        </div>
        {gradeLabel && (
          <span className="surface-2 tnum shrink-0 rounded-full px-2 py-1 text-micro font-extrabold text-foreground">
            {gradeLabel}
          </span>
        )}
      </div>

      <div className="grid gap-2">
        <a
          href={buyHref}
          className="ease-chrome flex min-h-12 items-center gap-2 rounded-xl px-3 text-sm font-bold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          style={{
            background: "var(--primary)",
            color: "var(--primary-foreground)",
            boxShadow: "inset 0 0 0 1px color-mix(in srgb, var(--primary) 28%, transparent)",
          }}
        >
          <ShoppingBag className="size-4 shrink-0" aria-hidden />
          <span className="min-w-0 flex-1 text-left">
            <span className="block truncate">
              {hasListings ? t(lang, "viewGradeListingsCta") : t(lang, "viewTradeOptionsCta")}
            </span>
            <span className="block truncate text-overlay font-medium opacity-75">
              {hasListings ? `${listingCount} ${t(lang, "activeAsks")}` : t(lang, "notifyOrListHint")}
            </span>
          </span>
          <ChevronRight className="size-4 shrink-0 opacity-70" aria-hidden />
        </a>

        <Link
          href={sellHref}
          className="ease-chrome flex min-h-11 items-center justify-center gap-1.5 rounded-xl border border-border bg-background/40 px-3 text-sm font-semibold text-foreground hover:bg-muted/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <Tag className="size-4" aria-hidden />
          <span className="truncate">
            {t(lang, "listSelectedGradeCta")}
            {gradeLabel ? ` ${gradeLabel}` : ""}
          </span>
        </Link>
      </div>

      <p className="hairline-t mt-3 flex items-center justify-center gap-1.5 pt-3 text-center text-overlay text-muted-foreground">
        <ShieldCheck className="size-3.5 shrink-0" style={{ color: "var(--price-up)" }} aria-hidden />
        {t(lang, "buyerProtectionStrip")}
      </p>
    </div>
  )
}
