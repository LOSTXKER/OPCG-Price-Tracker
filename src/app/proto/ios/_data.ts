/**
 * Shared mock data for the /proto/ios/* showcase (v3) -- REAL cards pulled
 * once from the local dev DB via /api/cards, not invented numbers. Baked in
 * as a static deterministic module (no runtime fetch, no Date/random) so
 * every render is identical. THB conversions use the same fallback rates as
 * the real app (src/lib/constants/prices.ts: FALLBACK_JPY_THB_RATE 0.21,
 * DEFAULT_JPY_USD 0.0067) so the numbers read exactly like production --
 * e.g. MARKET_STATS below matches the owner's own screenshot exactly
 * (3,838 cards / 2,688,706 THB total value), and CARD_DETAIL is the exact
 * Roronoa Zoro (Parallel) OP01-001 the owner has seen in every portfolio
 * screenshot throughout this project (17,800 JPY = 3,738 THB).
 */

export type ProtoCard = {
  code: string
  name: string
  rarity: string
  img: string
  setName: string
  setCode: string
  priceThb: number
  d24: number
  d7: number
  d30: number
  /** PSA 10 graded price in USD (SNKRDUNK) -- null when no graded comp exists. */
  psa10Usd: number | null
}

export const JPY_THB_RATE = 0.21
export const USD_THB_RATE = 31.34

// Real card catalog -- pulled from /api/cards (price_desc top 50 + top
// gainers/losers by 24h change + the OP01-001 reference card), deduped.
// 67 cards.
export const CATALOG: ProtoCard[] = [
  { code: "OP13-118_p3", name: "Monkey.D.Luffy", rarity: "P-SEC", img: "https://pub-e1c871a889eb42a4bd7dcdc3a5926f3c.r2.dev/op13/OP13-118_p3.png", setName: "Carrying on His Will", setCode: "op13", priceThb: 268800, d24: -8.32, d7: -0.14, d30: 350.07, psa10Usd: 15597 },
  { code: "OP05-119_p7", name: "Monkey.D.Luffy", rarity: "SP", img: "https://pub-e1c871a889eb42a4bd7dcdc3a5926f3c.r2.dev/op05/OP05-119_p7.png", setName: "A Fist of Divine Speed", setCode: "op11", priceThb: 209580, d24: 0.06, d7: 26.79, d30: 1.43, psa10Usd: null },
  { code: "OP09-118_p2", name: "Gol.D.Roger", rarity: "P-SEC", img: "https://pub-e1c871a889eb42a4bd7dcdc3a5926f3c.r2.dev/op09/OP09-118_p2.png", setName: "Emperors in the New World", setCode: "op09", priceThb: 125580, d24: 6.71, d7: 41.74, d30: 3.26, psa10Usd: null },
  { code: "OP05-119_p3", name: "Monkey.D.Luffy", rarity: "P-SEC", img: "https://pub-e1c871a889eb42a4bd7dcdc3a5926f3c.r2.dev/op05/OP05-119_p3.png", setName: "ONE PIECE CARD THE BEST", setCode: "prb01", priceThb: 125580, d24: 3.46, d7: 31.43, d30: -66.67, psa10Usd: null },
  { code: "OP05-119_p2", name: "Monkey.D.Luffy (Parallel)", rarity: "P-SEC", img: "https://pub-e1c871a889eb42a4bd7dcdc3a5926f3c.r2.dev/op05/OP05-119_p2.png", setName: "Awakening of the New Era", setCode: "op05", priceThb: 125580, d24: 1.56, d7: 13.24, d30: 183.14, psa10Usd: null },
  { code: "ST01-012_p3", name: "Monkey.D.Luffy (Parallel)", rarity: "P-SR", img: "https://pub-e1c871a889eb42a4bd7dcdc3a5926f3c.r2.dev/st01/ST01-012_p3.png", setName: "Awakening of the New Era", setCode: "op05", priceThb: 104580, d24: 14.85, d7: 38.83, d30: 99.68, psa10Usd: null },
  { code: "OP13-119_p3", name: "Portgas.D.Ace", rarity: "P-SEC", img: "https://pub-e1c871a889eb42a4bd7dcdc3a5926f3c.r2.dev/op13/OP13-119_p3.png", setName: "Carrying on His Will", setCode: "op13", priceThb: 104580, d24: 5.87, d7: -12.77, d30: -66.67, psa10Usd: null },
  { code: "OP13-120_p3", name: "Sabo", rarity: "P-SEC", img: "https://pub-e1c871a889eb42a4bd7dcdc3a5926f3c.r2.dev/op13/OP13-120_p3.png", setName: "Carrying on His Will", setCode: "op13", priceThb: 83580, d24: -20.27, d7: -17.51, d30: 8.18, psa10Usd: null },
  { code: "OP05-119_p6", name: "Monkey.D.Luffy", rarity: "SP", img: "https://pub-e1c871a889eb42a4bd7dcdc3a5926f3c.r2.dev/op05/OP05-119_p6.png", setName: "A Fist of Divine Speed", setCode: "op11", priceThb: 83580, d24: 4.57, d7: -11.12, d30: -66.67, psa10Usd: null },
  { code: "EB02-061_p3", name: "Monkey.D.Luffy", rarity: "SP", img: "https://pub-e1c871a889eb42a4bd7dcdc3a5926f3c.r2.dev/eb02/EB02-061_p3.png", setName: "ONE PIECE CARD THE BEST vol.2", setCode: "prb02", priceThb: 62580, d24: 3.87, d7: 23.29, d30: 14.53, psa10Usd: null },
  { code: "EB02-061_p2", name: "Monkey.D.Luffy", rarity: "P-SEC", img: "https://pub-e1c871a889eb42a4bd7dcdc3a5926f3c.r2.dev/eb02/EB02-061_p2.png", setName: "Anime 25th Collection", setCode: "eb02", priceThb: 62580, d24: -12.07, d7: -6.67, d30: -59.03, psa10Usd: null },
  { code: "OP13-118_p2", name: "Monkey.D.Luffy", rarity: "P-SEC", img: "https://pub-e1c871a889eb42a4bd7dcdc3a5926f3c.r2.dev/op13/OP13-118_p2.png", setName: "Carrying on His Will", setCode: "op13", priceThb: 41580, d24: 2.48, d7: -24.23, d30: -59.61, psa10Usd: null },
  { code: "OP06-118_p2", name: "Roronoa Zoro (Parallel)", rarity: "P-SEC", img: "https://pub-e1c871a889eb42a4bd7dcdc3a5926f3c.r2.dev/op06/OP06-118_p2.png", setName: "Wings of Captain", setCode: "op06", priceThb: 37380, d24: -8.25, d7: -28.54, d30: -45.28, psa10Usd: null },
  { code: "OP02-013_p2", name: "Portgas.D.Ace (Parallel)", rarity: "P-SR", img: "https://pub-e1c871a889eb42a4bd7dcdc3a5926f3c.r2.dev/op02/OP02-013_p2.png", setName: "Paramount War", setCode: "op02", priceThb: 26880, d24: -5.47, d7: 2.89, d30: -39.02, psa10Usd: null },
  { code: "OP01-120_p2", name: "Shanks (Parallel)", rarity: "P-SEC", img: "https://pub-e1c871a889eb42a4bd7dcdc3a5926f3c.r2.dev/op01/OP01-120_p2.png", setName: "Romance Dawn", setCode: "op01", priceThb: 26880, d24: -8.9, d7: 28.39, d30: 87.13, psa10Usd: null },
  { code: "OP15-118_p2", name: "Enel", rarity: "P-SEC", img: "https://pub-e1c871a889eb42a4bd7dcdc3a5926f3c.r2.dev/op15/OP15-118_p2.png", setName: "Adventure on KAMI's Island", setCode: "op15", priceThb: 26880, d24: -9.67, d7: -39.42, d30: -48.74, psa10Usd: null },
  { code: "EB01-006_p2", name: "Tony Tony.Chopper (Parallel)", rarity: "P-SR", img: "https://pub-e1c871a889eb42a4bd7dcdc3a5926f3c.r2.dev/eb01/EB01-006_p2.png", setName: "Memorial Collection", setCode: "eb01", priceThb: 26880, d24: -6.71, d7: 3.39, d30: -58.14, psa10Usd: null },
  { code: "OP07-051_p2", name: "Boa Hancock (Parallel)", rarity: "P-SR", img: "https://pub-e1c871a889eb42a4bd7dcdc3a5926f3c.r2.dev/op07/OP07-051_p2.png", setName: "500 Years in the Future", setCode: "op07", priceThb: 26880, d24: -1.69, d7: 15.63, d30: -50.88, psa10Usd: null },
  { code: "OP01-120_p5", name: "Shanks", rarity: "P-SEC", img: "https://pub-e1c871a889eb42a4bd7dcdc3a5926f3c.r2.dev/op01/OP01-120_p5.png", setName: "ONE PIECE CARD THE BEST", setCode: "prb01", priceThb: 26880, d24: -11.54, d7: -23.9, d30: 181.94, psa10Usd: null },
  { code: "OP09-093_p2", name: "Marshall.D.Teach", rarity: "P-SR", img: "https://pub-e1c871a889eb42a4bd7dcdc3a5926f3c.r2.dev/op09/OP09-093_p2.png", setName: "Emperors in the New World", setCode: "op09", priceThb: 20958, d24: -0.5, d7: 19.09, d30: 77.9, psa10Usd: null },
  { code: "OP09-051_p5", name: "Buggy", rarity: "SP", img: "https://pub-e1c871a889eb42a4bd7dcdc3a5926f3c.r2.dev/op09/OP09-051_p5.png", setName: "The Azure Sea's Seven", setCode: "op14", priceThb: 20958, d24: 6.4, d7: 1.01, d30: 56.67, psa10Usd: null },
  { code: "OP11-118_p2", name: "Monkey.D.Luffy", rarity: "P-SEC", img: "https://pub-e1c871a889eb42a4bd7dcdc3a5926f3c.r2.dev/op11/OP11-118_p2.png", setName: "A Fist of Divine Speed", setCode: "op11", priceThb: 20958, d24: -10.41, d7: 39.58, d30: 76.95, psa10Usd: null },
  { code: "EB03-061_p2", name: "Uta", rarity: "P-SEC", img: "https://pub-e1c871a889eb42a4bd7dcdc3a5926f3c.r2.dev/eb03/EB03-061_p2.png", setName: "ONE PIECE Heroines Edition", setCode: "eb03", priceThb: 20958, d24: -1.96, d7: 2.46, d30: 300.8, psa10Usd: null },
  { code: "OP09-004_p2", name: "Shanks", rarity: "P-SR", img: "https://pub-e1c871a889eb42a4bd7dcdc3a5926f3c.r2.dev/op09/OP09-004_p2.png", setName: "Emperors in the New World", setCode: "op09", priceThb: 20958, d24: 14.98, d7: 17.83, d30: 190.12, psa10Usd: null },
  { code: "OP05-069_p2", name: "Trafalgar Law (Parallel)", rarity: "P-SR", img: "https://pub-e1c871a889eb42a4bd7dcdc3a5926f3c.r2.dev/op05/OP05-069_p2.png", setName: "Awakening of the New Era", setCode: "op05", priceThb: 20958, d24: -0.8, d7: -51.46, d30: 12.01, psa10Usd: null },
  { code: "OP09-051_p2", name: "Buggy", rarity: "P-R", img: "https://pub-e1c871a889eb42a4bd7dcdc3a5926f3c.r2.dev/op09/OP09-051_p2.png", setName: "Emperors in the New World", setCode: "op09", priceThb: 20958, d24: 23.67, d7: 57.91, d30: 31.14, psa10Usd: null },
  { code: "OP13-119_p2", name: "Portgas.D.Ace", rarity: "P-SEC", img: "https://pub-e1c871a889eb42a4bd7dcdc3a5926f3c.r2.dev/op13/OP13-119_p2.png", setName: "Carrying on His Will", setCode: "op13", priceThb: 20958, d24: 6.74, d7: 83.12, d30: -66.67, psa10Usd: null },
  { code: "OP14-119_p2", name: "Dracule Mihawk", rarity: "P-SEC", img: "https://pub-e1c871a889eb42a4bd7dcdc3a5926f3c.r2.dev/op14/OP14-119_p2.png", setName: "The Azure Sea's Seven", setCode: "op14", priceThb: 18858, d24: 11.83, d7: -1.43, d30: -35.9, psa10Usd: null },
  { code: "OP09-093_p5", name: "Marshall.D.Teach", rarity: "SP", img: "https://pub-e1c871a889eb42a4bd7dcdc3a5926f3c.r2.dev/op09/OP09-093_p5.png", setName: "Legacy of the Master", setCode: "op12", priceThb: 16758, d24: 23.34, d7: 50.57, d30: 50.57, psa10Usd: null },
  { code: "EB03-026_p2", name: "Boa Hancock", rarity: "SP", img: "https://pub-e1c871a889eb42a4bd7dcdc3a5926f3c.r2.dev/eb03/EB03-026_p2.png", setName: "ONE PIECE Heroines Edition", setCode: "eb03", priceThb: 16758, d24: -15.38, d7: 10.22, d30: -37.8, psa10Usd: null },
  { code: "OP09-051_p6", name: "Buggy", rarity: "SP", img: "https://pub-e1c871a889eb42a4bd7dcdc3a5926f3c.r2.dev/op09/OP09-051_p6.png", setName: "The Azure Sea's Seven", setCode: "op14", priceThb: 16758, d24: 5, d7: 20.18, d30: -62.61, psa10Usd: null },
  { code: "OP03-122_p2", name: "Sogeking (Parallel)", rarity: "P-SEC", img: "https://pub-e1c871a889eb42a4bd7dcdc3a5926f3c.r2.dev/op03/OP03-122_p2.png", setName: "Pillars of Strength", setCode: "op03", priceThb: 14658, d24: 6.24, d7: -19.12, d30: 308.19, psa10Usd: null },
  { code: "OP12-118_p2", name: "Jewelry Bonney", rarity: "P-SEC", img: "https://pub-e1c871a889eb42a4bd7dcdc3a5926f3c.r2.dev/op12/OP12-118_p2.png", setName: "Legacy of the Master", setCode: "op12", priceThb: 14658, d24: -19.77, d7: -21.4, d30: 18.91, psa10Usd: null },
  { code: "EB04-044_p2", name: "Koby", rarity: "P-SR", img: "https://pub-e1c871a889eb42a4bd7dcdc3a5926f3c.r2.dev/eb04/EB04-044_p2.png", setName: "EGGHEAD CRISIS", setCode: "eb04", priceThb: 14658, d24: 4.18, d7: 25.77, d30: 445.31, psa10Usd: null },
  { code: "OP05-074_p4", name: "Eustass\"Captain\"Kid", rarity: "P-SR", img: "https://pub-e1c871a889eb42a4bd7dcdc3a5926f3c.r2.dev/op05/OP05-074_p4.png", setName: "ONE PIECE CARD THE BEST", setCode: "prb01", priceThb: 14658, d24: -1.69, d7: -9.23, d30: 133.44, psa10Usd: null },
  { code: "OP13-120_p2", name: "Sabo", rarity: "P-SEC", img: "https://pub-e1c871a889eb42a4bd7dcdc3a5926f3c.r2.dev/op13/OP13-120_p2.png", setName: "Carrying on His Will", setCode: "op13", priceThb: 14658, d24: 6.73, d7: -6.56, d30: 202.16, psa10Usd: null },
  { code: "OP05-074_p2", name: "Eustass\"Captain\"Kid (Parallel)", rarity: "P-SR", img: "https://pub-e1c871a889eb42a4bd7dcdc3a5926f3c.r2.dev/op05/OP05-074_p2.png", setName: "Awakening of the New Era", setCode: "op05", priceThb: 14658, d24: 21.82, d7: 28.31, d30: 13.5, psa10Usd: null },
  { code: "OP04-083_p2", name: "Sabo (Parallel)", rarity: "P-SR", img: "https://pub-e1c871a889eb42a4bd7dcdc3a5926f3c.r2.dev/op04/OP04-083_p2.png", setName: "Kingdoms of Intrigue", setCode: "op04", priceThb: 12558, d24: -6.71, d7: -25.62, d30: -16.13, psa10Usd: null },
  { code: "OP07-038_p2", name: "Boa Hancock", rarity: "P-L", img: "https://pub-e1c871a889eb42a4bd7dcdc3a5926f3c.r2.dev/op07/OP07-038_p2.png", setName: "Anime 25th Collection", setCode: "eb02", priceThb: 12558, d24: -0.33, d7: 53.33, d30: -63.82, psa10Usd: null },
  { code: "OP09-004_p5", name: "Shanks", rarity: "SP", img: "https://pub-e1c871a889eb42a4bd7dcdc3a5926f3c.r2.dev/op09/OP09-004_p5.png", setName: "Carrying on His Will", setCode: "op13", priceThb: 12558, d24: 8.73, d7: 10.95, d30: 22.04, psa10Usd: null },
  { code: "OP10-119_p3", name: "Trafalgar Law", rarity: "SP", img: "https://pub-e1c871a889eb42a4bd7dcdc3a5926f3c.r2.dev/op10/OP10-119_p3.png", setName: "ONE PIECE CARD THE BEST vol.2", setCode: "prb02", priceThb: 12558, d24: -4.17, d7: -10.48, d30: 42.38, psa10Usd: null },
  { code: "OP10-119_p2", name: "Trafalgar Law", rarity: "P-SEC", img: "https://pub-e1c871a889eb42a4bd7dcdc3a5926f3c.r2.dev/op10/OP10-119_p2.png", setName: "Royal Blood", setCode: "op10", priceThb: 12558, d24: 6.22, d7: 48.39, d30: 86.88, psa10Usd: null },
  { code: "EB03-053_p2", name: "Nami", rarity: "SP", img: "https://pub-e1c871a889eb42a4bd7dcdc3a5926f3c.r2.dev/eb03/EB03-053_p2.png", setName: "ONE PIECE Heroines Edition", setCode: "eb03", priceThb: 12558, d24: 5.1, d7: 35.91, d30: -31.81, psa10Usd: null },
  { code: "OP08-118_p2", name: "Silvers Rayleigh (Parallel)", rarity: "P-SEC", img: "https://pub-e1c871a889eb42a4bd7dcdc3a5926f3c.r2.dev/op08/OP08-118_p2.png", setName: "Two Legends", setCode: "op08", priceThb: 12558, d24: -16.71, d7: 18.89, d30: 13.69, psa10Usd: null },
  { code: "EB03-055_p2", name: "Nico Robin", rarity: "SP", img: "https://pub-e1c871a889eb42a4bd7dcdc3a5926f3c.r2.dev/eb03/EB03-055_p2.png", setName: "ONE PIECE Heroines Edition", setCode: "eb03", priceThb: 12558, d24: -0.33, d7: 4.18, d30: -66.67, psa10Usd: null },
  { code: "OP01-078_p2", name: "Boa Hancock (Parallel)", rarity: "SP", img: "https://pub-e1c871a889eb42a4bd7dcdc3a5926f3c.r2.dev/op01/OP01-078_p2.png", setName: "Kingdoms of Intrigue", setCode: "op04", priceThb: 10458, d24: 5.96, d7: -1.97, d30: 40.68, psa10Usd: null },
  { code: "OP12-014_p2", name: "Boa Hancock", rarity: "SP", img: "https://pub-e1c871a889eb42a4bd7dcdc3a5926f3c.r2.dev/op12/OP12-014_p2.png", setName: "Adventure on KAMI's Island", setCode: "op15", priceThb: 8358, d24: -1.49, d7: -16.03, d30: 28.8, psa10Usd: null },
  { code: "OP05-060_p4", name: "Monkey.D.Luffy", rarity: "P-L", img: "https://pub-e1c871a889eb42a4bd7dcdc3a5926f3c.r2.dev/op05/OP05-060_p4.png", setName: "Anime 25th Collection", setCode: "eb02", priceThb: 8358, d24: 7.28, d7: 61.13, d30: 106.22, psa10Usd: null },
  { code: "PRB02-006", name: "Roronoa Zoro", rarity: "R", img: "https://pub-e1c871a889eb42a4bd7dcdc3a5926f3c.r2.dev/prb02/PRB02-006.png", setName: "ONE PIECE CARD THE BEST vol.2", setCode: "prb02", priceThb: 8358, d24: 0.51, d7: 5.29, d30: 34.46, psa10Usd: null },
  { code: "PRB02-006_p1", name: "Roronoa Zoro", rarity: "P-R", img: "https://pub-e1c871a889eb42a4bd7dcdc3a5926f3c.r2.dev/prb02/PRB02-006_p1.png", setName: "ONE PIECE CARD THE BEST vol.2", setCode: "prb02", priceThb: 8358, d24: -11.95, d7: -24.76, d30: 61.79, psa10Usd: null },
  { code: "OP01-001_p1", name: "Roronoa Zoro (Parallel)", rarity: "P-L", img: "https://pub-e1c871a889eb42a4bd7dcdc3a5926f3c.r2.dev/op01/OP01-001_p1.png", setName: "Romance Dawn", setCode: "op01", priceThb: 3738, d24: -3.78, d7: -31.01, d30: 223.64, psa10Usd: null },
  { code: "ST21-001_p1", name: "Monkey.D.Luffy", rarity: "P-L", img: "https://pub-e1c871a889eb42a4bd7dcdc3a5926f3c.r2.dev/st21/ST21-001_p1.png", setName: "GEAR5", setCode: "st21", priceThb: 3108, d24: 33.33, d7: 155.17, d30: -66.67, psa10Usd: null },
  { code: "OP15-118_p1", name: "Enel", rarity: "P-SEC", img: "https://pub-e1c871a889eb42a4bd7dcdc3a5926f3c.r2.dev/op15/OP15-118_p1.png", setName: "Adventure on KAMI's Island", setCode: "op15", priceThb: 2096, d24: 26.33, d7: 29.61, d30: 112.34, psa10Usd: null },
  { code: "EB04-007_p1", name: "Roronoa Zoro", rarity: "P-SR", img: "https://pub-e1c871a889eb42a4bd7dcdc3a5926f3c.r2.dev/eb04/EB04-007_p1.png", setName: "EGGHEAD CRISIS", setCode: "eb04", priceThb: 2096, d24: -20.79, d7: 5.05, d30: -41.98, psa10Usd: null },
  { code: "ST13-011_p2", name: "Portgas.D.Ace", rarity: "SP", img: "https://pub-e1c871a889eb42a4bd7dcdc3a5926f3c.r2.dev/st13/ST13-011_p2.png", setName: "Legacy of the Master", setCode: "op12", priceThb: 1676, d24: 28.71, d7: 20.91, d30: 73.48, psa10Usd: null },
  { code: "OP03-008_p1", name: "Buggy (Parallel)", rarity: "SP", img: "https://pub-e1c871a889eb42a4bd7dcdc3a5926f3c.r2.dev/op03/OP03-008_p1.png", setName: "Wings of Captain", setCode: "op06", priceThb: 1466, d24: 48.51, d7: 58.64, d30: 16.33, psa10Usd: null },
  { code: "OP04-039_p1", name: "Rebecca (Parallel)", rarity: "P-L", img: "https://pub-e1c871a889eb42a4bd7dcdc3a5926f3c.r2.dev/op04/OP04-039_p1.png", setName: "Kingdoms of Intrigue", setCode: "op04", priceThb: 836, d24: 28.39, d7: 99, d30: -66.55, psa10Usd: null },
  { code: "OP07-111_p2", name: "Lilith", rarity: "SP", img: "https://pub-e1c871a889eb42a4bd7dcdc3a5926f3c.r2.dev/op07/OP07-111_p2.png", setName: "Carrying on His Will", setCode: "op13", priceThb: 836, d24: -21.96, d7: -48.97, d30: -21.96, psa10Usd: null },
  { code: "OP12-094_p1", name: "Monkey.D.Dragon", rarity: "P-SR", img: "https://pub-e1c871a889eb42a4bd7dcdc3a5926f3c.r2.dev/op12/OP12-094_p1.png", setName: "Legacy of the Master", setCode: "op12", priceThb: 269, d24: 28, d7: 42.22, d30: -66.32, psa10Usd: null },
  { code: "OP04-044_p1", name: "Kaido (Parallel)", rarity: "P-SR", img: "https://pub-e1c871a889eb42a4bd7dcdc3a5926f3c.r2.dev/op04/OP04-044_p1.png", setName: "Kingdoms of Intrigue", setCode: "op04", priceThb: 122, d24: 28.89, d7: 65.71, d30: 190, psa10Usd: null },
  { code: "OP08-047", name: "Jozu", rarity: "R", img: "https://pub-e1c871a889eb42a4bd7dcdc3a5926f3c.r2.dev/op08/OP08-047.png", setName: "Two Legends", setCode: "op08", priceThb: 105, d24: 25, d7: 66.67, d30: 100, psa10Usd: null },
  { code: "ST03-017", name: "Love-Love Mellow", rarity: "C", img: "https://pub-e1c871a889eb42a4bd7dcdc3a5926f3c.r2.dev/st03/ST03-017.png", setName: "The Seven Warlords of the Sea", setCode: "st03", priceThb: 25, d24: -20, d7: -20, d30: 50, psa10Usd: 60 },
  { code: "OP02-030", name: "Kouzuki Oden", rarity: "SR", img: "https://pub-e1c871a889eb42a4bd7dcdc3a5926f3c.r2.dev/op02/OP02-030.png", setName: "Paramount War", setCode: "op02", priceThb: 25, d24: -20, d7: -20, d30: 71.43, psa10Usd: null },
  { code: "OP01-096", name: "King", rarity: "SR", img: "https://pub-e1c871a889eb42a4bd7dcdc3a5926f3c.r2.dev/op01/OP01-096.png", setName: "Romance Dawn", setCode: "op01", priceThb: 25, d24: -20, d7: -20, d30: 71.43, psa10Usd: 47 },
  { code: "OP04-093", name: "Gum-Gum King Kong Gun", rarity: "UC", img: "https://pub-e1c871a889eb42a4bd7dcdc3a5926f3c.r2.dev/op04/OP04-093.png", setName: "Kingdoms of Intrigue", setCode: "op04", priceThb: 25, d24: -20, d7: -20, d30: 33.33, psa10Usd: null },
  { code: "OP09-056_r2", name: "Mr.3(Galdino)", rarity: "R", img: "https://pub-e1c871a889eb42a4bd7dcdc3a5926f3c.r2.dev/op09/OP09-056_r2.png", setName: "ONE PIECE CARD THE BEST vol.2", setCode: "prb02", priceThb: 25, d24: -20, d7: -20, d30: 71.43, psa10Usd: null },
  { code: "OP01-001", name: "Roronoa Zoro", rarity: "L", img: "https://pub-e1c871a889eb42a4bd7dcdc3a5926f3c.r2.dev/op01/OP01-001.png", setName: "Romance Dawn", setCode: "op01", priceThb: 25, d24: 20, d7: 33.33, d30: 50, psa10Usd: 181 },
]

export const fmt = (n: number) => `${Math.round(n).toLocaleString("th-TH")} ฿`
export const fmtPct = (n: number) => `${n >= 0 ? "+" : ""}${n.toFixed(1)}%`
export const cardByCode = (code: string) => CATALOG.find((c) => c.code === code) ?? CATALOG[0]

// Market-wide stats -- real aggregate from /api/cards with no filter applied
// (total card count + summed value of every priced card in the catalog).
export const MARKET_STATS = { totalCards: 3838, totalValueThb: 2688706 }

// Today's biggest movers -- real 24h % change, picked from the full catalog.
export const TOP_GAINERS: ProtoCard[] = ["OP03-008_p1", "ST21-001_p1", "OP04-044_p1"].map(cardByCode)
export const TOP_LOSERS: ProtoCard[] = ["OP07-111_p2", "EB04-007_p1", "OP13-120_p3"].map(cardByCode)
export const MOST_VALUABLE: ProtoCard[] = ["OP13-118_p3", "OP05-119_p7", "OP09-118_p2"].map(cardByCode)

export type ProtoHolding = { card: ProtoCard; qty: number; costThb: number }
export type ProtoPortfolio = { id: number; name: string; isPublic: boolean; holdings: ProtoHolding[] }

export const PORTFOLIOS: ProtoPortfolio[] = [
  {
    id: 1,
    name: "คอลเลกชันหลัก",
    isPublic: true,
    holdings: [
    { card: cardByCode("OP13-118_p3"), qty: 1, costThb: 59724 },
    { card: cardByCode("OP05-119_p7"), qty: 1, costThb: 206625 },
    { card: cardByCode("OP09-118_p2"), qty: 1, costThb: 121615 },
    { card: cardByCode("OP01-001_p1"), qty: 1, costThb: 1155 },
    { card: cardByCode("OP13-119_p3"), qty: 2, costThb: 313771 },
    { card: cardByCode("ST01-012_p3"), qty: 1, costThb: 52374 },
    ],
  },
  {
    id: 2,
    name: "นักล่าเลเจนด์",
    isPublic: false,
    holdings: [
    { card: cardByCode("EB02-061_p3"), qty: 1, costThb: 54641 },
    { card: cardByCode("OP07-111_p2"), qty: 2, costThb: 1071 },
    { card: cardByCode("OP04-044_p1"), qty: 1, costThb: 42 },
    { card: cardByCode("EB04-007_p1"), qty: 3, costThb: 3613 },
    ],
  },
]

function portfolioStats(p: ProtoPortfolio) {
  const value = p.holdings.reduce((s, h) => s + h.card.priceThb * h.qty, 0)
  const cost = p.holdings.reduce((s, h) => s + h.costThb * h.qty, 0)
  const count = p.holdings.reduce((s, h) => s + h.qty, 0)
  const ranked = [...p.holdings].sort((a, b) => (b.card.priceThb - b.costThb) - (a.card.priceThb - a.costThb))
  return {
    value,
    cost,
    pnl: value - cost,
    pnlPct: cost > 0 ? ((value - cost) / cost) * 100 : 0,
    count,
    best: ranked[0],
    worst: ranked[ranked.length - 1],
  }
}

export const PORTFOLIO_STATS = new Map(PORTFOLIOS.map((p) => [p.id, portfolioStats(p)]))
export const portfolioById = (id: number) => PORTFOLIOS.find((p) => p.id === id) ?? PORTFOLIOS[0]

export const TOTAL_VALUE = PORTFOLIOS.reduce((s, p) => s + PORTFOLIO_STATS.get(p.id)!.value, 0)
export const TOTAL_COST = PORTFOLIOS.reduce((s, p) => s + PORTFOLIO_STATS.get(p.id)!.cost, 0)
export const TOTAL_PNL_PCT = TOTAL_COST > 0 ? ((TOTAL_VALUE - TOTAL_COST) / TOTAL_COST) * 100 : 0

/** Cross-portfolio allocation -- top holdings by value across every portfolio,
 *  the rest folded into "other". Mirrors the real allocation panel. */
export const ALLOCATION = (() => {
  const rows = PORTFOLIOS.flatMap((p) => p.holdings).map((h) => ({
    name: h.card.name,
    code: h.card.code,
    img: h.card.img,
    value: h.card.priceThb * h.qty,
  }))
  rows.sort((a, b) => b.value - a.value)
  const total = rows.reduce((s, r) => s + r.value, 0)
  const top = rows.slice(0, 6)
  const otherValue = rows.slice(6).reduce((s, r) => s + r.value, 0)
  const result = top.map((r) => ({ ...r, percent: total > 0 ? (r.value / total) * 100 : 0 }))
  if (otherValue > 0) result.push({ name: "อื่นๆ", code: "", img: "", value: otherValue, percent: (otherValue / total) * 100 })
  return result
})()

/** 30-day value history (THB) for the main portfolio's scrub chart -- a
 *  deterministic climb-dip-runup shape scaled to land exactly on the real
 *  current total (portfolio id 1 only). */
export const HISTORY: number[] = (() => {
  const end = PORTFOLIO_STATS.get(1)!.value
  const start = end * 0.62
  const shape = [0, 0.04, 0.03, 0.09, 0.14, 0.12, 0.19, 0.24, 0.22, 0.29, 0.36, 0.33, 0.27, 0.19, 0.14, 0.21, 0.29, 0.35, 0.41, 0.47, 0.44, 0.51, 0.58, 0.63, 0.69, 0.75, 0.8, 0.77, 0.84, 1]
  return shape.map((t) => Math.round(start + (end - start) * t))
})()

export type ProtoWatchlistEntry = { card: ProtoCard; pinned: boolean; alert: boolean }

export const WATCHLIST: ProtoWatchlistEntry[] = [
  { card: cardByCode("OP01-001_p1"), pinned: true, alert: true },
  { card: cardByCode("OP03-008_p1"), pinned: false, alert: false },
  { card: cardByCode("OP07-111_p2"), pinned: false, alert: true },
  { card: cardByCode("ST21-001_p1"), pinned: true, alert: false },
  { card: cardByCode("OP09-118_p2"), pinned: false, alert: false },
  { card: cardByCode("EB04-007_p1"), pinned: true, alert: false },
  { card: cardByCode("OP13-120_p3"), pinned: false, alert: true },
  { card: cardByCode("OP04-044_p1"), pinned: false, alert: false },
]

// Card detail -- Roronoa Zoro (Parallel), OP01-001, the exact card the owner
// has seen in every portfolio screenshot (17,800 JPY = 3,738 THB). Real specs
// (cost/power/color/type/attribute/effect) straight from the DB; grades below
// PSA10 and the 30-day range/history are modeled the same way the real
// card-detail page flags modeled values (DESIGN.md §6 "est" convention).
export const CARD_DETAIL = {
  ...cardByCode("OP01-001_p1"),
  cost: 0,
  power: 5000,
  counter: null,
  color: "Red",
  type: "LEADER",
  attribute: "Slash",
  effect: "[DON!! x1] [Your Turn] All of your Characters gain +1000 power.",
  grades: [
    { key: "raw", label: "Raw", priceThb: 3738, source: "Yuyu-tei", modeled: false },
    { key: "psa10", label: "PSA 10", priceThb: 28035, source: "SNKRDUNK", modeled: true },
    { key: "psa9", label: "PSA 9", priceThb: 14578, source: "SNKRDUNK", modeled: true },
    { key: "bgs95", label: "BGS 9.5", priceThb: 17382, source: "SNKRDUNK", modeled: true },
  ],
  rangeLow: 2691,
  rangeHigh: 4411,
  history: [1155,1199,1248,1303,1367,1442,1526,1621,1725,1838,1956,2078,2203,2326,2447,2563,2674,2777,2873,2961,3042,3117,3188,3255,3321,3387,3454,3524,3599,3738],
  sales: [
    { label: "ขายล่าสุด", source: "Yuyu-tei", grade: "Raw", priceThb: 3738, when: "3 ชม.ที่แล้ว", type: "sold" as const },
    { label: "ตั้งขายต่ำสุด", source: "SNKRDUNK", grade: "PSA 10", priceThb: 28035, when: "อัปเดตวันนี้", type: "listed" as const },
    { label: "ขายแล้ว", source: "Yuyu-tei", grade: "Raw", priceThb: 3514, when: "เมื่อวาน", type: "sold" as const },
    { label: "ขายแล้ว", source: "SNKRDUNK", grade: "PSA 9", priceThb: 14018, when: "4 วันก่อน", type: "sold" as const },
  ],
  related: [cardByCode("OP13-118_p3"), cardByCode("OP05-119_p7"), cardByCode("OP09-118_p2"), cardByCode("ST01-012_p3")],
}

// ---------------------------------------------------------------------------
// More / settings -- grouped-inset sections
// ---------------------------------------------------------------------------
export const USER = { name: "เบส", tier: "Free · มือใหม่", avatarInitial: "บ" }
