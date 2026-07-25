import { stripGamePrefix } from "@/lib/game/constants"

export const AD_ZONES = [
  "global-bottom-anchor",
  "home-results-after-8",
  "search-results-after-8",
  "set-detail-before-rarity",
  "card-detail-chart-rail",
  "card-detail-marketplace-rail",
] as const

export type AdZone = (typeof AD_ZONES)[number]
export type AdKind = "GOOGLE_MOCK" | "DIRECT"
export type AdStrategy = "GOOGLE_ONLY" | "DIRECT_THEN_GOOGLE"
export type AdFormat = "ANCHOR" | "LEADERBOARD" | "RECTANGLE"
export type AdRoute =
  | "GLOBAL"
  | "HOME"
  | "SEARCH"
  | "SET_DETAIL"
  | "CARD_DETAIL"

export type AdInventoryDefinition = {
  zone: AdZone
  strategy: AdStrategy
  format: AdFormat
  route: AdRoute
  mobileSize: string
  desktopSize: string
}

/**
 * Both providers share this frame so an active Direct campaign replaces the
 * Google mock 1:1 without changing page rhythm.
 */
export const AD_FORMAT_CLASS = {
  ANCHOR:
    "mx-auto h-16 w-full max-w-[320px] sm:h-[90px] sm:max-w-[728px]",
  LEADERBOARD:
    "mx-auto h-[100px] w-full max-w-[320px] sm:h-[90px] sm:max-w-[970px]",
  RECTANGLE:
    "mx-auto h-[250px] w-full max-w-[300px] sm:h-[280px] sm:max-w-[336px]",
} satisfies Record<AdFormat, string>

export const AD_INVENTORY: Record<AdZone, AdInventoryDefinition> = {
  "global-bottom-anchor": {
    zone: "global-bottom-anchor",
    strategy: "DIRECT_THEN_GOOGLE",
    format: "ANCHOR",
    route: "GLOBAL",
    mobileSize: "320 × 64",
    desktopSize: "728 × 90",
  },
  "home-results-after-8": {
    zone: "home-results-after-8",
    strategy: "GOOGLE_ONLY",
    format: "LEADERBOARD",
    route: "HOME",
    mobileSize: "320 × 100",
    desktopSize: "970 × 90",
  },
  "search-results-after-8": {
    zone: "search-results-after-8",
    strategy: "GOOGLE_ONLY",
    format: "LEADERBOARD",
    route: "SEARCH",
    mobileSize: "320 × 100",
    desktopSize: "970 × 90",
  },
  "set-detail-before-rarity": {
    zone: "set-detail-before-rarity",
    strategy: "GOOGLE_ONLY",
    format: "LEADERBOARD",
    route: "SET_DETAIL",
    mobileSize: "320 × 100",
    desktopSize: "970 × 90",
  },
  "card-detail-chart-rail": {
    zone: "card-detail-chart-rail",
    strategy: "DIRECT_THEN_GOOGLE",
    format: "RECTANGLE",
    route: "CARD_DETAIL",
    mobileSize: "300 × 250",
    desktopSize: "336 × 280",
  },
  "card-detail-marketplace-rail": {
    zone: "card-detail-marketplace-rail",
    strategy: "GOOGLE_ONLY",
    format: "RECTANGLE",
    route: "CARD_DETAIL",
    mobileSize: "300 × 250",
    desktopSize: "336 × 280",
  },
}

const DENIED_EXACT_PATHS = new Set([
  "/pricing",
  "/login",
  "/register",
  "/forgot-password",
  "/reset-password",
  "/admin-login",
  "/marketplace/create",
])

const DENIED_PATH_PREFIXES = [
  "/settings",
  "/admin",
  "/seller",
  "/messages",
  "/orders",
  "/proto",
] as const

export function normalizeAdPathname(pathname: string): string {
  const normalized = stripGamePrefix(pathname)
  if (normalized === "/") return normalized
  return normalized.replace(/\/+$/, "")
}

export function isAdDeniedPath(pathname: string): boolean {
  const normalized = normalizeAdPathname(pathname)
  return (
    DENIED_EXACT_PATHS.has(normalized) ||
    DENIED_PATH_PREFIXES.some(
      (prefix) => normalized === prefix || normalized.startsWith(`${prefix}/`),
    )
  )
}

export function getAdRoute(pathname: string): AdRoute | null {
  if (isAdDeniedPath(pathname)) return null

  const normalized = normalizeAdPathname(pathname)
  if (normalized === "/") return "HOME"
  if (normalized === "/search") return "SEARCH"
  if (/^\/sets\/[^/]+$/.test(normalized)) return "SET_DETAIL"
  if (/^\/cards\/[^/]+$/.test(normalized)) return "CARD_DETAIL"
  return null
}

export function hasAdInventoryForPath(pathname: string): boolean {
  return getAdRoute(pathname) !== null
}

export function getEligibleAdInventory(
  zone: AdZone,
  pathname: string,
): AdInventoryDefinition | null {
  const definition = AD_INVENTORY[zone]
  if (definition.route === "GLOBAL") {
    return getAdRoute(pathname) === null ? null : definition
  }
  return definition.route === getAdRoute(pathname) ? definition : null
}
