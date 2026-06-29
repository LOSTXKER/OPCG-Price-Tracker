"use client"

import { ChevronLeft, ChevronRight } from "lucide-react"
import { cn } from "@/lib/utils"
import { Surface } from "@/components/ui/surface"
import { t } from "@/lib/i18n"
import { useUIStore } from "@/stores/ui-store"
import { buildPageRange } from "@/lib/utils/pagination"

export function SearchPagination({
  page,
  totalPages,
  onPageChange,
}: {
  page: number
  totalPages: number
  onPageChange: (p: number) => void
}) {
  const lang = useUIStore((s) => s.language)

  if (totalPages <= 1) return null

  return (
    <Surface variant="panel" className="flex items-center justify-between px-4 py-3">
      <p className="text-xs tabular-nums text-muted-foreground">
        {t(lang, "pageOf")} {page} / {totalPages}
      </p>
      <div className="flex items-center gap-1">
        <button
          type="button"
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
          className="flex size-8 items-center justify-center rounded-lg text-muted-foreground motion-base hover:bg-muted disabled:opacity-30"
        >
          <ChevronLeft className="size-4" />
        </button>
        {buildPageRange(page, totalPages).map((p, i) =>
          p === "..." ? (
            <span key={`dots-${i}`} className="px-1 text-meta">...</span>
          ) : (
            <button
              key={p}
              type="button"
              onClick={() => onPageChange(p as number)}
              className={cn(
                "flex size-8 items-center justify-center rounded-lg text-xs font-medium tabular-nums motion-base",
                page === p
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              {p}
            </button>
          )
        )}
        <button
          type="button"
          disabled={page >= totalPages}
          onClick={() => onPageChange(page + 1)}
          className="flex size-8 items-center justify-center rounded-lg text-muted-foreground motion-base hover:bg-muted disabled:opacity-30"
        >
          <ChevronRight className="size-4" />
        </button>
      </div>
    </Surface>
  )
}
