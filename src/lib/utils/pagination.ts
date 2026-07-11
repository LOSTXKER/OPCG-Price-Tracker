/**
 * Page-number window with ellipsis for pagination controls.
 *
 * Returns page numbers interleaved with "..." gaps: always shows the first and
 * last page, a ±1 window around `current`, and an ellipsis for each gap. When
 * `total <= 7` every page is shown. Single source of truth for the home /
 * search / admin / cards pagination components (previously each re-implemented
 * this).
 */
export function buildPageRange(current: number, total: number): (number | "...")[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1)

  const pages: (number | "...")[] = [1]
  if (current > 3) pages.push("...")

  const start = Math.max(2, current - 1)
  const end = Math.min(total - 1, current + 1)
  for (let i = start; i <= end; i++) pages.push(i)

  if (current < total - 2) pages.push("...")
  pages.push(total)
  return pages
}

/** Compact page window that keeps 44px controls within a phone viewport. */
export function buildMobilePageRange(
  current: number,
  total: number,
): (number | "...")[] {
  if (total <= 5) return Array.from({ length: total }, (_, i) => i + 1)

  const pages: (number | "...")[] = [1]
  if (current > 2) pages.push("...")
  if (current > 1 && current < total) pages.push(current)
  if (current < total - 1) pages.push("...")
  pages.push(total)
  return pages
}
