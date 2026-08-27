"use client"

import Image from "next/image"
import Link from "next/link"

import { ArrowLink } from "@/components/shared/arrow-link"
import { buildHomeSetStripCopy } from "@/lib/seo/copy/home"
import { cn } from "@/lib/utils"
import { useUIStore } from "@/stores/ui-store"

/**
 * Keeps the wrapping grid at exactly two rows (owner ruling เบส 2026-08-08).
 *
 * Pill widths are set by the set names, so a fixed count wraps to a different
 * number of rows at every width — measured against the twelve live names, two
 * rows hold 4 pills at `sm`, 6 at `md`, 8 at `lg` and 10 from `xl`. The content
 * column stops growing at 1216px, so ten is the ceiling on any monitor and the
 * remainder would always have made a third row.
 *
 * The hidden pills stay in the HTML: the strip exists to pass link equity to
 * the set cluster (SEO plan §3.1), the phone rail still scrolls through all of
 * them, and "ดูชุดทั้งหมด" is right there.
 */
function twoRowVisibility(index: number): string {
  if (index < 4) return ""
  if (index < 6) return "sm:hidden md:block"
  if (index < 8) return "sm:hidden lg:block"
  if (index < 10) return "sm:hidden xl:block"
  return "sm:hidden"
}

export type HomeSetStripItem = {
  code: string
  /** English/latin set name. CardSet.nameTh is empty for every set, so the
   *  Thai context comes from the heading around it, never from the name. */
  name: string
  /** The set's packaging art, or its priciest card for the one set that has no
   *  boxed product. Optional on purpose — the links are the point, the picture
   *  is the polish. */
  coverUrl?: string | null
}

/**
 * Crawlable "latest sets" strip (SEO plan §3.1). Before this, the only path
 * from the home page to a set page was a client-side picker dropdown, so the
 * home page passed zero link equity down to the set cluster — the layer the
 * plan calls the main battleground.
 *
 * Real <a> links (next/link), rendered in the first HTML response. It follows
 * the complete market table and pagination (owner decision 2026-08-26), so the
 * market remains the primary task and set browsing reads as the next step.
 */
export function HomeSetStrip({ sets }: { sets: HomeSetStripItem[] }) {
  const lang = useUIStore((s) => s.language)
  const copy = buildHomeSetStripCopy(lang)

  if (sets.length === 0) return null

  return (
    <section className="mt-8 sm:mt-10" aria-labelledby="home-set-strip">
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
        <ArrowLink href="/opcg/sets" className="shrink-0">
          {copy.allLabel}
        </ArrowLink>
      </div>

      {/* One swipeable row on phones, wrapping grid from `sm` up.
          Wrapping at 390px puts these 12 pills on seven rows, with some rows
          holding a single pill, so the block reads as broken rather than
          deliberate. The rail keeps every link in the server HTML — it only
          changes how many are on screen at once. `no-sb` +
          `overflow-x-auto` is the same rail the grade/scope controls use. */}
      <ul className="no-sb -mx-5 mt-3 flex snap-x snap-mandatory gap-2 overflow-x-auto px-5 sm:mx-0 sm:flex-wrap sm:overflow-visible sm:px-0">
        {sets.map((s, i) => (
          <li
            key={s.code}
            className={cn("shrink-0 snap-start sm:shrink", twoRowVisibility(i))}
          >
            <Link
              href={`/opcg/sets/${s.code}`}
              className="ease-chrome flex items-center gap-2 rounded-lg border border-hair bg-background py-1 pe-2.5 ps-1 text-xs hover:border-primary/35 hover:bg-primary/5"
            >
              {/* Collectors recognise a set by its packaging long before they
                  recognise "op14". The slot stays narrow and pack-shaped so the
                  whole strip grows by single-digit pixels and the phone rail
                  stays a compact next step, which is why these are pills rather
                  than tiles. `object-cover`
                  earns its place here: the art is a portrait pack centred on a
                  square transparent canvas, so cropping to this ratio trims the
                  empty margin and renders the pack larger than `contain` would.
                  No background tint — the alpha channel is the point. */}
              <span className="relative block h-8 w-[1.43rem] shrink-0 overflow-hidden rounded-sm">
                {s.coverUrl && (
                  <Image
                    src={s.coverUrl}
                    alt=""
                    fill
                    className="object-cover"
                    sizes="24px"
                  />
                )}
              </span>
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
