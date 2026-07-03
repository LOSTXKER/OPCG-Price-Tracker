"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { ChevronLeft, LineChart, ListChecks, Menu, Wallet } from "lucide-react"

import { cn } from "@/lib/utils"

/**
 * iOS shell for the /proto/ios/* showcase — one file owning the two chrome
 * pieces every screen shares:
 *   - a frosted nav bar that starts fully transparent over the Large Title
 *     and fades in (title + hairline) once the user scrolls past it, exactly
 *     like iOS's collapsing large-title navigation bar
 *   - a bottom tab bar on mobile / a left side-rail on desktop (VISION §2:
 *     "desktop = side-rail nav ... not a mobile column stretched")
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
    <div className="min-h-dvh bg-background text-foreground md:flex">
      {/* Desktop side rail */}
      <aside className="hidden md:sticky md:top-0 md:flex md:h-dvh md:w-60 md:shrink-0 md:flex-col md:border-r md:border-[var(--p-hair)] md:p-4">
        <Link href="/proto/ios" className="flex items-center gap-2 px-2 py-3">
          <span className="text-lg">🐻</span>
          <span className="text-h5">Meecard</span>
        </Link>
        <nav className="mt-4 flex flex-col gap-1">
          {TABS.map((tab) => {
            const active = isTabActive(pathname, tab.href)
            return (
              <Link
                key={tab.href}
                href={tab.href}
                className={cn(
                  "ease-chrome flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                  active ? "bg-primary/12 text-primary" : "text-muted-foreground hover:bg-muted hover:text-foreground",
                )}
              >
                <tab.icon className={cn("size-4.5", active && "stroke-[2.5]")} />
                {tab.label}
              </Link>
            )
          })}
        </nav>
      </aside>

      <div className="min-w-0 flex-1">
        {/* Collapsing frosted nav bar — transparent over the Large Title,
            fades to frost+hairline+compact-title once scrolled. */}
        <header className="pt-safe sticky top-0 z-40">
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
      </div>

      {/* Mobile bottom tab bar */}
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
