import type { ReactNode } from "react"
import "./proto.css"

export const metadata = {
  title: "Meecard — VISION Prototype",
}

/**
 * Standalone shell for the VISION design prototype. Chromeless (see
 * CHROMELESS_ROUTES in main-chrome.tsx) so it owns the full viewport and
 * renders in the warm-premium honey theme regardless of the app's light/dark
 * mode. On desktop the content sits in a phone-width column so the mobile-first
 * design reads as intended.
 */
export default function ProtoLayout({ children }: { children: ReactNode }) {
  return (
    <div className="proto-root min-h-svh w-full">
      <div className="mx-auto min-h-svh w-full max-w-[460px] sm:my-0">{children}</div>
    </div>
  )
}
