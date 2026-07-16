"use client"

import {
  ChevronDown,
  Eye,
  Lock,
  Plus,
  Share2,
} from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Surface } from "@/components/ui/surface"
import { t, type Language } from "@/lib/i18n"

/** Static, data-free detail preview shared by every logged-out portfolio URL. */
export function PortfolioMockPreview({ lang }: { lang: Language }) {
  return (
    <div className="space-y-4 sm:space-y-5" data-slot="portfolio-detail-preview">
      <div className="flex items-center gap-2">
        <Surface
          variant="subtle"
          className="flex min-h-11 min-w-0 flex-1 items-center gap-2 px-3 py-2 sm:max-w-sm"
        >
          <div className="min-w-0 flex-1">
            <p className="truncate text-h4">{t(lang, "myPortfolio")}</p>
            <Badge variant="neutral" className="mt-1">
              <Lock aria-hidden />
              {t(lang, "portfolioPrivate")}
            </Badge>
          </div>
          <ChevronDown className="size-4 shrink-0 text-muted-foreground" aria-hidden />
        </Surface>

        <div className="ml-auto flex shrink-0 items-center gap-1.5">
          <span className="flex size-11 items-center justify-center rounded-lg bg-muted/50">
            <Eye className="size-4" aria-hidden />
          </span>
          <span className="flex size-11 items-center justify-center rounded-lg bg-muted/50">
            <Share2 className="size-4" aria-hidden />
          </span>
          <span className="flex min-h-11 items-center gap-1.5 rounded-lg bg-primary px-3 text-sm font-medium text-primary-foreground">
            <Plus className="size-4" aria-hidden />
            <span className="hidden sm:inline">{t(lang, "addCard")}</span>
          </span>
        </div>
      </div>

      <Surface variant="panel" className="space-y-4 p-4 sm:p-5">
        <div>
          <p className="text-eyebrow">{t(lang, "portfolioValue")}</p>
          <p className="mt-2 text-display tabular-nums">¥15,580</p>
        </div>
        <div className="grid grid-cols-2 gap-4 border-t border-hair pt-4 sm:grid-cols-4">
          {["+¥2,180", "¥13,400", "+11.2%", "9"].map((value) => (
            <div key={value} className="space-y-1">
              <Skeleton className="h-3 w-14" />
              <p className="text-body-sm tabular-nums">{value}</p>
            </div>
          ))}
        </div>
      </Surface>

      <Surface variant="panel" className="overflow-hidden">
        <div className="divide-y divide-hair">
          {["OP01-016", "OP05-119", "OP06-069", "OP09-093"].map((code) => (
            <div key={code} className="flex items-center gap-3 px-3 py-3 sm:px-4">
              <Skeleton className="aspect-[63/88] w-11 shrink-0 rounded-md" />
              <div className="min-w-0 flex-1 space-y-1.5">
                <Skeleton className="h-3.5 w-40 max-w-full" />
                <p className="text-meta">{code}</p>
              </div>
              <Skeleton className="h-4 w-20" />
            </div>
          ))}
        </div>
      </Surface>
    </div>
  )
}
