import { NextRequest, NextResponse } from "next/server";
import { requireAuthUser } from "@/lib/api/auth";
import { apiHandler } from "@/lib/api/api-handler";
import { prisma } from "@/lib/db";

export const GET = apiHandler(async (request: NextRequest) => {
  const auth = await requireAuthUser();
  if (!auth.ok) return auth.response;

  const { searchParams } = request.nextUrl;
  const limit = Math.min(50, Number(searchParams.get("limit")) || 20);
  const cursor = Number(searchParams.get("cursor")) || undefined;

  const notifications = await prisma.notification.findMany({
    where: { userId: auth.user.id },
    orderBy: { createdAt: "desc" },
    take: limit,
    ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
  });

  const unreadCount = await prisma.notification.count({
    where: { userId: auth.user.id, read: false },
  });

  return NextResponse.json({
    notifications,
    unreadCount,
    nextCursor: notifications.length === limit ? notifications[notifications.length - 1]?.id : null,
  });
});
