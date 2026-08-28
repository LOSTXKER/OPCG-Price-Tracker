"use client"

import Image from "next/image"
import Link from "next/link"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { useCallback, useEffect, useRef } from "react"

import { IconButton } from "@/components/ui/icon-button"
import { t } from "@/lib/i18n"
import { buildHomeSetStripCopy } from "@/lib/seo/copy/home"
import { useUIStore } from "@/stores/ui-store"

import {
  NUDGE,
  RESUME_DELAY,
  isUserScroll,
  nextTickerPos,
  prewrapForNudge,
} from "./set-ticker-motion"

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
 * One copy of the pill list. The rail renders it twice so the loop has no
 * seam; the second copy is `aria-hidden` and untabbable, so screen readers and
 * crawlers still see each set exactly once.
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
    <ul aria-hidden={clone || undefined} className="flex gap-2 pe-2">
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
 * the market section (owner ruling 2026-08-28) in ONE row: collectors pick the
 * set first, and the whole block costs ~54px instead of a stacked header.
 *
 * DRIVEN BY `scrollLeft`, not by a CSS transform (owner ruling 2026-08-28,
 * second pass — "อยากเลื่อนซ้ายขวาเองได้ด้วย"). The previous marquee animated
 * `translateX` inside an `overflow-hidden` box, which meant the row could not
 * be touched: no swipe, no wheel, no arrows. A real scroll container gives
 * every native gesture back for free, and a rAF loop nudges `scrollLeft` while
 * nobody is interacting. Any interaction wins immediately — hover and focus
 * hold the row still, and a swipe or an arrow press buys ~1.6s of quiet before
 * the drift picks up from wherever the user left it.
 */
export function HomeSetStrip({ sets }: { sets: HomeSetStripItem[] }) {
  const lang = useUIStore((s) => s.language)
  const copy = buildHomeSetStripCopy(lang)

  const railRef = useRef<HTMLDivElement>(null)
  /** Pointer/touch/focus is currently on the rail — hold indefinitely. */
  const engagedRef = useRef(false)
  /** Timestamp (ms, rAF clock) to stay still until — set by scroll / arrows. */
  const holdUntilRef = useRef(0)
  /** Sub-pixel drift position. `scrollLeft` alone would stall: at 38px/s a
   *  frame moves 0.6px, which some browsers round away to nothing. */
  const posRef = useRef(0)
  /** The last `scrollLeft` the drift itself wrote. Scroll events don't say who
   *  caused them, so without this the rAF loop reads its own writes as user
   *  input, holds for every one of them, and freezes on the first frame. */
  const selfScrollRef = useRef(-1)

  const hold = useCallback((ms: number) => {
    holdUntilRef.current = performance.now() + ms
  }, [])

  useEffect(() => {
    const rail = railRef.current
    if (!rail) return
    // Respect the OS setting: the row still scrolls by hand and by arrow, it
    // just never moves on its own.
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return

    let raf = 0
    let last = 0

    const step = (now: number) => {
      raf = requestAnimationFrame(step)
      const dt = last ? (now - last) / 1000 : 0
      last = now

      const held = engagedRef.current || now < holdUntilRef.current
      const next = nextTickerPos({
        pos: posRef.current,
        half: rail.scrollWidth / 2,
        dtSeconds: dt,
        held,
      })

      if (next === null) {
        // While the user is in charge, track their position instead of
        // fighting it — the drift then resumes from wherever they stopped.
        if (held) posRef.current = rail.scrollLeft
        return
      }

      posRef.current = next
      rail.scrollLeft = next
      // Read back what the browser actually kept (it may round or clamp), so
      // the scroll event this write triggers recognises itself.
      selfScrollRef.current = rail.scrollLeft
    }

    raf = requestAnimationFrame(step)
    return () => cancelAnimationFrame(raf)
  }, [])

  const nudge = useCallback(
    (dir: -1 | 1) => {
      const rail = railRef.current
      if (!rail) return

      const prewrap = prewrapForNudge({
        direction: dir,
        scrollLeft: rail.scrollLeft,
        half: rail.scrollWidth / 2,
      })
      if (prewrap !== null) rail.scrollLeft = prewrap

      rail.scrollBy({ left: dir * NUDGE, behavior: "smooth" })
      hold(RESUME_DELAY)
    },
    [hold],
  )

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
              onPointerEnter={() => {
                engagedRef.current = true
              }}
              onPointerLeave={() => {
                engagedRef.current = false
              }}
              // Touch has no "leave": end the hold on a timer instead, long
              // enough for iOS momentum to finish before the drift resumes.
              onTouchStart={() => {
                engagedRef.current = true
              }}
              onTouchEnd={() => {
                engagedRef.current = false
                hold(RESUME_DELAY)
              }}
              onFocusCapture={() => {
                engagedRef.current = true
              }}
              onBlurCapture={() => {
                engagedRef.current = false
              }}
              // A wheel/trackpad scroll can fire with no pointer state change,
              // so hold here too — but only for a jump the drift did not make
              // itself (see selfScrollRef; 2px covers browser rounding).
              onScroll={(e) => {
                if (engagedRef.current) return
                if (isUserScroll(e.currentTarget.scrollLeft, selfScrollRef.current)) {
                  hold(RESUME_DELAY)
                }
              }}
            >
              <div className="flex w-max">
                <SetPills sets={sets} allLabel={copy.allLabel} />
                <SetPills sets={sets} allLabel={copy.allLabel} clone />
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
