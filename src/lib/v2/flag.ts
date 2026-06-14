/**
 * V2 redesign feature flag — controls the page-by-page swap from the v1 app to
 * the warm-premium v2 redesign.
 *
 * - The isolated `/v2/*` preview routes ALWAYS render v2 (build there freely).
 * - Production routes call `isV2Enabled("<page>")` and render the v2 tree only
 *   when its flag is on, so each page can be flipped live independently.
 *
 * Control via env `NEXT_PUBLIC_V2`:
 *   - "all"                 → every page on v2
 *   - "card-detail,home"    → only those pages
 *   - unset / ""            → all v1 (default)
 */
export const V2_PAGES = [
  "home",
  "card-detail",
  "portfolio",
  "marketplace",
  "browse",
] as const

export type V2Page = (typeof V2_PAGES)[number]

export function isV2Enabled(page: V2Page): boolean {
  const env = (process.env.NEXT_PUBLIC_V2 ?? "").trim()
  if (!env) return false
  if (env === "all") return true
  return env
    .split(",")
    .map((s) => s.trim())
    .includes(page)
}
