import { PrismaClient } from "@/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";
import { serverEnv } from "@/lib/env";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function createPrismaClient() {
  const { DATABASE_URL } = serverEnv();

  const isVercel = !!process.env.VERCEL;
  const pool = new pg.Pool({
    connectionString: DATABASE_URL,
    max: isVercel ? 1 : 5,
    idleTimeoutMillis: isVercel ? 10_000 : 30_000,
    connectionTimeoutMillis: 10_000,
  });

  const adapter = new PrismaPg(pool as unknown as ConstructorParameters<typeof PrismaPg>[0]);
  return new PrismaClient({ adapter });
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
