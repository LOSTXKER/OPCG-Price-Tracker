"use client"

import Image from "next/image"
import Link from "next/link"

import { ArrowLink } from "@/components/shared/arrow-link"
import { buildHomeSetStripCopy } from "@/lib/seo/copy/home"
import { useUIStore } from "@/stores/ui-store"

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
 * Real <a> links (next/link), rendered in the first HTML response. It HEADS
 * the market section (owner ruling 2026-08-28, reversing 2026-08-26's tail
 * placement): collectors pick the set first, so the set links introduce the
 * table instead of trailing it, and the strip's h2 is the section's heading.
 *
 * ONE row at every width (same ruling — the old two-row wrapping grid is
 * gone): a snap-scroll rail with the scrollbar hidden, bleeding to the screen
 * edge on phones, plus a static right-edge fade so a half-cropped pill and the
 * fade together say "more this way". Every link stays in the server HTML — the
 * rail only changes how many are on screen at once.
 */
export function HomeSetStrip({ sets }: { sets: HomeSetStripItem[] }) {
  const lang = useUIStore((s) => s.language)
  const copy = buildHomeSetStripCopy(lang)

  if (sets.length === 0) return null

  return (
    <section aria-labelledby="home-set-strip">
      <div className="flex items-end justify-between gap-3">
        <div className="min-w-0">
          <h2 id="home-set-strip" className="text-h2">
            {copy.heading}
          </h2>
          {/* Visible at every width now — as the market section's heading the
              sentence is the section's one line of context, not a restatement
              it can afford to drop on phones. */}
          <p className="mt-1 text-body-sm text-muted-foreground">
            {copy.description}
          </p>
        </div>
        <ArrowLink href="/opcg/sets" className="shrink-0">
          {copy.allLabel}
        </ArrowLink>
      </div>

      {/* The one-row rail. `-mx-5 px-5` bleeds through the page gutter on
          phones (PageContainer is px-5 there); from `sm` up it stays inside
          the content column and simply scrolls. `no-sb` + `overflow-x-auto`
          is the same rail the grade/scope controls use. */}
      <div className="relative -mx-5 mt-4 sm:mx-0">
        <ul className="no-sb flex snap-x gap-2 overflow-x-auto px-5 sm:px-0 sm:pe-10">
          {sets.map((s) => (
            <li key={s.code} className="shrink-0 snap-start">
              <Link
                href={`/opcg/sets/${s.code}`}
                className="ease-chrome group flex items-center gap-2.5 rounded-xl border border-hair bg-background py-1.5 pe-3.5 ps-1.5 hover:border-primary/35 hover:bg-primary/5"
              >
                {/* Collectors recognise a set by its packaging long before
                    they recognise "op14". The slot keeps the pack's own
                    portrait ratio; `object-cover` trims the transparent
                    margin around the art so the pack renders larger than
                    `contain` would. No background tint — the alpha channel is
                    the point. */}
                <span className="relative block h-10 w-[1.79rem] shrink-0 overflow-hidden rounded-md">
                  {s.coverUrl && (
                    <Image
                      src={s.coverUrl}
                      alt=""
                      fill
                      className="ease-chrome object-cover group-hover:scale-105"
                      sizes="29px"
                    />
                  )}
                </span>
                {/* Two stacked lines keep each pill narrow, which is what
                    lets twelve of them read as one calm row instead of a
                    half-page block. */}
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
        {/* Static scroll hint — sits above the rail's right edge, under the
            pointer's reach (pointer-events-none), and fades the last visible
            pill into the page background in both themes. */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-y-0 right-0 w-10 bg-gradient-to-l from-background to-transparent"
        />
      </div>
    </section>
  )
}
