import { getAuthUser } from "@/lib/api/auth";
import { parseJsonBody } from "@/lib/api/request-body";
import { prisma } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const dbUser = await getAuthUser();
    if (!dbUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const listingId = request.nextUrl.searchParams.get("listingId");
    const listingIdNum = listingId ? parseInt(listingId, 10) : NaN;
    if (!listingId || isNaN(listingIdNum)) {
      return NextResponse.json({ error: "Valid listingId is required" }, { status: 400 });
    }

    const messages = await prisma.message.findMany({
      where: {
        listingId: listingIdNum,
        OR: [{ senderId: dbUser.id }, { receiverId: dbUser.id }],
      },
      orderBy: { createdAt: "asc" },
      include: {
        sender: { select: { displayName: true, avatarUrl: true } },
      },
    });

    await prisma.message.updateMany({
      where: {
        listingId: listingIdNum,
        receiverId: dbUser.id,
        isRead: false,
      },
      data: { isRead: true },
    });

    return NextResponse.json({
      messages: messages.map((m) => ({
        id: m.id,
        content: m.content,
        senderId: m.senderId,
        isOwn: m.senderId === dbUser.id,
        sender: m.sender,
        createdAt: m.createdAt.toISOString(),
      })),
    });
  } catch (error) {
    console.error("GET /api/messages:", error);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const dbUser = await getAuthUser();
    if (!dbUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const parsed = await parseJsonBody<{ listingId: number; content: string }>(request);
    if (!parsed.ok) return parsed.response;
    const body = parsed.body;

    const listingId = Number(body.listingId);
    if (!Number.isInteger(listingId) || listingId < 1) {
      return NextResponse.json({ error: "Valid listingId is required" }, { status: 400 });
    }
    if (!body.content?.trim()) {
      return NextResponse.json({ error: "content is required" }, { status: 400 });
    }

    const listing = await prisma.listing.findUnique({
      where: { id: listingId },
      select: { userId: true },
    });
    if (!listing) {
      return NextResponse.json({ error: "Listing not found" }, { status: 404 });
    }

    const receiverId =
      listing.userId === dbUser.id ? null : listing.userId;
    if (!receiverId) {
      return NextResponse.json(
        { error: "Cannot message your own listing" },
        { status: 400 }
      );
    }

    const message = await prisma.message.create({
      data: {
        listingId,
        senderId: dbUser.id,
        receiverId,
        content: body.content.trim(),
      },
      include: {
        sender: { select: { displayName: true, avatarUrl: true } },
      },
    });

    return NextResponse.json(
      {
        message: {
          id: message.id,
          content: message.content,
          senderId: message.senderId,
          isOwn: true,
          sender: message.sender,
          createdAt: message.createdAt.toISOString(),
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("POST /api/messages:", error);
    return NextResponse.json({ error: "Failed to send" }, { status: 500 });
  }
}
