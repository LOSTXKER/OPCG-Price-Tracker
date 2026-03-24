import { prisma } from "@/lib/db";
import { OPCG_SETS } from "@/lib/constants/sets";
import { TYPE_MAP, COLOR_MAP } from "./mappings";
import {
  fetchWithRetry,
  getSetListingUrl,
  parseSetListingPage,
  sleep,
} from "./yuyu-tei";

const DELAY_BETWEEN_CARDS_MS = 1500;

export async function scrapeMasterData(setCodes?: string[]) {
  const setsToScrape = setCodes
    ? OPCG_SETS.filter((s) => setCodes.includes(s.code))
    : OPCG_SETS;

  console.log(`Master data scrape starting for ${setsToScrape.length} sets`);

  for (const setInfo of setsToScrape) {
    // Upsert the set
    const cardSet = await prisma.cardSet.upsert({
      where: { code: setInfo.code },
      update: { name: setInfo.name, nameEn: setInfo.nameEn, type: setInfo.type },
      create: {
        code: setInfo.code,
        name: setInfo.name,
        nameEn: setInfo.nameEn,
        type: setInfo.type,
      },
    });

    try {
      const url = getSetListingUrl(setInfo.code);
      console.log(`Scraping master data: ${setInfo.code} (${url})`);

      const $ = await fetchWithRetry(url);
      const listings = parseSetListingPage($);

      console.log(`  Found ${listings.length} cards`);

      let upsertCount = 0;
      for (const listing of listings) {
        if (!listing.cardCode) {
          console.warn(`  Skipping card without code: ${listing.name}`);
          continue;
        }

        // Parse rarity from name if not found separately
        // e.g. "SR ニコ・ロビン" -> rarity = "SR", name = "ニコ・ロビン"
        let rarity = listing.rarity || "";
        let cardName = listing.name;
        const rarityMatch = cardName.match(/^(P-SEC|P-SR|P-R|P-UC|P-C|P-L|P-P|SEC|SR|R|UC|C|SP|L|P)\s+/);
        if (rarityMatch && !rarity) {
          rarity = rarityMatch[1];
          cardName = cardName.replace(rarityMatch[0], "").trim();
        }

        if (!rarity && cardName.includes("ドン!!")) {
          rarity = "DON";
        }

        const isParallel = cardName.includes("パラレル") || rarity.startsWith("P-") || rarity === "SP";
        if (isParallel && rarity && !rarity.startsWith("P-") && rarity !== "SP" && rarity !== "DON") {
          rarity = `P-${rarity}`;
        }
        if (isParallel) {
          cardName = cardName.replace(/[（(]パラレル[）)]/, "").trim();
        }

        await prisma.card.upsert({
          where: { cardCode: listing.cardCode },
          update: {
            yuyuteiId: listing.yuyuteiId,
            yuyuteiUrl: listing.cardUrl,
            nameJp: cardName,
            rarity: rarity || "Unknown",
            imageUrl: listing.imageUrl,
            isParallel,
            latestPriceJpy: listing.priceJpy,
          },
          create: {
            cardCode: listing.cardCode,
            yuyuteiId: listing.yuyuteiId,
            yuyuteiUrl: listing.cardUrl,
            setId: cardSet.id,
            nameJp: cardName,
            rarity: rarity || "Unknown",
            cardType: "CHARACTER",
            color: "Unknown",
            imageUrl: listing.imageUrl,
            isParallel,
            latestPriceJpy: listing.priceJpy,
          },
        });
        upsertCount++;
      }

      // Update card count
      await prisma.cardSet.update({
        where: { id: cardSet.id },
        data: { cardCount: upsertCount },
      });

      console.log(`  Upserted ${upsertCount} cards for ${setInfo.code}`);
      await sleep(DELAY_BETWEEN_CARDS_MS);
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      console.error(`  ERROR scraping ${setInfo.code}: ${msg}`);
    }
  }

  console.log("Master data scrape complete");
}
