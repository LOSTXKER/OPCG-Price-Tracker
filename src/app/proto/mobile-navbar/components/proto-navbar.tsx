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

export type NavbarVariant = "current" | "twoRow" | "polished" | "polishedCollapse"

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

/**
 * Polished row 2: a CONTEXT bar, not a second chrome row. Three things change
 * from the plain version — a faint surface tint so the eye reads "this line
 * says where you are" instead of "more buttons", the game shown as its crest
 * rather than a text pill, and the set trigger carrying the chosen set's box
 * art plus its full name (the width row 2 exists to give it).
 */
function PolishedContextRow({ collapsed }: { collapsed: boolean }) {
  return (
    <div
      className={cn(
        "ease-chrome flex min-w-0 items-center gap-1.5 overflow-hidden bg-muted/30 px-2 transition-all",
        collapsed ? "h-0 opacity-0" : "h-12 opacity-100",
      )}
    >
      <span className="flex h-9 shrink-0 items-center gap-1.5 rounded-full border border-hair bg-background ps-1.5 pe-2.5 text-sm font-semibold text-foreground">
        <span className="relative flex size-6 shrink-0 items-center justify-center overflow-hidden rounded-full bg-muted">
          <Image
            src="/games/one-piece-logo.png"
            alt=""
            width={48}
            height={48}
            className="size-6 object-contain"
          />
        </span>
        OPCG
        <ChevronDown className="size-3.5 text-muted-foreground" />
      </span>

      <span className="flex h-9 min-w-0 flex-1 items-center gap-2 rounded-full border border-hair bg-background ps-1.5 pe-2.5">
        <span className="relative block h-7 w-5 shrink-0 overflow-hidden rounded-sm bg-muted">
          <Image
            src="https://pub-e1c871a889eb42a4bd7dcdc3a5926f3c.r2.dev/sets/op15.webp"
            alt=""
            fill
            className="object-cover"
            sizes="20px"
          />
        </span>
        <span className="min-w-0 flex-1 text-start">
          <span className="block text-xs font-semibold leading-tight text-foreground">
            OP15
          </span>
          <span className="block truncate text-xs leading-tight text-muted-foreground">
            Adventure on KAMI&apos;s Island
          </span>
        </span>
        <ChevronDown className="size-3.5 shrink-0 text-muted-foreground" />
      </span>
    </div>
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

  // Polished pass on the same two-row idea (owner: "ทำให้ดีกว่านี้หน่อย").
  // Four changes, each earning its place:
  //  1. Row 1's middle carries the PAGE NAME instead of the wordmark — the
  //     logo already says which site this is; the space is better spent
  //     saying where you are (iOS toolbar grammar).
  //  2. The utilities are grouped: tools (watchlist, alerts) then a hairline
  //     then the account, so four icons stop reading as one undifferentiated
  //     row.
  //  3. Sign-out lives inside the avatar menu like every other site, which
  //     buys back a whole 44px slot for the page name.
  //  4. Row 2 becomes a tinted CONTEXT bar showing the game crest and the
  //     set's box art + full name — the payoff for spending the second row.
  if (variant === "polished" || variant === "polishedCollapse") {
    const collapsedCtx = variant === "polishedCollapse" && scrolled
    return (
      <div aria-hidden className="hairline-b sticky top-0 z-chrome bg-background">
        <div className="flex h-14 min-w-0 items-center px-2">
          <Logo />
          <span className="min-w-0 flex-1 truncate text-h5 text-foreground">
            ราคาการ์ด
          </span>

          <Slot label="รายการโปรด">
            <Heart className="size-[18px]" />
          </Slot>
          <span className="relative">
            <Slot filled={false} label="แจ้งเตือน">
              <Bell className="size-[18px]" />
            </Slot>
            <span className="absolute right-2 top-2 size-2 rounded-full bg-danger" />
          </span>

          <span aria-hidden className="mx-1 h-5 w-px shrink-0 bg-hair" />

          {signedIn ? (
            // One control, not two: tapping it opens the account menu, where
            // "ออกจากระบบ" lives with settings and preferences.
            <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-primary/15 text-sm font-semibold text-primary">
              บ
            </span>
          ) : (
            <span className="flex h-11 shrink-0 items-center gap-1.5 rounded-full bg-primary px-3.5 text-sm font-semibold text-primary-foreground">
              <LogIn className="size-4" />
              เข้าสู่ระบบ
            </span>
          )}
        </div>

        <PolishedContextRow collapsed={collapsedCtx} />
      </div>
    )
  }

  // Owner request as literally specced: identity + account utilities on top,
  // the game→set catalog control on its own full-width row underneath.
  const collapsed = false

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
