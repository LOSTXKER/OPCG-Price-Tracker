/**
 * Migrate card images from Bandai CDN → Cloudflare R2.
 *
 * Reads original imageUrls from data/cards/*.json files,
 * downloads each image from Bandai CDN, uploads to R2,
 * and updates Card.imageUrl in the DB.
 *
 * Usage:
 *   npx tsx scripts/migrate-to-r2.ts              # migrate all
 *   npx tsx scripts/migrate-to-r2.ts --dry-run    # preview only
 *   npx tsx scripts/migrate-to-r2.ts --sets=op01  # specific sets
 */
import "dotenv/config";
import fs from "fs";
import path from "path";
import { S3Client, PutObjectCommand, HeadObjectCommand } from "@aws-sdk/client-s3";
import { prisma } from "./_db";

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

const CONCURRENCY = 8;
const DELAY_MS = 100;

const args = process.argv.slice(2);
const dryRun = args.includes("--dry-run");
const setsArg = args.find((a) => a.startsWith("--sets="));
const setsFilter = setsArg
  ? new Set(setsArg.replace("--sets=", "").split(",").map((s) => s.trim().toLowerCase()))
  : null;

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

function deriveSetCode(cardCode: string): string {
  const m = cardCode.match(/^(OP|EB|ST|PRB)(\d+)/i);
  if (!m) return "misc";
  return m[1].toLowerCase() + m[2].padStart(2, "0");
}

function r2Key(cardCode: string): string {
  const setCode = deriveSetCode(cardCode);
  const safe = cardCode.replace(/[^a-zA-Z0-9_-]/g, "_");
  return `${setCode}/${safe}.png`;
}

async function objectExistsInR2(key: string): Promise<boolean> {
  try {
    await s3.send(new HeadObjectCommand({ Bucket: R2_BUCKET, Key: key }));
    return true;
  } catch {
    return false;
  }
}

async function downloadImage(url: string): Promise<Buffer | null> {
  try {
    const res = await fetch(url, {
      headers: { "User-Agent": "Mozilla/5.0 (compatible; MeeCard/1.0)" },
    });
    if (!res.ok) return null;
    return Buffer.from(await res.arrayBuffer());
  } catch {
    return null;
  }
}

interface CardData {
  code: string;
  cardCode: string;
  imageUrl: string;
}

function loadJsonCards(): Map<string, string> {
  const dataDir = path.join(process.cwd(), "data", "cards");
  const files = fs.readdirSync(dataDir).filter((f) => f.endsWith(".json"));
  const map = new Map<string, string>();

  for (const file of files) {
    const setCode = file.replace(".json", "").toLowerCase();
    if (setsFilter && !setsFilter.has(setCode)) continue;

    const cards: CardData[] = JSON.parse(fs.readFileSync(path.join(dataDir, file), "utf8"));
    for (const c of cards) {
      if (c.imageUrl) {
        // Index by cardCode (unique variant key e.g. EB01-001_p1) AND code (base key)
        map.set(c.cardCode, c.imageUrl);
        if (!map.has(c.code)) map.set(c.code, c.imageUrl);
      }
    }
  }

  return map;
}

async function migrateCard(
  dbCard: { id: number; cardCode: string },
  originalUrl: string
): Promise<"migrated" | "skipped" | "failed"> {
  const key = r2Key(dbCard.cardCode);

  if (!dryRun) {
    const exists = await objectExistsInR2(key);
    if (exists) {
      const newUrl = `${R2_PUBLIC_URL}/${key}`;
      await prisma.card.update({ where: { id: dbCard.id }, data: { imageUrl: newUrl } });
      return "skipped";
    }
  }

  const buf = await downloadImage(originalUrl);
  if (!buf) {
    console.warn(`  FAIL ${dbCard.cardCode} — ${originalUrl}`);
    return "failed";
  }

  if (dryRun) {
    console.log(`  [dry-run] ${dbCard.cardCode} → ${key} (${buf.length} bytes)`);
    return "migrated";
  }

  try {
    await s3.send(new PutObjectCommand({
      Bucket: R2_BUCKET,
      Key: key,
      Body: buf,
      ContentType: originalUrl.endsWith(".jpg") ? "image/jpeg" : "image/png",
    }));
  } catch (err) {
    console.warn(`  FAIL upload ${dbCard.cardCode}: ${String(err)}`);
    return "failed";
  }

  const newUrl = `${R2_PUBLIC_URL}/${key}`;
  await prisma.card.update({ where: { id: dbCard.id }, data: { imageUrl: newUrl } });
  return "migrated";
}

async function main() {
  console.log("╔══════════════════════════════════════════════════════╗");
  console.log("║   Migrate Card Images: Bandai CDN → Cloudflare R2   ║");
  console.log("╚══════════════════════════════════════════════════════╝");
  if (dryRun) console.log("  ⚠️  DRY RUN — no changes will be made");
  console.log();

  // Load original URLs from JSON files
  const originalUrls = loadJsonCards();
  console.log(`  Loaded ${originalUrls.size} original image URLs from data/cards/\n`);

  // Fetch only cards still pointing to Supabase (skip already-migrated)
  const supabaseHost = new URL(process.env.NEXT_PUBLIC_SUPABASE_URL!).host;
  const whereClause = {
    imageUrl: { contains: supabaseHost },
    ...(setsFilter ? { set: { code: { in: [...setsFilter] } } } : {}),
  };

  const dbCards = await prisma.card.findMany({
    where: whereClause,
    select: { id: true, cardCode: true, baseCode: true },
    orderBy: { cardCode: "asc" },
  });

  // Match DB cards to original URLs — fall back to baseCode if no direct match
  const toMigrate = dbCards
    .map((c) => {
      const originalUrl = originalUrls.get(c.cardCode) ?? (c.baseCode ? originalUrls.get(c.baseCode) : undefined);
      return { ...c, originalUrl };
    })
    .filter((c): c is typeof c & { originalUrl: string } => !!c.originalUrl);

  const noSource = dbCards.length - toMigrate.length;
  console.log(`  Cards still on Supabase: ${dbCards.length}`);
  console.log(`  Cards with original URL: ${toMigrate.length}`);
  if (noSource > 0) console.log(`  No original URL found: ${noSource}`);
  console.log();

  if (toMigrate.length === 0) {
    console.log("  Nothing to migrate!");
    return;
  }

  let migrated = 0, skipped = 0, failed = 0;

  for (let i = 0; i < toMigrate.length; i += CONCURRENCY) {
    const batch = toMigrate.slice(i, i + CONCURRENCY);
    const results = await Promise.all(batch.map((c) => migrateCard(c, c.originalUrl)));

    for (const r of results) {
      if (r === "migrated") migrated++;
      else if (r === "skipped") skipped++;
      else failed++;
    }

    const done = Math.min(i + CONCURRENCY, toMigrate.length);
    if (done % 200 === 0 || done === toMigrate.length) {
      console.log(`  Progress: ${done}/${toMigrate.length} — uploaded: ${migrated}, skipped: ${skipped}, failed: ${failed}`);
    }

    if (i + CONCURRENCY < toMigrate.length) await sleep(DELAY_MS);
  }

  console.log(`\n${"=".repeat(57)}`);
  console.log(dryRun ? "Dry run complete!" : "Migration complete!");
  console.log(`  Uploaded: ${migrated}`);
  console.log(`  Skipped:  ${skipped} (already on R2)`);
  console.log(`  Failed:   ${failed}`);
  console.log("=".repeat(57));
}

main()
  .catch(console.error)
  .finally(() => void prisma.$disconnect());
