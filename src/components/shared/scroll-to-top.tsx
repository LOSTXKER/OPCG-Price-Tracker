"use client"

import { useEffect, useState } from "react"
import { usePathname } from "next/navigation"
import { ArrowUp } from "lucide-react"
import { cn } from "@/lib/utils"
import { isGamePrefix } from "@/lib/game/constants"
import { useHydrated } from "@/hooks/use-hydrated"

export function ScrollToTop() {
  const [visible, setVisible] = useState(false)
  const pathname = usePathname()
  const mounted = useHydrated()
  // Card detail lives at the game-prefixed URL (`/opcg/cards/x`) since the
  // `/[game]/` namespace rollout — the old flat `/cards/x` regex here never
  // matched post-rollout. Beyond that, the game-namespace middleware REWRITES
  // (not redirects) `/opcg/cards/x` to the flat route, so `usePathname()`
  // resolves differently between the server render (sees the rewrite
  // destination, unprefixed) and the client (sees the real, prefixed browser
  // URL) — a genuine hydration mismatch, not just a stale regex. Gate on
  // `mounted` so the very first client render matches the server's `false`
  // exactly, then the real value applies right after.
  const segments = pathname.split("/").filter(Boolean)
  const hideOnMobileCardDetail =
    mounted && isGamePrefix(segments[0]) && segments[1] === "cards" && !!segments[2]

  useEffect(() => {
    function onScroll() {
      setVisible(window.scrollY > 500)
    }
    window.addEventListener("scroll", onScroll, { passive: true })
    return () => window.removeEventListener("scroll", onScroll)
  }, [])

  return (
    <button
      type="button"
      onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
      aria-label="Scroll to top"
      className={cn(
        "tap-safe fixed bottom-[calc(5rem+var(--floating-ad-clearance))] right-4 z-floating flex size-10 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-[var(--elev-raised)] motion-base hover:bg-primary/90 md:bottom-[calc(2rem+var(--floating-ad-clearance))]",
        hideOnMobileCardDetail && "hidden md:flex",
        visible
          ? "translate-y-0 opacity-100"
          : "pointer-events-none translate-y-4 opacity-0"
      )}
    >
      <ArrowUp className="size-4" />
    </button>
  )
}
