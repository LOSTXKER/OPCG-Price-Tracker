/**
 * Download official set packaging art and upload it to Cloudflare R2.
 *
 * `CardSet.boxImageUrl` shipped empty for all 51 sets, so every surface that
 * wanted box art fell back to the set's priciest card — a picture of a card
 * where the reader expected a picture of a product. Bandai publishes the real
 * packaging under a path that is derivable from the set code alone:
 *
 *   boosters (op*, eb*, prb*)  .../renewal/images/products/boosters/{code}/img_item01.webp
 *   starter decks (st*)        .../renewal/images/products/decks/{code}/img_item01.webp
 *
 * Verified 2026-08-08 against all 51 codes: 50 return a 670x670 WebP with a
 * real alpha channel, every file byte-unique. The miss is `don` (DON!! Card
 * Collection) — a promo collection, not a boxed retail product, so no
 * packaging art exists to find. It keeps the priciest-card fallback.
 *
 * Usage:
 *   npx tsx scripts/upload-set-images.ts --dry-run       # fetch + report, writes nothing
 *   npx tsx scripts/upload-set-images.ts --sets=op15,st17
 *   npx tsx scripts/upload-set-images.ts                 # all sets missing art
 *   npx tsx scripts/upload-set-images.ts --force         # re-upload even if already on R2
 */
import "dotenv/config";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { prisma } from "./_db";

const CONCURRENCY = 5;
const DELAY_BETWEEN_BATCHES_MS = 200;

/** No retail product exists for these, so there is no packaging to fetch. */
const NO_PRODUCT_ART = new Set(["don"]);

const R2_ACCESS_KEY_ID = process.env.R2_ACCESS_KEY_ID!;
const R2_SECRET_ACCESS_KEY = process.env.R2_SECRET_ACCESS_KEY!;
const R2_ENDPOINT = process.env.R2_ENDPOINT!;
const R2_BUCKET = process.env.R2_BUCKET!;
const R2_PUBLIC_URL = process.env.NEXT_PUBLIC_R2_PUBLIC_URL!;

if (!R2_ACCESS_KEY_ID || !R2_SECRET_ACCESS_KEY || !R2_ENDPOINT || !R2_BUCKET || !R2_PUBLIC_URL) {
  console.error("Missing R2 environment variables. Check .env");
  process.exit(1);
}

const s3 = new S3Client({
  region: "auto",
  endpoint: R2_ENDPOINT,
  credentials: {
    accessKeyId: R2_ACCESS_KEY_ID,
    secretAccessKey: R2_SECRET_ACCESS_KEY,
  },
});

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

function officialArtUrl(setCode: string): string {
  const code = setCode.toLowerCase();
  const dir = code.startsWith("st") ? "decks" : "boosters";
  return `https://www.onepiece-cardgame.com/renewal/images/products/${dir}/${code}/img_item01.webp`;
}

/**
 * Card art already lives at `{setCode}/{cardCode}.png`, so a bare `op09.webp`
 * would sit next to a folder literally named `op09`. The prefix keeps them apart.
 */
function storagePath(setCode: string): string {
  return `sets/${setCode.toLowerCase()}.webp`;
}

async function downloadImage(url: string): Promise<Buffer | null> {
  try {
    const res = await fetch(url, {
      headers: { "User-Agent": "Mozilla/5.0 (compatible; MeeCard/1.0)" },
    });
    if (!res.ok) return null;
    // A 200 carrying HTML is the site's error page, not art.
    const type = res.headers.get("content-type") ?? "";
    if (!type.startsWith("image/")) return null;
    const arrayBuffer = await res.arrayBuffer();
    return Buffer.from(arrayBuffer);
  } catch {
    return null;
  }
}

async function uploadToR2(
  key: string,
  data: Buffer,
  contentType: string
): Promise<string | null> {
  try {
    await s3.send(new PutObjectCommand({
      Bucket: R2_BUCKET,
      Key: key,
      Body: data,
      ContentType: contentType,
    }));
    return `${R2_PUBLIC_URL}/${key}`;
  } catch (err) {
    console.warn(`    Upload error for ${key}: ${String(err)}`);
    return null;
  }
}

type SetRow = { id: number; code: string; boxImageUrl: string | null };

async function processSet(
  set: SetRow,
  dryRun: boolean
): Promise<{ ok: boolean; skipped?: boolean }> {
  const src = officialArtUrl(set.code);
  const buf = await downloadImage(src);
  if (!buf) {
    console.warn(`    FAIL download ${set.code}: ${src}`);
    return { ok: false };
  }

  const key = storagePath(set.code);

  if (dryRun) {
    console.log(`    ${set.code.padEnd(6)} ${String(buf.length).padStart(7)} bytes  →  ${R2_PUBLIC_URL}/${key}`);
    return { ok: true };
  }

  const publicUrl = await uploadToR2(key, buf, "image/webp");
  if (!publicUrl) return { ok: false };

  await prisma.cardSet.update({
    where: { id: set.id },
    data: { boxImageUrl: publicUrl },
  });

  console.log(`    ${set.code.padEnd(6)} uploaded (${buf.length} bytes)`);
  return { ok: true };
}

async function main() {
  const args = process.argv.slice(2);
  const force = args.includes("--force");
  const dryRun = args.includes("--dry-run");
  const setsArg = args.find((a) => a.startsWith("--sets="));
  const setsFilter = setsArg
    ? new Set(setsArg.replace("--sets=", "").split(",").map((s) => s.trim().toLowerCase()))
    : null;

  console.log("╔══════════════════════════════════════════════════╗");
  console.log("║   Upload Set Box Art to Cloudflare R2            ║");
  console.log("╚══════════════════════════════════════════════════╝");
  console.log(`  dry-run: ${dryRun}, force: ${force}, sets: ${setsFilter ? [...setsFilter].join(",") : "all"}\n`);

  const all = await prisma.cardSet.findMany({
    select: { id: true, code: true, boxImageUrl: true },
    orderBy: { code: "asc" },
  });

  const sets = all.filter((s) => {
    const code = s.code.toLowerCase();
    if (setsFilter && !setsFilter.has(code)) return false;
    if (NO_PRODUCT_ART.has(code)) {
      console.log(`  SKIP ${code}: no retail product exists, keeps its card fallback`);
      return false;
    }
    if (!force && s.boxImageUrl?.includes(R2_PUBLIC_URL)) return false;
    return true;
  });

  console.log(`\n  ${sets.length} sets to fetch\n`);

  if (sets.length === 0) {
    console.log("  Nothing to do!");
    await prisma.$disconnect();
    return;
  }

  let uploaded = 0;
  let failed = 0;

  for (let i = 0; i < sets.length; i += CONCURRENCY) {
    const batch = sets.slice(i, i + CONCURRENCY);
    const results = await Promise.all(batch.map((s) => processSet(s, dryRun)));

    for (const r of results) {
      if (r.ok) uploaded++;
      else if (!r.skipped) failed++;
    }

    if (i + CONCURRENCY < sets.length) await sleep(DELAY_BETWEEN_BATCHES_MS);
  }

  console.log(`\n${"=".repeat(60)}`);
  console.log(dryRun ? "Dry run complete — nothing was written." : "Done!");
  console.log(`  ${dryRun ? "Would upload" : "Uploaded"}: ${uploaded}`);
  console.log(`  Failed:   ${failed}`);
  console.log(`  Total:    ${sets.length}`);
  console.log("=".repeat(60));

  await prisma.$disconnect();
}

main().catch((e) => {
  console.error("Fatal:", e);
  process.exit(1);
});
