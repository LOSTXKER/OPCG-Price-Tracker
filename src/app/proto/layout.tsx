import type { ReactNode } from "react"
import "./proto.css"

export const metadata = {
  title: "Meecard — VISION Prototype",
}

/**
 * Standalone shell for the VISION design prototype. Chromeless (see
 * CHROMELESS_ROUTES in main-chrome.tsx) so it owns the full viewport and
 * renders in the warm-premium honey theme regardless of the app's light/dark
 * mode. Each page owns its own responsive container — mobile-first phone
 * column that expands into a real desktop layout at lg:.
 */
export default function ProtoLayout({ children }: { children: ReactNode }) {
  return <div className="proto-root min-h-svh w-full">{children}</div>
}
