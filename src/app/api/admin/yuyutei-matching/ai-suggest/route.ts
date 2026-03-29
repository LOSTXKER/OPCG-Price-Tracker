import { NextRequest, NextResponse } from "next/server";
import { getAdminUser } from "@/lib/auth/get-admin-user";
import { prisma } from "@/lib/db";
import {
  matchCardImage,
  type MatchCandidate,
} from "@/lib/scraper/gemini-matcher";
import { unauthorized } from "@/lib/api/admin-helpers";

/**
 * POST /api/admin/yuyutei-matching/ai-suggest
 *
 * Single-item AI matching. Client handles the loop for bulk operations.
 * Body: { id: number }
 *
 * Returns: { success, matchedCardCode?, confidence?, error? }
 */
export async function POST(request: NextRequest) {
  const admin = await getAdminUser();
  if (!admin) return unauthorized();

  const body = await request.json();
  const { id } = body as { id: number };

  if (!id) {
    return NextResponse.json({ error: "id is required" }, { status: 400 });
  }

  const mapping = await prisma.yuyuteiMapping.findUnique({
    where: { id },
    select: {
      id: true,
      setCode: true,
      scrapedCode: true,
      scrapedImage: true,
      matchedCardId: true,
      matchMethod: true,
      status: true,
    },
  });

  if (!mapping) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  const force = body.force === true;

  if (mapping.status === "matched" && !force) {
    return NextResponse.json({ success: false, error: "Already approved", skipped: true });
  }
  if (mapping.matchMethod === "gemini" && !force) {
    return NextResponse.json({ success: false, error: "AI เคยจับคู่แล้ว", skipped: true });
  }

  const hdImage = mapping.scrapedImage?.replace(/\/\d+_\d+\//, "/front/");
  if (!hdImage) {
    return NextResponse.json(
      { success: false, error: "No image", skipped: true },
      { status: 200 }
    );
  }

  const code = mapping.scrapedCode.toUpperCase();
  const cardSet = await prisma.cardSet.findFirst({
    where: { code: { equals: mapping.setCode, mode: "insensitive" } },
  });
  if (!cardSet) {
    return NextResponse.json(
      { success: false, error: "Set not found", skipped: true },
      { status: 200 }
    );
  }

  const dbCandidates = await prisma.card.findMany({
    where: {
      OR: [{ cardCode: code }, { baseCode: code }],
      setId: cardSet.id,
    },
    select: { id: true, cardCode: true, imageUrl: true },
    orderBy: [{ isParallel: "asc" }, { parallelIndex: "asc" }],
  });

  const validCandidates: MatchCandidate[] = dbCandidates
    .filter((c) => c.imageUrl)
    .map((c) => ({
      cardId: c.id,
      cardCode: c.cardCode,
      imageUrl: c.imageUrl!,
    }));

  if (validCandidates.length === 0) {
    return NextResponse.json(
      { success: false, error: "No candidates", skipped: true },
      { status: 200 }
    );
  }

  try {
    const result = await matchCardImage(hdImage, validCandidates);

    if (result && result.confidence >= 0.3) {
      await prisma.yuyuteiMapping.update({
        where: { id: mapping.id },
        data: {
          matchedCardId: result.cardId,
          matchMethod: "gemini",
          geminiScore: result.confidence,
          status: "suggested",
          actionBy: admin.id,
          actionAt: new Date(),
        },
      });
      return NextResponse.json({
        success: true,
        matchedCardCode: result.cardCode,
        confidence: result.confidence,
      });
    }

    return NextResponse.json({
      success: false,
      error: "Low confidence",
      confidence: result?.confidence ?? 0,
    });
  } catch (e) {
    console.error(`[ai-suggest] Error for mapping ${mapping.id}:`, e);
    return NextResponse.json({
      success: false,
      error: e instanceof Error ? e.message : "AI call failed",
    });
  }
}
