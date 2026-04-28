import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { ShopItemForm } from "../shop-item-form";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "แก้ไขสินค้า — แอดมิน" };

export default async function EditShopItemPage(props: {
  params: Promise<{ id: string }>;
}) {
  const { id: idParam } = await props.params;
  const id = Number(idParam);
  if (!Number.isInteger(id) || id < 1) notFound();

  const item = await prisma.honeyShopItem.findUnique({ where: { id } });
  if (!item) notFound();

  return (
    <ShopItemForm
      initial={{
        id: item.id,
        name: item.name,
        nameEn: item.nameEn,
        nameTh: item.nameTh,
        description: item.description,
        cost: item.cost,
        type: item.type as string,
        value: item.value as Record<string, unknown> | null,
        isActive: item.isActive,
        stock: item.stock,
      }}
    />
  );
}
