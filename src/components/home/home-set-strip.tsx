"use client"

import Image from "next/image"
import Link from "next/link"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { useCallback, useRef } from "react"

import { IconButton } from "@/components/ui/icon-button"
import { t } from "@/lib/i18n"
import { buildHomeSetStripCopy } from "@/lib/seo/copy/home"
import { useUIStore } from "@/stores/ui-store"

import { NUDGE } from "./set-ticker-motion"

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

/** The pill list — one copy, since the rail no longer loops. */
function SetPills({
  sets,
  allLabel,
}: {
  sets: HomeSetStripItem[]
  allLabel: string
}) {
  return (
    <ul className="flex gap-2 pe-2">
      {sets.map((s) => (
        <li key={s.code} className="shrink-0">
          <Link
            href={`/opcg/sets/${s.code}`}
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
      {/* "View all" is the last pill, so the way out to the full set catalog
          sits right after the newest sets. */}
      <li className="shrink-0">
        <Link
          href="/opcg/sets"
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
 * the market section (owner ruling 2026-08-28) in ONE row: collectors pick the
 * set first, and the whole block costs ~54px instead of a stacked header.
 *
 * DRIVEN BY `scrollLeft`, not by a CSS transform (owner ruling 2026-08-28,
 * second pass — "อยากเลื่อนซ้ายขวาเองได้ด้วย"). A real scroll container gives
 * every native gesture for free: swipe, wheel, keyboard.
 *
 * IT NO LONGER MOVES ON ITS OWN (owner ruling 2026-08-28, third pass —
 * "ขอแบบไม่ต้องเลื่อนเอง นิ่งๆ"). The self-scrolling version rendered the pill
 * list twice so the wrap had no seam; with the drift gone that clone would just
 * be every set listed a second time, so the rail is now a single copy that
 * starts at the newest set and stops at "view all" — a shelf, not a loop.
 */
export function HomeSetStrip({ sets }: { sets: HomeSetStripItem[] }) {
  const lang = useUIStore((s) => s.language)
  const copy = buildHomeSetStripCopy(lang)

  const railRef = useRef<HTMLDivElement>(null)

  const nudge = useCallback((dir: -1 | 1) => {
    const rail = railRef.current
    if (!rail) return

    // The browser clamps at both ends, which is what a finite shelf wants.
    rail.scrollBy({
      left: dir * NUDGE,
      // Smooth scrolling is animation too — honour the OS setting.
      behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches
        ? "auto"
        : "smooth",
    })
  }, [])

  if (sets.length === 0) return null

  const arrow = (dir: -1 | 1) => (
    <IconButton
      aria-label={t(lang, dir < 0 ? "prev" : "next")}
      variant="solid"
      onClick={() => nudge(dir)}
      className="size-8 rounded-full"
    >
      {dir < 0 ? (
        <ChevronLeft className="size-4" />
      ) : (
        <ChevronRight className="size-4" />
      )}
    </IconButton>
  )

  return (
    <section aria-labelledby="home-set-strip">
      <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center sm:gap-5">
        {/* The whole header block is the link to the set catalog — a moving
            rail has no fixed corner to hang a "view all" on. */}
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

        <div className="flex min-w-0 flex-1 items-center gap-2">
          {/* Viewport. Bleeds through the page gutter on phones (PageContainer
              is px-5 there) so the row runs edge to edge; from `sm` up it fills
              whatever the header and arrows leave. */}
          <div className="relative -mx-5 min-w-0 flex-1 sm:mx-0">
            <div
              ref={railRef}
              className="no-sb overflow-x-auto overscroll-x-contain px-5 sm:px-0"
            >
              <div className="flex w-max">
                <SetPills sets={sets} allLabel={copy.allLabel} />
              </div>
            </div>
            {/* Edge fades — the row dissolves into the page instead of being
                cut, and they read as "this keeps going". */}
            <span
              aria-hidden
              className="pointer-events-none absolute inset-y-0 left-0 w-8 bg-gradient-to-r from-background to-transparent"
            />
            <span
              aria-hidden
              className="pointer-events-none absolute inset-y-0 right-0 w-8 bg-gradient-to-l from-background to-transparent"
            />
          </div>

          {/* Arrows are the desktop affordance — phones already swipe, and two
              more targets there would crowd a 375px row. */}
          <div className="hidden shrink-0 items-center gap-1 sm:flex">
            {arrow(-1)}
            {arrow(1)}
          </div>
        </div>
      </div>
    </section>
  )
}
