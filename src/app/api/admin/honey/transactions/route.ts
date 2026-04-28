import { NextRequest } from "next/server";
import { adminApiHandler } from "@/lib/api/api-handler";
import { paginatedJson } from "@/lib/api/list-response";
import { parsePageLimit } from "@/lib/api/request-body";
import { prisma } from "@/lib/db";
import type { Prisma } from "@/generated/prisma/client";

export const GET = adminApiHandler(async (request: NextRequest) => {
  const sp = request.nextUrl.searchParams;
  const { page, limit, skip } = parsePageLimit(sp, { defaultLimit: 30 });
  const type = sp.get("type") || "";

  const where: Prisma.HoneyTransactionWhereInput = {};
  if (type) {
    where.type = type as Prisma.HoneyTransactionWhereInput["type"];
  }

  const [transactions, total] = await Promise.all([
    prisma.honeyTransaction.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
      select: {
        id: true,
        amount: true,
        type: true,
        reason: true,
        createdAt: true,
        user: { select: { displayName: true, email: true } },
      },
    }),
    prisma.honeyTransaction.count({ where }),
  ]);

  return paginatedJson({
    rows: transactions,
    total,
    page,
    limit,
    itemsKey: "transactions",
  });
});
