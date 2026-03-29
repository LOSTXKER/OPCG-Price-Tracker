import { NextRequest, NextResponse } from "next/server";
import { getAdminUser } from "@/lib/auth/get-admin-user";
import { prisma } from "@/lib/db";

function unauthorized() {
  return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
}

const actionStamp = (userId: string) => ({
  actionBy: userId,
  actionAt: new Date(),
});

/**
 * GET /api/admin/yuyutei-matching?set=&status=&page=
 */
export async function GET(request: NextRequest) {
  const admin = await getAdminUser();
  if (!admin) return unauthorized();

  const sp = request.nextUrl.searchParams;

  if (sp.get("summary") === "true") {
    const [allSets, statusBySet] = await Promise.all([
      prisma.cardSet.findMany({ select: { code: true, name: true, nameEn: true }, orderBy: { code: "asc" } }),
      prisma.yuyuteiMapping.groupBy({ by: ["setCode", "status"], _count: { _all: true } }),
    ]);

    const setCompletion: Record<string, { total: number; pending: number; suggested: number; matched: number }> = {};
    for (const row of statusBySet) {
      if (!setCompletion[row.setCode])
        setCompletion[row.setCode] = { total: 0, pending: 0, suggested: 0, matched: 0 };
      setCompletion[row.setCode].total += row._count._all;
      if (row.status === "pending") setCompletion[row.setCode].pending = row._count._all;
      if (row.status === "suggested") setCompletion[row.setCode].suggested = row._count._all;
      if (row.status === "matched") setCompletion[row.setCode].matched = row._count._all;
    }

    return NextResponse.json({ sets: allSets, setCompletion });
  }

  if (sp.get("ai-candidates") === "true") {
    const mode = sp.get("mode") || "new";
    const where: Record<string, unknown> = {
      scrapedImage: { not: null },
    };
    if (mode === "new") {
      where.status = { in: ["pending", "suggested"] };
      where.OR = [{ matchMethod: null }, { matchMethod: { not: "gemini" } }];
    } else {
      where.status = { in: ["pending", "suggested", "matched"] };
    }
    const setParam = sp.get("set");
    if (setParam) where.setCode = setParam;

    const items = await prisma.yuyuteiMapping.findMany({
      where,
      select: { id: true, scrapedCode: true, setCode: true },
      orderBy: { scrapedCode: "asc" },
    });
    return NextResponse.json({ items });
  }

  const setFilter = sp.get("set") || "";
  const statusFilter = sp.get("status") || "";
  const searchQuery = sp.get("q")?.trim() || "";
  const methodFilter = sp.get("method") || "";
  const confidenceFilter = sp.get("confidence") || "";
  const noMatchOnly = sp.get("noMatch") === "true";
  const hasCandidates = sp.get("hasCandidates");
  const page = Math.max(1, parseInt(sp.get("page") || "1", 10) || 1);
  const limit = Math.min(1000, Math.max(1, parseInt(sp.get("limit") || "20", 10) || 20));
  const skip = (page - 1) * limit;

  const where: Record<string, unknown> = {};
  if (setFilter) where.setCode = setFilter;
  if (statusFilter) where.status = statusFilter;
  if (searchQuery) {
    where.OR = [
      { scrapedCode: { contains: searchQuery, mode: "insensitive" } },
      { scrapedName: { contains: searchQuery, mode: "insensitive" } },
    ];
  }
  if (methodFilter) {
    where.matchMethod = methodFilter === "none" ? null : methodFilter;
  }
  if (confidenceFilter === "high") where.geminiScore = { gte: 0.8 };
  else if (confidenceFilter === "mid") where.geminiScore = { gte: 0.5, lt: 0.8 };
  else if (confidenceFilter === "low") where.geminiScore = { lt: 0.5, not: null };
  if (noMatchOnly) where.matchedCardId = null;
  if (hasCandidates === "no") where.matchedCardId = null;

  const [mappings, total, sets, statusCounts] = await Promise.all([
    prisma.yuyuteiMapping.findMany({
      where,
      orderBy: [{ status: "asc" }, { scrapedCode: "asc" }],
      skip,
      take: limit,
      include: {
        matchedCard: {
          select: { id: true, cardCode: true, nameJp: true, nameEn: true, rarity: true, imageUrl: true, isParallel: true, parallelIndex: true },
        },
        actionByUser: {
          select: { displayName: true, email: true },
        },
      },
    }),
    prisma.yuyuteiMapping.count({ where }),
    prisma.cardSet.findMany({ select: { code: true, name: true, nameEn: true }, orderBy: { code: "asc" } }),
    prisma.yuyuteiMapping.groupBy({
      by: ["status"],
      _count: true,
      where: Object.fromEntries(
        Object.entries(where).filter(([k]) => k !== "status")
      ),
    }),
  ]);

  const enriched = await Promise.all(
    mappings.map(async (m) => {
      let candidates: {
        id: number; cardCode: string; imageUrl: string | null; parallelIndex: number | null;
        rarity: string; nameJp: string; nameEn: string | null; isParallel: boolean;
      }[] = [];

      if ((m.status === "pending" || m.status === "suggested") && m.scrapedCode) {
        const code = m.scrapedCode.toUpperCase();
        const cardSet = await prisma.cardSet.findFirst({
          where: { code: { equals: m.setCode, mode: "insensitive" } },
        });

        if (cardSet) {
          candidates = await prisma.card.findMany({
            where: { OR: [{ cardCode: code }, { baseCode: code }], setId: cardSet.id },
            select: { id: true, cardCode: true, imageUrl: true, parallelIndex: true, rarity: true, nameJp: true, nameEn: true, isParallel: true },
            orderBy: [{ isParallel: "asc" }, { parallelIndex: "asc" }],
          });
        }
      }

      return { ...m, candidates };
    })
  );

  const counts = Object.fromEntries(statusCounts.map((s) => [s.status, s._count]));

  return NextResponse.json({
    mappings: enriched,
    total,
    page,
    totalPages: Math.ceil(total / limit),
    sets,
    counts: {
      matched: counts.matched ?? 0,
      pending: counts.pending ?? 0,
      suggested: counts.suggested ?? 0,
      rejected: counts.rejected ?? 0,
    },
  });
}

/**
 * PATCH /api/admin/yuyutei-matching
 */
export async function PATCH(request: NextRequest) {
  const admin = await getAdminUser();
  if (!admin) return unauthorized();

  const body = await request.json();
  const stamp = actionStamp(admin.id);

  // ── Bulk approve all with suggestion ──
  if (body.action === "bulk-approve") {
    const where: Record<string, unknown> = {
      status: { in: ["suggested", "pending"] },
      matchedCardId: { not: null },
    };
    if (body.set) where.setCode = body.set;

    const toApprove = await prisma.yuyuteiMapping.findMany({
      where,
      select: { id: true, matchedCardId: true, priceJpy: true, yuyuteiId: true },
    });

    let approved = 0;
    for (const m of toApprove) {
      await prisma.yuyuteiMapping.update({
        where: { id: m.id },
        data: { status: "matched", matchMethod: "admin-bulk", ...stamp },
      });
      await prisma.card.update({
        where: { id: m.matchedCardId! },
        data: { yuyuteiId: m.yuyuteiId, latestPriceJpy: m.priceJpy },
      });
      await prisma.cardPrice.create({
        data: { cardId: m.matchedCardId!, source: "YUYUTEI", type: "SELL", priceJpy: m.priceJpy, inStock: true },
      });
      approved++;
    }

    return NextResponse.json({ success: true, approved });
  }

  // ── Bulk approve selected IDs ──
  if (body.action === "bulk-approve-ids") {
    const ids: number[] = body.ids ?? [];
    const overrides: Record<string, number> = body.overrides ?? {};
    if (ids.length === 0) return NextResponse.json({ success: true, approved: 0 });

    const mappings = await prisma.yuyuteiMapping.findMany({
      where: { id: { in: ids }, status: { not: "matched" } },
      select: { id: true, matchedCardId: true, priceJpy: true, yuyuteiId: true },
    });

    let approved = 0;
    for (const m of mappings) {
      const cardId = overrides[String(m.id)] ?? m.matchedCardId;
      if (!cardId) continue;

      await prisma.yuyuteiMapping.update({
        where: { id: m.id },
        data: { status: "matched", matchMethod: "admin-bulk", matchedCardId: cardId, ...stamp },
      });
      await prisma.card.update({
        where: { id: cardId },
        data: { yuyuteiId: m.yuyuteiId, latestPriceJpy: m.priceJpy },
      });
      await prisma.cardPrice.create({
        data: { cardId, source: "YUYUTEI", type: "SELL", priceJpy: m.priceJpy, inStock: true },
      });
      approved++;
    }

    return NextResponse.json({ success: true, approved });
  }

  // ── Bulk reject selected IDs ──
  if (body.action === "bulk-reject-ids") {
    const ids: number[] = body.ids ?? [];
    if (ids.length === 0) return NextResponse.json({ success: true, rejected: 0 });

    for (const id of ids) {
      await prisma.yuyuteiMapping.updateMany({
        where: { id, status: { not: "matched" } },
        data: { status: "rejected", ...stamp },
      });
    }

    return NextResponse.json({ success: true, rejected: ids.length });
  }

  // ── Single actions ──
  const { id, matchedCardId, action } = body as { id: number; matchedCardId?: number; action?: string };

  if (!id) return NextResponse.json({ error: "id is required" }, { status: 400 });

  const mapping = await prisma.yuyuteiMapping.findUnique({ where: { id } });
  if (!mapping) return NextResponse.json({ error: "Mapping not found" }, { status: 404 });

  // Unmatch
  if (action === "unmatch") {
    if (mapping.matchedCardId) {
      await prisma.card.update({
        where: { id: mapping.matchedCardId },
        data: { yuyuteiId: null, latestPriceJpy: null },
      });
    }
    await prisma.yuyuteiMapping.update({
      where: { id },
      data: { matchedCardId: null, matchMethod: null, geminiScore: null, status: "pending", ...stamp },
    });
    return NextResponse.json({ success: true });
  }

  // Single approve
  if (!matchedCardId) return NextResponse.json({ error: "matchedCardId is required" }, { status: 400 });

  const card = await prisma.card.findUnique({ where: { id: matchedCardId }, select: { id: true } });
  if (!card) return NextResponse.json({ error: "Card not found" }, { status: 404 });

  await prisma.yuyuteiMapping.update({
    where: { id },
    data: { matchedCardId, matchMethod: "admin", status: "matched", ...stamp },
  });
  await prisma.card.update({
    where: { id: matchedCardId },
    data: { yuyuteiId: mapping.yuyuteiId, latestPriceJpy: mapping.priceJpy },
  });
  await prisma.cardPrice.create({
    data: { cardId: matchedCardId, source: "YUYUTEI", type: "SELL", priceJpy: mapping.priceJpy, inStock: true },
  });

  return NextResponse.json({ success: true });
}

/**
 * DELETE /api/admin/yuyutei-matching  { id }
 */
export async function DELETE(request: NextRequest) {
  const admin = await getAdminUser();
  if (!admin) return unauthorized();

  const body = await request.json();
  const { id } = body as { id: number };
  if (!id) return NextResponse.json({ error: "id is required" }, { status: 400 });

  await prisma.yuyuteiMapping.update({
    where: { id },
    data: { status: "rejected", ...actionStamp(admin.id) },
  });

  return NextResponse.json({ success: true });
}
