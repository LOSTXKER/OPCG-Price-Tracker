import { apiHandler } from "@/lib/api/api-handler";
import { requireAuthUser } from "@/lib/api/auth";
import { prisma } from "@/lib/db";
import { guardMarketplaceApi } from "@/lib/marketplace/feature-flag";
import { NextResponse } from "next/server";

export const GET = apiHandler(async () => {
  const blocked = await guardMarketplaceApi();
  if (blocked) return blocked;

  const auth = await requireAuthUser();
  if (!auth.ok) return auth.response;
  const dbUser = auth.user;

  const messages = await prisma.message.findMany({
    where: {
      OR: [{ senderId: dbUser.id }, { receiverId: dbUser.id }],
    },
    distinct: ["listingId"],
    orderBy: { createdAt: "desc" },
    include: {
      listing: {
        select: {
          id: true,
          priceJpy: true,
          priceThb: true,
          condition: true,
          status: true,
          card: {
            select: {
              cardCode: true,
              nameJp: true,
              nameEn: true,
              imageUrl: true,
              rarity: true,
              latestPriceJpy: true,
              latestPriceThb: true,
            },
          },
          user: { select: { id: true, displayName: true, avatarUrl: true } },
        },
      },
      sender: { select: { id: true, displayName: true, avatarUrl: true } },
      receiver: { select: { id: true, displayName: true, avatarUrl: true } },
    },
  });

  const unreadCounts = await prisma.message.groupBy({
    by: ["listingId"],
    where: { receiverId: dbUser.id, isRead: false },
    _count: true,
  });
  const unreadMap = new Map(
    unreadCounts.map((u) => [u.listingId, u._count])
  );

  const listingIds = messages.map((m) => m.listingId);

  const [latestOffers, activeOrders] = await Promise.all([
    prisma.offer.findMany({
      where: {
        listingId: { in: listingIds },
        OR: [{ buyerId: dbUser.id }, { sellerId: dbUser.id }],
        status: "PENDING",
      },
      select: {
        listingId: true,
        id: true,
        priceThb: true,
        status: true,
        buyerId: true,
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.order.findMany({
      where: {
        listingId: { in: listingIds },
        OR: [{ buyerId: dbUser.id }, { sellerId: dbUser.id }],
        status: { notIn: ["COMPLETED", "CANCELLED"] },
      },
      select: {
        listingId: true,
        id: true,
        status: true,
        priceThb: true,
        buyerId: true,
      },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  const offerMap = new Map<number, (typeof latestOffers)[0]>();
  for (const o of latestOffers) {
    if (!offerMap.has(o.listingId)) offerMap.set(o.listingId, o);
  }
  const orderMap = new Map<number, (typeof activeOrders)[0]>();
  for (const o of activeOrders) {
    if (!orderMap.has(o.listingId)) orderMap.set(o.listingId, o);
  }

  const conversations = messages.map((m) => {
    const otherUser =
      m.senderId === dbUser.id ? m.receiver : m.sender;
    const isSeller = m.listing.user.id === dbUser.id;
    return {
      listingId: m.listingId,
      listing: m.listing,
      otherUser,
      isSeller,
      lastMessage: m.content,
      lastMessageType: m.type,
      lastMessageAt: m.createdAt.toISOString(),
      unread: unreadMap.get(m.listingId) ?? 0,
      pendingOffer: offerMap.get(m.listingId) ?? null,
      activeOrder: orderMap.get(m.listingId) ?? null,
    };
  });

  return NextResponse.json({ conversations });
});
