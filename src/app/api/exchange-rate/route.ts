import { prisma } from "@/lib/db";
import { createLog } from "@/lib/logger";
import { NextResponse } from "next/server";

const log = createLog("api:exchange-rate");

export async function GET() {
  try {
    const latest = await prisma.exchangeRate.findFirst({
      orderBy: { fetchedAt: "desc" },
    });

    return NextResponse.json({
      rate: latest?.rate ?? 0.296,
      fetchedAt: latest?.fetchedAt ?? new Date().toISOString(),
    });
  } catch (error) {
    log.error("Error fetching exchange rate", error);
    return NextResponse.json({ error: "Failed to fetch exchange rate" }, { status: 500 });
  }
}
