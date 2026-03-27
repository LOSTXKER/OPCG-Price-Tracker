/**
 * Download card images from external CDN and upload to Supabase Storage.
 *
 * After seed-cards.ts populates the DB with Punk Records image URLs
 * (pointing to asia-en.onepiece-cardgame.com), this script:
 *   1. Queries cards with external imageUrl
 *   2. Downloads each image
 *   3. Uploads to Supabase Storage bucket "card-images"
 *   4. Updates Card.imageUrl to the Supabase public URL
 *
 * Usage:
 *   npx tsx scripts/upload-images.ts                # all cards
 *   npx tsx scripts/upload-images.ts --sets=op09    # specific sets
 *   npx tsx scripts/upload-images.ts --force        # re-upload even if already on Supabase
 */
import "dotenv/config";
import { createClient } from "@supabase/supabase-js";
import { prisma } from "./_db";
import { SETS } from "./sets";

const BUCKET = "card-images";
const CONCURRENCY = 5;
const DELAY_BETWEEN_BATCHES_MS = 200;

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

function deriveSetCode(cardCode: string): string {
  const m = cardCode.match(/^(OP|EB|ST|PRB)(\d+)/i);
  if (!m) return "misc";
  return m[1].toLowerCase() + m[2].padStart(2, "0");
}

function storagePath(cardCode: string): string {
  const setCode = deriveSetCode(cardCode);
  const safe = cardCode.replace(/[^a-zA-Z0-9_-]/g, "_");
  return `${setCode}/${safe}.png`;
}

async function ensureBucketExists() {
  const { data: buckets } = await supabase.storage.listBuckets();
  const exists = buckets?.some((b) => b.name === BUCKET);
  if (!exists) {
    const { error } = await supabase.storage.createBucket(BUCKET, {
      public: true,
      fileSizeLimit: 2 * 1024 * 1024,
    });
    if (error) throw new Error(`Failed to create bucket: ${error.message}`);
    console.log(`  Created Supabase Storage bucket "${BUCKET}"`);
  } else {
    console.log(`  Bucket "${BUCKET}" already exists`);
  }
}

async function downloadImage(url: string): Promise<Buffer | null> {
  try {
    const res = await fetch(url, {
      headers: { "User-Agent": "Mozilla/5.0 (compatible; MeeCard/1.0)" },
    });
    if (!res.ok) return null;
    const arrayBuffer = await res.arrayBuffer();
    return Buffer.from(arrayBuffer);
  } catch {
    return null;
  }
}

async function uploadToStorage(
  path: string,
  data: Buffer,
  contentType: string
): Promise<string | null> {
  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(path, data, { contentType, upsert: true });
  if (error) {
    console.warn(`    Upload error for ${path}: ${error.message}`);
    return null;
  }
  const { data: publicUrlData } = supabase.storage.from(BUCKET).getPublicUrl(path);
  return publicUrlData.publicUrl;
}

async function processCard(card: {
  id: number;
  cardCode: string;
  imageUrl: string | null;
}): Promise<{ ok: boolean; skipped?: boolean }> {
  if (!card.imageUrl) return { ok: false };

  const path = storagePath(card.cardCode);
  const buf = await downloadImage(card.imageUrl);
  if (!buf) {
    console.warn(`    FAIL download ${card.cardCode}: ${card.imageUrl}`);
    return { ok: false };
  }

  const contentType = card.imageUrl.endsWith(".jpg") || card.imageUrl.endsWith(".jpeg")
    ? "image/jpeg"
    : "image/png";

  const publicUrl = await uploadToStorage(path, buf, contentType);
  if (!publicUrl) return { ok: false };

  await prisma.card.update({
    where: { id: card.id },
    data: { imageUrl: publicUrl },
  });

  return { ok: true };
}

async function main() {
  const args = process.argv.slice(2);
  const force = args.includes("--force");
  const setsArg = args.find((a) => a.startsWith("--sets="));
  const setsFilter = setsArg
    ? new Set(setsArg.replace("--sets=", "").split(",").map((s) => s.trim().toLowerCase()))
    : null;

  console.log("╔══════════════════════════════════════════════════╗");
  console.log("║   Upload Card Images to Supabase Storage         ║");
  console.log("╚══════════════════════════════════════════════════╝");
  console.log(`  force: ${force}, sets: ${setsFilter ? [...setsFilter].join(",") : "all"}\n`);

  await ensureBucketExists();

  const setFilter = setsFilter
    ? { set: { code: { in: [...setsFilter] } } }
    : {};

  const supabaseHost = new URL(supabaseUrl!).host;
  const externalFilter = force
    ? {}
    : { NOT: { imageUrl: { contains: supabaseHost } } };

  const cards = await prisma.card.findMany({
    where: {
      imageUrl: { not: null },
      ...setFilter,
      ...externalFilter,
    },
    select: { id: true, cardCode: true, imageUrl: true },
    orderBy: { cardCode: "asc" },
  });

  console.log(`  Found ${cards.length} cards with external images to upload\n`);

  if (cards.length === 0) {
    console.log("  Nothing to do!");
    await prisma.$disconnect();
    return;
  }

  let uploaded = 0;
  let failed = 0;

  for (let i = 0; i < cards.length; i += CONCURRENCY) {
    const batch = cards.slice(i, i + CONCURRENCY);
    const results = await Promise.all(batch.map(processCard));

    for (let j = 0; j < results.length; j++) {
      if (results[j].ok) {
        uploaded++;
      } else if (!results[j].skipped) {
        failed++;
      }
    }

    const progress = Math.min(i + CONCURRENCY, cards.length);
    if (progress % 50 === 0 || progress === cards.length) {
      console.log(`  Progress: ${progress}/${cards.length} (uploaded: ${uploaded}, failed: ${failed})`);
    }

    if (i + CONCURRENCY < cards.length) {
      await sleep(DELAY_BETWEEN_BATCHES_MS);
    }
  }

  console.log(`\n${"=".repeat(60)}`);
  console.log(`Done!`);
  console.log(`  Uploaded: ${uploaded}`);
  console.log(`  Failed:   ${failed}`);
  console.log(`  Total:    ${cards.length}`);
  console.log("=".repeat(60));

  await prisma.$disconnect();
}

main().catch((e) => {
  console.error("Fatal:", e);
  process.exit(1);
});
