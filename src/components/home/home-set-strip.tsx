"use client"

import Image from "next/image"
import Link from "next/link"
import { ChevronRight } from "lucide-react"

import { buildHomeSetStripCopy } from "@/lib/seo/copy/home"
import { cn } from "@/lib/utils"
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
 * One copy of the pill list. The ticker renders it twice — the second copy is
 * `aria-hidden` (screen readers and crawlers should see each set once) and
 * disappears entirely under reduced motion, where the rail stops moving and
 * becomes a plain scroll strip.
 */
function SetPills({
  sets,
  allLabel,
  clone = false,
}: {
  sets: HomeSetStripItem[]
  allLabel: string
  clone?: boolean
}) {
  return (
    <ul
      aria-hidden={clone || undefined}
      className={cn("flex gap-2 pe-2", clone && "motion-reduce:hidden")}
    >
      {sets.map((s) => (
        <li key={s.code} className="shrink-0">
          <Link
            href={`/opcg/sets/${s.code}`}
            tabIndex={clone ? -1 : undefined}
            className="ease-chrome group/pill flex items-center gap-2.5 rounded-xl border border-hair bg-background py-1.5 pe-3.5 ps-1.5 hover:border-primary/35 hover:bg-primary/5"
          >
            {/* Collectors recognise a set by its packaging long before they
                recognise "op14". `object-cover` trims the transparent margin
                around the art so the pack renders larger than `contain`
                would. */}
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
            {/* Two stacked lines keep each pill narrow — that's what lets the
                whole set cluster read as one calm ticker row. */}
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
      {/* "View all" rides the loop as its own pill, so the way out to the full
          set catalog passes by right after the newest sets. */}
      <li className="shrink-0">
        <Link
          href="/opcg/sets"
          tabIndex={clone ? -1 : undefined}
          className="ease-chrome flex h-full items-center gap-1 rounded-xl border border-dashed border-hair bg-background px-3.5 text-xs font-medium text-muted-foreground hover:border-primary/35 hover:bg-primary/5 hover:text-primary"
        >
          {allLabel}
          <ChevronRight className="size-3.5" />
        </Link>
      </li>
    </ul>
  )
}

/**
 * Crawlable "latest sets" ticker (SEO plan §3.1). Before this, the only path
 * from the home page to a set page was a client-side picker dropdown, so the
 * home page passed zero link equity down to the set cluster — the layer the
 * plan calls the main battleground.
 *
 * Real <a> links (next/link), rendered in the first HTML response. It HEADS
 * the market section (owner ruling 2026-08-28): collectors pick the set
 * first, so the set links introduce the table instead of trailing it, and the
 * strip's h2 is the section's heading.
 *
 * ONE self-flowing row (same-day follow-up ruling — the stacked header +
 * static rail still cost ~3 rows of height): the header sits inline on the
 * left and the pills drift by on their own like a market ticker, pausing on
 * hover/focus so they can be clicked. Phones stack header over rail — two
 * compact rows is the floor a 375px screen allows. Reduced motion stops the
 * loop and leaves a plain scroll rail.
 */
export function HomeSetStrip({ sets }: { sets: HomeSetStripItem[] }) {
  const lang = useUIStore((s) => s.language)
  const copy = buildHomeSetStripCopy(lang)

  if (sets.length === 0) return null

  return (
    <section aria-labelledby="home-set-strip">
      <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center sm:gap-5">
        {/* The whole header block is the link to the set catalog — the ticker
            itself has no fixed corner to hang a "view all" on. */}
        <Link href="/opcg/sets" className="group/head block shrink-0">
          <h2
            id="home-set-strip"
            className="text-h5 flex items-center gap-1 text-foreground"
          >
            {copy.heading}
            <ChevronRight className="ease-chrome size-4 text-muted-foreground group-hover/head:translate-x-0.5 group-hover/head:text-primary" />
          </h2>
          <p className="mt-0.5 text-meta">{copy.description}</p>
        </Link>

        {/* The ticker viewport. Bleeds through the page gutter on phones
            (PageContainer is px-5 there); from `sm` up it fills the space the
            header leaves. `overflow-x-auto` + `no-sb` is the reduced-motion /
            no-JS fallback; while the marquee animates, the track is wider
            than the viewport and simply slides behind the edge fades. */}
        <div className="group relative -mx-5 min-w-0 flex-1 sm:mx-0">
          <div className="no-sb overflow-x-auto motion-safe:overflow-x-hidden">
            <div className="set-marquee flex w-max group-hover:[animation-play-state:paused] group-focus-within:[animation-play-state:paused]">
              <SetPills sets={sets} allLabel={copy.allLabel} />
              <SetPills sets={sets} allLabel={copy.allLabel} clone />
            </div>
          </div>
          {/* Edge fades — the row dissolves into the page instead of being
              cut, and they double as the "this flows" affordance. */}
          <span
            aria-hidden
            className="pointer-events-none absolute inset-y-0 left-0 w-8 bg-gradient-to-r from-background to-transparent"
          />
          <span
            aria-hidden
            className="pointer-events-none absolute inset-y-0 right-0 w-8 bg-gradient-to-l from-background to-transparent"
          />
        </div>
      </div>
    </section>
  )
}
