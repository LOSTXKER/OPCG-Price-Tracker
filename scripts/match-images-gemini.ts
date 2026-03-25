/**
 * Gemini-powered parallel image matching.
 *
 * For each parallel card we have a unique Yuyu-tei thumbnail (reference).
 * We discover which Bandai _pN images exist via HEAD checks, then ask
 * Gemini Vision which candidate matches the reference art.
 *
 * Usage:
 *   GEMINI_API_KEY=xxx npx tsx scripts/match-images-gemini.ts
 *   --dry-run   : show matches without writing to DB
 *   --set op09  : only process a specific set
 *   --limit 20  : only process N cards (for testing)
 */
import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { GoogleGenAI } from "@google/genai";

const cs = process.env.DIRECT_URL || process.env.DATABASE_URL;
if (!cs) throw new Error("DATABASE_URL or DIRECT_URL required");
const adapter = new PrismaPg({ connectionString: cs });
const prisma = new PrismaClient({ adapter });

const GEMINI_KEY = process.env.GEMINI_API_KEY;
if (!GEMINI_KEY) throw new Error("GEMINI_API_KEY required in .env");

const ai = new GoogleGenAI({ apiKey: GEMINI_KEY });

const BANDAI_CDN = "https://asia-en.onepiece-cardgame.com/images/cardlist/card";
const MAX_P_INDEX = 10;
const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36";
const CONCURRENCY = 3;
const DELAY_BETWEEN_CALLS = 1200;

const args = process.argv.slice(2);
const DRY_RUN = args.includes("--dry-run");
const SET_FILTER = args.find((_, i, a) => a[i - 1] === "--set") ?? null;
const LIMIT = parseInt(args.find((_, i, a) => a[i - 1] === "--limit") ?? "0") || 0;

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

async function headOk(url: string): Promise<boolean> {
  try {
    const res = await fetch(url, { method: "HEAD", headers: { "User-Agent": UA } });
    return res.ok;
  } catch {
    return false;
  }
}

async function downloadAsBase64(url: string): Promise<string | null> {
  try {
    const res = await fetch(url, { headers: { "User-Agent": UA } });
    if (!res.ok) return null;
    const buf = Buffer.from(await res.arrayBuffer());
    return buf.toString("base64");
  } catch {
    return null;
  }
}

/** Discover which _pN images exist on Bandai CDN for a given baseCode */
async function discoverBandaiImages(baseCode: string): Promise<{ index: number; url: string }[]> {
  const found: { index: number; url: string }[] = [];
  const checks = [];
  for (let i = 1; i <= MAX_P_INDEX; i++) {
    const url = `${BANDAI_CDN}/${baseCode}_p${i}.png`;
    checks.push(headOk(url).then((ok) => ok && found.push({ index: i, url })));
  }
  await Promise.all(checks);
  return found.sort((a, b) => a.index - b.index);
}

interface MatchResult {
  cardId: number;
  cardCode: string;
  matchedIndex: number;
  matchedUrl: string;
  confidence: string;
}

/** Single-card matching: one reference vs multiple candidates */
async function matchSingleWithGemini(
  refBase64: string,
  refMime: string,
  candidates: { index: number; base64: string; mime: string }[]
): Promise<{ index: number; confidence: string } | null> {
  if (candidates.length === 0) return null;
  if (candidates.length === 1) return { index: candidates[0].index, confidence: "only-candidate" };

  const parts: Array<{ inlineData: { data: string; mimeType: string } } | { text: string }> = [];

  parts.push({ text: "Reference card image (from store listing):" });
  parts.push({ inlineData: { data: refBase64, mimeType: refMime } });

  parts.push({ text: `\nCandidate images (official card art). Which candidate shows the SAME card illustration/artwork as the reference? Cards may have different borders or frames but the core illustration must match.\n` });

  for (const c of candidates) {
    parts.push({ text: `Candidate ${c.index}:` });
    parts.push({ inlineData: { data: c.base64, mimeType: c.mime } });
  }

  parts.push({
    text: `\nRespond with ONLY the candidate number that matches the reference illustration. If none match, respond "NONE". Just the number, nothing else.`,
  });

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash",
      contents: [{ role: "user", parts }],
    });

    const answer = (response.text ?? "").trim();
    const num = parseInt(answer);
    if (!isNaN(num) && candidates.some((c) => c.index === num)) {
      return { index: num, confidence: "gemini" };
    }
    if (answer.toUpperCase() === "NONE") return null;
    console.warn(`    Unexpected Gemini response: "${answer}"`);
    return null;
  } catch (err) {
    console.error(`    Gemini error: ${(err as Error).message}`);
    return null;
  }
}

/** Batch matching: multiple references vs multiple candidates (1:1 unique assignment) */
async function matchBatchWithGemini(
  refs: { label: string; base64: string; mime: string }[],
  candidates: { index: number; base64: string; mime: string }[]
): Promise<Map<string, number> | null> {
  const parts: Array<{ inlineData: { data: string; mimeType: string } } | { text: string }> = [];

  parts.push({ text: `I have ${refs.length} reference card images (from a store listing) and ${candidates.length} candidate images (official card art). Match each reference to the candidate with the SAME illustration/artwork. Each candidate can only be used ONCE.\n` });

  for (const r of refs) {
    parts.push({ text: `Reference "${r.label}":` });
    parts.push({ inlineData: { data: r.base64, mimeType: r.mime } });
  }

  parts.push({ text: "\nCandidate images:\n" });
  for (const c of candidates) {
    parts.push({ text: `Candidate ${c.index}:` });
    parts.push({ inlineData: { data: c.base64, mimeType: c.mime } });
  }

  parts.push({
    text: `\nFor each reference, respond with: "LABEL=NUMBER" (one per line). Each candidate number must be used at most once. If a reference has no match, use "LABEL=NONE".\nExample:\nA=1\nB=3\nC=2`,
  });

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash",
      contents: [{ role: "user", parts }],
    });

    const answer = (response.text ?? "").trim();
    const result = new Map<string, number>();
    const usedIndices = new Set<number>();

    for (const line of answer.split("\n")) {
      const m = line.trim().match(/^([A-Z]+)\s*=\s*(\d+|NONE)$/i);
      if (m) {
        const label = m[1].toUpperCase();
        if (m[2].toUpperCase() !== "NONE") {
          const idx = parseInt(m[2]);
          if (!isNaN(idx) && candidates.some((c) => c.index === idx) && !usedIndices.has(idx)) {
            result.set(label, idx);
            usedIndices.add(idx);
          }
        }
      }
    }

    return result.size > 0 ? result : null;
  } catch (err) {
    console.error(`    Gemini batch error: ${(err as Error).message}`);
    return null;
  }
}

async function main() {
  console.log("=== Gemini Image Matching ===");
  console.log(`  Mode: ${DRY_RUN ? "DRY RUN" : "LIVE (will update DB)"}`);
  if (SET_FILTER) console.log(`  Set filter: ${SET_FILTER}`);
  if (LIMIT) console.log(`  Limit: ${LIMIT}`);

  // Load parallel cards
  const where: Record<string, unknown> = { isParallel: true, yuyuteiId: { not: null } };
  if (SET_FILTER) {
    where.set = { code: SET_FILTER };
  }

  const parallels = await prisma.card.findMany({
    where,
    select: {
      id: true, cardCode: true, baseCode: true, nameJp: true,
      yuyuteiId: true, imageUrl: true, parallelIndex: true,
      set: { select: { code: true } },
    },
    orderBy: { cardCode: "asc" },
    ...(LIMIT ? { take: LIMIT } : {}),
  });

  console.log(`  Parallel cards to process: ${parallels.length}\n`);

  // Group by baseCode to batch Bandai discovery
  const groups = new Map<string, typeof parallels>();
  for (const c of parallels) {
    if (!c.baseCode) continue;
    if (!groups.has(c.baseCode)) groups.set(c.baseCode, []);
    groups.get(c.baseCode)!.push(c);
  }

  let processed = 0, matched = 0, updated = 0, skipped = 0, failed = 0;

  for (const [baseCode, cards] of groups) {
    console.log(`[${baseCode}] ${cards.length} parallel(s)`);

    // Discover Bandai candidates
    const bandaiImages = await discoverBandaiImages(baseCode);
    if (bandaiImages.length === 0) {
      console.log(`  No Bandai _pN images found, skipping`);
      skipped += cards.length;
      continue;
    }
    console.log(`  Bandai images: ${bandaiImages.map((b) => `_p${b.index}`).join(", ")}`);

    // Download all candidate images once
    const candidateData: { index: number; base64: string; mime: string }[] = [];
    for (const b of bandaiImages) {
      const b64 = await downloadAsBase64(b.url);
      if (b64) candidateData.push({ index: b.index, base64: b64, mime: "image/png" });
    }

    if (candidateData.length === 0) {
      console.log(`  Failed to download candidates, skipping`);
      skipped += cards.length;
      continue;
    }

    // Download all Yuyu-tei reference images for this group
    const refsWithData: { card: typeof cards[0]; base64: string }[] = [];
    for (const card of cards) {
      const yuyuUrl = `https://card.yuyu-tei.jp/opc/front/${card.set.code}/${card.yuyuteiId}.jpg`;
      const b64 = await downloadAsBase64(yuyuUrl);
      if (b64) {
        refsWithData.push({ card, base64: b64 });
      } else {
        console.log(`  ${card.cardCode}: Failed to download yuyu-tei ref, skipping`);
        skipped++;
      }
    }

    if (refsWithData.length === 0) continue;

    if (refsWithData.length === 1) {
      // Single parallel → single matching
      processed++;
      const { card, base64 } = refsWithData[0];
      const result = await matchSingleWithGemini(base64, "image/jpeg", candidateData);

      if (result) {
        const matchedUrl = `${BANDAI_CDN}/${baseCode}_p${result.index}.png`;
        console.log(`  ${card.cardCode}: → _p${result.index} (${result.confidence}) [UPDATED]`);
        if (!DRY_RUN) {
          await prisma.card.update({
            where: { id: card.id },
            data: { imageUrl: matchedUrl, parallelIndex: result.index },
          });
        }
        updated++; matched++;
      } else {
        console.log(`  ${card.cardCode}: NO MATCH`);
        failed++;
      }
      await sleep(DELAY_BETWEEN_CALLS);
    } else {
      // Multiple parallels → batch matching (ensures unique 1:1 assignment)
      const LABELS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
      const refs = refsWithData.map((r, i) => ({
        label: LABELS[i],
        base64: r.base64,
        mime: "image/jpeg",
      }));

      const batchResult = await matchBatchWithGemini(refs, candidateData);

      for (let i = 0; i < refsWithData.length; i++) {
        processed++;
        const { card } = refsWithData[i];
        const label = LABELS[i];
        const matchedIdx = batchResult?.get(label);

        if (matchedIdx != null) {
          const matchedUrl = `${BANDAI_CDN}/${baseCode}_p${matchedIdx}.png`;
          console.log(`  ${card.cardCode}: → _p${matchedIdx} (gemini-batch) [UPDATED]`);
          if (!DRY_RUN) {
            await prisma.card.update({
              where: { id: card.id },
              data: { imageUrl: matchedUrl, parallelIndex: matchedIdx },
            });
          }
          updated++; matched++;
        } else {
          console.log(`  ${card.cardCode}: NO MATCH in batch`);
          failed++;
        }
      }
      await sleep(DELAY_BETWEEN_CALLS);
    }
  }

  console.log(`\n=== Summary ===`);
  console.log(`  Processed: ${processed}`);
  console.log(`  Matched: ${matched}`);
  console.log(`  Updated: ${updated}`);
  console.log(`  Skipped: ${skipped}`);
  console.log(`  Failed: ${failed}`);
  if (DRY_RUN) console.log(`  (DRY RUN — no DB changes)`);

  await prisma.$disconnect();
}

main().catch((e) => { console.error(e); process.exit(1); });
