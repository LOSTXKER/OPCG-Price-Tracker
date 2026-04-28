import { NextResponse } from "next/server";
import { apiHandler } from "@/lib/api/api-handler";
import { requireAuthUser } from "@/lib/api/auth";
import { prisma } from "@/lib/db";

export const GET = apiHandler(async () => {
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
});
