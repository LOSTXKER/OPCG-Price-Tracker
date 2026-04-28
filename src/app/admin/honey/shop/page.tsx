import { prisma } from "@/lib/db";
import { HoneyShopManager } from "./honey-shop-manager";

export const dynamic = "force-dynamic";

export default async function AdminHoneyShopPage() {
  const items = await prisma.honeyShopItem.findMany({
    orderBy: [{ isActive: "desc" }, { cost: "asc" }],
  });

  const serialized = items.map((item) => ({
    ...item,
    value: (item.value && typeof item.value === "object" && !Array.isArray(item.value)
      ? (item.value as Record<string, unknown>)
      : null),
    createdAt: item.createdAt.toISOString(),
  }));

  return <HoneyShopManager initialItems={serialized} />;
}
