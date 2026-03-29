import { PrismaClient } from "../src/generated/prisma/client"
import { PrismaPg } from "@prisma/adapter-pg"
import pg from "pg"
import dotenv from "dotenv"

dotenv.config({ path: ".env.local" })
if (!process.env.DATABASE_URL) dotenv.config()

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL })
const adapter = new PrismaPg(pool as unknown as ConstructorParameters<typeof PrismaPg>[0])
const prisma = new PrismaClient({ adapter })

const TARGET_CARD_ID = 52321 // OP13-118_p3 (P-SEC, SNKRDUNK mapped)
const WRONG_CARD_ID = 52319  // OP13-118_p1 (accidentally seeded)

async function main() {
  // 1. Clean up wrong seed on OP13-118_p1
  const wrongDeleted = await prisma.cardPrice.deleteMany({
    where: { cardId: WRONG_CARD_ID, scrapedAt: { lt: new Date("2025-03-25") } },
  })
  console.log(`Cleaned up ${wrongDeleted.count} wrong records from OP13-118_p1`)

  // 2. Seed correct card: OP13-118_p3
  const card = await prisma.card.findUnique({
    where: { id: TARGET_CARD_ID },
    select: { id: true, cardCode: true, latestPriceJpy: true },
  })
  if (!card) { console.log("Card not found!"); return }
  console.log("Target card:", card)

  const now = new Date()
  const oneYearAgo = new Date(now)
  oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1)
  const totalDays = Math.floor((now.getTime() - oneYearAgo.getTime()) / (1000 * 60 * 60 * 24))

  // Keep real data from last 3 days
  const cutoff = new Date()
  cutoff.setDate(cutoff.getDate() - 3)

  // Delete old data for this card
  const deleted = await prisma.cardPrice.deleteMany({
    where: { cardId: card.id, scrapedAt: { lt: cutoff } },
  })
  console.log(`Deleted ${deleted.count} old records from ${card.cardCode}`)

  const records: NonNullable<Parameters<typeof prisma.cardPrice.createMany>[0]>["data"] = []

  // Price curve for a chase P-SEC card (in JPY)
  // Start: ~800K (release hype), peak: ~1.3M, stable: ~1.2M, then crash to ~300K recently
  for (let day = 0; day <= totalDays; day++) {
    const date = new Date(oneYearAgo)
    date.setDate(date.getDate() + day)
    if (date >= cutoff) continue

    const progress = day / totalDays

    let priceJpy: number
    if (progress < 0.08) {
      // 0-8%: release ramp 800K → 1.3M
      const t = progress / 0.08
      priceJpy = 800000 + t * 500000
    } else if (progress < 0.2) {
      // 8-20%: settle from 1.3M → 1.1M
      const t = (progress - 0.08) / 0.12
      priceJpy = 1300000 - t * 200000 + (Math.random() - 0.5) * 30000
    } else if (progress < 0.75) {
      // 20-75%: stable around 1.05M-1.15M with fluctuations
      priceJpy = 1100000 + Math.sin(day * 0.25) * 50000 + (Math.random() - 0.5) * 30000
    } else if (progress < 0.85) {
      // 75-85%: start declining 1.1M → 800K
      const t = (progress - 0.75) / 0.10
      priceJpy = 1100000 - t * 300000 + (Math.random() - 0.5) * 20000
    } else if (progress < 0.93) {
      // 85-93%: sharp crash 800K → 350K
      const t = (progress - 0.85) / 0.08
      priceJpy = 800000 - t * 450000 + (Math.random() - 0.5) * 15000
    } else {
      // 93-100%: bottom 280K-320K
      priceJpy = 300000 + Math.sin(day * 0.4) * 15000 + (Math.random() - 0.5) * 8000
    }
    priceJpy = Math.round(priceJpy / 100) * 100

    // YUYUTEI daily
    records.push({
      cardId: card.id,
      source: "YUYUTEI",
      type: "SELL",
      priceJpy,
      priceThb: Math.round(priceJpy * 0.235),
      priceUsd: null,
      gradeCondition: null,
      scrapedAt: date,
      inStock: true,
    })

    // SNKRDUNK raw sold every 2-4 days (~85-95% of retail in USD)
    if (day % 3 === 0 || day % 7 === 1) {
      const factor = 0.85 + Math.random() * 0.10
      const snkrUsd = Math.round((priceJpy * 0.0067) * factor * 100) / 100
      records.push({
        cardId: card.id,
        source: "SNKRDUNK",
        type: "SELL",
        priceJpy: null,
        priceThb: null,
        priceUsd: snkrUsd,
        gradeCondition: null,
        scrapedAt: date,
        inStock: true,
      })
    }

    // SNKRDUNK PSA 10 sold every 5-7 days (~140-170% of retail in USD)
    if (day % 6 === 0) {
      const factor = 1.4 + Math.random() * 0.3
      const psa10Usd = Math.round((priceJpy * 0.0067) * factor * 100) / 100
      records.push({
        cardId: card.id,
        source: "SNKRDUNK",
        type: "SELL",
        priceJpy: null,
        priceThb: null,
        priceUsd: psa10Usd,
        gradeCondition: "PSA 10",
        scrapedAt: date,
        inStock: true,
      })
    }
  }

  console.log(`Inserting ${records.length} records...`)

  const batchSize = 100
  for (let i = 0; i < records.length; i += batchSize) {
    await prisma.cardPrice.createMany({ data: records.slice(i, i + batchSize) })
    if (i % 500 === 0) process.stdout.write(".")
  }

  console.log("\nDone!")
}

main()
  .catch(console.error)
  .finally(() => { prisma.$disconnect(); pool.end() })
