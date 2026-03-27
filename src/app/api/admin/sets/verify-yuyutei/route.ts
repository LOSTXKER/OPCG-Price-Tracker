import { NextRequest, NextResponse } from "next/server";
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
  if (!(await checkIsAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const body = await request.json();
  const setCode: string = body.setCode;

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

    for (const listing of listings) {
      if (!listing.yuyuteiId) {
        stats.pending++;
        continue;
      }

      const rawCode = listing.cardCode?.toUpperCase() ?? "";
      const isDon = !rawCode || rawCode.includes("＊") || listing.name.includes("ドン!!");
      const parallel = isParallelCard(listing.name, listing.rarity ?? "");

      let matchedCardId: number | null = null;
      let matchMethod: string | null = null;
      let geminiScore: number | null = null;
      let status: string;

      if (isDon) {
        status = "rejected";
        matchMethod = null;
        stats.pending++;
      } else {
        // 1. Check cached yuyuteiId (global, not set-constrained)
        const cached = await prisma.card.findFirst({
          where: { yuyuteiId: listing.yuyuteiId },
          select: { id: true },
        });

        if (cached) {
          matchedCardId = cached.id;
          matchMethod = "cached";
          status = "matched";
          stats.cached++;
        }
        // 2. Non-parallel: exact cardCode match (global)
        else if (!parallel) {
          const exact = await prisma.card.findUnique({
            where: { cardCode: rawCode },
            select: { id: true },
          });
          if (exact) {
            matchedCardId = exact.id;
            matchMethod = "exact";
            status = "matched";
            stats.exact++;
          } else {
            status = "pending";
            stats.pending++;
          }
        }
        // 3. Parallel: Gemini AI image match
        else if (listing.imageUrl) {
          // Search in the same set first, then fall back to global
          let candidates = await prisma.card.findMany({
            where: { baseCode: rawCode, isParallel: true, setId: cardSet.id },
            select: { id: true, cardCode: true, imageUrl: true },
          });

          if (candidates.length === 0) {
            candidates = await prisma.card.findMany({
              where: { baseCode: rawCode, isParallel: true },
              select: { id: true, cardCode: true, imageUrl: true },
            });
          }

          const validCandidates: MatchCandidate[] = candidates
            .filter((c) => c.imageUrl)
            .map((c) => ({
              cardId: c.id,
              cardCode: c.cardCode,
              imageUrl: c.imageUrl!,
            }));

          if (validCandidates.length > 0) {
            const aiResult = await matchCardImage(
              listing.imageUrl,
              validCandidates
            );
            if (aiResult && aiResult.confidence >= 0.5) {
              matchedCardId = aiResult.cardId;
              matchMethod = "gemini";
              geminiScore = aiResult.confidence;
              status = "matched";
              stats.aiMatched++;

              await prisma.card.update({
                where: { id: aiResult.cardId },
                data: {
                  yuyuteiId: listing.yuyuteiId,
                  yuyuteiUrl: listing.cardUrl,
                },
              });
            } else {
              status = "pending";
              stats.pending++;
            }
          } else {
            status = "pending";
            stats.pending++;
          }
        } else {
          status = "pending";
          stats.pending++;
        }
      }

      await prisma.yuyuteiMapping.upsert({
        where: {
          setCode_yuyuteiId: {
            setCode,
            yuyuteiId: listing.yuyuteiId,
          },
        },
        create: {
          setCode,
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
        },
        update: {
          scrapedRarity: listing.rarity,
          scrapedName: listing.name,
          scrapedImage: listing.imageUrl,
          priceJpy: listing.priceJpy,
          matchedCardId,
          matchMethod,
          geminiScore,
          status,
        },
      });
    }

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
