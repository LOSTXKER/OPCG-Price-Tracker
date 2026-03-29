export const BLUR_DATA_URL =
  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mN8+M9QDwADggGAgxkG+QAAAABJRU5ErkJggg=="

export const CARD_BG = "bg-muted"

export const PAGE_SIZE_DEFAULT = 24
export const PAGE_SIZES = [24, 48, 96] as const

/** Cards list page size used in market overview, search, and API defaults */
export const CARDS_PAGE_SIZE = 20

/** Listing and portfolio item quantity bounds (shared between UI schema and API validation) */
export const MIN_LISTING_QUANTITY = 1
export const MAX_LISTING_QUANTITY = 999

/** Default card condition for new listings and portfolio items */
export const DEFAULT_CARD_CONDITION = "NM" as const

export type Unit = "pack" | "box" | "carton"

export const UNIT_LABELS: Record<Unit, string> = {
  pack: "ซอง",
  box: "กล่อง",
  carton: "คาตั้น",
}

export const PULL_UNITS: Unit[] = ["pack", "box", "carton"]
