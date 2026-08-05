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
 * Real <a> links (next/link), rendered in the first HTML response. Sits right
 * under the hero (owner decision 2026-08-06 — tried the tail, reverted), so
 * its top margin hugs the hero's own bottom padding.
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
          {/* Restates the h2 two pixels above it, so phones drop it and keep
              the header on one line. `hidden` is display:none — the sentence
              stays in the server HTML, same trade page.tsx already makes for
              the highlights row. */}
          <p className="mt-0.5 hidden text-meta sm:block">{copy.description}</p>
        </div>
        <Link
          href="/opcg/sets"
          className="ease-chrome flex shrink-0 items-center gap-0.5 text-sm font-medium text-primary hover:underline"
        >
          {copy.allLabel}
          <ChevronRight className="size-4" />
        </Link>
      </div>

      {/* One swipeable row on phones, wrapping grid from `sm` up.
          Wrapping at 390px put these 12 pills on SEVEN rows (~330px — taller
          than the hero) and pushed the market table clean off the first screen,
          with two of the rows holding a single pill so the block read as broken
          rather than deliberate. The rail keeps every link in the server HTML —
          it only changes how many are on screen at once. `no-sb` +
          `overflow-x-auto` is the same rail the grade/scope controls use. */}
      <ul className="no-sb -mx-5 mt-3 flex snap-x snap-mandatory gap-2 overflow-x-auto px-5 sm:mx-0 sm:flex-wrap sm:overflow-visible sm:px-0">
        {sets.map((s) => (
          <li key={s.code} className="shrink-0 snap-start sm:shrink">
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
