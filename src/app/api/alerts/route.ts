import {
  AlertChannel,
  AlertDirection,
  type AlertChannel as AlertChannelType,
  type AlertDirection as AlertDirectionType,
} from "@/generated/prisma/client";
import { getAuthUser } from "@/lib/api/auth";
import { cardInclude } from "@/lib/api/query-fragments";
import { prisma } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

const DIRECTIONS = new Set<string>(Object.values(AlertDirection));
const CHANNELS = new Set<string>(Object.values(AlertChannel));

function parseDirection(value: unknown): AlertDirectionType | null {
  if (typeof value !== "string" || !DIRECTIONS.has(value)) return null;
  return value as AlertDirectionType;
}

function parseChannel(value: unknown): AlertChannelType | null {
  if (typeof value !== "string" || !CHANNELS.has(value)) return null;
  return value as AlertChannelType;
}

export async function GET() {
  try {
    const dbUser = await getAuthUser();
    if (!dbUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const alerts = await prisma.priceAlert.findMany({
      where: { userId: dbUser.id },
      orderBy: { createdAt: "desc" },
      include: { card: { include: cardInclude } },
    });

    return NextResponse.json({ alerts });
  } catch (error) {
    console.error("GET /api/alerts:", error);
    return NextResponse.json({ error: "Failed to load alerts" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const dbUser = await getAuthUser();
    if (!dbUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    let body: Record<string, unknown>;
    try {
      body = (await request.json()) as Record<string, unknown>;
    } catch {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    const cardId = typeof body.cardId === "number" ? body.cardId : Number(body.cardId);
    const targetPriceRaw =
      typeof body.targetPrice === "number" ? body.targetPrice : Number(body.targetPrice);
    const direction = parseDirection(body.direction);
    const channel = parseChannel(body.channel) ?? AlertChannel.EMAIL;

    if (!Number.isInteger(cardId) || cardId < 1) {
      return NextResponse.json({ error: "Invalid cardId" }, { status: 400 });
    }
    if (!Number.isInteger(targetPriceRaw) || targetPriceRaw < 1) {
      return NextResponse.json({ error: "targetPrice must be a positive integer (JPY)" }, { status: 400 });
    }
    if (!direction) {
      return NextResponse.json({ error: "direction must be ABOVE or BELOW" }, { status: 400 });
    }
    if (body.channel !== undefined && parseChannel(body.channel) === null) {
      return NextResponse.json({ error: "Invalid channel" }, { status: 400 });
    }

    const card = await prisma.card.findUnique({ where: { id: cardId } });
    if (!card) {
      return NextResponse.json({ error: "Card not found" }, { status: 404 });
    }

    const alert = await prisma.priceAlert.create({
      data: {
        userId: dbUser.id,
        cardId,
        targetPrice: targetPriceRaw,
        direction,
        channel,
      },
      include: { card: { include: cardInclude } },
    });

    return NextResponse.json({ alert }, { status: 201 });
  } catch (error) {
    console.error("POST /api/alerts:", error);
    return NextResponse.json({ error: "Failed to create alert" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const dbUser = await getAuthUser();
    if (!dbUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const idParam = request.nextUrl.searchParams.get("id");
    const id = idParam ? Number(idParam) : NaN;
    if (!Number.isInteger(id) || id < 1) {
      return NextResponse.json({ error: "Query id is required and must be a positive integer" }, { status: 400 });
    }

    const alert = await prisma.priceAlert.findFirst({
      where: { id, userId: dbUser.id },
    });

    if (!alert) {
      return NextResponse.json({ error: "Alert not found" }, { status: 404 });
    }

    await prisma.priceAlert.delete({ where: { id } });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("DELETE /api/alerts:", error);
    return NextResponse.json({ error: "Failed to delete alert" }, { status: 500 });
  }
}
