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
 */
export function ProtoTopBar() {
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

        <span className="surface-2 hairline ml-1.5 flex size-11 shrink-0 items-center justify-center rounded-full text-foreground">
          <Search className="size-[18px]" />
        </span>
        <span className="flex size-11 shrink-0 items-center justify-center text-muted-foreground">
          <Bell className="size-[18px]" />
        </span>
      </div>
    </div>
  )
}

const TABS = [
  { label: "หน้าแรก", icon: LineChart, active: true },
  { label: "ชุดการ์ด", icon: LayoutGrid, active: false },
  { label: "รายการโปรด", icon: Heart, active: false },
  { label: "พอร์ต", icon: Briefcase, active: false },
  { label: "ดูเพิ่มเติม", icon: Menu, active: false },
] as const

export function ProtoBottomNav() {
  return (
    <nav
      aria-hidden
      className="hairline-t pb-safe fixed bottom-0 left-1/2 z-chrome w-full max-w-md -translate-x-1/2 bg-background"
    >
      <ul className="flex items-stretch justify-around">
        {TABS.map((tab) => (
          <li key={tab.label} className="min-w-0 flex-1">
            <span
              className={cn(
                "flex w-full flex-col items-center gap-0.5 py-2 text-xs font-medium",
                tab.active ? "text-primary" : "text-muted-foreground",
              )}
            >
              <tab.icon className={cn("size-5", tab.active && "stroke-[2.5]")} />
              <span>{tab.label}</span>
              <span
                className={cn(
                  "h-1 w-1 rounded-full bg-primary",
                  tab.active ? "opacity-100" : "opacity-0",
                )}
              />
            </span>
          </li>
        ))}
      </ul>
    </nav>
  )
}
