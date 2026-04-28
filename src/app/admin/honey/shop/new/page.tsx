import type { Metadata } from "next";
import { ShopItemForm } from "../shop-item-form";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "สร้างสินค้า — แอดมิน" };

export default function NewShopItemPage() {
  return <ShopItemForm />;
}
