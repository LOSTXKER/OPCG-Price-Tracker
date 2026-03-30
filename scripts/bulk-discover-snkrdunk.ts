/**
 * Bulk discover OPCG cards from SNKRDUNK, create mappings, auto-match, and fetch prices.
 */
import { PrismaClient, MappingStatus, MatchMethod } from "../src/generated/prisma/client"
import { PrismaPg } from "@prisma/adapter-pg"
import pg from "pg"
import dotenv from "dotenv"

dotenv.config({ path: ".env.local" })
if (!process.env.DATABASE_URL) dotenv.config()

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL })
const adapter = new PrismaPg(pool as unknown as ConstructorParameters<typeof PrismaPg>[0])
const prisma = new PrismaClient({ adapter })

const SNKRDUNK_API = "https://snkrdunk.com/en/v1/trading-cards"
const HEADERS = {
  "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
  Accept: "application/json",
}

const OPCG_CODE_PATTERN = /^(OP\d{2}-\d{3}|ST\d{2}-\d{3}|EB\d{2}-\d{3}|P-\d{3})$/i

type SnkrCard = {
  id: number
  productNumber: string
  name: string
  minPrice: number
  thumbnailUrl: string | null
}

function sleep(ms: number) { return new Promise(r => setTimeout(r, ms)) }

async function main() {
  console.log("=== SNKRDUNK Bulk Discovery ===\n")

  // 1. Fetch all OPCG cards from SNKRDUNK
  console.log("Step 1: Fetching OPCG cards from SNKRDUNK...")
  const allCards = new Map<number, SnkrCard>()
  let page = 1
  let emptyStreak = 0
  const MAX_EMPTY = 10

  while (emptyStreak < MAX_EMPTY) {
    const url = `${SNKRDUNK_API}?keyword=one+piece+card+game&perPage=100&page=${page}`
    const res = await fetch(url, { headers: HEADERS })
    if (!res.ok) { console.error(`  Page ${page}: HTTP ${res.status}`); break }

    const json = (await res.json()) as { tradingCards: SnkrCard[] }
    const cards = json.tradingCards ?? []
    if (cards.length === 0) break

    const opcg = cards.filter(c => OPCG_CODE_PATTERN.test(c.productNumber))
    let newCount = 0
    for (const c of opcg) {
      if (!allCards.has(c.id)) { allCards.set(c.id, c); newCount++ }
    }

    if (newCount > 0) {
      console.log(`  Page ${page}: ${newCount} new OPCG (${allCards.size} total)`)
      emptyStreak = 0
    } else {
      emptyStreak++
    }

    if (cards.length < 100) break
    page++
    await sleep(400)
  }

  console.log(`\nTotal unique OPCG individual cards: ${allCards.size}\n`)

  // 2. Check existing mappings
  const existingMappings = await prisma.snkrdunkMapping.findMany({
    select: { snkrdunkId: true },
  })
  const existingIds = new Set(existingMappings.map(m => m.snkrdunkId))
  const newCards = [...allCards.values()].filter(c => !existingIds.has(c.id))
  console.log(`Existing mappings: ${existingIds.size}`)
  console.log(`New cards to add: ${newCards.length}\n`)

  // 3. Create SnkrdunkMapping entries
  if (newCards.length > 0) {
    console.log("Step 2: Creating mapping entries...")
    let created = 0
    for (const card of newCards) {
      try {
        await prisma.snkrdunkMapping.create({
          data: {
            snkrdunkId: card.id,
            productNumber: card.productNumber,
            scrapedName: card.name,
            thumbnailUrl: card.thumbnailUrl,
            minPriceUsd: card.minPrice > 0 ? card.minPrice : null,
            status: MappingStatus.PENDING,
          },
        })
        created++
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : String(e)
        if (msg.includes("Unique constraint")) continue
        console.error(`  Error creating ${card.productNumber}: ${msg}`)
      }
    }
    console.log(`  Created ${created} new mappings\n`)
  }

  // 4. Auto-match by productNumber → DB card
  console.log("Step 3: Auto-matching by card code...")
  const pendingMappings = await prisma.snkrdunkMapping.findMany({
    where: { status: MappingStatus.PENDING, matchedCardId: null },
    select: { id: true, productNumber: true, scrapedName: true },
  })

  let matched = 0
  let multiMatch = 0
  let noMatch = 0

  for (const mapping of pendingMappings) {
    const code = mapping.productNumber.toUpperCase().trim()
    const name = mapping.scrapedName ?? ""
    const isParallel = /[-\s](P|SP|SEC-P|SEC-RSP|SR-P|R-P|L-P|TR)\b/i.test(name)

    // Look up by cardCode (exact match = base card)
    let cards = await prisma.card.findMany({
      where: { cardCode: { equals: code, mode: "insensitive" } },
      select: { id: true, cardCode: true, isParallel: true },
    })

    if (isParallel && cards.length === 0) {
      cards = await prisma.card.findMany({
        where: { baseCode: { equals: code, mode: "insensitive" }, isParallel: true },
        select: { id: true, cardCode: true, isParallel: true },
      })
    }

    if (!isParallel && cards.length > 1) {
      const base = cards.filter(c => !c.isParallel)
      if (base.length === 1) cards = base
    }

    if (cards.length === 1) {
      await prisma.snkrdunkMapping.update({
        where: { id: mapping.id },
        data: {
          matchedCardId: cards[0]!.id,
          matchMethod: MatchMethod.AUTO_CODE,
          status: MappingStatus.MATCHED,
        },
      })
      matched++
    } else if (cards.length > 1) {
      await prisma.snkrdunkMapping.update({
        where: { id: mapping.id },
        data: { matchMethod: MatchMethod.AUTO_CODE_MULTI },
      })
      multiMatch++
    } else {
      noMatch++
    }
  }

  console.log(`  Auto-matched: ${matched}`)
  console.log(`  Multiple candidates (needs admin review): ${multiMatch}`)
  console.log(`  No match in DB: ${noMatch}\n`)

  // 5. Fetch prices for all matched cards
  const allMatched = await prisma.snkrdunkMapping.findMany({
    where: { status: MappingStatus.MATCHED, matchedCardId: { not: null } },
    select: { id: true, snkrdunkId: true },
  })

  console.log(`Step 4: Fetching prices for ${allMatched.length} matched cards...`)
  console.log(`  Estimated time: ~${Math.ceil(allMatched.length * 1.5 / 60)} minutes\n`)

  if (allMatched.length > 0) {
    const { updateSnkrdunkPrices } = await import("../src/lib/scraper/snkrdunk-matcher")
    const result = await updateSnkrdunkPrices(prisma as unknown as Parameters<typeof updateSnkrdunkPrices>[0])

    console.log(`\n=== Done! ===`)
    console.log(`  Cards processed: ${result.processed}`)
    console.log(`  Errors: ${result.errors.length}`)
    if (result.errors.length > 0) {
      console.log("  First 10 errors:")
      for (const e of result.errors.slice(0, 10)) console.log(`    - ${e}`)
    }
  } else {
    console.log("  No matched cards to fetch prices for.")
  }
}

main()
  .catch(console.error)
  .finally(() => { prisma.$disconnect(); pool.end() })
