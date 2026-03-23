import { prisma } from "@/lib/db";

const API_URL = "https://v6.exchangerate-api.com/v6";

export async function fetchExchangeRate(): Promise<number> {
  const apiKey = process.env.EXCHANGE_RATE_API_KEY;

  if (apiKey) {
    try {
      const res = await fetch(`${API_URL}/${apiKey}/pair/JPY/THB`);
      const data = await res.json();
      if (data.result === "success") {
        return data.conversion_rate;
      }
    } catch (error) {
      console.error("Exchange rate API failed, using fallback:", error);
    }
  }

  // Fallback: use latest rate from DB
  const latest = await prisma.exchangeRate.findFirst({
    orderBy: { fetchedAt: "desc" },
  });

  return latest?.rate ?? 0.296;
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
  return latest?.rate ?? 0.296;
}
