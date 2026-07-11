import { OrderStatus, type Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/db";
import { encodeOrderMessageEvent } from "@/lib/orders/message-events";
import { NextResponse } from "next/server";

const ORDER_STATUSES = new Set(Object.values(OrderStatus));

const orderInclude = {
  listing: {
    select: {
      id: true,
      priceJpy: true,
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
  },
  buyer: { select: { id: true, displayName: true, avatarUrl: true } },
  seller: { select: { id: true, displayName: true, avatarUrl: true } },
} as const satisfies Prisma.OrderInclude;

export type ListOrdersParams = {
  userId: string;
  role: "buyer" | "seller";
  status: string | null;
  page: number;
  limit: number;
  skip: number;
};

export async function listOrders(params: ListOrdersParams) {
  const { userId, role, status, page, limit, skip } = params;

  const where: Prisma.OrderWhereInput =
    role === "buyer" ? { buyerId: userId } : { sellerId: userId };

  if (status && status !== "ALL" && ORDER_STATUSES.has(status as OrderStatus)) {
    where.status = status as OrderStatus;
  }

  const [orders, total, statusCounts] = await Promise.all([
    prisma.order.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
      include: orderInclude,
    }),
    prisma.order.count({ where }),
    prisma.order.groupBy({
      by: ["status"],
      where: role === "buyer" ? { buyerId: userId } : { sellerId: userId },
      _count: true,
    }),
  ]);

  const counts: Record<string, number> = {};
  for (const row of statusCounts) {
    counts[row.status] = row._count;
  }

  return {
    orders,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
    statusCounts: counts,
  };
}

export type CreateOrderResult =
  | { ok: true; order: Awaited<ReturnType<typeof prisma.order.create>> }
  | { ok: false; response: NextResponse };

/**
 * Create a "buy listing at the asking price" order. Validates ownership,
 * status, dedupes against existing in-flight orders, and reserves the
 * listing in the same transaction so two buyers can't both win it.
 */
export async function createBuyNowOrder(
  buyerId: string,
  listingId: number,
): Promise<CreateOrderResult> {
  if (!listingId) {
    return {
      ok: false,
      response: NextResponse.json(
        { error: "listingId is required" },
        { status: 400 },
      ),
    };
  }

  const listing = await prisma.listing.findUnique({
    where: { id: listingId },
    select: {
      userId: true,
      status: true,
      priceThb: true,
      priceJpy: true,
    },
  });
  if (!listing) {
    return {
      ok: false,
      response: NextResponse.json({ error: "Listing not found" }, { status: 404 }),
    };
  }
  if (listing.status !== "ACTIVE") {
    return {
      ok: false,
      response: NextResponse.json(
        { error: "Listing is not active" },
        { status: 400 },
      ),
    };
  }
  if (listing.userId === buyerId) {
    return {
      ok: false,
      response: NextResponse.json(
        { error: "Cannot buy your own listing" },
        { status: 400 },
      ),
    };
  }

  const existingOrder = await prisma.order.findFirst({
    where: {
      listingId,
      buyerId,
      status: { notIn: ["CANCELLED", "COMPLETED"] },
    },
  });
  if (existingOrder) {
    return {
      ok: false,
      response: NextResponse.json(
        { error: "You already have an active order for this listing" },
        { status: 400 },
      ),
    };
  }

  const order = await prisma.$transaction(async (tx) => {
    const created = await tx.order.create({
      data: {
        listingId,
        buyerId,
        sellerId: listing.userId,
        priceThb: listing.priceThb || 0,
      },
    });

    await tx.listing.update({
      where: { id: listingId },
      data: { status: "RESERVED" },
    });

    await tx.message.create({
      data: {
        listingId,
        senderId: buyerId,
        receiverId: listing.userId,
        content: encodeOrderMessageEvent({
          kind: "order_created",
          priceThb: listing.priceThb || 0,
        }),
        type: "ORDER_UPDATE",
        orderId: created.id,
      },
    });

    return created;
  });

  return { ok: true, order };
}
