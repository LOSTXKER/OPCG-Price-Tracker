import { PrismaClient } from "../src/generated/prisma/client"
import { PrismaPg } from "@prisma/adapter-pg"
import pg from "pg"
import dotenv from "dotenv"
import { updateSnkrdunkPrices } from "../src/lib/scraper/snkrdunk-matcher"

dotenv.config({ path: ".env.local" })
if (!process.env.DATABASE_URL) dotenv.config()

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL })
const adapter = new PrismaPg(pool as unknown as ConstructorParameters<typeof PrismaPg>[0])
const prisma = new PrismaClient({ adapter })

async function main() {
  const mappings = await prisma.snkrdunkMapping.findMany({
    where: { status: "matched", matchedCardId: { not: null } },
    select: { id: true, snkrdunkId: true, matchedCardId: true, scrapedName: true },
  })

  console.log(`Found ${mappings.length} matched SNKRDUNK mappings:`)
  for (const m of mappings) {
    console.log(`  - snkrdunkId=${m.snkrdunkId} → cardId=${m.matchedCardId} (${m.scrapedName?.slice(0, 60)})`)
  }

  if (mappings.length === 0) {
    console.log("No matched mappings to process.")
    return
  }

  console.log(`\nStarting scrape for ${mappings.length} cards...`)
  const start = Date.now()

  const result = await updateSnkrdunkPrices(prisma as unknown as Parameters<typeof updateSnkrdunkPrices>[0])

  const elapsed = ((Date.now() - start) / 1000).toFixed(1)
  console.log(`\nDone in ${elapsed}s`)
  console.log(`  Processed: ${result.processed}`)
  console.log(`  Errors: ${result.errors.length}`)
  if (result.errors.length > 0) {
    console.log("  Error details:")
    for (const e of result.errors) {
      console.log(`    - ${e}`)
    }
  }
}

main()
  .catch(console.error)
  .finally(() => { prisma.$disconnect(); pool.end() })
