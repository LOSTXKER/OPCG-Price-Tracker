import { requireAuthUser } from "@/lib/api/auth";
import { apiHandler } from "@/lib/api/api-handler";
import { prisma } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

const BATCH_NOTE_PREFIX = "__portfolio_batch__:";

export const GET = apiHandler(async (request: NextRequest) => {
  const auth = await requireAuthUser();
  if (!auth.ok) return auth.response;

  const portfolioId = request.nextUrl.searchParams.get("portfolioId");

  const where: Record<string, unknown> = {
    portfolio: { userId: auth.user.id },
  };
  if (portfolioId) {
    const pid = parseInt(portfolioId, 10);
    if (isNaN(pid)) {
      return NextResponse.json({ error: "Invalid portfolioId" }, { status: 400 });
    }
    where.portfolioId = pid;
  }

  const transactions = await prisma.portfolioTransaction.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: 200,
    include: {
      card: {
        select: {
          cardCode: true,
          nameJp: true,
          nameEn: true,
          imageUrl: true,
          rarity: true,
        },
      },
    },
  });

  return NextResponse.json({
    transactions: transactions.map((transaction) => ({
      ...transaction,
      note: transaction.note?.startsWith(BATCH_NOTE_PREFIX)
        ? null
        : transaction.note,
    })),
  });
});

export const DELETE = apiHandler(async (request: NextRequest) => {
  const auth = await requireAuthUser();
  if (!auth.ok) return auth.response;

  const id = request.nextUrl.searchParams.get("id");
  if (!id) {
    return NextResponse.json({ error: "Missing id" }, { status: 400 });
  }

  const txId = parseInt(id, 10);
  if (isNaN(txId)) {
    return NextResponse.json({ error: "Invalid id" }, { status: 400 });
  }

  const tx = await prisma.portfolioTransaction.findUnique({
    where: { id: txId },
    include: { portfolio: { select: { userId: true } } },
  });

  if (!tx || tx.portfolio.userId !== auth.user.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  await prisma.portfolioTransaction.delete({ where: { id: txId } });

  return NextResponse.json({ ok: true });
});
