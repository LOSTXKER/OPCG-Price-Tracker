/**
 * Step 5: Sync reprint prices.
 *
 * Two phases:
 *   Phase 1 — PRB overwrite: cards in PRB sets ALWAYS get their price
 *             from the original card (same baseCode + same rarity) in
 *             a non-PRB set. This ensures reprints show the same price
 *             as the original regardless of Yuyutei mapping.
 *   Phase 2 — Null fill: any remaining cards with no price get the
 *             price from a sibling with the same baseCode.
 */
import { prisma } from "./_db";

const PRB_PREFIXES = ["prb"];

function isPrbSet(code: string): boolean {
  return PRB_PREFIXES.some((p) => code.toLowerCase().startsWith(p));
}

function getCleanBase(code: string): string {
  return code
    .replace(/_[Rr]\d+$/, "")
    .replace(/_[Pp]\d+$/, "")
    .replace(/_[Rr]\d+$/, "");
}

async function main() {
  // ── Phase 1: PRB overwrite ──────────────────────────────────────
  const prbCards = await prisma.card.findMany({
    where: { set: { code: { in: await getPrbCodes() } } },
    select: {
      id: true,
      cardCode: true,
      baseCode: true,
      rarity: true,
      latestPriceJpy: true,
      set: { select: { code: true } },
    },
  });

  console.log(`[Phase 1] PRB cards: ${prbCards.length}`);
  let prbSynced = 0;
  let prbNoSource = 0;

  for (const card of prbCards) {
    const cleanBase = getCleanBase(card.cardCode);

    // Find original in non-PRB set with same rarity
    let source = await prisma.card.findFirst({
      where: {
        baseCode: { equals: cleanBase, mode: "insensitive" },
        rarity: card.rarity,
        latestPriceJpy: { not: null },
        set: { NOT: { code: { in: await getPrbCodes() } } },
      },
      select: { latestPriceJpy: true, cardCode: true },
      orderBy: { latestPriceJpy: "desc" },
    });

    // Fallback: same baseCode, any rarity in non-PRB
    if (!source) {
      source = await prisma.card.findFirst({
        where: {
          baseCode: { equals: cleanBase, mode: "insensitive" },
          latestPriceJpy: { not: null },
          set: { NOT: { code: { in: await getPrbCodes() } } },
        },
        select: { latestPriceJpy: true, cardCode: true },
        orderBy: { latestPriceJpy: "desc" },
      });
    }

    // Fallback: cardCode exact match in non-PRB
    if (!source) {
      source = await prisma.card.findFirst({
        where: {
          cardCode: { equals: cleanBase, mode: "insensitive" },
          latestPriceJpy: { not: null },
          set: { NOT: { code: { in: await getPrbCodes() } } },
        },
        select: { latestPriceJpy: true, cardCode: true },
      });
    }

    if (source) {
      if (card.latestPriceJpy !== source.latestPriceJpy) {
        await prisma.card.update({
          where: { id: card.id },
          data: { latestPriceJpy: source.latestPriceJpy },
        });
        prbSynced++;
      }
    } else {
      prbNoSource++;
      console.log(`  No source: ${card.cardCode} (${card.rarity})`);
    }
  }

  console.log(`[Phase 1] PRB synced: ${prbSynced}, no source: ${prbNoSource}`);

  // ── Phase 2: Null fill (non-PRB cards without price) ────────────
  const missing = await prisma.card.findMany({
    where: {
      latestPriceJpy: null,
      set: { NOT: { code: { in: await getPrbCodes() } } },
    },
    select: {
      id: true,
      cardCode: true,
      set: { select: { code: true } },
    },
  });

  console.log(`[Phase 2] Cards without price: ${missing.length}`);
  let filled = 0;
  let notFound = 0;

  for (const card of missing) {
    const cleanBase = getCleanBase(card.cardCode);

    let source = await prisma.card.findFirst({
      where: {
        cardCode: { equals: cleanBase, mode: "insensitive" },
        latestPriceJpy: { not: null },
      },
      select: { latestPriceJpy: true },
    });

    if (!source) {
      source = await prisma.card.findFirst({
        where: {
          baseCode: { equals: cleanBase, mode: "insensitive" },
          latestPriceJpy: { not: null },
        },
        select: { latestPriceJpy: true },
        orderBy: { latestPriceJpy: "desc" },
      });
    }

    if (source) {
      await prisma.card.update({
        where: { id: card.id },
        data: { latestPriceJpy: source.latestPriceJpy },
      });
      filled++;
    } else {
      notFound++;
    }
  }

  console.log(`[Phase 2] Filled: ${filled}, no source: ${notFound}`);
  await prisma.$disconnect();
}

let _prbCodes: string[] | null = null;
async function getPrbCodes(): Promise<string[]> {
  if (_prbCodes) return _prbCodes;
  const sets = await prisma.cardSet.findMany({
    where: { code: { startsWith: "prb" } },
    select: { code: true },
  });
  _prbCodes = sets.map((s) => s.code);
  return _prbCodes;
}

main().catch((e) => {
  console.error("fill-reprint-prices failed:", e);
  process.exit(1);
});
