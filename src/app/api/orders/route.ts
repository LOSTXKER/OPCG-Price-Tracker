import { requireAuthUser } from "@/lib/api/auth";
import { parseJsonBody, parsePageLimit } from "@/lib/api/request-body";
import { prisma } from "@/lib/db";
import { createLog } from "@/lib/logger";
import { NextRequest, NextResponse } from "next/server";
import { OrderStatus, type Prisma } from "@/generated/prisma/client";

const log = createLog("api:orders");

const ORDER_STATUSES = new Set(Object.values(OrderStatus));

export async function GET(request: NextRequest) {
  try {
    const auth = await requireAuthUser();
    if (!auth.ok) return auth.response;
    const userId = auth.user.id;

    const sp = request.nextUrl.searchParams;
    const role = sp.get("role");
    if (role !== "buyer" && role !== "seller") {
      return NextResponse.json(
        { error: "role must be 'buyer' or 'seller'" },
        { status: 400 }
      );
    }

    const { page, limit, skip } = parsePageLimit(sp);
    const statusParam = sp.get("status");

    const where: Prisma.OrderWhereInput =
      role === "buyer" ? { buyerId: userId } : { sellerId: userId };

    if (statusParam && statusParam !== "ALL" && ORDER_STATUSES.has(statusParam as OrderStatus)) {
      where.status = statusParam as OrderStatus;
    }

    const [orders, total, statusCounts] = await Promise.all([
      prisma.order.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
        include: {
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
        },
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

    return NextResponse.json({
      orders,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      statusCounts: counts,
    });
  } catch (error) {
    log.error("GET /api/orders", error);
    return NextResponse.json({ error: "Failed to load orders" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await requireAuthUser();
    if (!auth.ok) return auth.response;
    const dbUser = auth.user;

    const parsed = await parseJsonBody<{
      listingId: number;
    }>(request);
    if (!parsed.ok) return parsed.response;
    const { listingId } = parsed.body;

    if (!listingId) {
      return NextResponse.json(
        { error: "listingId is required" },
        { status: 400 }
      );
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
      return NextResponse.json({ error: "Listing not found" }, { status: 404 });
    }
    if (listing.status !== "ACTIVE") {
      return NextResponse.json(
        { error: "Listing is not active" },
        { status: 400 }
      );
    }
    if (listing.userId === dbUser.id) {
      return NextResponse.json(
        { error: "Cannot buy your own listing" },
        { status: 400 }
      );
    }

    const existingOrder = await prisma.order.findFirst({
      where: {
        listingId,
        buyerId: dbUser.id,
        status: { notIn: ["CANCELLED", "COMPLETED"] },
      },
    });
    if (existingOrder) {
      return NextResponse.json(
        { error: "You already have an active order for this listing" },
        { status: 400 }
      );
    }

    const result = await prisma.$transaction(async (tx) => {
      const order = await tx.order.create({
        data: {
          listingId,
          buyerId: dbUser.id,
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
          senderId: dbUser.id,
          receiverId: listing.userId,
          content: `ซื้อตามราคา ฿${(listing.priceThb || 0).toLocaleString()} - รอการชำระเงิน`,
          type: "ORDER_UPDATE",
          orderId: order.id,
        },
      });

      return order;
    });

    return NextResponse.json({ order: result }, { status: 201 });
  } catch (error) {
    log.error("POST /api/orders", error);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
