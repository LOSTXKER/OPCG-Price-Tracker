import { NextResponse } from "next/server";
import { requireAuthUser } from "@/lib/api/auth";
import { prisma } from "@/lib/db";
import { createLog } from "@/lib/logger";

const log = createLog("api:me:login-history");

export async function GET() {
  try {
    const auth = await requireAuthUser();
    if (!auth.ok) return auth.response;

    const sessions = await prisma.loginHistory.findMany({
      where: { userId: auth.user.id },
      orderBy: { createdAt: "desc" },
      take: 20,
      select: {
        id: true,
        method: true,
        ipAddress: true,
        userAgent: true,
        createdAt: true,
      },
    });

    return NextResponse.json({ sessions });
  } catch (error) {
    log.error("GET /api/me/login-history", error);
    return NextResponse.json({ error: "Failed to load login history" }, { status: 500 });
  }
}
