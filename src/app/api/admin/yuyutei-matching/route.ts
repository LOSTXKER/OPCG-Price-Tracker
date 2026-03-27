import { NextRequest, NextResponse } from "next/server";
import { checkIsAdmin } from "@/lib/auth/check-admin";
import { prisma } from "@/lib/db";

/**
 * GET /api/admin/yuyutei-matching?set=&status=&page=
 * GET /api/admin/yuyutei-matching?summary=true  (lightweight per-set counts)
 *
 * List YuyuteiMapping records for admin review.
 */
export async function GET(request: NextRequest) {
  if (!(await checkIsAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const sp = request.nextUrl.searchParams;

  if (sp.get("summary") === "true") {
    const [allSets, totalBySet, pendingBySet] = await Promise.all([
      prisma.cardSet.findMany({
        select: { code: true, name: true, nameEn: true },
        orderBy: { code: "asc" },
      }),
      prisma.yuyuteiMapping.groupBy({
        by: ["setCode"],
        _count: { _all: true },
      }),
      prisma.yuyuteiMapping.groupBy({
        by: ["setCode"],
        _count: { _all: true },
        where: { status: "pending" },
      }),
    ]);

    const totalMap = Object.fromEntries(
      totalBySet.map((r) => [r.setCode, r._count._all])
    );
    const pendingMap = Object.fromEntries(
      pendingBySet.map((r) => [r.setCode, r._count._all])
    );

    const setCompletion: Record<string, { total: number; pending: number }> = {};
    for (const code of Object.keys(totalMap)) {
      setCompletion[code] = {
        total: totalMap[code] ?? 0,
        pending: pendingMap[code] ?? 0,
      };
    }

    return NextResponse.json({ sets: allSets, setCompletion });
  }

  const setFilter = sp.get("set") || "";
  const statusFilter = sp.get("status") || "";
  const sortBy = sp.get("sort") || "default";
  const page = Math.max(1, parseInt(sp.get("page") || "1"));
  const limit = 30;
  const skip = (page - 1) * limit;

  const where: Record<string, unknown> = {};
  if (setFilter) where.setCode = setFilter;
  if (statusFilter) where.status = statusFilter;

  const orderBy =
    sortBy === "recent"
      ? [{ updatedAt: "desc" as const }]
      : [{ status: "asc" as const }, { scrapedCode: "asc" as const }];

  const [mappings, total, sets, statusCounts] = await Promise.all([
    prisma.yuyuteiMapping.findMany({
      where,
      orderBy,
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
            parallelIndex: true,
          },
        },
      },
    }),
    prisma.yuyuteiMapping.count({ where }),
    prisma.cardSet
      .findMany({
        select: { code: true, name: true, nameEn: true },
        orderBy: { code: "asc" },
      }),
    prisma.yuyuteiMapping.groupBy({
      by: ["status"],
      _count: true,
      ...(setFilter ? { where: { setCode: setFilter } } : {}),
    }),
  ]);

  const enriched = await Promise.all(
    mappings.map(async (m) => {
      let candidates: {
        id: number;
        cardCode: string;
        imageUrl: string | null;
        parallelIndex: number | null;
        rarity: string;
      }[] = [];

      if (m.status === "pending" && m.scrapedCode) {
        const code = m.scrapedCode.toUpperCase();
        const cardSet = await prisma.cardSet.findFirst({
          where: { code: { equals: m.setCode, mode: "insensitive" } },
        });

        // Search in the same set first
        if (cardSet) {
          candidates = await prisma.card.findMany({
            where: {
              baseCode: code,
              isParallel: true,
              setId: cardSet.id,
            },
            select: {
              id: true,
              cardCode: true,
              imageUrl: true,
              parallelIndex: true,
              rarity: true,
            },
            orderBy: { parallelIndex: "asc" },
          });
        }

        // Fall back to global search across all sets
        if (candidates.length === 0) {
          candidates = await prisma.card.findMany({
            where: {
              baseCode: code,
              isParallel: true,
            },
            select: {
              id: true,
              cardCode: true,
              imageUrl: true,
              parallelIndex: true,
              rarity: true,
            },
            orderBy: { parallelIndex: "asc" },
          });
        }
      }

      return { ...m, candidates };
    })
  );

  const counts = Object.fromEntries(
    statusCounts.map((s) => [s.status, s._count])
  );

  return NextResponse.json({
    mappings: enriched,
    total,
    page,
    totalPages: Math.ceil(total / limit),
    sets,
    counts: {
      matched: counts.matched ?? 0,
      pending: counts.pending ?? 0,
      rejected: counts.rejected ?? 0,
    },
  });
}

/**
 * PATCH /api/admin/yuyutei-matching
 *
 * Admin approves/links a mapping, or unmatches it back to pending.
 * Body: { id: number, matchedCardId: number } — approve
 * Body: { id: number, action: "unmatch" }      — reset to pending
 */
export async function PATCH(request: NextRequest) {
  if (!(await checkIsAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const body = await request.json();
  const { id, matchedCardId, action } = body as {
    id: number;
    matchedCardId?: number;
    action?: string;
  };

  if (!id) {
    return NextResponse.json({ error: "id is required" }, { status: 400 });
  }

  const mapping = await prisma.yuyuteiMapping.findUnique({ where: { id } });
  if (!mapping) {
    return NextResponse.json(
      { error: "Mapping not found" },
      { status: 404 }
    );
  }

  if (action === "unmatch") {
    if (mapping.matchedCardId) {
      await prisma.card.update({
        where: { id: mapping.matchedCardId },
        data: { yuyuteiId: null, yuyuteiUrl: null },
      });
    }

    await prisma.yuyuteiMapping.update({
      where: { id },
      data: {
        matchedCardId: null,
        matchMethod: null,
        geminiScore: null,
        status: "pending",
      },
    });

    return NextResponse.json({ success: true });
  }

  if (!matchedCardId) {
    return NextResponse.json(
      { error: "matchedCardId is required" },
      { status: 400 }
    );
  }

  const card = await prisma.card.findUnique({
    where: { id: matchedCardId },
    select: { id: true },
  });
  if (!card) {
    return NextResponse.json(
      { error: "Card not found" },
      { status: 404 }
    );
  }

  await prisma.yuyuteiMapping.update({
    where: { id },
    data: {
      matchedCardId,
      matchMethod: "admin",
      status: "matched",
    },
  });

  await prisma.card.update({
    where: { id: matchedCardId },
    data: {
      yuyuteiId: mapping.yuyuteiId,
      yuyuteiUrl: undefined,
    },
  });

  return NextResponse.json({ success: true });
}

/**
 * DELETE /api/admin/yuyutei-matching
 *
 * Admin rejects a mapping.
 * Body: { id: number }
 */
export async function DELETE(request: NextRequest) {
  if (!(await checkIsAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const body = await request.json();
  const { id } = body as { id: number };

  if (!id) {
    return NextResponse.json(
      { error: "id is required" },
      { status: 400 }
    );
  }

  await prisma.yuyuteiMapping.update({
    where: { id },
    data: { status: "rejected" },
  });

  return NextResponse.json({ success: true });
}
