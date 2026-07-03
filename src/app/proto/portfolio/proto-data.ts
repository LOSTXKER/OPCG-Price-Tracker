/**
 * Shared mock data for the /proto/portfolio/* prototypes — REAL OPCG cards
 * (live R2 images) + Pokémon cards (pokemontcg.io) so the protos sell the
 * "cards are the hero" story with actual art. Prices in THB. Deterministic —
 * no Date/random — so every proto renders identically.
 */

export type ProtoHolding = {
  code: string
  name: string
  rarity: string
  img: string
  game: "opcg" | "pokemon"
  qty: number
  /** Cost basis per copy (THB). */
  costThb: number
  /** Current price per copy (THB). */
  priceThb: number
  d24: number
  d7: number
}

export const HOLDINGS: ProtoHolding[] = [
  { code: "OP13-118", name: "Monkey.D.Luffy", rarity: "P-SEC", img: "https://pub-e1c871a889eb42a4bd7dcdc3a5926f3c.r2.dev/op13/OP13-118_p3.png", game: "opcg", qty: 1, costThb: 216000, priceThb: 294400, d24: -8.32, d7: -0.14 },
  { code: "OP05-119", name: "Monkey.D.Luffy", rarity: "SP", img: "https://pub-e1c871a889eb42a4bd7dcdc3a5926f3c.r2.dev/op05/OP05-119_p7.png", game: "opcg", qty: 1, costThb: 148000, priceThb: 229540, d24: 0.06, d7: 26.79 },
  { code: "OP09-118", name: "Gol.D.Roger", rarity: "P-SEC", img: "https://pub-e1c871a889eb42a4bd7dcdc3a5926f3c.r2.dev/op09/OP09-118_p2.png", game: "opcg", qty: 1, costThb: 98000, priceThb: 137540, d24: 6.71, d7: 41.74 },
  { code: "OP13-119", name: "Portgas.D.Ace", rarity: "P-SEC", img: "https://pub-e1c871a889eb42a4bd7dcdc3a5926f3c.r2.dev/op13/OP13-119_p3.png", game: "opcg", qty: 2, costThb: 132000, priceThb: 114540, d24: 5.87, d7: -12.77 },
  { code: "ST01-012", name: "Monkey.D.Luffy", rarity: "P-SR", img: "https://pub-e1c871a889eb42a4bd7dcdc3a5926f3c.r2.dev/st01/ST01-012_p3.png", game: "opcg", qty: 1, costThb: 74000, priceThb: 114540, d24: 14.85, d7: 38.83 },
  { code: "OP13-120", name: "Sabo", rarity: "P-SEC", img: "https://pub-e1c871a889eb42a4bd7dcdc3a5926f3c.r2.dev/op13/OP13-120_p3.png", game: "opcg", qty: 1, costThb: 118000, priceThb: 91540, d24: -20.27, d7: -17.51 },
  { code: "EB02-061", name: "Monkey.D.Luffy", rarity: "SP", img: "https://pub-e1c871a889eb42a4bd7dcdc3a5926f3c.r2.dev/eb02/EB02-061_p3.png", game: "opcg", qty: 1, costThb: 45200, priceThb: 68540, d24: 3.87, d7: 23.29 },
  { code: "SV3.5-006", name: "Charizard ex", rarity: "SAR", img: "https://images.pokemontcg.io/sv3pt5/6_hires.png", game: "pokemon", qty: 2, costThb: 5200, priceThb: 7770, d24: 3.2, d7: 8.4 },
  { code: "SV3.5-025", name: "Pikachu", rarity: "AR", img: "https://images.pokemontcg.io/sv3pt5/25_hires.png", game: "pokemon", qty: 1, costThb: 1090, priceThb: 1449, d24: -1.1, d7: 2.0 },
  { code: "SV3.5-151", name: "Mew ex", rarity: "SAR", img: "https://images.pokemontcg.io/sv3pt5/151_hires.png", game: "pokemon", qty: 4, costThb: 590, priceThb: 1050, d24: 0.5, d7: -0.8 },
]

export const TOTALS = (() => {
  let value = 0
  let cost = 0
  for (const h of HOLDINGS) {
    value += h.priceThb * h.qty
    cost += h.costThb * h.qty
  }
  const pnl = value - cost
  return { value, cost, pnl, pnlPct: (pnl / cost) * 100 }
})()

export const GAMES = (["opcg", "pokemon"] as const).map((g) => {
  const rows = HOLDINGS.filter((h) => h.game === g)
  const value = rows.reduce((s, h) => s + h.priceThb * h.qty, 0)
  const cost = rows.reduce((s, h) => s + h.costThb * h.qty, 0)
  return {
    slug: g,
    name: g === "opcg" ? "One Piece" : "Pokémon",
    short: g === "opcg" ? "OPCG" : "Pokémon",
    tint: g === "opcg" ? "var(--primary)" : "#F2C744",
    count: rows.reduce((s, h) => s + h.qty, 0),
    value,
    pnlPct: ((value - cost) / cost) * 100,
    share: value / TOTALS.value,
  }
})

/** 30-day value history (THB) — gentle climb, a dip, then the current runup. */
export const HISTORY: number[] = [
  818000, 821500, 819800, 826400, 831900, 830200, 838700, 845100, 842600, 851300,
  860900, 858200, 849700, 838400, 829800, 835600, 846900, 855400, 862800, 871500,
  868900, 878300, 889600, 897200, 905800, 914400, 921700, 918300, 927600, TOTALS.value,
]

export const fmt = (n: number) => `${Math.round(n).toLocaleString("th-TH")} ฿`
export const fmtPct = (n: number) => `${n >= 0 ? "+" : ""}${n.toFixed(1)}%`
