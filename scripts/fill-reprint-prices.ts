/**
 * Step 4.5: Fill prices for reprint/variant cards.
 *
 * Cards in PRB01, PRB02, ST15-ST28 etc. are reprints of cards from
 * other sets (e.g. OP01-006_r1 in PRB01 = OP01-006 from OP01).
 * Yuyutei only lists these under the original set, so our set-scoped
 * matching can't find them. This script copies the price from the
 * original card (or any variant with the same base that already has a price).
 */
import { prisma } from "./_db";

function getCleanBase(code: string): string {
  return code
    .replace(/_[Rr]\d+$/, "")
    .replace(/_[Pp]\d+$/, "")
    .replace(/_[Rr]\d+$/, "");
}

async function main() {
  const missing = await prisma.card.findMany({
    where: { latestPriceJpy: null },
    select: {
      id: true,
      cardCode: true,
      set: { select: { code: true } },
    },
  });

  if (missing.length === 0) {
    console.log("All cards have prices — nothing to fill.");
    await prisma.$disconnect();
    return;
  }

  console.log(`[fill-reprint-prices] ${missing.length} cards without price`);

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

    if (!source) {
      source = await prisma.card.findFirst({
        where: {
          cardCode: { startsWith: cleanBase, mode: "insensitive" },
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

  console.log(`[fill-reprint-prices] Filled: ${filled}, No source: ${notFound}`);

  await prisma.$disconnect();
}

main().catch((e) => {
  console.error("fill-reprint-prices failed:", e);
  process.exit(1);
});
