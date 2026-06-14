import type { ReactNode } from "react"

export const metadata = {
  title: "Meecard V2",
}

/**
 * V2 build namespace. Phase 0 = an EXACT copy of v1 (same chrome via the root
 * MainChrome, same theme, same components) so we can restyle page-by-page
 * without drift. The warm-premium design layer (src/components/v2/*) gets
 * applied gradually from here — nothing is changed yet.
 */
export default function V2Layout({ children }: { children: ReactNode }) {
  return <>{children}</>
}
