import { apiHandler } from "@/lib/api/api-handler";
import { requireAuthUser } from "@/lib/api/auth";
import { parseJsonBody } from "@/lib/api/request-body";
import { prisma } from "@/lib/db";
import { createLog } from "@/lib/logger";
import { NextRequest, NextResponse } from "next/server";

const log = createLog("api:messages");

export const GET = apiHandler(async (request: NextRequest) => {
  try {
    const auth = await requireAuthUser();
    if (!auth.ok) return auth.response;
    const dbUser = auth.user;

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
        offer: {
          select: {
            id: true,
            priceThb: true,
            status: true,
            note: true,
            buyerId: true,
            sellerId: true,
            parentId: true,
            createdAt: true,
          },
        },
        order: {
          select: {
            id: true,
            priceThb: true,
            status: true,
            trackingNumber: true,
            shippingMethod: true,
            createdAt: true,
          },
        },
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
        type: m.type,
        senderId: m.senderId,
        isOwn: m.senderId === dbUser.id,
        sender: m.sender,
        offer: m.offer,
        order: m.order,
        metadata: m.metadata,
        createdAt: m.createdAt.toISOString(),
      })),
    });
  } catch (error) {
    log.error("GET /api/messages", error);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
});

export const POST = apiHandler(async (request: NextRequest) => {
  try {
    const auth = await requireAuthUser();
    if (!auth.ok) return auth.response;
    const dbUser = auth.user;

    const parsed = await parseJsonBody<{
      listingId: number;
      content: string;
      type?: string;
    }>(request);
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

    // Find the other user in this conversation if sender is the listing owner
    let resolvedReceiverId = receiverId;
    if (!resolvedReceiverId) {
      const lastMsg = await prisma.message.findFirst({
        where: {
          listingId,
          OR: [{ senderId: dbUser.id }, { receiverId: dbUser.id }],
        },
        orderBy: { createdAt: "desc" },
        select: { senderId: true, receiverId: true },
      });
      if (lastMsg) {
        resolvedReceiverId =
          lastMsg.senderId === dbUser.id ? lastMsg.receiverId : lastMsg.senderId;
      }
    }

    if (!resolvedReceiverId) {
      return NextResponse.json(
        { error: "Cannot message your own listing without a conversation partner" },
        { status: 400 }
      );
    }

    const messageType = body.type === "IMAGE" ? "IMAGE" : "TEXT";

    const message = await prisma.message.create({
      data: {
        listingId,
        senderId: dbUser.id,
        receiverId: resolvedReceiverId,
        content: body.content.trim(),
        type: messageType as any,
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
          type: message.type,
          senderId: message.senderId,
          isOwn: true,
          sender: message.sender,
          offer: null,
          order: null,
          metadata: null,
          createdAt: message.createdAt.toISOString(),
        },
      },
      { status: 201 }
    );
  } catch (error) {
    log.error("POST /api/messages", error);
    return NextResponse.json({ error: "Failed to send" }, { status: 500 });
  }
});
