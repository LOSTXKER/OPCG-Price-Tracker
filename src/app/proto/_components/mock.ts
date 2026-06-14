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

/* ── Browse / Home cards ────────────────────────────────────────────────── */
export type BrowseCard = {
  name: string
  code: string
  set: string
  rarity: string
  price: number
  pct: number
  series: number[]
  grad: string // foil gradient
}

export const CARDS: BrowseCard[] = [
  { name: "Monkey D. Luffy", code: "OP01-120", set: "OP01", rarity: "SEC", price: 48000, pct: 12.3, series: series(20, 36000, 48000, 1400, 1.4, 0.1), grad: "linear-gradient(150deg,#241808,#6d4f23,#e9b970)" },
  { name: "Shanks", code: "OP01-121", set: "OP01", rarity: "SEC", price: 52000, pct: 4.6, series: series(20, 48000, 52000, 900, 1.8, 0.5), grad: "linear-gradient(150deg,#2a0e0e,#7a2a2a,#e98a70)" },
  { name: "Boa Hancock", code: "OP02-116", set: "OP02", rarity: "SR", price: 19000, pct: 6.2, series: series(20, 16800, 19000, 600, 2, 0.9), grad: "linear-gradient(150deg,#2a0e22,#7a2a5a,#e970b8)" },
  { name: "Trafalgar Law", code: "OP05-119", set: "OP05", rarity: "SEC", price: 16400, pct: -3.2, series: series(20, 17200, 16400, 420, 2.2, 1), grad: "linear-gradient(150deg,#0e1a2a,#2a4a7a,#70b0e9)" },
  { name: "Yamato", code: "OP09-118", set: "OP09", rarity: "SR", price: 7800, pct: 8.1, series: series(20, 6900, 7800, 280, 1.8, 0.5), grad: "linear-gradient(150deg,#1a1408,#5a4818,#e9c870)" },
  { name: "Roronoa Zoro", code: "OP01-025", set: "OP01", rarity: "SR", price: 9200, pct: 2.4, series: series(20, 8600, 9200, 220, 2, 0.3), grad: "linear-gradient(150deg,#0e2014,#1a5a3a,#70e9a0)" },
  { name: "Nico Robin", code: "OP03-079", set: "OP03", rarity: "SR", price: 5400, pct: -1.1, series: series(20, 5600, 5400, 160, 2.1, 1.4), grad: "linear-gradient(150deg,#1a0e2a,#4a2a7a,#a070e9)" },
  { name: "Sanji", code: "OP01-051", set: "OP01", rarity: "SR", price: 6100, pct: 3.8, series: series(20, 5500, 6100, 200, 1.9, 0.7), grad: "linear-gradient(150deg,#2a1a08,#7a5018,#e9b870)" },
]

/* ── Marketplace listings ───────────────────────────────────────────────── */
export type MktListing = {
  name: string
  code: string
  grade: string
  edition: "JP" | "EN"
  price: number
  seller: string
  rating: number
  verified: boolean
  featured?: boolean
  grad: string
}

export const MKT: MktListing[] = [
  { name: "Shanks", code: "OP01-121", grade: "PSA 10", edition: "JP", price: 52000, seller: "GrandLineTCG", rating: 4.9, verified: true, featured: true, grad: "linear-gradient(150deg,#2a0e0e,#7a2a2a,#e98a70)" },
  { name: "Monkey D. Luffy", code: "OP01-120", grade: "PSA 9", edition: "JP", price: 23200, seller: "card_oji", rating: 4.8, verified: true, grad: "linear-gradient(150deg,#241808,#6d4f23,#e9b970)" },
  { name: "Boa Hancock", code: "OP02-116", grade: "Raw A", edition: "EN", price: 9300, seller: "thaiopcg", rating: 4.7, verified: false, grad: "linear-gradient(150deg,#2a0e22,#7a2a5a,#e970b8)" },
  { name: "Yamato", code: "OP09-118", grade: "PSA 10", edition: "JP", price: 28400, seller: "wano_cards", rating: 5.0, verified: true, grad: "linear-gradient(150deg,#1a1408,#5a4818,#e9c870)" },
  { name: "Trafalgar Law", code: "OP05-119", grade: "PSA 9", edition: "EN", price: 15800, seller: "heartpirates", rating: 4.6, verified: true, grad: "linear-gradient(150deg,#0e1a2a,#2a4a7a,#70b0e9)" },
  { name: "Roronoa Zoro", code: "OP01-025", grade: "Raw A", edition: "JP", price: 9100, seller: "santoryu", rating: 4.9, verified: true, grad: "linear-gradient(150deg,#0e2014,#1a5a3a,#70e9a0)" },
]

/* ── Market screener rows (the REAL home = sortable table) ──────────────── */
export type MarketRow = {
  rank: number
  name: string
  code: string
  set: string
  rarity: string
  price: number
  c24: number
  c7: number
  c30: number
  views: number
  series: number[]
  grad: string
}

export const MARKET: MarketRow[] = [
  { rank: 1, name: "Shanks", code: "OP01-121", set: "OP01", rarity: "SEC", price: 52000, c24: 1.2, c7: 3.8, c30: 4.6, views: 48200, series: series(16, 48000, 52000, 700, 1.8, 0.5), grad: "linear-gradient(150deg,#2a0e0e,#7a2a2a,#e98a70)" },
  { rank: 2, name: "Monkey D. Luffy", code: "OP01-120", set: "OP01", rarity: "SEC", price: 48000, c24: 2.4, c7: 8.1, c30: 12.3, views: 61400, series: series(16, 36000, 48000, 1200, 1.4, 0.1), grad: "linear-gradient(150deg,#241808,#6d4f23,#e9b970)" },
  { rank: 3, name: "Yamato", code: "OP09-118", set: "OP09", rarity: "SR", price: 28400, c24: 1.1, c7: 5.2, c30: 8.1, views: 33900, series: series(16, 24000, 28400, 600, 1.8, 0.5), grad: "linear-gradient(150deg,#1a1408,#5a4818,#e9c870)" },
  { rank: 4, name: "Boa Hancock", code: "OP02-116", set: "OP02", rarity: "SR", price: 19000, c24: -0.8, c7: 2.4, c30: 6.2, views: 41200, series: series(16, 16800, 19000, 500, 2, 0.9), grad: "linear-gradient(150deg,#2a0e22,#7a2a5a,#e970b8)" },
  { rank: 5, name: "Trafalgar Law", code: "OP05-119", set: "OP05", rarity: "SEC", price: 16400, c24: -1.4, c7: -3.2, c30: -3.2, views: 28700, series: series(16, 17200, 16400, 380, 2.2, 1), grad: "linear-gradient(150deg,#0e1a2a,#2a4a7a,#70b0e9)" },
  { rank: 6, name: "Roronoa Zoro", code: "OP01-025", set: "OP01", rarity: "SR", price: 9200, c24: 0.6, c7: 1.8, c30: 2.4, views: 52100, series: series(16, 8600, 9200, 200, 2, 0.3), grad: "linear-gradient(150deg,#0e2014,#1a5a3a,#70e9a0)" },
  { rank: 7, name: "Sanji", code: "OP01-051", set: "OP01", rarity: "SR", price: 6100, c24: 1.9, c7: 3.0, c30: 3.8, views: 30500, series: series(16, 5500, 6100, 180, 1.9, 0.7), grad: "linear-gradient(150deg,#2a1a08,#7a5018,#e9b870)" },
  { rank: 8, name: "Nico Robin", code: "OP03-079", set: "OP03", rarity: "SR", price: 5400, c24: -0.4, c7: -0.9, c30: -1.1, views: 22800, series: series(16, 5600, 5400, 150, 2.1, 1.4), grad: "linear-gradient(150deg,#1a0e2a,#4a2a7a,#a070e9)" },
  { rank: 9, name: "Portgas D. Ace", code: "OP02-013", set: "OP02", rarity: "SR", price: 4650, c24: 0.3, c7: 0.8, c30: 1.1, views: 19400, series: series(16, 4500, 4650, 120, 2, 0.2), grad: "linear-gradient(150deg,#2a1208,#7a3818,#e97a40)" },
  { rank: 10, name: "Eustass Kid", code: "OP05-060", set: "OP05", rarity: "SR", price: 3900, c24: 4.2, c7: 6.6, c30: 9.4, views: 17600, series: series(16, 3400, 3900, 140, 1.6, 0.8), grad: "linear-gradient(150deg,#2a0808,#7a1818,#e94040)" },
]

/* ── Portfolio transactions (real portfolio has a transactions list) ────── */
export type Txn = { type: "buy" | "sell"; name: string; code: string; qty: number; price: number; date: string }
export const TXNS: Txn[] = [
  { type: "buy", name: "Shanks", code: "OP01-121", qty: 1, price: 49800, date: "14 มิ.ย." },
  { type: "sell", name: "Nami", code: "OP01-016", qty: 2, price: 3200, date: "12 มิ.ย." },
  { type: "buy", name: "Yamato", code: "OP09-118", qty: 3, price: 7600, date: "9 มิ.ย." },
  { type: "buy", name: "Boa Hancock", code: "OP02-116", qty: 2, price: 18200, date: "5 มิ.ย." },
]

/* ── Card specs + multi-source strip (real card-detail) ─────────────────── */
export const SPECS: { label: string; value: string }[] = [
  { label: "Cost", value: "—" },
  { label: "Power", value: "5000" },
  { label: "Counter", value: "—" },
  { label: "Life", value: "5" },
  { label: "Color", value: "แดง" },
  { label: "Type", value: "Leader" },
  { label: "Attribute", value: "Slash" },
  { label: "Trait", value: "Straw Hat Crew / Supernovas" },
]
export const EFFECT =
  "[DON!! x1] [เมื่อโจมตี] เปิดการ์ดบนสุดของกอง ถ้าเป็นการ์ดตัวละคร ค่า Cost 5 ขึ้นไป เพิ่มลงมือ +1000 พลังจนจบเทิร์น"

export const SOURCES = [
  { source: "Yuyutei", ask: "฿9,500", sold: "฿9,200", updated: "2 ชม." },
  { source: "SNKRDUNK", ask: "$268", sold: "$255", updated: "5 ชม." },
  { source: "eBay (EN)", ask: "$205", sold: "$188", updated: "1 วัน" },
]
