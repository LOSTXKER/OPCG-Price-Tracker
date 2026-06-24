"use client";

import Link from "next/link";
import { useCallback, useState } from "react";
import { toast } from "sonner";
import {
  Plus,
  Pencil,
  Trash2,
  ShoppingBag,
  ToggleLeft,
  ToggleRight,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { AdminPage } from "@/components/admin/admin-page";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { AdminEmptyState } from "@/components/admin/admin-empty-state";
import { adminFetch } from "@/lib/admin/admin-fetch";
import { useAdminCrud } from "@/lib/admin/use-admin-crud";
import { localizedName, localizedShopDesc, localizedShopType } from "@/app/honey/types";

type ShopItem = {
  id: number;
  name: string;
  nameEn: string | null;
  nameTh: string | null;
  description: string | null;
  cost: number;
  type: string;
  value: Record<string, unknown> | null;
  isActive: boolean;
  stock: number | null;
  createdAt: string;
};

const TYPE_COLORS: Record<string, string> = {
  TRIAL_PRO: "status-info",
  TRIAL_PRO_PLUS: "bg-purple-500/10 text-purple-500",
  BADGE: "status-warning",
  PROFILE_FRAME: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
  PRICE_ALERT_SLOT: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
  CSV_EXPORT_PASS: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  RAFFLE_TICKET: "bg-violet-500/10 text-violet-600 dark:text-violet-400",
  CUSTOM: "status-success",
};

function readImageUrl(value: ShopItem["value"]): string {
  if (!value || typeof value !== "object") return "";
  const url = (value as Record<string, unknown>).imageUrl;
  return typeof url === "string" ? url : "";
}

export function HoneyShopManager({ initialItems }: { initialItems: ShopItem[] }) {
  const [items, setItems] = useState<ShopItem[]>(initialItems);

  const reload = useCallback(async () => {
    const data = await adminFetch<{ items: ShopItem[] }>("/api/admin/honey/shop");
    setItems(data.items);
  }, []);

  const crud = useAdminCrud<number>({
    basePath: "/api/admin/honey/shop",
    reload,
    deleteSuccessMessage: "ปิดใช้งานสินค้าแล้ว",
    deleteConfirm: {
      title: "ปิดใช้งานสินค้า",
      description: () => "ต้องการปิดใช้งานสินค้านี้หรือไม่?",
      confirmLabel: "ปิดใช้งาน",
    },
  });

  const handleToggleActive = async (item: ShopItem) => {
    try {
      await adminFetch(`/api/admin/honey/shop/${item.id}`, {
        method: "PATCH",
        body: { isActive: !item.isActive },
      });
      toast.success(item.isActive ? "ปิดใช้งานสินค้าแล้ว" : "เปิดใช้งานสินค้าแล้ว");
      await reload();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "อัปเดตไม่สำเร็จ");
    }
  };

  return (
    <AdminPage
      header={
        <AdminPageHeader
          title="สินค้าใน Honey Shop"
          icon={ShoppingBag}
          meta={<span className="text-meta">{items.length} รายการ</span>}
          actions={
            <Button render={<Link href="/admin/honey/shop/new" />} size="sm">
              <Plus className="h-4 w-4" /> เพิ่มสินค้า
            </Button>
          }
        />
      }
    >
      {items.length === 0 ? (
        <AdminEmptyState
          icon={ShoppingBag}
          title="ยังไม่มีสินค้าในร้าน"
          description="สร้างสินค้าแรกของคุณเพื่อเริ่มต้น"
          action={
            <Button render={<Link href="/admin/honey/shop/new" />} size="sm">
              <Plus className="h-4 w-4" /> เพิ่มสินค้า
            </Button>
          }
        />
      ) : (
        <div className="overflow-x-auto rounded-xl border border-[var(--p-hair)]">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[var(--p-hair)] bg-muted/30">
                <th className="px-4 py-2.5 text-left text-xs font-medium text-muted-foreground">สินค้า</th>
                <th className="px-4 py-2.5 text-left text-xs font-medium text-muted-foreground">ประเภท</th>
                <th className="px-4 py-2.5 text-right text-xs font-medium text-muted-foreground">ราคา</th>
                <th className="px-4 py-2.5 text-right text-xs font-medium text-muted-foreground">สต็อก</th>
                <th className="px-4 py-2.5 text-center text-xs font-medium text-muted-foreground">สถานะ</th>
                <th className="px-4 py-2.5 text-right text-xs font-medium text-muted-foreground">จัดการ</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => {
                const itemImage = readImageUrl(item.value);
                return (
                  <tr
                    key={item.id}
                    className="border-b border-[var(--p-hair)] transition-colors hover:bg-muted/20"
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        {itemImage ? (
                          <img
                            src={itemImage}
                            alt=""
                            className="size-10 shrink-0 rounded-lg object-cover"
                          />
                        ) : (
                          <div className="size-10 shrink-0 rounded-lg bg-muted/50" />
                        )}
                        <div className="min-w-0">
                          <p className="truncate font-medium">
                            {localizedName(item, "TH")}
                          </p>
                          {item.description && (
                            <p className="mt-0.5 truncate text-meta">
                              {localizedShopDesc(item.description, "TH")}
                            </p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                          TYPE_COLORS[item.type] ?? "bg-muted"
                        }`}
                      >
                        {localizedShopType(item.type, "TH")}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className="font-bold tabular-nums text-warning">{item.cost}</span>
                    </td>
                    <td className="px-4 py-3 text-right text-muted-foreground">
                      {item.stock ?? "∞"}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <button
                        onClick={() => void handleToggleActive(item)}
                        title={item.isActive ? "เปิดใช้งาน" : "ปิดใช้งาน"}
                      >
                        {item.isActive ? (
                          <ToggleRight className="mx-auto h-5 w-5 text-success" />
                        ) : (
                          <ToggleLeft className="mx-auto h-5 w-5 text-muted-foreground" />
                        )}
                      </button>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex justify-end gap-1">
                        <Button
                          render={<Link href={`/admin/honey/shop/${item.id}`} title="แก้ไข" />}
                          variant="ghost"
                          size="icon-xs"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon-xs"
                          onClick={() => void crud.remove(item.id)}
                          disabled={crud.deleting === item.id}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </AdminPage>
  );
}