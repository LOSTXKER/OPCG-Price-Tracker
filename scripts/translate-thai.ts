import { prisma } from "./_db";
import translate from "google-translate-api-x";

const BATCH_SIZE = 10;
const DELAY_BETWEEN_BATCHES_MS = 2000;
const MAX_RETRIES = 3;

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

async function translateBatch(
  texts: string[],
  retries = MAX_RETRIES
): Promise<(string | null)[]> {
  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      const results = await translate(texts, { from: "en", to: "th" });
      if (Array.isArray(results)) {
        return results.map(
          (r: { text?: string }) => r?.text || null
        );
      }
      return [(results as { text?: string })?.text || null];
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      if (attempt < retries - 1) {
        const wait = DELAY_BETWEEN_BATCHES_MS * (attempt + 1) * 2;
        console.warn(
          `  Translate retry ${attempt + 1}/${retries}: ${msg}, waiting ${wait}ms`
        );
        await sleep(wait);
      } else {
        console.error(`  Translate failed after ${retries} attempts: ${msg}`);
        return texts.map(() => null);
      }
    }
  }
  return texts.map(() => null);
}

// ============================================================
// Step 1: Translate card names
// ============================================================

async function translateCardNames() {
  console.log("\n=== Translating card names (EN → TH) ===\n");

  const cards = await prisma.card.findMany({
    where: {
      nameEn: { not: null },
      nameTh: null,
    },
    select: { id: true, nameEn: true, cardCode: true },
    orderBy: { id: "asc" },
  });

  console.log(`  ${cards.length} cards to translate\n`);
  if (cards.length === 0) return;

  let translated = 0;
  let failed = 0;

  for (let i = 0; i < cards.length; i += BATCH_SIZE) {
    const batch = cards.slice(i, i + BATCH_SIZE);
    const texts = batch.map((c) => c.nameEn!);
    const results = await translateBatch(texts);

    for (let j = 0; j < batch.length; j++) {
      const th = results[j];
      if (th) {
        await prisma.card.update({
          where: { id: batch[j].id },
          data: { nameTh: th },
        });
        translated++;
      } else {
        failed++;
      }
    }

    const progress = Math.min(i + BATCH_SIZE, cards.length);
    process.stdout.write(
      `\r  Names: ${progress}/${cards.length} (ok: ${translated}, fail: ${failed})`
    );

    await sleep(DELAY_BETWEEN_BATCHES_MS);
  }

  console.log(
    `\n  Done: ${translated} translated, ${failed} failed\n`
  );
}

// ============================================================
// Step 2: Translate card effects
// ============================================================

async function translateCardEffects() {
  console.log("=== Translating card effects (EN → TH) ===\n");

  const cards = await prisma.card.findMany({
    where: {
      effectEn: { not: null },
      effectTh: null,
    },
    select: { id: true, effectEn: true, cardCode: true },
    orderBy: { id: "asc" },
  });

  console.log(`  ${cards.length} cards with effects to translate\n`);
  if (cards.length === 0) return;

  let translated = 0;
  let failed = 0;
  const effectBatchSize = 5; // effects are longer, smaller batches

  for (let i = 0; i < cards.length; i += effectBatchSize) {
    const batch = cards.slice(i, i + effectBatchSize);
    const texts = batch.map((c) => c.effectEn!);
    const results = await translateBatch(texts);

    for (let j = 0; j < batch.length; j++) {
      const th = results[j];
      if (th) {
        await prisma.card.update({
          where: { id: batch[j].id },
          data: { effectTh: th },
        });
        translated++;
      } else {
        failed++;
      }
    }

    const progress = Math.min(i + effectBatchSize, cards.length);
    process.stdout.write(
      `\r  Effects: ${progress}/${cards.length} (ok: ${translated}, fail: ${failed})`
    );

    await sleep(DELAY_BETWEEN_BATCHES_MS);
  }

  console.log(
    `\n  Done: ${translated} translated, ${failed} failed\n`
  );
}

// ============================================================
// Step 3: Translate set names
// ============================================================

async function translateSetNames() {
  console.log("=== Translating set names (EN → TH) ===\n");

  const sets = await prisma.cardSet.findMany({
    where: {
      nameEn: { not: null },
      nameTh: null,
    },
    select: { id: true, nameEn: true, code: true },
  });

  if (sets.length === 0) {
    console.log("  No sets to translate.\n");
    return;
  }

  const texts = sets.map((s) => s.nameEn!);
  const results = await translateBatch(texts);

  let translated = 0;
  for (let i = 0; i < sets.length; i++) {
    const th = results[i];
    if (th) {
      await prisma.cardSet.update({
        where: { id: sets[i].id },
        data: { nameTh: th },
      });
      translated++;
      console.log(`  [${sets[i].code}] ${sets[i].nameEn} → ${th}`);
    }
  }

  console.log(`\n  ${translated}/${sets.length} sets translated\n`);
}

// ============================================================
// Main
// ============================================================

async function main() {
  const startTime = Date.now();
  console.log("========================================");
  console.log("  Thai Translation Script");
  console.log("========================================");

  await translateCardNames();
  await translateCardEffects();
  await translateSetNames();

  const elapsed = ((Date.now() - startTime) / 1000 / 60).toFixed(1);
  console.log("========================================");
  console.log(`  All done in ${elapsed} minutes`);
  console.log("========================================");
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error(e);
    prisma.$disconnect();
    process.exit(1);
  });
