import { prisma } from "@/lib/db";
import { HoneyShopManager } from "./honey-shop-manager";

export default async function AdminHoneyShopPage() {
  const items = await prisma.honeyShopItem.findMany({
    orderBy: [{ isActive: "desc" }, { cost: "asc" }],
  });

  const serialized = items.map((item) => ({
    ...item,
    createdAt: item.createdAt.toISOString(),
  }));

  return <HoneyShopManager initialItems={serialized} />;
}
