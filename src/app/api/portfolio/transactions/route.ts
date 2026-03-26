import { getAuthUser } from "@/lib/api/auth";
import { prisma } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const dbUser = await getAuthUser();
    if (!dbUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const portfolioId = request.nextUrl.searchParams.get("portfolioId");

    const where: Record<string, unknown> = {
      portfolio: { userId: dbUser.id },
    };
    if (portfolioId) {
      where.portfolioId = parseInt(portfolioId, 10);
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
    console.error("GET /api/portfolio/transactions:", error);
    return NextResponse.json({ error: "Failed to load transactions" }, { status: 500 });
  }
}
