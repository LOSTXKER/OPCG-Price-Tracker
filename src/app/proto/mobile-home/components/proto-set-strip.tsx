"use client"

import Image from "next/image"
import Link from "next/link"
import { ChevronRight } from "lucide-react"

import type { HomeSetLink } from "@/lib/data/home"
import { buildHomeSetStripCopy } from "@/lib/seo/copy/home"
import { useUIStore } from "@/stores/ui-store"

/**
 * Slimmed set strip for the comparison: the ONE-LINE header (h2 left, "view
 * all" link right — the stacked subtitle is what's being removed) over the same
 * pill rail as production. Pill markup mirrors SetPills in
 * home-set-strip.tsx — do NOT edit that file from here (another session owns
 * in-flight changes to it); if a variant wins, the real strip's header gets
 * slimmed in place. This rail is finger-scroll only — the production
 * auto-drift stays as-is and is out of scope for a layout comparison.
 */
export function ProtoSetStrip({ sets }: { sets: HomeSetLink[] }) {
  const lang = useUIStore((s) => s.language)
  const copy = buildHomeSetStripCopy(lang)

  if (sets.length === 0) return null

  return (
    <section aria-labelledby="proto-set-strip" className="mt-6">
      <div className="flex items-baseline justify-between gap-3">
        <h2 id="proto-set-strip" className="text-h5 text-foreground">
          {copy.heading}
        </h2>
        <Link
          href="/opcg/sets"
          className="ease-chrome flex shrink-0 items-center gap-0.5 text-meta hover:text-primary"
        >
          {copy.allLabel}
          <ChevronRight className="size-3.5" />
        </Link>
      </div>

      <div className="relative -mx-5 mt-2.5">
        <div className="no-sb overflow-x-auto overscroll-x-contain px-5">
          <ul className="flex gap-2">
            {sets.map((s) => (
              <li key={s.code} className="shrink-0">
                <Link
                  href={`/opcg/sets/${s.code}`}
                  className="ease-chrome group/pill flex items-center gap-2.5 rounded-xl border border-hair bg-background py-1.5 pe-3.5 ps-1.5 hover:border-primary/35 hover:bg-primary/5"
                >
                  <span className="relative block h-10 w-[1.79rem] shrink-0 overflow-hidden rounded-md">
                    {s.coverUrl && (
                      <Image
                        src={s.coverUrl}
                        alt=""
                        fill
                        className="ease-chrome object-cover group-hover/pill:scale-105"
                        sizes="29px"
                      />
                    )}
                  </span>
                  <span className="min-w-0">
                    <span className="block text-xs font-semibold leading-tight text-foreground">
                      {s.code}
                    </span>
                    <span className="mt-0.5 block max-w-[7.5rem] truncate text-xs leading-tight text-muted-foreground">
                      {s.name}
                    </span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
        <span
          aria-hidden
          className="pointer-events-none absolute inset-y-0 left-0 w-8 bg-gradient-to-r from-background to-transparent"
        />
        <span
          aria-hidden
          className="pointer-events-none absolute inset-y-0 right-0 w-8 bg-gradient-to-l from-background to-transparent"
        />
      </div>
    </section>
  )
}
