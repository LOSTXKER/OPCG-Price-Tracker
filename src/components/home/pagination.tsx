"use client"

import { ChevronLeft, ChevronRight } from "lucide-react"
import { cn } from "@/lib/utils"
import { t } from "@/lib/i18n"
import { useUIStore } from "@/stores/ui-store"

export function Pagination({
  page,
  totalPages,
  total,
  pageSize,
  isPending,
  onPageChange,
}: {
  page: number
  totalPages: number
  total: number
  pageSize: number
  isPending: boolean
  onPageChange: (page: number) => void
}) {
  const lang = useUIStore((s) => s.language)

  if (totalPages <= 1) return null

  return (
    <div className="flex items-center justify-between border-t border-border px-4 py-3">
      <p className="text-xs text-muted-foreground">
        {t(lang, "showingOf")} {((page - 1) * pageSize + 1).toLocaleString()}-{Math.min(page * pageSize, total).toLocaleString()} {t(lang, "from")} {total.toLocaleString()} {t(lang, "card")}
      </p>
      <div className="flex items-center gap-1">
        <button
          onClick={() => onPageChange(Math.max(1, page - 1))}
          disabled={page <= 1 || isPending}
          className="flex size-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:pointer-events-none disabled:opacity-40"
        >
          <ChevronLeft className="size-4" />
        </button>
        <PageNumbers current={page} total={totalPages} onChange={onPageChange} />
        <button
          onClick={() => onPageChange(Math.min(totalPages, page + 1))}
          disabled={page >= totalPages || isPending}
          className="flex size-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:pointer-events-none disabled:opacity-40"
        >
          <ChevronRight className="size-4" />
        </button>
      </div>
    </div>
  )
}

function PageNumbers({
  current,
  total,
  onChange,
}: {
  current: number
  total: number
  onChange: (page: number) => void
}) {
  const pages = buildPageRange(current, total)

  return (
    <>
      {pages.map((p, i) =>
        p === "..." ? (
          <span
            key={`ellipsis-${i}`}
            className="flex size-8 items-center justify-center text-xs text-muted-foreground"
          >
            ...
          </span>
        ) : (
          <button
            key={p}
            onClick={() => onChange(p as number)}
            className={cn(
              "flex size-8 items-center justify-center rounded-md text-xs font-medium transition-colors",
              current === p
                ? "bg-muted text-foreground font-semibold"
                : "text-muted-foreground hover:bg-muted/60 hover:text-foreground"
            )}
          >
            {p}
          </button>
        )
      )}
    </>
  )
}

function buildPageRange(current: number, total: number): (number | "...")[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1)

  const pages: (number | "...")[] = []

  if (current <= 4) {
    for (let i = 1; i <= 5; i++) pages.push(i)
    pages.push("...", total)
  } else if (current >= total - 3) {
    pages.push(1, "...")
    for (let i = total - 4; i <= total; i++) pages.push(i)
  } else {
    pages.push(1, "...", current - 1, current, current + 1, "...", total)
  }

  return pages
}
