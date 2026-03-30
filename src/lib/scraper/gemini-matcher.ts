import { GoogleGenAI, type Part } from "@google/genai";
import { serverEnv } from "@/lib/env";
import { createLog } from "@/lib/logger";

const log = createLog("scraper:gemini");
const MODEL = "gemini-2.0-flash";

export interface MatchCandidate {
  cardId: number;
  cardCode: string;
  imageUrl: string;
}

export interface MatchResult {
  cardId: number;
  cardCode: string;
  confidence: number;
}

function getClient(): GoogleGenAI {
  const key = serverEnv().GEMINI_API_KEY;
  if (!key) throw new Error("GEMINI_API_KEY is not set");
  return new GoogleGenAI({ apiKey: key });
}

async function fetchImageAsBase64(
  url: string
): Promise<{ base64: string; mimeType: string } | null> {
  try {
    const res = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      },
    });
    if (!res.ok) return null;

    const contentType = res.headers.get("content-type") ?? "image/jpeg";
    const mimeType = contentType.split(";")[0].trim();
    const buffer = await res.arrayBuffer();
    const base64 = Buffer.from(buffer).toString("base64");
    return { base64, mimeType };
  } catch {
    return null;
  }
}

/**
 * Use Gemini Vision to match a Yuyutei listing image against DB candidate images.
 * Returns the best matching candidate with a confidence score, or null.
 */
export async function matchCardImage(
  yuyuteiImageUrl: string,
  candidates: MatchCandidate[]
): Promise<MatchResult | null> {
  if (candidates.length === 0) return null;
  if (candidates.length === 1) {
    return {
      cardId: candidates[0].cardId,
      cardCode: candidates[0].cardCode,
      confidence: 1.0,
    };
  }

  const ai = getClient();

  const yuyuteiImg = await fetchImageAsBase64(yuyuteiImageUrl);
  if (!yuyuteiImg) return null;

  const candidateImages: { candidate: MatchCandidate; img: Awaited<ReturnType<typeof fetchImageAsBase64>> }[] = [];
  for (const c of candidates) {
    const img = await fetchImageAsBase64(c.imageUrl);
    if (img) candidateImages.push({ candidate: c, img });
  }

  if (candidateImages.length === 0) return null;
  if (candidateImages.length === 1) {
    return {
      cardId: candidateImages[0].candidate.cardId,
      cardCode: candidateImages[0].candidate.cardCode,
      confidence: 0.8,
    };
  }

  const parts: Part[] = [
    {
      text: `You are a trading card identification expert. I have a reference card image from a Japanese card shop (Yuyutei) and ${candidateImages.length} candidate card images from the official database. Each candidate is a different parallel/variant version of the same card with different artwork.

Your task: Determine which candidate image shows the SAME card artwork as the reference image.

Reference image (from Yuyutei):`,
    },
    {
      inlineData: {
        data: yuyuteiImg.base64,
        mimeType: yuyuteiImg.mimeType,
      },
    },
  ];

  for (let i = 0; i < candidateImages.length; i++) {
    const { candidate, img } = candidateImages[i];
    parts.push({
      text: `\nCandidate ${i + 1} (${candidate.cardCode}):`,
    });
    parts.push({
      inlineData: {
        data: img!.base64,
        mimeType: img!.mimeType,
      },
    });
  }

  parts.push({
    text: `\nWhich candidate matches the reference image? Consider the card artwork, not the border or frame.
Reply with ONLY valid JSON, no markdown: {"choice": <1-based candidate number>, "confidence": <0.0 to 1.0>}`,
  });

  const MAX_RETRIES = 3;
  const RETRY_WAIT_SEC = [5, 10, 20];
  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      const response = await ai.models.generateContent({
        model: MODEL,
        contents: [{ role: "user", parts }],
        config: {
          temperature: 0,
          maxOutputTokens: 100,
        },
      });

      const text = response.text?.trim() ?? "";
      const json = text.replace(/```json\s*|\s*```/g, "").trim();
      const parsed = JSON.parse(json) as { choice: number; confidence: number };

      const idx = parsed.choice - 1;
      if (idx < 0 || idx >= candidateImages.length) return null;

      return {
        cardId: candidateImages[idx].candidate.cardId,
        cardCode: candidateImages[idx].candidate.cardCode,
        confidence: Math.min(1, Math.max(0, parsed.confidence)),
      };
    } catch (e: unknown) {
      const errStr = String(e);
      const status = (e as { status?: number }).status;
      const is429 =
        status === 429 ||
        errStr.includes("429") ||
        errStr.includes("RESOURCE_EXHAUSTED");

      if (is429 && attempt < MAX_RETRIES) {
        const waitSec = RETRY_WAIT_SEC[attempt];
        log.warn(
          `Rate limited (429), waiting ${waitSec}s before retry (attempt ${attempt + 1}/${MAX_RETRIES})`
        );
        await new Promise((r) => setTimeout(r, waitSec * 1000));
        continue;
      }

      log.error("Failed", e);
      return null;
    }
  }

  return null;
}

/**
 * Batch-match multiple Yuyutei parallel listings against DB cards for a single set.
 * Groups listings by baseCode, then calls Gemini for each group.
 */
export async function matchParallelsBatch(
  listings: {
    yuyuteiId: string;
    scrapedCode: string;
    imageUrl: string;
    name: string;
    rarity?: string;
  }[],
  dbCards: {
    id: number;
    cardCode: string;
    baseCode: string | null;
    imageUrl: string | null;
    isParallel: boolean;
  }[],
  options?: { delayMs?: number }
): Promise<
  Map<string, MatchResult & { yuyuteiId: string }>
> {
  const results = new Map<string, MatchResult & { yuyuteiId: string }>();
  const delay = options?.delayMs ?? 1000;

  const parallelsByBase = new Map<string, typeof dbCards>();
  for (const card of dbCards) {
    if (!card.isParallel || !card.baseCode) continue;
    const list = parallelsByBase.get(card.baseCode) ?? [];
    list.push(card);
    parallelsByBase.set(card.baseCode, list);
  }

  for (const listing of listings) {
    const code = listing.scrapedCode.toUpperCase();
    const candidates = parallelsByBase.get(code);
    if (!candidates || candidates.length === 0) continue;

    const validCandidates: MatchCandidate[] = candidates
      .filter((c) => c.imageUrl)
      .map((c) => ({
        cardId: c.id,
        cardCode: c.cardCode,
        imageUrl: c.imageUrl!,
      }));

    if (validCandidates.length === 0) continue;

    if (!listing.imageUrl) continue;

    const result = await matchCardImage(listing.imageUrl, validCandidates);
    if (result) {
      results.set(listing.yuyuteiId, { ...result, yuyuteiId: listing.yuyuteiId });
    }

    if (delay > 0) {
      await new Promise((r) => setTimeout(r, delay));
    }
  }

  return results;
}
