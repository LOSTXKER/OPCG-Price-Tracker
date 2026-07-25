"use client"

import { Info } from "lucide-react"

import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { t, type Language } from "@/lib/i18n"
import { cn } from "@/lib/utils"

/**
 * Tiny info icon that explains all market values are derived from
 * raw (non-graded) card prices. Use beside any aggregated value
 * label on /market-overview so users don't read the number as
 * "all of the market including PSA 10".
 */
export function RawValueHint({
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
          aria-label={t(lang, "rawValueHint")}
          className={cn(
            "tap-safe inline-flex shrink-0 items-center justify-center rounded-full text-muted-foreground/70 motion-base hover:text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring",
            className,
          )}
        >
          <Info className="size-3.5" aria-hidden="true" />
        </TooltipTrigger>
        <TooltipContent>{t(lang, "rawValueHint")}</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}
