"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState, useCallback } from "react";
import { Loader2, ShoppingCart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { OrderCard, type OrderListItem } from "@/components/orders/order-card";

type ApiResponse = {
  orders: OrderListItem[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  statusCounts: Record<string, number>;
};

const STATUS_TABS = [
  { key: "ALL", label: "ทั้งหมด" },
  { key: "AWAITING_PAYMENT", label: "รอชำระ" },
  { key: "PAID", label: "ชำระแล้ว" },
  { key: "SHIPPED", label: "จัดส่งแล้ว" },
  { key: "COMPLETED", label: "สำเร็จ" },
  { key: "CANCELLED", label: "ยกเลิก" },
];

export default function SellerOrdersPage() {
  const router = useRouter();
  const [data, setData] = useState<ApiResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("ALL");
  const [page, setPage] = useState(1);
  const [actionLoading, setActionLoading] = useState<number | null>(null);

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set("role", "seller");
      params.set("page", String(page));
      params.set("limit", "20");
      if (activeTab !== "ALL") params.set("status", activeTab);

      const res = await fetch(`/api/orders?${params}`);
      if (!res.ok) throw new Error();
      setData(await res.json());
    } catch {
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [activeTab, page]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    setPage(1);
  };

  const handleStatusUpdate = async (
    orderId: number,
    status: string,
    extra?: Record<string, string>
  ) => {
    setActionLoading(orderId);
    try {
      const res = await fetch(`/api/orders/${orderId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status, ...extra }),
      });
      if (res.ok) await fetchOrders();
    } finally {
      setActionLoading(null);
    }
  };

  const totalAll = data
    ? Object.values(data.statusCounts).reduce((a, b) => a + b, 0)
    : 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">คำสั่งซื้อ</h1>
        <p className="text-sm text-muted-foreground">
          จัดการคำสั่งซื้อจากผู้ซื้อ
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 overflow-x-auto rounded-lg bg-muted/50 p-1">
        {STATUS_TABS.map((tab) => {
          const count =
            tab.key === "ALL" ? totalAll : (data?.statusCounts[tab.key] ?? 0);
          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => handleTabChange(tab.key)}
              className={`flex items-center gap-1.5 whitespace-nowrap rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                activeTab === tab.key
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {tab.label}
              {count > 0 && (
                <span className="rounded-full bg-muted px-1.5 text-xs tabular-nums">
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex min-h-[300px] items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : !data || data.orders.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border py-16 text-center text-muted-foreground">
          <ShoppingCart className="mb-3 h-12 w-12 opacity-30" />
          <p className="text-lg font-medium">ไม่มีคำสั่งซื้อ</p>
          <p className="text-sm">คำสั่งซื้อจะปรากฏที่นี่เมื่อมีผู้ซื้อ</p>
        </div>
      ) : (
        <>
          <div className="space-y-3">
            {data.orders.map((order) => (
              <OrderCard
                key={order.id}
                order={order}
                viewAs="seller"
                actions={
                  <SellerActions
                    order={order}
                    loading={actionLoading === order.id}
                    onStatusUpdate={handleStatusUpdate}
                    onViewDetail={() =>
                      router.push(`/seller/orders/${order.id}`)
                    }
                  />
                }
              />
            ))}
          </div>

          {data.totalPages > 1 && (
            <div className="flex items-center justify-center gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={page <= 1}
                onClick={() => setPage(page - 1)}
              >
                ก่อนหน้า
              </Button>
              <span className="text-sm text-muted-foreground">
                หน้า {data.page} / {data.totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={page >= data.totalPages}
                onClick={() => setPage(page + 1)}
              >
                ถัดไป
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function SellerActions({
  order,
  loading,
  onStatusUpdate,
  onViewDetail,
}: {
  order: OrderListItem;
  loading: boolean;
  onStatusUpdate: (
    id: number,
    status: string,
    extra?: Record<string, string>
  ) => void;
  onViewDetail: () => void;
}) {
  if (loading) {
    return <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />;
  }

  return (
    <>
      <Button variant="outline" size="sm" onClick={onViewDetail}>
        ดูรายละเอียด
      </Button>
      {order.status === "PAID" && (
        <Button size="sm" onClick={onViewDetail}>
          จัดส่ง
        </Button>
      )}
      {order.status === "AWAITING_PAYMENT" && (
        <Button
          variant="outline"
          size="sm"
          onClick={() => onStatusUpdate(order.id, "CANCELLED")}
        >
          ยกเลิก
        </Button>
      )}
    </>
  );
}
