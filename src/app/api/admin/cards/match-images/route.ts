import { NextRequest, NextResponse } from "next/server";
import { checkIsAdmin } from "@/lib/auth/check-admin";
import { prisma } from "@/lib/db";
import { GoogleGenAI } from "@google/genai";

const BANDAI_BASE = "https://www.onepiece-cardgame.com/images/cardlist/card";

async function headOk(url: string): Promise<boolean> {
  try {
    const res = await fetch(url, { method: "HEAD" });
    return res.ok;
  } catch {
    return false;
  }
}

async function discoverBandaiImages(
  baseCode: string
): Promise<{ index: number; url: string }[]> {
  const found: { index: number; url: string }[] = [];
  for (let p = 1; p <= 8; p++) {
    const url = `${BANDAI_BASE}/${baseCode}_p${p}.png`;
    if (await headOk(url)) {
      found.push({ index: p, url });
    } else {
      break;
    }
  }
  return found;
}

async function toBase64(url: string): Promise<string | null> {
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    const buf = Buffer.from(await res.arrayBuffer());
    return buf.toString("base64");
  } catch {
    return null;
  }
}

export async function POST(request: NextRequest) {
  if (!(await checkIsAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "GEMINI_API_KEY not configured" },
      { status: 500 }
    );
  }

  const body = await request.json();
  const setCode: string = body.setCode;

  if (!setCode) {
    return NextResponse.json(
      { error: "setCode is required" },
      { status: 400 }
    );
  }

  const dbSet = await prisma.cardSet.findUnique({ where: { code: setCode } });
  if (!dbSet) {
    return NextResponse.json({ error: "Set not found" }, { status: 404 });
  }

  const parallels = await prisma.card.findMany({
    where: {
      setId: dbSet.id,
      isParallel: true,
      OR: [
        { imageUrl: null },
        { imageUrl: "" },
        { imageUrl: { contains: "yuyu-tei" } },
      ],
    },
    select: {
      id: true,
      cardCode: true,
      baseCode: true,
      imageUrl: true,
      nameJp: true,
    },
  });

  if (parallels.length === 0) {
    return NextResponse.json({
      success: true,
      message: "No unmatched parallels found",
      matched: 0,
      failed: 0,
    });
  }

  const ai = new GoogleGenAI({ apiKey });
  let matched = 0;
  let failed = 0;

  // Group by baseCode for batch matching
  const groups = new Map<string, typeof parallels>();
  for (const card of parallels) {
    if (!card.baseCode) continue;
    if (!groups.has(card.baseCode)) groups.set(card.baseCode, []);
    groups.get(card.baseCode)!.push(card);
  }

  for (const [baseCode, cards] of groups) {
    const candidates = await discoverBandaiImages(baseCode);
    if (candidates.length === 0) {
      failed += cards.length;
      continue;
    }

    const candidateImages = await Promise.all(
      candidates.map(async (c) => ({
        ...c,
        b64: await toBase64(c.url),
      }))
    );
    const validCandidates = candidateImages.filter((c) => c.b64);

    if (validCandidates.length === 0) {
      failed += cards.length;
      continue;
    }

    for (const card of cards) {
      const refUrl =
        card.imageUrl && card.imageUrl.includes("yuyu-tei")
          ? card.imageUrl
          : null;

      if (!refUrl) {
        failed++;
        continue;
      }

      const refB64 = await toBase64(refUrl);
      if (!refB64) {
        failed++;
        continue;
      }

      try {
        const parts = [
          {
            inlineData: { mimeType: "image/jpeg", data: refB64 },
          },
          {
            text: `Reference image above is a card thumbnail. Below are ${validCandidates.length} candidate images numbered ${validCandidates.map((c) => c.index).join(", ")}. Which candidate number best matches the reference? Reply with ONLY the number.`,
          },
          ...validCandidates.map((c) => ({
            inlineData: { mimeType: "image/png", data: c.b64! },
          })),
        ];

        const response = await ai.models.generateContent({
          model: "gemini-2.0-flash",
          contents: [{ role: "user", parts }],
        });

        const text = response.text?.trim() || "";
        const match = text.match(/(\d+)/);
        if (match) {
          const pIndex = parseInt(match[1]);
          const chosen = validCandidates.find((c) => c.index === pIndex);
          if (chosen) {
            await prisma.card.update({
              where: { id: card.id },
              data: { imageUrl: chosen.url, parallelIndex: pIndex },
            });
            matched++;
            continue;
          }
        }
        failed++;
      } catch {
        failed++;
      }
    }
  }

  return NextResponse.json({
    success: true,
    matched,
    failed,
    total: parallels.length,
  });
}
