import type { ReactNode } from "react"
import "@/components/v2/theme.css"
import { V2Chrome } from "@/components/v2/chrome"

export const metadata = {
  title: "Meecard V2",
}

/**
 * Isolated build/preview shell for the V2 redesign. Applies the warm-premium
 * theme (.v2) + the v2 top navbar. These /v2/* routes always render v2 (build
 * here freely); production routes adopt the same components page-by-page behind
 * isV2Enabled() (src/lib/v2/flag.ts).
 */
export default function V2Layout({ children }: { children: ReactNode }) {
  return (
    <div className="v2 min-h-svh w-full">
      <V2Chrome>{children}</V2Chrome>
    </div>
  )
}
