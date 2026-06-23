"use client"

import { ChevronLeft, ChevronRight } from "lucide-react"
import { cn } from "@/lib/utils"
import { t } from "@/lib/i18n"
import { useUIStore } from "@/stores/ui-store"
import { formatCount } from "@/lib/utils/currency"
import { buildPageRange } from "@/lib/utils/pagination"

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
    <div className="flex flex-wrap items-center justify-between gap-2 border-t border-[var(--p-hair)] px-4 py-3">
      <p className="hidden text-meta sm:block">
        {t(lang, "showingOf")} {formatCount((page - 1) * pageSize + 1)}-{formatCount(Math.min(page * pageSize, total))} {t(lang, "from")} {formatCount(total)} {t(lang, "card")}
      </p>
      <div className="flex flex-1 items-center justify-center gap-1 sm:flex-none sm:justify-end">
        <button
          onClick={() => onPageChange(Math.max(1, page - 1))}
          disabled={page <= 1 || isPending}
          className="ease-chrome flex size-9 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground disabled:pointer-events-none disabled:opacity-40"
        >
          <ChevronLeft className="size-4" />
        </button>
        <PageNumbers current={page} total={totalPages} onChange={onPageChange} />
        <button
          onClick={() => onPageChange(Math.min(totalPages, page + 1))}
          disabled={page >= totalPages || isPending}
          className="ease-chrome flex size-9 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground disabled:pointer-events-none disabled:opacity-40"
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
            className="flex size-9 items-center justify-center text-meta"
          >
            ...
          </span>
        ) : (
          <button
            key={p}
            onClick={() => onChange(p as number)}
            className={cn(
              "ease-chrome flex size-9 items-center justify-center rounded-md text-xs font-medium",
              current === p
                ? "bg-foreground/[0.08] text-foreground font-semibold"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            )}
          >
            {p}
          </button>
        )
      )}
    </>
  )
}
