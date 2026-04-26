import { NextRequest, NextResponse } from "next/server";
import { adminApiHandler } from "@/lib/api/api-handler";
import { prisma } from "@/lib/db";
import type { Prisma } from "@/generated/prisma/client";

export const GET = adminApiHandler(async (request: NextRequest) => {
  const sp = request.nextUrl.searchParams;
  const page = Math.max(1, Number(sp.get("page") || 1));
  const limit = Math.min(100, Math.max(1, Number(sp.get("limit") || 30)));
  const type = sp.get("type") || "";
  const skip = (page - 1) * limit;

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

  return NextResponse.json({
    transactions,
    total,
    page,
    limit,
    hasMore: skip + transactions.length < total,
  });
});
