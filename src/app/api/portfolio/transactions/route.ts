import { requireAuthUser } from "@/lib/api/auth";
import { prisma } from "@/lib/db";
import { createLog } from "@/lib/logger";
import { NextRequest, NextResponse } from "next/server";

const log = createLog("api:portfolio");

export async function GET(request: NextRequest) {
  try {
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

    return NextResponse.json({ transactions });
  } catch (error) {
    log.error("GET /api/portfolio/transactions", error);
    return NextResponse.json({ error: "Failed to load transactions" }, { status: 500 });
  }
}
