/* Deterministic mock data for the VISION prototype (no Math.random → SSR-safe). */

function series(len: number, start: number, end: number, amp: number, freq: number, phase: number) {
  return Array.from({ length: len }, (_, i) => {
    const t = i / (len - 1)
    const trend = start + (end - start) * t
    const wave = Math.sin(t * Math.PI * 2 * freq + phase) * amp
    const wobble = Math.sin(t * Math.PI * 2 * freq * 3.7 + phase * 1.3) * amp * 0.35
    return Math.max(1, Math.round(trend + wave + wobble))
  })
}

/* ── Card detail ────────────────────────────────────────────────────────── */
export const CARD = {
  name: "Monkey D. Luffy",
  sub: "Leader · Parallel",
  set: "OP01 · Romance Dawn",
  code: "OP01-120",
  rarity: "SEC",
  // a clean foil-ish artwork stand-in
  art: "https://images.unsplash.com/photo-1593085512500-5d55148d6f0d?w=480&q=80",
}

export type Tier = {
  key: string
  label: string
  kind: "raw" | "psa"
  price: number // in THB for hero
  display: string
  pct: number
  series: number[]
}

const JP: Tier[] = [
  { key: "rawc", label: "Raw C", kind: "raw", price: 4200, display: "฿4,200", pct: 2.1, series: series(60, 3600, 4200, 220, 2, 0.4) },
  { key: "rawb", label: "Raw B", kind: "raw", price: 6800, display: "฿6,800", pct: 3.4, series: series(60, 5600, 6800, 320, 2.2, 1) },
  { key: "rawa", label: "Raw A", kind: "raw", price: 9500, display: "฿9,500", pct: 5.2, series: series(60, 7800, 9500, 480, 1.8, 0.2) },
  { key: "psa8", label: "PSA 8", kind: "psa", price: 14000, display: "฿14,000", pct: -1.4, series: series(60, 15200, 14000, 700, 2.4, 2) },
  { key: "psa9", label: "PSA 9", kind: "psa", price: 22500, display: "฿22,500", pct: 6.8, series: series(60, 18000, 22500, 1100, 1.6, 0.8) },
  { key: "psa10", label: "PSA 10", kind: "psa", price: 48000, display: "฿48,000", pct: 12.3, series: series(60, 36000, 48000, 2600, 1.4, 0.1) },
]

const EN: Tier[] = [
  { key: "rawc", label: "Raw C", kind: "raw", price: 3100, display: "$86", pct: 1.2, series: series(60, 2700, 3100, 180, 2, 0.6) },
  { key: "rawb", label: "Raw B", kind: "raw", price: 5200, display: "$144", pct: 2.6, series: series(60, 4400, 5200, 260, 2.1, 1.2) },
  { key: "rawa", label: "Raw A", kind: "raw", price: 7400, display: "$205", pct: 4.1, series: series(60, 6200, 7400, 360, 1.9, 0.3) },
  { key: "psa8", label: "PSA 8", kind: "psa", price: 11500, display: "$319", pct: 0.6, series: series(60, 11000, 11500, 540, 2.3, 1.8) },
  { key: "psa9", label: "PSA 9", kind: "psa", price: 18800, display: "$521", pct: 5.4, series: series(60, 15600, 18800, 900, 1.7, 0.9) },
  { key: "psa10", label: "PSA 10", kind: "psa", price: 41000, display: "$1,138", pct: 9.7, series: series(60, 32000, 41000, 2200, 1.5, 0.2) },
]

export const TIERS: Record<"JP" | "EN", Tier[]> = { JP, EN }

export const COMPS = [
  { source: "SNKRDUNK", grade: "PSA 10", price: "฿47,500", when: "2 ชม.", up: true },
  { source: "eBay", grade: "PSA 10", price: "$1,150", when: "5 ชม.", up: true },
  { source: "SNKRDUNK", grade: "PSA 9", price: "฿22,800", when: "1 วัน", up: true },
  { source: "Yuyutei", grade: "Raw A", price: "฿9,400", when: "1 วัน", up: false },
  { source: "eBay", grade: "PSA 10", price: "$1,090", when: "2 วัน", up: false },
  { source: "SNKRDUNK", grade: "PSA 10", price: "฿46,900", when: "3 วัน", up: true },
]

export const LISTINGS = [
  { seller: "GrandLineTCG", rating: 4.9, sales: 1240, grade: "PSA 10", price: 48500, ship: 80, verified: true },
  { seller: "card_oji", rating: 4.8, sales: 612, grade: "PSA 9", price: 23200, ship: 60, verified: true },
  { seller: "thaiopcg", rating: 4.7, sales: 318, grade: "Raw A", price: 9300, ship: 50, verified: false },
]

/* ── Portfolio ──────────────────────────────────────────────────────────── */
export const PF_SERIES: Record<string, number[]> = {
  "1D": series(24, 247000, 251420, 900, 3, 0.5),
  "1W": series(28, 238000, 251420, 1800, 2.2, 1),
  "1M": series(30, 226000, 251420, 3200, 2, 0.3),
  "3M": series(40, 198000, 251420, 5200, 1.8, 0.8),
  "1Y": series(52, 142000, 251420, 9000, 2.6, 0.2),
  ALL: series(60, 88000, 251420, 12000, 1.6, 0.4),
}

export const PF = {
  total: 251420,
  // delta per range: [amount, pct]
  delta: { "1D": [4420, 1.79], "1W": [13420, 5.64], "1M": [25420, 11.25], "3M": [53420, 26.99], "1Y": [109420, 77.05], ALL: [163420, 185.7] } as Record<string, [number, number]>,
  costBasis: 168900,
  pl: 82520,
  roi: 48.9,
}

export const MOVERS = [
  { name: "Monkey D. Luffy", code: "OP01-120", grade: "PSA 10", val: "฿48,000", pct: 12.3, series: series(20, 36000, 48000, 1400, 1.4, 0.1) },
  { name: "Yamato", code: "OP09-118", grade: "Raw A", val: "฿7,800", pct: 8.1, series: series(20, 6900, 7800, 280, 1.8, 0.5) },
  { name: "Trafalgar Law", code: "OP05-119", grade: "PSA 9", val: "฿16,400", pct: -3.2, series: series(20, 17200, 16400, 420, 2.2, 1) },
]

export const HOLDINGS = [
  { name: "Monkey D. Luffy", code: "OP01-120", grade: "PSA 10", qty: 1, val: 48000, pct: 12.3 },
  { name: "Shanks", code: "OP01-121", grade: "PSA 10", qty: 1, val: 52000, pct: 4.6 },
  { name: "Boa Hancock", code: "OP02-116", grade: "PSA 9", qty: 2, val: 38000, pct: 6.2 },
  { name: "Trafalgar Law", code: "OP05-119", grade: "PSA 9", qty: 1, val: 16400, pct: -3.2 },
  { name: "Yamato", code: "OP09-118", grade: "Raw A", qty: 3, val: 23400, pct: 8.1 },
  { name: "Portgas D. Ace", code: "OP02-013", grade: "Raw A", qty: 4, val: 18600, pct: 1.1 },
]
