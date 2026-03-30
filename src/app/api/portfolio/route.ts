import { requireAuthUser } from "@/lib/api/auth";
import { cardInclude } from "@/lib/api/query-fragments";
import { parseJsonBody } from "@/lib/api/request-body";
import { prisma } from "@/lib/db";
import { createLog } from "@/lib/logger";
import { NextRequest, NextResponse } from "next/server";

const log = createLog("api:portfolio");

export async function GET() {
  try {
    const auth = await requireAuthUser();
    if (!auth.ok) return auth.response;

    const portfolios = await prisma.portfolio.findMany({
      where: { userId: auth.user.id },
      orderBy: { updatedAt: "desc" },
      include: {
        items: {
          orderBy: { addedAt: "desc" },
          include: { card: { include: cardInclude } },
        },
      },
    });

    return NextResponse.json({ portfolios });
  } catch (error) {
    log.error("GET /api/portfolio", error);
    return NextResponse.json({ error: "Failed to load portfolios" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await requireAuthUser();
    if (!auth.ok) return auth.response;

    const parsed = await parseJsonBody<{ name?: string }>(request);
    if (!parsed.ok) return parsed.response;

    const name =
      typeof parsed.body.name === "string" ? parsed.body.name.trim() : "";

    if (!name || name.length > 120) {
      return NextResponse.json(
        { error: "name is required and must be at most 120 characters" },
        { status: 400 }
      );
    }

    const portfolio = await prisma.portfolio.create({
      data: {
        userId: auth.user.id,
        name,
      },
      include: {
        items: {
          include: { card: { include: cardInclude } },
        },
      },
    });

    return NextResponse.json({ portfolio }, { status: 201 });
  } catch (error) {
    log.error("POST /api/portfolio", error);
    return NextResponse.json({ error: "Failed to create portfolio" }, { status: 500 });
  }
}
