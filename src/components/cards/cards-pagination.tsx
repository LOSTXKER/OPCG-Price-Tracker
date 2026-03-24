import Link from "next/link"

export function CardsPagination({
  page,
  totalPages,
  pageHref,
}: {
  page: number
  totalPages: number
  pageHref: (p: number) => string
}) {
  const hasPrev = page > 1
  const hasNext = page < totalPages

  const pageNumbers: (number | "...")[] = []
  if (totalPages <= 7) {
    for (let i = 1; i <= totalPages; i++) pageNumbers.push(i)
  } else {
    pageNumbers.push(1)
    if (page > 3) pageNumbers.push("...")
    for (let i = Math.max(2, page - 1); i <= Math.min(totalPages - 1, page + 1); i++) {
      pageNumbers.push(i)
    }
    if (page < totalPages - 2) pageNumbers.push("...")
    pageNumbers.push(totalPages)
  }

  return (
    <nav className="flex flex-wrap items-center justify-center gap-1.5 pt-2" aria-label="Pagination">
      {hasPrev ? (
        <Link href={pageHref(page - 1)} className="inline-flex h-8 items-center rounded-md border border-border/40 px-3 text-[13px] font-medium transition-colors hover:bg-muted">
          ก่อนหน้า
        </Link>
      ) : (
        <span className="inline-flex h-8 cursor-not-allowed items-center rounded-md border border-border/20 px-3 text-[13px] font-medium opacity-30">
          ก่อนหน้า
        </span>
      )}

      {pageNumbers.map((p, i) =>
        p === "..." ? (
          <span key={`dots-${i}`} className="px-1 text-muted-foreground">…</span>
        ) : (
          <Link
            key={p}
            href={pageHref(p)}
            className={`inline-flex size-8 items-center justify-center rounded-md text-[13px] font-medium transition-colors ${
              p === page
                ? "bg-primary text-primary-foreground"
                : "border border-border/40 hover:bg-muted"
            }`}
          >
            {p}
          </Link>
        )
      )}

      {hasNext ? (
        <Link href={pageHref(page + 1)} className="inline-flex h-8 items-center rounded-md border border-border/40 px-3 text-[13px] font-medium transition-colors hover:bg-muted">
          ถัดไป
        </Link>
      ) : (
        <span className="inline-flex h-8 cursor-not-allowed items-center rounded-md border border-border/20 px-3 text-[13px] font-medium opacity-30">
          ถัดไป
        </span>
      )}
    </nav>
  )
}
