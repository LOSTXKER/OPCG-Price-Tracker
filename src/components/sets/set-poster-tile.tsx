import Image from "next/image"
import Link from "next/link"
import { Package } from "lucide-react"

/**
 * The set poster tile (art-forward, floats on canvas) shared by the /sets index
 * grid and the "browse other sets" rail — both grids are identical
 * (grid-cols-3 sm:4 lg:6 xl:7), so the Image `sizes` lives here once (fixes the
 * old drift: index over-fetched at 45vw, rail under-fetched at 12vw). Presentational
 * + server-safe (no i18n / store): the caller resolves imageUrl and, for the index,
 * passes the already-translated count label.
 */
export function SetPosterTile({
  code,
  displayName,
  imageUrl,
  showCount = false,
  count,
  countLabel,
  releaseLabel,
  preload = false,
}: {
  code: string
  displayName: string
  imageUrl?: string | null
  /** index grid shows the card count; the rail omits it. */
  showCount?: boolean
  count?: number
  /** pre-translated unit (e.g. "ใบ") — caller owns i18n. */
  countLabel?: string
  /** Pre-formatted release month (e.g. "ม.ค. 2023"). Formatted by the caller so
   *  server and client render identical strings. Index grid only. */
  releaseLabel?: string | null
  /** Only the first above-the-fold poster on an index page should opt in. */
  preload?: boolean
}) {
  return (
    <Link
      href={`/opcg/sets/${code}`}
      aria-label={displayName}
      className="group flex flex-col gap-2 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      <div className="surface-1 ease-chrome group-lift relative aspect-[3/4] w-full overflow-hidden rounded-lg shadow-[var(--panel-shadow)]">
        {imageUrl ? (
          <Image
            src={imageUrl}
            alt={displayName}
            fill
            sizes="(max-width: 640px) 31vw, (max-width: 1024px) 23vw, (max-width: 1280px) 15vw, 13vw"
            className="object-cover object-top"
            preload={preload}
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <Package className="size-8 text-muted-foreground/30" />
          </div>
        )}
      </div>

      <div className="min-w-0">
        {showCount ? (
          <div className="flex items-baseline justify-between gap-1.5">
            <span className="text-h5 truncate text-foreground">{code.toUpperCase()}</span>
            {count != null && (
              <span className="text-meta shrink-0 tabular-nums">
                {count} {countLabel}
              </span>
            )}
          </div>
        ) : (
          <span className="text-h5 block truncate text-foreground">{code.toUpperCase()}</span>
        )}
        <p className="text-meta truncate">{displayName}</p>
        {releaseLabel && (
          <p className="text-meta truncate tabular-nums">{releaseLabel}</p>
        )}
      </div>
    </Link>
  )
}
