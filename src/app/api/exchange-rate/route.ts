import { apiHandler } from "@/lib/api/api-handler";
import { prisma } from "@/lib/db";
import { NextResponse } from "next/server";

export const GET = apiHandler(async () => {
  const latest = await prisma.exchangeRate.findFirst({
    orderBy: { fetchedAt: "desc" },
  });

  return NextResponse.json({
    rate: latest?.rate ?? 0.296,
    fetchedAt: latest?.fetchedAt ?? new Date().toISOString(),
  });
});
