import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import * as cheerio from "cheerio";

const connectionString = process.env.DIRECT_URL || process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("DATABASE_URL or DIRECT_URL is not set");
}

const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

const BASE_URL = "https://yuyu-tei.jp";
const USER_AGENT =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36";
const DELAY_MS = 1500;
const DEFAULT_RATE = 0.296;
const EXCHANGE_API_URL = "https://v6.exchangerate-api.com/v6";

const SET_CODES = [
  "op01", "op02", "op03", "op04", "op05", "op06", "op07", "op08",
  "op09", "op10", "op11", "op12", "op13", "op14", "op15",
  "eb01", "eb02", "eb03", "eb04",
  "st01", "st02", "st03", "st04", "st05", "st06", "st07", "st08",
  "st09", "st10", "st11", "st12", "st13", "st14", "st15", "st16",
  "st17", "st18", "st19", "st20", "st21",
  "prb01",
];

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

async function fetchPage(url: string) {
  const res = await fetch(url, {
    headers: { "User-Agent": USER_AGENT },
  });
  if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
  return cheerio.load(await res.text());
}

async function fetchWithRetry(url: string, maxRetries = 3, baseDelay = 2000) {
  let lastError: Error | undefined;
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await fetchPage(url);
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      console.warn(
        `  Attempt ${attempt + 1}/${maxRetries} failed: ${lastError.message}`
      );
      if (attempt < maxRetries - 1) {
        await sleep(baseDelay * Math.pow(2, attempt));
      }
    }
  }
  throw lastError;
}

interface ScrapedListing {
  cardCode: string;
  name: string;
  rarity: string | undefined;
  priceJpy: number;
  inStock: boolean;
  yuyuteiId: string | undefined;
}

function parseCards($: cheerio.CheerioAPI): ScrapedListing[] {
  const cards: ScrapedListing[] = [];
  $(".card-product").each((_, el) => {
    const $el = $(el);
    const cardCode = $el.find("span.border-dark").first().text().trim();
    if (!cardCode) return;

    const priceText = $el.find("strong.text-end").first().text().trim();
    const priceJpy = parseInt(priceText.replace(/[^0-9]/g, ""), 10);
    if (isNaN(priceJpy) || priceJpy === 0) return;

    const imgEl = $el.find(".product-img img.card").first();
    const altText = imgEl.attr("alt") || "";

    const altMatch = altText.match(
      /^[\w-]+\s+(P-SEC|P-SR|P-R|P-UC|P-C|P-L|P-P|SEC|SR|SP|R|UC|C|L|P)?\s*(.*)/
    );
    const rarity = altMatch?.[1] || undefined;
    const name =
      altMatch?.[2]?.trim() ||
      $el.find("h4.text-primary").first().text().trim();

    const href = $el.find("a[href*='/sell/opc/card/']").first().attr("href");
    const yuyuteiId =
      $el.find("input.cart_cid").val()?.toString() || href?.split("/").pop();

    const inStock = !$el.hasClass("sold-out");

    cards.push({ cardCode, name, rarity, priceJpy, inStock, yuyuteiId });
  });
  return cards;
}

async function fetchExchangeRate(): Promise<number> {
  const apiKey = process.env.EXCHANGE_RATE_API_KEY;
  if (apiKey && apiKey !== "your-exchange-rate-api-key") {
    try {
      const res = await fetch(`${EXCHANGE_API_URL}/${apiKey}/pair/JPY/THB`);
      const data = await res.json();
      if (data.result === "success") {
        console.log(`Exchange rate from API: 1 JPY = ${data.conversion_rate} THB`);
        return data.conversion_rate;
      }
    } catch (error) {
      console.warn("Exchange rate API failed, checking DB fallback:", error);
    }
  }

  const latest = await prisma.exchangeRate.findFirst({
    orderBy: { fetchedAt: "desc" },
  });
  const rate = latest?.rate ?? DEFAULT_RATE;
  console.log(`Exchange rate (fallback): 1 JPY = ${rate} THB`);
  return rate;
}

function jpyToThb(jpy: number, rate: number): number {
  return Math.round(jpy * rate * 100) / 100;
}

async function computePriceChanges() {
  console.log("\nComputing price changes...");
  const now = new Date();
  const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  const cards = await prisma.card.findMany({
    where: { latestPriceJpy: { not: null } },
    select: { id: true, latestPriceJpy: true },
  });

  let updated = 0;
  for (const card of cards) {
    const currentPrice = card.latestPriceJpy;
    if (!currentPrice) continue;

    const price24h = await prisma.cardPrice.findFirst({
      where: { cardId: card.id, scrapedAt: { lte: oneDayAgo } },
      orderBy: { scrapedAt: "desc" },
      select: { priceJpy: true },
    });

    const price7d = await prisma.cardPrice.findFirst({
      where: { cardId: card.id, scrapedAt: { lte: sevenDaysAgo } },
      orderBy: { scrapedAt: "desc" },
      select: { priceJpy: true },
    });

    const change24h = price24h
      ? Math.round(
          ((currentPrice - price24h.priceJpy) / price24h.priceJpy) * 10000
        ) / 100
      : null;
    const change7d = price7d
      ? Math.round(
          ((currentPrice - price7d.priceJpy) / price7d.priceJpy) * 10000
        ) / 100
      : null;

    if (change24h !== null || change7d !== null) {
      await prisma.card.update({
        where: { id: card.id },
        data: { priceChange24h: change24h, priceChange7d: change7d },
      });
      updated++;
    }
  }
  console.log(`  ${updated}/${cards.length} cards updated with price changes`);
}

async function main() {
  console.log(`Starting daily price scrape for ${SET_CODES.length} sets...`);
  const startTime = Date.now();
  let totalCards = 0;
  let totalSets = 0;
  const errors: string[] = [];

  const rate = await fetchExchangeRate();

  try {
    await prisma.exchangeRate.create({
      data: { fromCur: "JPY", toCur: "THB", rate },
    });
  } catch {
    console.warn("Could not save exchange rate to DB (may already exist)");
  }

  for (const setCode of SET_CODES) {
    const url = `${BASE_URL}/sell/opc/s/${setCode}`;
    console.log(`\n[${setCode}] ${url}`);

    try {
      const $ = await fetchWithRetry(url);
      const listings = parseCards($);

      if (listings.length === 0) {
        console.log("  ⚠ No cards found");
        errors.push(`${setCode}: 0 cards`);
        await sleep(DELAY_MS);
        continue;
      }

      let matched = 0;
      for (const listing of listings) {
        const compositeCode = `${listing.cardCode}${listing.yuyuteiId ? `-${listing.yuyuteiId}` : ""}`;
        let card = listing.yuyuteiId
          ? await prisma.card.findFirst({
              where: { yuyuteiId: listing.yuyuteiId },
            })
          : null;

        if (!card) {
          card = await prisma.card.findUnique({
            where: { cardCode: compositeCode },
          });
        }

        if (!card) continue;

        const priceThb = jpyToThb(listing.priceJpy, rate);

        await prisma.cardPrice.create({
          data: {
            cardId: card.id,
            priceJpy: listing.priceJpy,
            priceThb,
            inStock: listing.inStock,
          },
        });

        await prisma.card.update({
          where: { id: card.id },
          data: {
            latestPriceJpy: listing.priceJpy,
            latestPriceThb: priceThb,
          },
        });
        matched++;
      }

      console.log(`  ✓ ${matched}/${listings.length} cards price-updated`);
      totalCards += matched;
      totalSets++;
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error(`  ✗ ERROR: ${msg}`);
      errors.push(`${setCode}: ${msg}`);
    }

    await sleep(DELAY_MS);
  }

  await computePriceChanges();

  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
  console.log(`\n========================================`);
  console.log(
    `Done! ${totalCards} card prices across ${totalSets} sets in ${elapsed}s`
  );
  if (errors.length) {
    console.log(`Errors (${errors.length}):`);
    errors.forEach((e) => console.log(`  - ${e}`));
  }
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error(e);
    prisma.$disconnect();
    process.exit(1);
  });
