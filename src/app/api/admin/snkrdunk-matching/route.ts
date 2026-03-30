import { MappingStatus, MatchMethod } from "@/generated/prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { getAdminUser } from "@/lib/auth/get-admin-user";
import { prisma } from "@/lib/db";
import { fetchSnkrdunkPriceData, parseCardPageHtml } from "@/lib/scraper/snkrdunk";
import { autoMatchByProductNumber, upsertSnkrdunkPrices } from "@/lib/scraper/snkrdunk-matcher";
import { unauthorized, actionStamp, parseJsonBody } from "@/lib/api/admin-helpers";
import { parsePageLimit } from "@/lib/api/request-body";
import { createLog } from "@/lib/logger";

const log = createLog("admin:snkrdunk-matching");

/**
 * GET /api/admin/snkrdunk-matching
 * - ?summary=true  → status counts per set / overall
 * - default        → paginated mapping list with optional filters
 *
 * GET /api/admin/snkrdunk-matching?lookup=<snkrdunkId>
 * - Fetch SNKRDUNK page data for a given numeric ID (for admin preview)
 */
export async function GET(request: NextRequest) {
  const admin = await getAdminUser();
  if (!admin) return unauthorized();

  const sp = request.nextUrl.searchParams;

  // ── Lookup a SNKRDUNK ID (preview before adding mapping) ──
  const lookupId = sp.get("lookup");
  if (lookupId) {
    const id = parseInt(lookupId, 10);
    if (!id) return NextResponse.json({ error: "Invalid id" }, { status: 400 });

    try {
      const data = await fetchSnkrdunkPriceData(id);
      return NextResponse.json({ data });
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      return NextResponse.json({ error: msg }, { status: 502 });
    }
  }

  // ── Summary ──
  if (sp.get("summary") === "true") {
    const [total, byStatus] = await Promise.all([
      prisma.snkrdunkMapping.count(),
      prisma.snkrdunkMapping.groupBy({ by: ["status"], _count: { _all: true } }),
    ]);
    const counts = Object.fromEntries(byStatus.map((s) => [s.status, s._count._all]));
    return NextResponse.json({ total, counts });
  }

  // ── Paginated list ──
  const statusFilter = sp.get("status") || "";
  const searchQuery = sp.get("q")?.trim() || "";
  const { page, limit, skip } = parsePageLimit(sp, { defaultLimit: 20, maxLimit: 100 });

  const where: Record<string, unknown> = {};
  if (statusFilter) where.status = statusFilter;
  if (searchQuery) {
    where.OR = [
      { productNumber: { contains: searchQuery, mode: "insensitive" } },
      { scrapedName: { contains: searchQuery, mode: "insensitive" } },
    ];
  }

  const [mappings, total] = await Promise.all([
    prisma.snkrdunkMapping.findMany({
      where,
      orderBy: [{ status: "asc" }, { productNumber: "asc" }],
      skip,
      take: limit,
      include: {
        matchedCard: {
          select: {
            id: true,
            cardCode: true,
            nameJp: true,
            nameEn: true,
            rarity: true,
            imageUrl: true,
            isParallel: true,
          },
        },
        actionByUser: {
          select: { displayName: true, email: true },
        },
      },
    }),
    prisma.snkrdunkMapping.count({ where }),
  ]);

  // Batch-fetch candidate cards for all pending mappings in a single query
  const pendingProductNumbers = [
    ...new Set(
      mappings
        .filter((m) => m.status === MappingStatus.PENDING && m.productNumber)
        .map((m) => m.productNumber!.toLowerCase())
    ),
  ];

  type CandidateCard = {
    id: number;
    cardCode: string;
    nameJp: string;
    nameEn: string | null;
    rarity: string;
    imageUrl: string | null;
    isParallel: boolean;
  };

  let candidatesByPn = new Map<string, CandidateCard[]>();

  if (pendingProductNumbers.length > 0) {
    const allCandidates = await prisma.card.findMany({
      where: {
        OR: [
          { cardCode: { in: pendingProductNumbers, mode: "insensitive" } },
          { baseCode: { in: pendingProductNumbers, mode: "insensitive" } },
        ],
      },
      select: {
        id: true,
        cardCode: true,
        baseCode: true,
        nameJp: true,
        nameEn: true,
        rarity: true,
        imageUrl: true,
        isParallel: true,
      },
      orderBy: [{ isParallel: "asc" }, { parallelIndex: "asc" }],
    });

    for (const c of allCandidates) {
      const keys = new Set<string>();
      if (c.cardCode) keys.add(c.cardCode.toLowerCase());
      if (c.baseCode) keys.add(c.baseCode.toLowerCase());
      for (const key of keys) {
        if (pendingProductNumbers.includes(key)) {
          const arr = candidatesByPn.get(key) ?? [];
          arr.push(c);
          candidatesByPn.set(key, arr);
        }
      }
    }
  }

  const enriched = mappings.map((m) => {
    const candidates =
      m.status === MappingStatus.PENDING && m.productNumber
        ? (candidatesByPn.get(m.productNumber.toLowerCase()) ?? []).slice(0, 10)
        : [];
    return { ...m, candidates };
  });

  return NextResponse.json({
    mappings: enriched,
    total,
    page,
    totalPages: Math.ceil(total / limit),
  });
}

/**
 * POST /api/admin/snkrdunk-matching
 * Add a new SNKRDUNK mapping by ID (fetches data from SNKRDUNK automatically).
 * Body: { snkrdunkId: number }
 */
export async function POST(request: NextRequest) {
  const admin = await getAdminUser();
  if (!admin) return unauthorized();

  const parsed = await parseJsonBody<{ snkrdunkId: number }>(request);
  if (!parsed.ok) return parsed.response;
  const snkrdunkId = parseInt(String(parsed.body.snkrdunkId), 10);
  if (!snkrdunkId) {
    return NextResponse.json({ error: "snkrdunkId required" }, { status: 400 });
  }

  // Check if already exists
  const existing = await prisma.snkrdunkMapping.findUnique({
    where: { snkrdunkId },
  });
  if (existing) {
    return NextResponse.json({ error: "Already exists", mapping: existing }, { status: 409 });
  }

  // Fetch data from SNKRDUNK
  let html: string;
  try {
    const res = await fetch(`https://snkrdunk.com/en/trading-cards/${snkrdunkId}`, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      },
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    html = await res.text();
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: `Failed to fetch SNKRDUNK page: ${msg}` }, { status: 502 });
  }

  const summary = parseCardPageHtml(html);
  if (!summary) {
    return NextResponse.json(
      { error: "Could not parse card data from SNKRDUNK page. Ensure it is a single-card page." },
      { status: 422 }
    );
  }

  // Create mapping entry
  const mapping = await prisma.snkrdunkMapping.create({
    data: {
      snkrdunkId: summary.snkrdunkId,
      productNumber: summary.productNumber,
      scrapedName: summary.name,
      thumbnailUrl: summary.thumbnailUrl,
      minPriceUsd: summary.minPriceUsd,
      usedMinPriceUsd: summary.usedMinPriceUsd,
      status: MappingStatus.PENDING,
      ...actionStamp(admin.id),
    },
  });

  // Try auto-match by productNumber
  const autoMatched = await autoMatchByProductNumber(prisma);

  return NextResponse.json({ mapping, autoMatched }, { status: 201 });
}

/**
 * PATCH /api/admin/snkrdunk-matching
 * - Approve: { id, matchedCardId }
 * - Unmatch: { id, action: "unmatch" }
 * - Auto-match all pending: { action: "auto-match" }
 * - Refresh prices: { id, action: "refresh" }
 */
export async function PATCH(request: NextRequest) {
  const admin = await getAdminUser();
  if (!admin) return unauthorized();

  const parsed = await parseJsonBody<{
    action?: string; id?: number; matchedCardId?: number;
  }>(request);
  if (!parsed.ok) return parsed.response;
  const body = parsed.body;
  const stamp = actionStamp(admin.id);

  // ── Auto-match all pending ──
  if (body.action === "auto-match") {
    const count = await autoMatchByProductNumber(prisma);
    return NextResponse.json({ success: true, autoMatched: count });
  }

  const id = parseInt(String(body.id), 10);
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

  const mapping = await prisma.snkrdunkMapping.findUnique({ where: { id } });
  if (!mapping) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // ── Unmatch ──
  if (body.action === "unmatch") {
    await prisma.snkrdunkMapping.update({
      where: { id },
      data: { matchedCardId: null, matchMethod: null, status: MappingStatus.PENDING, ...stamp },
    });
    return NextResponse.json({ success: true });
  }

  // ── Refresh prices for this card ──
  if (body.action === "refresh") {
    if (!mapping.matchedCardId) {
      return NextResponse.json({ error: "Not matched to a card yet" }, { status: 400 });
    }
    try {
      const data = await fetchSnkrdunkPriceData(mapping.snkrdunkId);
      await upsertSnkrdunkPrices(prisma, mapping.matchedCardId, mapping.id, data);
      return NextResponse.json({
        success: true,
        psa10MinPriceUsd: data.psa10MinPriceUsd,
        psa10LastSoldUsd: data.psa10LastSoldUsd,
        lastSoldUsd: data.lastSoldUsd,
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      return NextResponse.json({ error: msg }, { status: 502 });
    }
  }

  // ── Approve / match to card ──
  const matchedCardId = parseInt(String(body.matchedCardId), 10);
  if (!matchedCardId) {
    return NextResponse.json({ error: "matchedCardId required" }, { status: 400 });
  }

  const card = await prisma.card.findUnique({ where: { id: matchedCardId }, select: { id: true } });
  if (!card) return NextResponse.json({ error: "Card not found" }, { status: 404 });

  await prisma.snkrdunkMapping.update({
    where: { id },
    data: { matchedCardId, matchMethod: MatchMethod.ADMIN, status: MappingStatus.MATCHED, ...stamp },
  });

  // Immediately fetch and store prices
  try {
    const data = await fetchSnkrdunkPriceData(mapping.snkrdunkId);
    await upsertSnkrdunkPrices(prisma, matchedCardId, id, data);
  } catch (err) {
    log.error("Price fetch after approve failed", err);
  }

  return NextResponse.json({ success: true });
}

/**
 * DELETE /api/admin/snkrdunk-matching  { id }
 * Reject (soft-delete) a mapping.
 */
export async function DELETE(request: NextRequest) {
  const admin = await getAdminUser();
  if (!admin) return unauthorized();

  const parsed = await parseJsonBody<{ id: number }>(request);
  if (!parsed.ok) return parsed.response;
  const id = parseInt(String(parsed.body.id), 10);
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

  await prisma.snkrdunkMapping.update({
    where: { id },
    data: { status: MappingStatus.REJECTED, ...actionStamp(admin.id) },
  });

  return NextResponse.json({ success: true });
}
