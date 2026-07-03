/**
 * Shared mock data for the /proto/ios/* showcase — one deterministic dataset
 * (real card art from R2/pokemontcg.io, no Date/random) reused across all 6
 * screens so numbers reconcile with each other (e.g. the portfolio hub total
 * matches the sum of its holdings). Display-only; nothing here touches the DB.
 */

export type ProtoCard = {
  code: string
  name: string
  rarity: string
  img: string
  game: "opcg" | "pokemon"
  setName: string
  priceThb: number
  d24: number
  d7: number
}

export const CATALOG: ProtoCard[] = [
  { code: "OP01-001", name: "Roronoa Zoro", rarity: "L", img: "https://pub-e1c871a889eb42a4bd7dcdc3a5926f3c.r2.dev/op01/OP01-001_p1.png", game: "opcg", setName: "OP01 Romance Dawn", priceThb: 890, d24: 5.4, d7: 12.1 },
  { code: "OP13-118", name: "Monkey.D.Luffy", rarity: "P-SEC", img: "https://pub-e1c871a889eb42a4bd7dcdc3a5926f3c.r2.dev/op13/OP13-118_p3.png", game: "opcg", setName: "OP13", priceThb: 294400, d24: -8.32, d7: -0.14 },
  { code: "OP05-119", name: "Monkey.D.Luffy", rarity: "SP", img: "https://pub-e1c871a889eb42a4bd7dcdc3a5926f3c.r2.dev/op05/OP05-119_p7.png", game: "opcg", setName: "OP05 Awakening of the New Era", priceThb: 229540, d24: 0.06, d7: 26.79 },
  { code: "OP09-118", name: "Gol.D.Roger", rarity: "P-SEC", img: "https://pub-e1c871a889eb42a4bd7dcdc3a5926f3c.r2.dev/op09/OP09-118_p2.png", game: "opcg", setName: "OP09 Emperors in the New World", priceThb: 137540, d24: 6.71, d7: 41.74 },
  { code: "OP13-119", name: "Portgas.D.Ace", rarity: "P-SEC", img: "https://pub-e1c871a889eb42a4bd7dcdc3a5926f3c.r2.dev/op13/OP13-119_p3.png", game: "opcg", setName: "OP13", priceThb: 114540, d24: 5.87, d7: -12.77 },
  { code: "ST01-012", name: "Monkey.D.Luffy", rarity: "P-SR", img: "https://pub-e1c871a889eb42a4bd7dcdc3a5926f3c.r2.dev/st01/ST01-012_p3.png", game: "opcg", setName: "ST01 Straw Hat Crew", priceThb: 114540, d24: 14.85, d7: 38.83 },
  { code: "OP13-120", name: "Sabo", rarity: "P-SEC", img: "https://pub-e1c871a889eb42a4bd7dcdc3a5926f3c.r2.dev/op13/OP13-120_p3.png", game: "opcg", setName: "OP13", priceThb: 91540, d24: -20.27, d7: -17.51 },
  { code: "EB02-061", name: "Monkey.D.Luffy", rarity: "SP", img: "https://pub-e1c871a889eb42a4bd7dcdc3a5926f3c.r2.dev/eb02/EB02-061_p3.png", game: "opcg", setName: "EB02 Anime 25th Collection", priceThb: 68540, d24: 3.87, d7: 23.29 },
  { code: "SV3.5-006", name: "Charizard ex", rarity: "SAR", img: "https://images.pokemontcg.io/sv3pt5/6_hires.png", game: "pokemon", setName: "151", priceThb: 7770, d24: 3.2, d7: 8.4 },
  { code: "SV3.5-025", name: "Pikachu", rarity: "AR", img: "https://images.pokemontcg.io/sv3pt5/25_hires.png", game: "pokemon", setName: "151", priceThb: 1449, d24: -1.1, d7: 2.0 },
  { code: "SV3.5-151", name: "Mew ex", rarity: "SAR", img: "https://images.pokemontcg.io/sv3pt5/151_hires.png", game: "pokemon", setName: "151", priceThb: 1050, d24: 0.5, d7: -0.8 },
]

export const fmt = (n: number) => `${Math.round(n).toLocaleString("th-TH")} ฿`
export const fmtPct = (n: number) => `${n >= 0 ? "+" : ""}${n.toFixed(1)}%`
export const cardByCode = (code: string) => CATALOG.find((c) => c.code === code) ?? CATALOG[0]

// ---------------------------------------------------------------------------
// Portfolio — two portfolios so the hub grid has something to pick between.
// ---------------------------------------------------------------------------

export type ProtoHolding = {
  card: ProtoCard
  qty: number
  costThb: number
}

export type ProtoPortfolio = {
  id: number
  name: string
  isPublic: boolean
  holdings: ProtoHolding[]
}

export const PORTFOLIOS: ProtoPortfolio[] = [
  {
    id: 1,
    name: "คอลเลกชันหลัก",
    isPublic: true,
    holdings: [
      { card: CATALOG[1], qty: 1, costThb: 216000 },
      { card: CATALOG[2], qty: 1, costThb: 148000 },
      { card: CATALOG[3], qty: 1, costThb: 98000 },
      { card: CATALOG[4], qty: 2, costThb: 132000 },
      { card: CATALOG[5], qty: 1, costThb: 74000 },
    ],
  },
  {
    id: 2,
    name: "Pokémon",
    isPublic: false,
    holdings: [
      { card: CATALOG[8], qty: 2, costThb: 5200 },
      { card: CATALOG[9], qty: 1, costThb: 1090 },
      { card: CATALOG[10], qty: 4, costThb: 590 },
    ],
  },
]

function portfolioStats(p: ProtoPortfolio) {
  const value = p.holdings.reduce((s, h) => s + h.card.priceThb * h.qty, 0)
  const cost = p.holdings.reduce((s, h) => s + h.costThb * h.qty, 0)
  const count = p.holdings.reduce((s, h) => s + h.qty, 0)
  return { value, cost, pnl: value - cost, pnlPct: cost > 0 ? ((value - cost) / cost) * 100 : 0, count }
}

export const PORTFOLIO_STATS = new Map(PORTFOLIOS.map((p) => [p.id, portfolioStats(p)]))
export const portfolioById = (id: number) => PORTFOLIOS.find((p) => p.id === id) ?? PORTFOLIOS[0]

export const TOTAL_VALUE = PORTFOLIOS.reduce((s, p) => s + PORTFOLIO_STATS.get(p.id)!.value, 0)
export const TOTAL_COST = PORTFOLIOS.reduce((s, p) => s + PORTFOLIO_STATS.get(p.id)!.cost, 0)
export const TOTAL_PNL_PCT = ((TOTAL_VALUE - TOTAL_COST) / TOTAL_COST) * 100

/** 30-day value history (THB) for the portfolio detail scrub chart — gentle
 *  climb, a dip, then the current runup. Deterministic, ends at TOTAL_VALUE. */
export const HISTORY: number[] = [
  818000, 821500, 819800, 826400, 831900, 830200, 838700, 845100, 842600, 851300,
  860900, 858200, 849700, 838400, 829800, 835600, 846900, 855400, 862800, 871500,
  868900, 878300, 889600, 897200, 905800, 914400, 921700, 918300, 927600,
]
HISTORY.push(PORTFOLIO_STATS.get(1)!.value)

// ---------------------------------------------------------------------------
// Watchlist
// ---------------------------------------------------------------------------

export const WATCHLIST = [
  { card: CATALOG[0], pinned: true, alert: true },
  { card: CATALOG[6], pinned: false, alert: false },
  { card: CATALOG[7], pinned: false, alert: true },
  { card: CATALOG[8], pinned: true, alert: false },
]

// ---------------------------------------------------------------------------
// Card detail — one focused deep dataset (Roronoa Zoro, OP01-001, per
// DESIGN.md's own reference sample) with grades, sources, and history.
// ---------------------------------------------------------------------------

export const CARD_DETAIL = {
  ...CATALOG[0],
  setCode: "OP01",
  cost: 3,
  power: 5000,
  counter: 2000,
  color: "แดง",
  type: "Leader",
  attribute: "Slash",
  effect: "[DON!! x1] คู่ต่อสู้ Power -2000 ในระหว่างเทิร์นนี้",
  grades: [
    { key: "raw", label: "Raw", priceThb: 890, source: "Yuyu-tei" },
    { key: "psa10", label: "PSA 10", priceThb: 6800, source: "SNKRDUNK" },
    { key: "psa9", label: "PSA 9", priceThb: 3200, source: "SNKRDUNK" },
    { key: "bgs95", label: "BGS 9.5", priceThb: 3900, source: "SNKRDUNK" },
  ],
  rangeLow: 720,
  rangeHigh: 1180,
  history: [640, 655, 648, 672, 690, 705, 698, 712, 730, 725, 745, 760, 758, 772, 790, 805, 798, 812, 830, 845, 838, 852, 861, 870, 865, 878, 882, 875, 884, 890],
  sales: [
    { label: "ขายล่าสุด", source: "Yuyu-tei", grade: "Raw", priceThb: 890, when: "2 ชม.ที่แล้ว", type: "sold" as const },
    { label: "ตั้งขายต่ำสุด", source: "SNKRDUNK", grade: "PSA 10", priceThb: 6800, when: "อัปเดตวันนี้", type: "listed" as const },
    { label: "ขายแล้ว", source: "Yuyu-tei", grade: "Raw", priceThb: 850, when: "เมื่อวาน", type: "sold" as const },
    { label: "ขายแล้ว", source: "SNKRDUNK", grade: "PSA 9", priceThb: 3150, when: "3 วันก่อน", type: "sold" as const },
  ],
  related: [CATALOG[1], CATALOG[4], CATALOG[5], CATALOG[6]],
}

// ---------------------------------------------------------------------------
// More / settings — grouped-inset sections
// ---------------------------------------------------------------------------

export const USER = { name: "เบส", tier: "Free · มือใหม่", avatarInitial: "บ" }
