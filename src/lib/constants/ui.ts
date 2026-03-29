export const BLUR_DATA_URL =
  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mN8+M9QDwADggGAgxkG+QAAAABJRU5ErkJggg=="

export const CARD_BG = "bg-muted"

export const PAGE_SIZE_DEFAULT = 24
export const PAGE_SIZES = [24, 48, 96] as const

export type Unit = "pack" | "box" | "carton"

export const UNIT_LABELS: Record<Unit, string> = {
  pack: "ซอง",
  box: "กล่อง",
  carton: "คาตั้น",
}
