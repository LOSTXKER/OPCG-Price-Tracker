import { NextRequest } from "next/server";
import { adminApiHandler } from "@/lib/api/api-handler";
import { paginatedJson } from "@/lib/api/list-response";
import { parsePageLimit } from "@/lib/api/request-body";
import { prisma } from "@/lib/db";

export const GET = adminApiHandler(async (request: NextRequest, _admin) => {
  const { searchParams } = request.nextUrl;
  const { page, limit, skip } = parsePageLimit(searchParams, { defaultLimit: 50 });
  const entity = searchParams.get("entity");
  const action = searchParams.get("action");
  const userId = searchParams.get("userId");

  const where: Record<string, unknown> = {};
  if (entity) where.entity = entity;
  if (action) where.action = { contains: action };
  if (userId) where.userId = userId;

  const [logs, total] = await Promise.all([
    prisma.auditLog.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
    }),
    prisma.auditLog.count({ where }),
  ]);

  // Legacy clients expect `{ logs, pagination: { page, limit, total, totalPages } }`.
  // Emit both shapes so existing pages keep working while new code can rely on
  // the standardized envelope (`items`, `total`, `totalPages`, …).
  return paginatedJson({
    rows: logs,
    total,
    page,
    limit,
    itemsKey: "logs",
    extra: {
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.max(1, Math.ceil(total / limit)),
      },
    },
  });
});
