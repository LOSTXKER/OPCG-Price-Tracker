import { MappingStatus, MatchMethod } from "@/generated/prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { unauthorized, parseJsonBody } from "@/lib/api/admin-helpers";
import { checkIsAdmin } from "@/lib/auth/check-admin";
import { prisma } from "@/lib/db";
import {
  fetchWithRetry,
  getSetListingUrl,
  parseSetListingPage,
} from "@/lib/scraper/yuyu-tei";
import { isParallelCard } from "@/lib/scraper/parallel-utils";
import { matchCardImage, type MatchCandidate } from "@/lib/scraper/gemini-matcher";

/**
 * POST /api/admin/sets/verify-yuyutei
 *
 * Scrapes a Yuyutei set listing, matches non-parallel cards by cardCode,
 * and uses Gemini AI to match parallel cards by image comparison.
 * Stores all results in YuyuteiMapping for admin review.
 * Does NOT update prices — use scrape-prices for that.
 */
export async function POST(request: NextRequest) {
  if (!(await checkIsAdmin())) return unauthorized();

  const parsed = await parseJsonBody<{ setCode?: string }>(request);
  if (!parsed.ok) return parsed.response;

  const setCode: string = parsed.body.setCode ?? "";

  if (!setCode) {
    return NextResponse.json(
      { error: "setCode is required" },
      { status: 400 }
    );
  }

  try {
    const cardSet = await prisma.cardSet.findFirst({
      where: { code: { equals: setCode, mode: "insensitive" } },
    });

    if (!cardSet) {
      return NextResponse.json(
        { error: `Set ${setCode} not found in DB` },
        { status: 404 }
      );
    }

    const url = getSetListingUrl(setCode);
    const $ = await fetchWithRetry(url);
    const listings = parseSetListingPage($);

    if (listings.length === 0) {
      return NextResponse.json({
        success: true,
        setCode,
        message: "No cards found on Yuyu-tei",
        stats: { total: 0, cached: 0, exact: 0, aiMatched: 0, pending: 0 },
      });
    }

    const stats = { total: listings.length, cached: 0, exact: 0, aiMatched: 0, pending: 0 };

    // Batch pre-fetch: all yuyuteiIds and all non-parallel card codes
    const validListings = listings.filter((l) => l.yuyuteiId);
    const allYuyuteiIds = validListings.map((l) => l.yuyuteiId!);
    const nonParallelCodes = validListings
      .filter((l) => {
        const code = l.cardCode?.toUpperCase() ?? "";
        return code && !code.includes("＊") && !l.name.includes("ドン!!") && !isParallelCard(l.name, l.rarity ?? "");
      })
      .map((l) => l.cardCode!.toUpperCase());

    const [cachedCards, exactCards, parallelCandidates] = await Promise.all([
      prisma.card.findMany({
        where: { yuyuteiId: { in: allYuyuteiIds } },
        select: { id: true, yuyuteiId: true },
      }),
      nonParallelCodes.length > 0
        ? prisma.card.findMany({
            where: { cardCode: { in: nonParallelCodes } },
            select: { id: true, cardCode: true },
          })
        : Promise.resolve([]),
      prisma.card.findMany({
        where: { isParallel: true, setId: cardSet.id },
        select: { id: true, cardCode: true, baseCode: true, imageUrl: true },
      }),
    ]);

    const cachedByYuyuteiId = new Map(cachedCards.map((c) => [c.yuyuteiId!, c.id]));
    const exactByCode = new Map(exactCards.map((c) => [c.cardCode, c.id]));
    const parallelByBaseCode = new Map<string, typeof parallelCandidates>();
    for (const c of parallelCandidates) {
      if (!c.baseCode) continue;
      const arr = parallelByBaseCode.get(c.baseCode) ?? [];
      arr.push(c);
      parallelByBaseCode.set(c.baseCode, arr);
    }

    type MappingUpsert = {
      yuyuteiId: string;
      scrapedCode: string;
      scrapedRarity: string | null | undefined;
      scrapedName: string;
      scrapedImage: string | null | undefined;
      priceJpy: number;
      matchedCardId: number | null;
      matchMethod: MatchMethod | null;
      geminiScore: number | null;
      status: MappingStatus;
    };

    const geminiUpdates: { cardId: number; yuyuteiId: string; yuyuteiUrl: string | null }[] = [];
    const mappingRows: MappingUpsert[] = [];

    for (const listing of listings) {
      if (!listing.yuyuteiId) {
        stats.pending++;
        continue;
      }

      const rawCode = listing.cardCode?.toUpperCase() ?? "";
      const isDon = !rawCode || rawCode.includes("＊") || listing.name.includes("ドン!!");
      const parallel = isParallelCard(listing.name, listing.rarity ?? "");

      let matchedCardId: number | null = null;
      let matchMethod: MatchMethod | null = null;
      let geminiScore: number | null = null;
      let status: MappingStatus;

      if (isDon) {
        status = MappingStatus.REJECTED;
        stats.pending++;
      } else if (cachedByYuyuteiId.has(listing.yuyuteiId)) {
        matchedCardId = cachedByYuyuteiId.get(listing.yuyuteiId)!;
        matchMethod = MatchMethod.CACHED;
        status = MappingStatus.MATCHED;
        stats.cached++;
      } else if (!parallel) {
        const exactId = exactByCode.get(rawCode);
        if (exactId) {
          matchedCardId = exactId;
          matchMethod = MatchMethod.EXACT;
          status = MappingStatus.MATCHED;
          stats.exact++;
        } else {
          status = MappingStatus.PENDING;
          stats.pending++;
        }
      } else if (listing.imageUrl) {
        let candidates = parallelByBaseCode.get(rawCode) ?? [];
        if (candidates.length === 0) {
          candidates = await prisma.card.findMany({
            where: { baseCode: rawCode, isParallel: true },
            select: { id: true, cardCode: true, imageUrl: true, baseCode: true },
          });
        }

        const validCandidates: MatchCandidate[] = candidates
          .filter((c) => c.imageUrl)
          .map((c) => ({ cardId: c.id, cardCode: c.cardCode, imageUrl: c.imageUrl! }));

        if (validCandidates.length > 0) {
          const aiResult = await matchCardImage(listing.imageUrl, validCandidates);
          if (aiResult && aiResult.confidence >= 0.5) {
            matchedCardId = aiResult.cardId;
            matchMethod = MatchMethod.GEMINI;
            geminiScore = aiResult.confidence;
            status = MappingStatus.MATCHED;
            stats.aiMatched++;
            geminiUpdates.push({ cardId: aiResult.cardId, yuyuteiId: listing.yuyuteiId, yuyuteiUrl: listing.cardUrl ?? null });
          } else {
            status = MappingStatus.PENDING;
            stats.pending++;
          }
        } else {
          status = MappingStatus.PENDING;
          stats.pending++;
        }
      } else {
        status = MappingStatus.PENDING;
        stats.pending++;
      }

      mappingRows.push({
        yuyuteiId: listing.yuyuteiId,
        scrapedCode: listing.cardCode ?? "",
        scrapedRarity: listing.rarity,
        scrapedName: listing.name,
        scrapedImage: listing.imageUrl,
        priceJpy: listing.priceJpy,
        matchedCardId,
        matchMethod,
        geminiScore,
        status,
      });
    }

    // Batch writes: gemini card updates + mapping upserts
    await Promise.all([
      ...geminiUpdates.map((u) =>
        prisma.card.update({
          where: { id: u.cardId },
          data: { yuyuteiId: u.yuyuteiId, yuyuteiUrl: u.yuyuteiUrl },
        })
      ),
      ...mappingRows.map((row) =>
        prisma.yuyuteiMapping.upsert({
          where: { setCode_yuyuteiId: { setCode, yuyuteiId: row.yuyuteiId } },
          create: { setCode, ...row },
          update: {
            scrapedRarity: row.scrapedRarity,
            scrapedName: row.scrapedName,
            scrapedImage: row.scrapedImage,
            priceJpy: row.priceJpy,
            matchedCardId: row.matchedCardId,
            matchMethod: row.matchMethod,
            geminiScore: row.geminiScore,
            status: row.status,
          },
        })
      ),
    ]);

    return NextResponse.json({ success: true, setCode, stats });
  } catch (e) {
    return NextResponse.json(
      {
        error: `Verify failed: ${e instanceof Error ? e.message : String(e)}`,
      },
      { status: 502 }
    );
  }
}
