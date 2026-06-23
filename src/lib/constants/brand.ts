/**
 * Brand colors as raw hex — the single source for contexts that CANNOT read CSS
 * custom properties: edge-rendered OG / icon images (`next/og`), Recharts series
 * colors, etc. For normal UI, use the CSS tokens (`--primary`, `--p-honey`,
 * Tailwind `primary`) instead — this constant exists only so a rebrand is one
 * edit instead of ~10.
 *
 * Keep in sync with `--primary` (light) / the gold accent in globals.css.
 */
export const BRAND_PRIMARY = "#73533E" // espresso brown (light --primary)
export const BRAND_GOLD = "#E0B865" // honey-gold accent
export const BRAND_GRADIENT = `linear-gradient(135deg, ${BRAND_PRIMARY}, ${BRAND_GOLD})`
