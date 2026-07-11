import { apiHandler } from "@/lib/api/api-handler";
import { requireAuthUser } from "@/lib/api/auth";
import { parseJsonBody } from "@/lib/api/request-body";
import { prisma } from "@/lib/db";
import { createLog } from "@/lib/logger";
import { guardMarketplaceApi } from "@/lib/marketplace/feature-flag";
import { notify } from "@/lib/notify/dispatch";
import { CreateMessageSchema } from "@/lib/messages/schemas";
import { NextRequest, NextResponse } from "next/server";

const log = createLog("api:messages");

export const GET = apiHandler(async (request: NextRequest) => {
  const blocked = await guardMarketplaceApi();
  if (blocked) return blocked;

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
});

export const POST = apiHandler(async (request: NextRequest) => {
  const blocked = await guardMarketplaceApi();
  if (blocked) return blocked;

  const auth = await requireAuthUser();
  if (!auth.ok) return auth.response;
  const dbUser = auth.user;

  const parsed = await parseJsonBody(request, CreateMessageSchema);
  if (!parsed.ok) return parsed.response;
  const body = parsed.body;

  const listingId = body.listingId;

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
      content: body.content,
      type: messageType,
    },
    include: {
      sender: { select: { displayName: true, avatarUrl: true } },
    },
  });

  // Best-effort: in-app + email/LINE depending on receiver prefs.
  notify({
    userId: resolvedReceiverId,
    kind: "MESSAGE",
    type: "MESSAGE_NEW",
    title: `New message from ${message.sender.displayName ?? "a buyer"}`,
    message:
      messageType === "IMAGE"
        ? "(image)"
        : message.content.length > 120
          ? `${message.content.slice(0, 117)}…`
          : message.content,
    data: { listingId, messageId: message.id, senderId: dbUser.id },
    // Coalesce a flurry of messages into a single bell row per
    // conversation per ~24h; the bell can deep-link to the thread.
    dedupKey: `message-thread:${listingId}:${dbUser.id}`,
  }).catch((err) => log.error("notify failed", err));

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
});
