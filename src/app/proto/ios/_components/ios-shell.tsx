"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { ChevronLeft, LineChart, ListChecks, Menu, Search, Wallet } from "lucide-react"

import { cn } from "@/lib/utils"

/**
 * iOS shell for the /proto/ios/* showcase (v3) — "Meecard as one app that
 * scales up," not "a phone app plus a separate desktop website." Every
 * screen size gets the SAME grammar (large title collapsing into a compact
 * toolbar title on scroll, frosted chrome, the same tab identity) — only the
 * chrome's shape and the content's column count change per breakpoint,
 * exactly like an Apple app scaling from iPhone to iPad to Mac (Notes/Music
 * collapse their big title into the toolbar identically on every size).
 *   - Desktop (`md:`+): a top app bar (logo · nav links · search · avatar)
 *     instead of a bottom tab bar — the owner's own reasoning: "the web has
 *     more room, not a different app." Same frost-on-scroll + honey-active
 *     treatment as mobile, and the SAME collapsing-title behavior.
 *   - Mobile (`<md`): the collapsing frosted large-title nav bar + bottom tab
 *     bar.
 *
 * Scoped entirely to /proto/ios — does not touch the real app's Header/
 * BottomNav/MainChrome.
 */

const TABS = [
  { href: "/proto/ios", label: "ตลาด", icon: LineChart },
  { href: "/proto/ios/portfolio", label: "พอร์ต", icon: Wallet },
  { href: "/proto/ios/watchlist", label: "รายการโปรด", icon: ListChecks },
  { href: "/proto/ios/more", label: "เพิ่มเติม", icon: Menu },
] as const

/** Fixed lookup for this showcase's 6 known screens — a real rollout would
 *  derive this from route metadata, but 6 static screens don't need that. */
function resolveNav(pathname: string): { title: string; showBack: boolean; backHref?: string } {
  if (/^\/proto\/ios\/portfolio\/[^/]+/.test(pathname)) {
    return { title: "พอร์ต", showBack: true, backHref: "/proto/ios/portfolio" }
  }
  if (pathname.startsWith("/proto/ios/portfolio")) return { title: "พอร์ตโฟลิโอ", showBack: false }
  if (/^\/proto\/ios\/cards\/[^/]+/.test(pathname)) {
    return { title: "รายละเอียดการ์ด", showBack: true, backHref: "/proto/ios" }
  }
  if (pathname.startsWith("/proto/ios/watchlist")) return { title: "รายการโปรด", showBack: false }
  if (pathname.startsWith("/proto/ios/more")) return { title: "เพิ่มเติม", showBack: false }
  return { title: "ตลาด", showBack: false }
}

function isTabActive(pathname: string, href: string) {
  if (href === "/proto/ios") return pathname === "/proto/ios" || pathname.startsWith("/proto/ios/cards")
  return pathname === href || pathname.startsWith(`${href}/`)
}

export function IosShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() ?? "/proto/ios"
  const router = useRouter()
  // Lazy initializer reads the real scroll position on first render (e.g. a
  // back-forward-cache restore that's already scrolled) without needing an
  // effect-body setState call, which would otherwise trigger a cascading render.
  const [scrolled, setScrolled] = useState(() => typeof window !== "undefined" && window.scrollY > 8)
  const nav = resolveNav(pathname)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8)
    window.addEventListener("scroll", onScroll, { passive: true })
    return () => window.removeEventListener("scroll", onScroll)
  }, [])

  return (
    <div className="min-h-dvh bg-background text-foreground">
      {/* ── Desktop top header — same grammar as the real app's header.tsx,
          re-skinned: frosted on scroll instead of a flat solid fill, honey
          pill for the active link (matches the mobile tab bar's language). ── */}
      <header
        className={cn(
          "ease-chrome sticky top-0 z-40 hidden transition-colors md:block",
          scrolled ? "frost hairline-b" : "bg-transparent",
        )}
      >
        <div className="mx-auto flex h-14 max-w-6xl items-center gap-1 px-6 lg:px-8">
          <Link href="/proto/ios" className="mr-4 flex shrink-0 items-center gap-2">
            <span className="text-lg leading-none">🐻</span>
            <span className="text-base font-bold tracking-tight">Meecard</span>
          </Link>

          <nav className="flex items-center gap-1">
            {TABS.map((tab) => {
              const active = isTabActive(pathname, tab.href)
              return (
                <Link
                  key={tab.href}
                  href={tab.href}
                  className={cn(
                    "ease-chrome flex items-center gap-1.5 rounded-full px-3 py-2 text-sm font-medium transition-colors",
                    active ? "bg-primary/12 text-primary" : "text-muted-foreground hover:bg-muted hover:text-foreground",
                  )}
                >
                  <tab.icon className={cn("size-4", active && "stroke-[2.5]")} />
                  {tab.label}
                </Link>
              )
            })}
          </nav>

          {/* Same "large title collapses into the toolbar on scroll" grammar
              as the mobile nav bar — one app, one behavior, every screen size
              (macOS/iPadOS toolbars do exactly this, e.g. Notes/Music). */}
          <p
            className={cn(
              "motion-base text-h4 ml-4 truncate",
              scrolled ? "opacity-100" : "pointer-events-none opacity-0",
            )}
          >
            {nav.title}
          </p>

          <div className="flex-1" />

          <button
            type="button"
            className="ease-chrome flex items-center gap-2 rounded-full bg-muted px-3.5 py-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            <Search className="size-4" />
            ค้นหาการ์ด, เซ็ต...
          </button>

          <div className="ml-2 flex size-9 shrink-0 items-center justify-center rounded-full bg-primary/15 text-sm font-semibold text-primary">
            บ
          </div>
        </div>
      </header>

      {/* ── Mobile collapsing frosted nav bar — transparent over the Large
          Title, fades to frost+hairline+compact-title once scrolled. ── */}
      <header className="pt-safe sticky top-0 z-40 md:hidden">
        <div
          aria-hidden
          className={cn(
            "motion-base pointer-events-none absolute inset-0",
            scrolled ? "frost hairline-b opacity-100" : "opacity-0",
          )}
        />
        <div className="relative flex h-11 items-center justify-between px-2">
          <div className="flex w-24 items-center">
            {nav.showBack && (
              <button
                type="button"
                onClick={() => (nav.backHref ? router.push(nav.backHref) : router.back())}
                className="ease-chrome -ml-1 inline-flex items-center gap-0.5 rounded-lg px-2 py-1.5 text-sm font-medium text-primary transition-colors hover:bg-muted"
              >
                <ChevronLeft className="size-5" />
                กลับ
              </button>
            )}
          </div>
          <p
            className={cn(
              "motion-base text-h4 truncate",
              scrolled ? "opacity-100" : "pointer-events-none opacity-0",
            )}
          >
            {nav.title}
          </p>
          <div className="w-24" />
        </div>
      </header>

      <main className="pb-24 md:pb-10">{children}</main>

      {/* ── Mobile bottom tab bar ── */}
      <nav className="frost hairline-t pb-safe fixed inset-x-0 bottom-0 z-40 md:hidden">
        <ul className="flex">
          {TABS.map((tab) => {
            const active = isTabActive(pathname, tab.href)
            return (
              <li key={tab.href} className="min-w-0 flex-1">
                <Link
                  href={tab.href}
                  className={cn(
                    "flex flex-col items-center gap-0.5 py-2 text-micro font-medium transition-all active:scale-95",
                    active ? "text-primary" : "text-muted-foreground",
                  )}
                >
                  <tab.icon className={cn("size-5", active && "stroke-[2.5]")} />
                  {tab.label}
                </Link>
              </li>
            )
          })}
        </ul>
      </nav>
    </div>
  )
}
