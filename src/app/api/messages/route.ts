import { getAuthUser } from "@/lib/api/auth";
import { prisma } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const dbUser = await getAuthUser();
    if (!dbUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const listingId = request.nextUrl.searchParams.get("listingId");
    if (!listingId) {
      return NextResponse.json({ error: "listingId is required" }, { status: 400 });
    }

    const messages = await prisma.message.findMany({
      where: {
        listingId: parseInt(listingId, 10),
        OR: [{ senderId: dbUser.id }, { receiverId: dbUser.id }],
      },
      orderBy: { createdAt: "asc" },
      include: {
        sender: { select: { displayName: true, avatarUrl: true } },
      },
    });

    await prisma.message.updateMany({
      where: {
        listingId: parseInt(listingId, 10),
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

    const body = (await request.json()) as {
      listingId: number;
      content: string;
    };

    if (!body.listingId || !body.content?.trim()) {
      return NextResponse.json({ error: "listingId and content required" }, { status: 400 });
    }

    const listing = await prisma.listing.findUnique({
      where: { id: body.listingId },
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
        listingId: body.listingId,
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
