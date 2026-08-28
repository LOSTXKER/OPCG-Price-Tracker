"use client"

import Image from "next/image"
import {
  Bell,
  Briefcase,
  ChevronDown,
  Heart,
  LayoutGrid,
  LineChart,
  Menu,
  Search,
} from "lucide-react"

import { cn } from "@/lib/utils"

/**
 * Static replicas of the phone chrome (header-mobile.tsx + bottom-nav.tsx) so
 * the fold budget in this proto reads true — 56px on top, tab bar below —
 * without the real chrome navigating the owner away mid-comparison. Purely
 * decorative: spans only, aria-hidden, nothing tappable.
 *
 * `showSearch` drops the top bar's search circle — the center-search nav
 * variant moves search to the bottom bar, so keeping both would double it.
 */
export function ProtoTopBar({ showSearch = true }: { showSearch?: boolean }) {
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

export type BottomNavVariant = "plain" | "search" | "searchAll"

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
 * "searchAll": the owner asked whether รายการโปรด can stay. It can — but 5
 * tabs + search = 6 slots, and 6 has no middle slot, so the FAB sits half a
 * slot right of true center (~31px on a 375px phone) and every slot narrows
 * to ~62px, which forces the smaller label size. Both costs are the point of
 * showing it; the explainer spells them out.
 */
const SEARCH_TABS: MockTab[] = [
  { label: "หน้าแรก", icon: LineChart, active: true },
  { label: "ชุดการ์ด", icon: LayoutGrid },
  { label: "พอร์ต", icon: Briefcase },
  { label: "ดูเพิ่มเติม", icon: Menu },
]

function MockTabItem({ tab, dense = false }: { tab: MockTab; dense?: boolean }) {
  return (
    <li className="min-w-0 flex-1">
      <span
        className={cn(
          "flex w-full flex-col items-center gap-0.5 py-2 font-medium",
          dense ? "text-micro" : "text-xs",
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

function SearchFab({ dense = false }: { dense?: boolean }) {
  return (
    <li className="min-w-0 flex-1">
      <span
        className={cn(
          "flex w-full flex-col items-center gap-0.5 py-2 font-medium text-muted-foreground",
          dense ? "text-micro" : "text-xs",
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
  variant?: BottomNavVariant
}) {
  // Which tabs render, where the FAB slots in, and how tight the row is:
  // plain = 5 tabs, no FAB · search = 2 + FAB + 2 (true center) ·
  // searchAll = 3 + FAB + 2 (6 slots — FAB half a slot off center, dense labels)
  const tabs = variant === "search" ? SEARCH_TABS : PLAIN_TABS
  const splitAt = variant === "search" ? 2 : 3
  const dense = variant === "searchAll"

  return (
    <nav
      aria-hidden
      className="hairline-t pb-safe fixed bottom-0 left-1/2 z-chrome w-full max-w-md -translate-x-1/2 bg-background"
    >
      <ul className="flex items-stretch justify-around">
        {variant === "plain" ? (
          tabs.map((tab) => <MockTabItem key={tab.label} tab={tab} />)
        ) : (
          <>
            {tabs.slice(0, splitAt).map((tab) => (
              <MockTabItem key={tab.label} tab={tab} dense={dense} />
            ))}
            <SearchFab dense={dense} />
            {tabs.slice(splitAt).map((tab) => (
              <MockTabItem key={tab.label} tab={tab} dense={dense} />
            ))}
          </>
        )}
      </ul>
    </nav>
  )
}
