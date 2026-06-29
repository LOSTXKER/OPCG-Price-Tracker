"use client"

import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"
import { t, type Language } from "@/lib/i18n"

/**
 * Compact "Δ 7d" chip used near any % delta on /market-overview so
 * users always see which time window the percentage refers to. Hovering
 * reveals the long-form description.
 */
export function PeriodChip({
  lang,
  className,
}: {
  lang: Language
  className?: string
}) {
  return (
    <TooltipProvider delay={120}>
      <Tooltip>
        <TooltipTrigger
          aria-label={t(lang, "marketPeriodHint")}
          className={cn(
            "inline-flex shrink-0 items-center gap-1 rounded-full border border-transparent dark:border-[var(--p-hair)] bg-muted/40 px-1.5 py-0.5 text-micro font-mono uppercase tracking-wider text-muted-foreground motion-base hover:text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring",
            className,
          )}
        >
          <span aria-hidden="true">Δ</span>
          <span>7d</span>
        </TooltipTrigger>
        <TooltipContent>{t(lang, "marketPeriodHint")}</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}
