import { NextRequest, NextResponse } from "next/server";
import { getAdminUser } from "@/lib/auth/get-admin-user";
import { prisma } from "@/lib/db";
import { unauthorized, actionStamp, parseJsonBody } from "@/lib/api/admin-helpers";
import { parsePageLimit } from "@/lib/api/request-body";

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
  const { page, limit, skip } = parsePageLimit(sp, { defaultLimit: 20, maxLimit: 1000 });

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

  // Batch-resolve candidates for pending/suggested mappings to avoid N+1 queries.
  type CandidateCard = {
    id: number; cardCode: string; baseCode: string | null; imageUrl: string | null;
    parallelIndex: number | null; rarity: string; nameJp: string; nameEn: string | null;
    isParallel: boolean; setId: number;
  };

  // key = `${setId}:${cardCode}` → cards
  const candidatesByKey = new Map<string, CandidateCard[]>();
  // mapping.id → lookup key
  const mappingToKey = new Map<number, string>();

  const candidateMappings = mappings.filter(
    (m) => (m.status === "pending" || m.status === "suggested") && m.scrapedCode,
  );

  if (candidateMappings.length > 0) {
    const uniqueSetCodes = [...new Set(candidateMappings.map((m) => m.setCode.toLowerCase()))];
    const cardSets = await prisma.cardSet.findMany({
      where: { code: { in: uniqueSetCodes } },
      select: { id: true, code: true },
    });
    const setCodeToId = new Map(cardSets.map((s) => [s.code.toLowerCase(), s.id]));

    const allSetIds = [...new Set(
      candidateMappings
        .map((m) => setCodeToId.get(m.setCode.toLowerCase()))
        .filter((id): id is number => id != null),
    )];
    const uniqueCodes = [...new Set(candidateMappings.map((m) => m.scrapedCode!.toUpperCase()))];

    if (allSetIds.length > 0 && uniqueCodes.length > 0) {
      const allCards = await prisma.card.findMany({
        where: {
          setId: { in: allSetIds },
          OR: [{ cardCode: { in: uniqueCodes } }, { baseCode: { in: uniqueCodes } }],
        },
        select: {
          id: true, cardCode: true, baseCode: true, imageUrl: true, parallelIndex: true,
          rarity: true, nameJp: true, nameEn: true, isParallel: true, setId: true,
        },
        orderBy: [{ isParallel: "asc" }, { parallelIndex: "asc" }],
      });

      // Group cards by `${setId}:${code}` for fast per-mapping lookup
      for (const card of allCards) {
        for (const code of [card.cardCode, card.baseCode].filter(Boolean) as string[]) {
          const key = `${card.setId}:${code}`;
          if (!candidatesByKey.has(key)) candidatesByKey.set(key, []);
          const bucket = candidatesByKey.get(key)!;
          if (!bucket.find((c) => c.id === card.id)) bucket.push(card);
        }
      }

      // Pre-compute each mapping's key
      for (const m of candidateMappings) {
        const setId = setCodeToId.get(m.setCode.toLowerCase());
        if (setId) mappingToKey.set(m.id, `${setId}:${m.scrapedCode!.toUpperCase()}`);
      }
    }
  }

  const enriched = mappings.map((m) => {
    const key = mappingToKey.get(m.id);
    const candidates = key ? (candidatesByKey.get(key) ?? []) : [];
    return { ...m, candidates };
  });

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

  const parsed = await parseJsonBody<{
    action?: string; set?: string; ids?: number[]; overrides?: Record<string, number>;
    id?: number; matchedCardId?: number;
  }>(request);
  if (!parsed.ok) return parsed.response;
  const body = parsed.body;
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

    await prisma.$transaction([
      prisma.yuyuteiMapping.updateMany({
        where: { id: { in: toApprove.map((m) => m.id) } },
        data: { status: "matched", matchMethod: "admin-bulk", ...stamp },
      }),
      ...toApprove.map((m) =>
        prisma.card.update({
          where: { id: m.matchedCardId! },
          data: { yuyuteiId: m.yuyuteiId, latestPriceJpy: m.priceJpy },
        })
      ),
      ...toApprove.map((m) =>
        prisma.cardPrice.create({
          data: { cardId: m.matchedCardId!, source: "YUYUTEI", type: "SELL", priceJpy: m.priceJpy, inStock: true },
        })
      ),
    ]);

    return NextResponse.json({ success: true, approved: toApprove.length });
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

    const toProcess = mappings
      .map((m) => ({ ...m, cardId: overrides[String(m.id)] ?? m.matchedCardId }))
      .filter((m): m is typeof m & { cardId: number } => m.cardId != null);

    await prisma.$transaction([
      ...toProcess.map((m) =>
        prisma.yuyuteiMapping.update({
          where: { id: m.id },
          data: { status: "matched", matchMethod: "admin-bulk", matchedCardId: m.cardId, ...stamp },
        })
      ),
      ...toProcess.map((m) =>
        prisma.card.update({
          where: { id: m.cardId },
          data: { yuyuteiId: m.yuyuteiId, latestPriceJpy: m.priceJpy },
        })
      ),
      ...toProcess.map((m) =>
        prisma.cardPrice.create({
          data: { cardId: m.cardId, source: "YUYUTEI", type: "SELL", priceJpy: m.priceJpy, inStock: true },
        })
      ),
    ]);

    return NextResponse.json({ success: true, approved: toProcess.length });
  }

  // ── Bulk reject selected IDs ──
  if (body.action === "bulk-reject-ids") {
    const ids: number[] = body.ids ?? [];
    if (ids.length === 0) return NextResponse.json({ success: true, rejected: 0 });

    const { count } = await prisma.yuyuteiMapping.updateMany({
      where: { id: { in: ids }, status: { not: "matched" } },
      data: { status: "rejected", ...stamp },
    });

    return NextResponse.json({ success: true, rejected: count });
  }

  // ── Single actions ──
  const { id, matchedCardId, action } = body;

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

  const parsed = await parseJsonBody<{ id: number }>(request);
  if (!parsed.ok) return parsed.response;
  const { id } = parsed.body;
  if (!id) return NextResponse.json({ error: "id is required" }, { status: 400 });

  await prisma.yuyuteiMapping.update({
    where: { id },
    data: { status: "rejected", ...actionStamp(admin.id) },
  });

  return NextResponse.json({ success: true });
}
