import { prisma } from "@/lib/db";
import { FALLBACK_JPY_THB_RATE } from "@/lib/constants/prices";
import { serverEnv } from "@/lib/env";
import { createLog } from "@/lib/logger";

const log = createLog("scraper:exchange-rate");

const API_URL = "https://v6.exchangerate-api.com/v6";

export async function fetchExchangeRate(): Promise<number> {
  const apiKey = serverEnv().EXCHANGE_RATE_API_KEY;

  if (apiKey) {
    try {
      const res = await fetch(`${API_URL}/${apiKey}/pair/JPY/THB`);
      const data = await res.json();
      if (data.result === "success") {
        return data.conversion_rate;
      }
    } catch (error) {
      log.error("Exchange rate API failed, using fallback", error);
    }
  }

  // Fallback: use latest rate from DB
  const latest = await prisma.exchangeRate.findFirst({
    orderBy: { fetchedAt: "desc" },
  });

  return latest?.rate ?? FALLBACK_JPY_THB_RATE;
}

export async function saveExchangeRate(rate: number) {
  return prisma.exchangeRate.create({
    data: {
      fromCur: "JPY",
      toCur: "THB",
      rate,
    },
  });
}

export async function getLatestExchangeRate(): Promise<number> {
  const latest = await prisma.exchangeRate.findFirst({
    orderBy: { fetchedAt: "desc" },
  });
  return latest?.rate ?? FALLBACK_JPY_THB_RATE;
}
