/**
 * Seed historical CardPrice rows so price charts have data.
 *
 * For every card that already has `latestPriceJpy`, generates ~90 days of
 * daily price snapshots using a random walk that converges on the current
 * price. Also recomputes `priceChange24h` / `priceChange7d`.
 *
 * Usage:
 *   npx tsx scripts/seed-price-history.ts              # all cards
 *   npx tsx scripts/seed-price-history.ts --days 30    # last 30 days only
 *   npx tsx scripts/seed-price-history.ts --wipe       # delete old CardPrice first
 */
import { prisma } from "./_db";

const THB_RATE = 0.23;
const BATCH_SIZE = 500;

// Yuyutei rounds to multiples of 10/50/100 depending on range
function roundYuyutei(price: number): number {
  if (price <= 0) return 30;
  if (price < 100) return Math.max(10, Math.round(price / 10) * 10);
  if (price < 500) return Math.round(price / 50) * 50;
  return Math.round(price / 100) * 100;
}

// Volatility based on price tier — cheap cards are stable, expensive ones swing
function dailyVolatility(price: number): number {
  if (price <= 50) return 0.02;
  if (price <= 200) return 0.04;
  if (price <= 500) return 0.06;
  if (price <= 2000) return 0.08;
  return 0.10;
}

function gaussianRandom(): number {
  let u = 0, v = 0;
  while (u === 0) u = Math.random();
  while (v === 0) v = Math.random();
  return Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
}

function generatePriceSeries(currentPrice: number, days: number): number[] {
  const vol = dailyVolatility(currentPrice);
  const meanReversion = 0.05;
  const minPrice = 10;
  const maxPrice = currentPrice * 3;

  // Walk backwards from current price
  const prices: number[] = new Array(days);
  prices[days - 1] = currentPrice;

  for (let i = days - 2; i >= 0; i--) {
    const prev = prices[i + 1];
    const drift = meanReversion * (currentPrice - prev) / currentPrice;
    const shock = gaussianRandom() * vol;
    const rawNext = prev * (1 - drift + shock);
    const clamped = Math.max(minPrice, Math.min(maxPrice, rawNext));
    prices[i] = roundYuyutei(clamped);
  }

  return prices;
}

async function main() {
  const args = process.argv.slice(2);
  const wipe = args.includes("--wipe");
  const daysIdx = args.indexOf("--days");
  const days = daysIdx !== -1 ? parseInt(args[daysIdx + 1], 10) : 90;

  console.log(`\n=== Seed Price History ===`);
  console.log(`Days: ${days}, Wipe existing: ${wipe}\n`);

  if (wipe) {
    const deleted = await prisma.cardPrice.deleteMany();
    console.log(`  Wiped ${deleted.count} existing CardPrice rows.\n`);
  }

  const cards = await prisma.card.findMany({
    where: { latestPriceJpy: { not: null } },
    select: { id: true, latestPriceJpy: true, latestPriceThb: true },
  });

  console.log(`Found ${cards.length} cards with prices.\n`);
  if (cards.length === 0) {
    console.log("Nothing to do.");
    await prisma.$disconnect();
    return;
  }

  const now = new Date();
  let totalRows = 0;
  let batch: {
    cardId: number;
    source: "YUYUTEI";
    type: "SELL";
    priceJpy: number;
    priceThb: number;
    inStock: boolean;
    scrapedAt: Date;
  }[] = [];

  async function flushBatch() {
    if (batch.length === 0) return;
    await prisma.cardPrice.createMany({ data: batch });
    totalRows += batch.length;
    batch = [];
  }

  for (let ci = 0; ci < cards.length; ci++) {
    const card = cards[ci];
    const currentJpy = card.latestPriceJpy!;
    const series = generatePriceSeries(currentJpy, days);

    for (let d = 0; d < days; d++) {
      const scrapedAt = new Date(now);
      scrapedAt.setDate(scrapedAt.getDate() - (days - 1 - d));
      scrapedAt.setHours(10, 0, 0, 0); // morning scrape

      batch.push({
        cardId: card.id,
        source: "YUYUTEI",
        type: "SELL",
        priceJpy: series[d],
        priceThb: Math.round(series[d] * THB_RATE * 100) / 100,
        inStock: true,
        scrapedAt,
      });

      if (batch.length >= BATCH_SIZE) {
        await flushBatch();
      }
    }

    if ((ci + 1) % 200 === 0) {
      await flushBatch();
      console.log(`  ${ci + 1}/${cards.length} cards processed (${totalRows} rows)...`);
    }
  }

  await flushBatch();
  console.log(`\nInserted ${totalRows} CardPrice rows for ${cards.length} cards.`);

  // Recompute priceChange24h / priceChange7d / priceChange30d
  console.log("\nRecomputing price changes...");
  const now24h = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const now7d = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const now30d = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

  function pctChange(current: number, old: number | null | undefined): number | null {
    if (!old) return null;
    const pct = ((current - old) / old) * 100;
    return Math.round(pct * 100) / 100;
  }

  let updated = 0;
  for (const card of cards) {
    const currentJpy = card.latestPriceJpy!;

    const [price24h, price7d, price30d] = await Promise.all([
      prisma.cardPrice.findFirst({
        where: { cardId: card.id, source: "YUYUTEI", scrapedAt: { lte: now24h } },
        orderBy: { scrapedAt: "desc" },
        select: { priceJpy: true },
      }),
      prisma.cardPrice.findFirst({
        where: { cardId: card.id, source: "YUYUTEI", scrapedAt: { lte: now7d } },
        orderBy: { scrapedAt: "desc" },
        select: { priceJpy: true },
      }),
      prisma.cardPrice.findFirst({
        where: { cardId: card.id, source: "YUYUTEI", scrapedAt: { lte: now30d } },
        orderBy: { scrapedAt: "desc" },
        select: { priceJpy: true },
      }),
    ]);

    await prisma.card.update({
      where: { id: card.id },
      data: {
        priceChange24h: pctChange(currentJpy, price24h?.priceJpy),
        priceChange7d: pctChange(currentJpy, price7d?.priceJpy),
        priceChange30d: pctChange(currentJpy, price30d?.priceJpy),
      },
    });
    updated++;

    if (updated % 200 === 0) {
      console.log(`  ${updated}/${cards.length} cards updated...`);
    }
  }

  console.log(`\n========================================`);
  console.log(`Done! ${totalRows} price rows, ${updated} cards with changes updated.`);
  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
