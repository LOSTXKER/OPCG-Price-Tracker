"use client"

import Image from "next/image"
import {
  Bell,
  Briefcase,
  ChevronDown,
  Heart,
  LayoutGrid,
  LineChart,
  LogIn,
  LogOut,
  Menu,
  Search,
  User,
} from "lucide-react"

import { useScrolled } from "@/hooks/use-scrolled"
import { cn } from "@/lib/utils"

export type NavbarVariant = "current" | "twoRow" | "twoRowCollapse"

/**
 * Static replicas of the phone chrome for the /proto/mobile-navbar comparison.
 * Decorative only (aria-hidden, nothing tappable) — the point is geometry: how
 * much height each arrangement costs and whether row 1 still fits once
 * รายการโปรด / แจ้งเตือน / โปรไฟล์ / เข้าสู่ระบบ all live there
 * (owner request 2026-08-29).
 */

/** One 44px circular utility slot, matching the live header's treatment. */
function Slot({
  children,
  filled = true,
  label,
}: {
  children: React.ReactNode
  filled?: boolean
  label?: string
}) {
  return (
    <span
      className={cn(
        "ml-1.5 flex size-11 shrink-0 items-center justify-center rounded-full",
        filled ? "surface-2 hairline text-foreground" : "text-muted-foreground",
      )}
      title={label}
    >
      {children}
    </span>
  )
}

function Logo() {
  return (
    <span className="mr-1 flex size-11 shrink-0 items-center justify-center">
      <Image
        src="/meecard.png"
        alt=""
        width={754}
        height={694}
        className="h-auto w-8 shrink-0 select-none"
      />
    </span>
  )
}

/** Game pill + set trigger — the catalog control, at whatever width it gets. */
function CatalogControl({ compact = false }: { compact?: boolean }) {
  return (
    <>
      <span
        className={cn(
          "flex shrink-0 items-center gap-1 rounded-full border border-hair bg-background px-3 text-sm font-semibold text-foreground",
          compact ? "h-9" : "h-11",
        )}
      >
        OPCG
        <ChevronDown className="size-3.5 text-muted-foreground" />
      </span>
      <span
        className={cn(
          "ml-1.5 flex min-w-0 flex-1 items-center gap-1 rounded-full border border-hair bg-background px-3 text-sm text-muted-foreground",
          compact ? "h-9" : "h-11",
        )}
      >
        <span className="truncate">เลือกชุด</span>
        <ChevronDown className="ml-auto size-3.5 shrink-0" />
      </span>
    </>
  )
}

export function ProtoNavbar({
  variant,
  signedIn,
}: {
  variant: NavbarVariant
  signedIn: boolean
}) {
  const scrolled = useScrolled()

  // Today's live chrome: ONE row, catalog control squeezed between the logo
  // and the utilities. Baseline for the comparison.
  if (variant === "current") {
    return (
      <div aria-hidden className="hairline-b sticky top-0 z-chrome bg-background">
        <div className="flex h-14 min-w-0 items-center px-2">
          <Logo />
          <CatalogControl />
          <Slot label="รายการโปรด">
            <Heart className="size-[18px]" />
          </Slot>
          <Slot filled={false} label="แจ้งเตือน">
            <Bell className="size-[18px]" />
          </Slot>
          {!signedIn && (
            <Slot filled={false} label="เข้าสู่ระบบ">
              <LogIn className="size-[18px]" />
            </Slot>
          )}
        </div>
      </div>
    )
  }

  // Owner request: TWO rows — identity + account utilities on top, the
  // game→set catalog control on its own full-width row underneath.
  const collapsed = variant === "twoRowCollapse" && scrolled

  return (
    <div aria-hidden className="hairline-b sticky top-0 z-chrome bg-background">
      {/* Row 1 — โลโก้ · รายการโปรด · แจ้งเตือน · โปรไฟล์ · เข้าสู่ระบบ/ออกจากระบบ */}
      <div className="flex h-14 min-w-0 items-center px-2">
        <Logo />
        <span className="text-h5 min-w-0 flex-1 truncate text-foreground">
          Meecard
        </span>

        <Slot label="รายการโปรด">
          <Heart className="size-[18px]" />
        </Slot>
        <Slot filled={false} label="แจ้งเตือน">
          <Bell className="size-[18px]" />
        </Slot>

        {signedIn ? (
          <>
            {/* Signed in: avatar + a direct sign-out control, as asked. On the
                live site sign-out lives inside this menu — shown here as its
                own slot so the row's real width is honest. */}
            <span className="ml-1.5 flex size-11 shrink-0 items-center justify-center rounded-full bg-primary/15 text-sm font-semibold text-primary">
              บ
            </span>
            <Slot filled={false} label="ออกจากระบบ">
              <LogOut className="size-[18px]" />
            </Slot>
          </>
        ) : (
          <>
            <Slot filled={false} label="โปรไฟล์">
              <User className="size-[18px]" />
            </Slot>
            <Slot filled={false} label="เข้าสู่ระบบ">
              <LogIn className="size-[18px]" />
            </Slot>
          </>
        )}
      </div>

      {/* Row 2 — the catalog control, finally at full width. In the collapse
          variant it folds away on scroll and hands its space back, with the
          set name surfacing next to the logo so you never lose your place. */}
      <div
        className={cn(
          "ease-chrome flex min-w-0 items-center overflow-hidden px-2 transition-all",
          collapsed ? "h-0 opacity-0" : "h-12 opacity-100",
        )}
      >
        <CatalogControl compact />
      </div>
    </div>
  )
}

/** The proto's bottom bar — the live one, unchanged, so heights read true. */
export function ProtoBottomNav() {
  const tabs = [
    { label: "หน้าแรก", icon: LineChart, active: true },
    { label: "ชุดการ์ด", icon: LayoutGrid, active: false },
    { label: "ค้นหา", icon: Search, active: false, fab: true },
    { label: "พอร์ต", icon: Briefcase, active: false },
    { label: "ดูเพิ่มเติม", icon: Menu, active: false },
  ]

  return (
    <nav
      aria-hidden
      className="hairline-t pb-safe fixed bottom-0 left-1/2 z-chrome w-full max-w-md -translate-x-1/2 bg-background"
    >
      <ul className="flex items-stretch justify-around">
        {tabs.map((tab) => (
          <li key={tab.label} className="min-w-0 flex-1">
            <span
              className={cn(
                "flex w-full flex-col items-center gap-0.5 py-2 text-xs font-medium",
                tab.active ? "text-primary" : "text-muted-foreground",
              )}
            >
              {tab.fab ? (
                <span className="-mt-7 flex size-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg ring-4 ring-background">
                  <tab.icon className="size-6" strokeWidth={2.25} />
                </span>
              ) : (
                <tab.icon className={cn("size-5", tab.active && "stroke-[2.5]")} />
              )}
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
