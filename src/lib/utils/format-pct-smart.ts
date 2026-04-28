/**
 * Smart percentage formatter that adapts decimals to magnitude.
 *
 * - |v| < 100  → 1 decimal place (e.g. "+89.8%")
 * - 100 ≤ |v| < 1000 → integer (e.g. "+345%")
 * - |v| ≥ 1000 → integer with thousands separator (e.g. "+9,833%")
 * - |v| ≥ 100000 → ">100,000%" (caps for readability)
 *
 * Always includes sign for non-zero values.
 * Returns "—" for null/undefined/NaN.
 */
export function formatPctSmart(v: number | null | undefined): string {
  if (v == null || Number.isNaN(v)) return "—"
  const abs = Math.abs(v)
  const sign = v > 0 ? "+" : v < 0 ? "-" : ""

  if (abs >= 100_000) {
    return `${sign}>100,000%`
  }

  let body: string
  if (abs < 100) {
    body = abs.toLocaleString(undefined, {
      minimumFractionDigits: 1,
      maximumFractionDigits: 1,
    })
  } else if (abs < 1000) {
    body = Math.round(abs).toString()
  } else {
    body = Math.round(abs).toLocaleString(undefined, {
      maximumFractionDigits: 0,
    })
  }

  return `${sign}${body}%`
}
