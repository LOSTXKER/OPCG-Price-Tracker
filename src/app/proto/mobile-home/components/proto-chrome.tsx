"use client"

import Image from "next/image"
import {
  Bell,
  Briefcase,
  Camera,
  ChevronDown,
  Heart,
  LayoutGrid,
  LineChart,
  Menu,
  Scale,
  Search,
} from "lucide-react"

import { useScrolled } from "@/hooks/use-scrolled"
import { cn } from "@/lib/utils"

/**
 * Static replicas of the phone chrome (header-mobile.tsx + bottom-nav.tsx) so
 * the fold budget in this proto reads true — 56px on top, tab bar below —
 * without the real chrome navigating the owner away mid-comparison. Purely
 * decorative: spans only, aria-hidden, nothing tappable.
 *
 * The chrome variant drives BOTH bars: the FAB variants drop the top bar's
 * search circle (search moved down — keeping both would double it). The
 * "top*" variants are the Shopee direction with the owner's correction kept
 * in (2026-08-28 "คนชอบเลือกชุดการ์ดด้วย" — matches how collectors browse):
 * a full-width search field on row 1 AND the game→set catalog row back on
 * row 2. "topTwoRow" pins both rows; "topCollapse" hides the catalog row
 * once the page scrolls, so the permanent chrome stays 56px.
 */
export function ProtoTopBar({ variant = "plain" }: { variant?: ChromeVariant }) {
  // Same collapsing-chrome signal the real header uses (use-scrolled.ts).
  // Called unconditionally (hook rules); only topCollapse acts on it.
  const scrolled = useScrolled()

  if (variant === "topTwoRow" || variant === "topCollapse") {
    const collapsed = variant === "topCollapse" && scrolled
    return (
      <div aria-hidden className="hairline-b sticky top-0 z-chrome bg-background">
        {/* Row 1 — today's navbar, verbatim (owner order 2026-08-29: game→set
            stays on top): logo + OPCG + เลือกชุด + bell. In topCollapse, a
            search circle appears here only while the field below is folded —
            the scrolled state then looks exactly like the live site. */}
        <div className="flex h-14 min-w-0 items-center px-2">
          <span className="mr-1 flex size-11 shrink-0 items-center justify-center">
            <Image
              src="/meecard.png"
              alt=""
              width={754}
              height={694}
              className="h-auto w-8 shrink-0 select-none"
            />
          </span>
          <span className="flex h-11 shrink-0 items-center gap-1 rounded-full border border-hair bg-background px-3 text-sm font-semibold text-foreground">
            OPCG
            <ChevronDown className="size-3.5 text-muted-foreground" />
          </span>
          <span className="ml-1.5 flex h-11 min-w-0 flex-1 items-center gap-1 rounded-full border border-hair bg-background px-3 text-sm text-muted-foreground">
            <span className="truncate">เลือกชุด</span>
            <ChevronDown className="ml-auto size-3.5 shrink-0" />
          </span>
          {collapsed && (
            <span className="surface-2 hairline ml-1.5 flex size-11 shrink-0 items-center justify-center rounded-full text-foreground">
              <Search className="size-[18px]" />
            </span>
          )}
          <span className="flex size-11 shrink-0 items-center justify-center text-muted-foreground">
            <Bell className="size-[18px]" />
          </span>
        </div>

        {/* Row 2 — the full-width search field. In topCollapse it folds away
            on scroll (handing search back to the circle above) and returns at
            the top of the page. */}
        <div
          className={cn(
            "ease-chrome flex min-w-0 items-center overflow-hidden px-2 transition-all",
            collapsed ? "h-0 opacity-0" : "h-14 opacity-100",
          )}
        >
          <span className="flex h-11 min-w-0 flex-1 items-center gap-2 rounded-full border border-hair bg-muted/30 px-3.5 text-sm text-muted-foreground">
            <Search className="size-4 shrink-0" />
            <span className="truncate">ค้นหาการ์ด ชุด หรือรหัส…</span>
            {/* Photo search is a real feature — the field carries its entry. */}
            <Camera className="ml-auto size-[18px] shrink-0" />
          </span>
        </div>
      </div>
    )
  }

  const showSearch = variant === "plain"
  return (
    <div aria-hidden className="hairline-b sticky top-0 z-chrome bg-background">
      <div className="flex h-14 min-w-0 items-center px-2">
        <span className="mr-1 flex size-11 shrink-0 items-center justify-center">
          <Image
            src="/meecard.png"
            alt=""
            width={754}
            height={694}
            className="h-auto w-8 shrink-0 select-none"
          />
        </span>

        {/* Game pill + set trigger — the shape of HeaderCatalogControl's mobile
            presentation, frozen in its "no set selected" state. */}
        <span className="flex h-11 shrink-0 items-center gap-1 rounded-full border border-hair bg-background px-3 text-sm font-semibold text-foreground">
          OPCG
          <ChevronDown className="size-3.5 text-muted-foreground" />
        </span>
        <span className="ml-1.5 flex h-11 min-w-0 flex-1 items-center gap-1 rounded-full border border-hair bg-background px-3 text-sm text-muted-foreground">
          <span className="truncate">เลือกชุด</span>
          <ChevronDown className="ml-auto size-3.5 shrink-0" />
        </span>

        {showSearch && (
          <span className="surface-2 hairline ml-1.5 flex size-11 shrink-0 items-center justify-center rounded-full text-foreground">
            <Search className="size-[18px]" />
          </span>
        )}
        <span className="flex size-11 shrink-0 items-center justify-center text-muted-foreground">
          <Bell className="size-[18px]" />
        </span>
      </div>
    </div>
  )
}

export type ChromeVariant =
  | "plain"
  | "search"
  | "searchCompare"
  | "topTwoRow"
  | "topCollapse"

type MockTab = { label: string; icon: typeof LineChart; active?: boolean }

/** The live bar's 5 tabs — "รายการโปรด" owns the center slot today. */
const PLAIN_TABS: MockTab[] = [
  { label: "หน้าแรก", icon: LineChart, active: true },
  { label: "ชุดการ์ด", icon: LayoutGrid },
  { label: "รายการโปรด", icon: Heart },
  { label: "พอร์ต", icon: Briefcase },
  { label: "ดูเพิ่มเติม", icon: Menu },
]

/**
 * "search": a TRUE-center FAB needs an even tab count around it, so the middle
 * tab (รายการโปรด) yields its slot — its home becomes a sub-tab inside พอร์ต,
 * the hub VISION already assigns it to.
 *
 * "searchCompare": the owner's follow-up — add เปรียบเทียบ (Scale icon +
 * label, same as compare-button.tsx) as a 7th slot so the FAB has 3 tabs on
 * each side and lands dead center again. Cost: ~54px slots — labels drop to
 * text-overlay (they still fit, barely).
 *
 * Retired but recoverable from git: "searchAll" (6 slots, FAB half a slot
 * off center — searchCompare supersedes it) and the single-row "topSearch"
 * (no catalog row — owner: set selection must stay in the chrome).
 *
 * "topTwoRow" / "topCollapse": Shopee grammar — search field on top, catalog
 * row under it, bottom bar back to today's untouched 5 tabs.
 */
const SEARCH_TABS: MockTab[] = [
  { label: "หน้าแรก", icon: LineChart, active: true },
  { label: "ชุดการ์ด", icon: LayoutGrid },
  { label: "พอร์ต", icon: Briefcase },
  { label: "ดูเพิ่มเติม", icon: Menu },
]

const COMPARE_TABS: MockTab[] = [
  { label: "หน้าแรก", icon: LineChart, active: true },
  { label: "ชุดการ์ด", icon: LayoutGrid },
  { label: "รายการโปรด", icon: Heart },
  { label: "เปรียบเทียบ", icon: Scale },
  { label: "พอร์ต", icon: Briefcase },
  { label: "ดูเพิ่มเติม", icon: Menu },
]

function MockTabItem({
  tab,
  labelClass = "text-xs",
}: {
  tab: MockTab
  labelClass?: string
}) {
  return (
    <li className="min-w-0 flex-1">
      <span
        className={cn(
          "flex w-full flex-col items-center gap-0.5 py-2 font-medium",
          labelClass,
          tab.active ? "text-primary" : "text-muted-foreground",
        )}
      >
        <tab.icon className={cn("size-5", tab.active && "stroke-[2.5]")} />
        <span className="max-w-full truncate">{tab.label}</span>
        <span
          className={cn(
            "h-1 w-1 rounded-full bg-primary",
            tab.active ? "opacity-100" : "opacity-0",
          )}
        />
      </span>
    </li>
  )
}

function SearchFab({ labelClass = "text-xs" }: { labelClass?: string }) {
  return (
    <li className="min-w-0 flex-1">
      <span
        className={cn(
          "flex w-full flex-col items-center gap-0.5 py-2 font-medium text-muted-foreground",
          labelClass,
        )}
      >
        {/* Raised honey FAB — the one loud element; ring-4 in the page
            background color cuts it cleanly out of the hairline. */}
        <span className="-mt-7 flex size-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg ring-4 ring-background">
          <Search className="size-6" strokeWidth={2.25} />
        </span>
        <span>ค้นหา</span>
        <span className="h-1 w-1 rounded-full bg-primary opacity-0" />
      </span>
    </li>
  )
}

export function ProtoBottomNav({
  variant = "plain",
}: {
  variant?: ChromeVariant
}) {
  // Which tabs render, where the FAB slots in, and how tight the row is:
  // plain / top* = today's 5 tabs, no FAB · search = 2 + FAB + 2 (true
  // center) · searchCompare = 3 + FAB + 3 (7 slots, centered, text-overlay)
  const plainBar =
    variant === "plain" || variant === "topTwoRow" || variant === "topCollapse"
  const tabs = variant === "search" ? SEARCH_TABS : COMPARE_TABS
  const splitAt = variant === "search" ? 2 : 3
  const labelClass = variant === "searchCompare" ? "text-overlay" : "text-xs"

  return (
    <nav
      aria-hidden
      className="hairline-t pb-safe fixed bottom-0 left-1/2 z-chrome w-full max-w-md -translate-x-1/2 bg-background"
    >
      <ul className="flex items-stretch justify-around">
        {plainBar ? (
          PLAIN_TABS.map((tab) => <MockTabItem key={tab.label} tab={tab} />)
        ) : (
          <>
            {tabs.slice(0, splitAt).map((tab) => (
              <MockTabItem key={tab.label} tab={tab} labelClass={labelClass} />
            ))}
            <SearchFab labelClass={labelClass} />
            {tabs.slice(splitAt).map((tab) => (
              <MockTabItem key={tab.label} tab={tab} labelClass={labelClass} />
            ))}
          </>
        )}
      </ul>
    </nav>
  )
}
