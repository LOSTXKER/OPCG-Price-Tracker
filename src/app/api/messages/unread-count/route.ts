import { apiHandler } from "@/lib/api/api-handler";
import { requireAuthUser } from "@/lib/api/auth";
import { prisma } from "@/lib/db";
import { createLog } from "@/lib/logger";
import { NextResponse } from "next/server";

const log = createLog("api:messages");

export const GET = apiHandler(async () => {
  try {
    const auth = await requireAuthUser();
    if (!auth.ok) return NextResponse.json({ count: 0 });

    const count = await prisma.message.count({
      where: { receiverId: auth.user.id, isRead: false },
    });

    return NextResponse.json({ count });
  } catch (error) {
    log.error("GET /api/messages/unread-count", error);
    return NextResponse.json({ count: 0 });
  }
});
