"use client"

import Link from "next/link"
import { ChevronRight } from "lucide-react"

import { buildHomeSetStripCopy } from "@/lib/seo/copy/home"
import { useUIStore } from "@/stores/ui-store"

export type HomeSetStripItem = {
  code: string
  /** English/latin set name. CardSet.nameTh is empty for every set, so the
   *  Thai context comes from the heading around it, never from the name. */
  name: string
}

/**
 * Crawlable "latest sets" strip (SEO plan §3.1). Before this, the only path
 * from the home page to a set page was a client-side picker dropdown, so the
 * home page passed zero link equity down to the set cluster — the layer the
 * plan calls the main battleground.
 *
 * Real <a> links (next/link), rendered in the first HTML response. Compact and
 * mobile-first: wrapping pills, no horizontal scroll trap.
 */
export function HomeSetStrip({ sets }: { sets: HomeSetStripItem[] }) {
  const lang = useUIStore((s) => s.language)
  const copy = buildHomeSetStripCopy(lang)

  if (sets.length === 0) return null

  return (
    <section className="mt-2 sm:mt-4" aria-labelledby="home-set-strip">
      <div className="flex items-end justify-between gap-3">
        <div className="min-w-0">
          <h2 id="home-set-strip" className="text-h4">
            {copy.heading}
          </h2>
          <p className="mt-0.5 text-meta">{copy.description}</p>
        </div>
        <Link
          href="/opcg/sets"
          className="ease-chrome flex shrink-0 items-center gap-0.5 text-sm font-medium text-primary hover:underline"
        >
          {copy.allLabel}
          <ChevronRight className="size-4" />
        </Link>
      </div>

      <ul className="mt-3 flex flex-wrap gap-2">
        {sets.map((s) => (
          <li key={s.code}>
            <Link
              href={`/opcg/sets/${s.code}`}
              className="ease-chrome flex items-center gap-1.5 rounded-lg border border-hair bg-background px-2.5 py-1.5 text-xs hover:border-primary/35 hover:bg-primary/5"
            >
              <span className="font-semibold text-foreground">{s.code}</span>
              <span className="max-w-[11rem] truncate text-muted-foreground">
                {s.name}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  )
}
