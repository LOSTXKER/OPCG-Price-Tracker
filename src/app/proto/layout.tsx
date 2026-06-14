import type { ReactNode } from "react"
import "./proto.css"
import { ProtoChrome } from "./_components/chrome"

export const metadata = {
  title: "Meecard — VISION Prototype",
}

/**
 * Standalone shell for the VISION design prototype. Chromeless vs the real app
 * (see CHROMELESS_ROUTES in main-chrome.tsx) so it owns the full viewport and
 * the warm-premium honey theme. ProtoChrome supplies the prototype's own
 * chrome: a desktop sidebar rail + a mobile bottom-nav + game switcher.
 */
export default function ProtoLayout({ children }: { children: ReactNode }) {
  return (
    <div className="proto-root min-h-svh w-full">
      <ProtoChrome>{children}</ProtoChrome>
    </div>
  )
}
