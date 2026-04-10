import { NextResponse } from "next/server";
import { requireAuthUser } from "@/lib/api/auth";
import { prisma } from "@/lib/db";
import { ListingStatus, OrderStatus } from "@/generated/prisma/client";

export async function GET() {
  const auth = await requireAuthUser();
  if (!auth.ok) return auth.response;
  const userId = auth.user.id;

  const [
    totalListings,
    activeListings,
    soldListings,
    totalOrders,
    pendingOrders,
    totalRevenue,
    totalViews,
    avgRating,
    recentOrders,
  ] = await Promise.all([
    prisma.listing.count({ where: { userId } }),
    prisma.listing.count({ where: { userId, status: ListingStatus.ACTIVE } }),
    prisma.listing.count({ where: { userId, status: ListingStatus.SOLD } }),
    prisma.order.count({ where: { sellerId: userId } }),
    prisma.order.count({
      where: {
        sellerId: userId,
        status: { in: [OrderStatus.AWAITING_PAYMENT, OrderStatus.PAID] },
      },
    }),
    prisma.order.aggregate({
      where: { sellerId: userId, status: OrderStatus.COMPLETED },
      _sum: { priceThb: true },
    }),
    prisma.listing.aggregate({
      where: { userId },
      _sum: { viewCount: true },
    }),
    prisma.review.aggregate({
      where: { revieweeId: userId },
      _avg: { rating: true },
      _count: true,
    }),
    prisma.order.findMany({
      where: { sellerId: userId },
      orderBy: { createdAt: "desc" },
      take: 5,
      include: {
        listing: {
          include: {
            card: { select: { cardCode: true, nameEn: true, nameJp: true, imageUrl: true } },
          },
        },
        buyer: { select: { id: true, displayName: true, avatarUrl: true } },
      },
    }),
  ]);

  return NextResponse.json({
    totalListings,
    activeListings,
    soldListings,
    totalOrders,
    pendingOrders,
    totalRevenue: totalRevenue._sum.priceThb ?? 0,
    totalViews: totalViews._sum.viewCount ?? 0,
    avgRating: avgRating._avg.rating,
    reviewCount: avgRating._count,
    recentOrders,
  });
}
