import { getAuthUser } from "@/lib/api/auth";
import { prisma } from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const dbUser = await getAuthUser();
    if (!dbUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

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
            status: true,
            card: {
              select: { cardCode: true, nameJp: true, nameEn: true, imageUrl: true },
            },
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

    const conversations = messages.map((m) => {
      const otherUser =
        m.senderId === dbUser.id ? m.receiver : m.sender;
      return {
        listingId: m.listingId,
        listing: m.listing,
        otherUser,
        lastMessage: m.content,
        lastMessageAt: m.createdAt.toISOString(),
        unread: unreadMap.get(m.listingId) ?? 0,
      };
    });

    return NextResponse.json({ conversations });
  } catch (error) {
    console.error("GET /api/messages/conversations:", error);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
