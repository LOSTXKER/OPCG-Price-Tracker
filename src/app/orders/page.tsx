"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState, useCallback } from "react";
import { Loader2, ShoppingBag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Breadcrumb } from "@/components/shared/breadcrumb";
import { EmptyState } from "@/components/shared/empty-state";
import { LoadingState } from "@/components/shared/loading-state";
import { OrderCard, type OrderListItem } from "@/components/orders/order-card";
import { PageHeader } from "@/components/layout/page-header";
import { SegmentedControl } from "@/components/ui/segmented-control";
import { useUIStore } from "@/stores/ui-store";
import { t } from "@/lib/i18n";

type ApiResponse = {
  orders: OrderListItem[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  statusCounts: Record<string, number>;
};

const STATUS_TABS = [
  { key: "ALL", labelKey: "orderStatusAll" },
  { key: "AWAITING_PAYMENT", labelKey: "orderStatusAwaitingPayment" },
  { key: "PAID", labelKey: "orderStatusPaid" },
  { key: "SHIPPED", labelKey: "orderStatusShipped" },
  { key: "COMPLETED", labelKey: "orderStatusCompleted" },
  { key: "CANCELLED", labelKey: "orderStatusCancelled" },
] as const;

export default function BuyerOrdersPage() {
  const lang = useUIStore((s) => s.language);
  const router = useRouter();
  const [data, setData] = useState<ApiResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("ALL");
  const [page, setPage] = useState(1);
  const [actionLoading, setActionLoading] = useState<number | null>(null);

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      params.set("role", "buyer");
      params.set("page", String(page));
      params.set("limit", "20");
      if (activeTab !== "ALL") params.set("status", activeTab);

      const res = await fetch(`/api/orders?${params}`);
      if (!res.ok) throw new Error();
      setData(await res.json());
    } catch {
      setData(null);
      setError(t(lang, "ordersLoadFailed"));
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

  const [actionError, setActionError] = useState<string | null>(null);

  const handleStatusUpdate = async (orderId: number, status: string) => {
    setActionLoading(orderId);
    setActionError(null);
    try {
      const res = await fetch(`/api/orders/${orderId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        setActionError(body?.error ?? t(lang, "orderUpdateFailed"));
        return;
      }
      await fetchOrders();
    } catch {
      setActionError(t(lang, "orderUpdateFailed"));
    } finally {
      setActionLoading(null);
    }
  };

  const totalAll = data
    ? Object.values(data.statusCounts).reduce((a, b) => a + b, 0)
    : 0;

  const segmentedOptions = STATUS_TABS.map((tab) => {
    const count =
      tab.key === "ALL" ? totalAll : (data?.statusCounts[tab.key] ?? 0);
    return {
      value: tab.key,
      label: t(lang, tab.labelKey),
      badge:
        count > 0 ? (
          <span className="rounded-full bg-muted px-1.5 text-xs tabular-nums">
            {count}
          </span>
        ) : undefined,
    };
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title={t(lang, "myOrdersTitle")}
        description={t(lang, "myOrdersDesc")}
        breadcrumb={
          <Breadcrumb
            items={[
              { label: t(lang, "home"), href: "/" },
              { label: t(lang, "myOrders") },
            ]}
          />
        }
      />

      <div className="overflow-x-auto">
        <SegmentedControl
          options={segmentedOptions}
          value={activeTab}
          onChange={handleTabChange}
          ariaLabel="Filter orders by status"
        />
      </div>

      {/* Content */}
      {loading ? (
        <LoadingState variant="spinner" label={t(lang, "loading")} />
      ) : error ? (
        <EmptyState
          variant="error"
          icon={ShoppingBag}
          title={error}
          action={
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setError(null);
                void fetchOrders();
              }}
            >
              {t(lang, "retry")}
            </Button>
          }
        />
      ) : !data || data.orders.length === 0 ? (
        <EmptyState
          variant="dashed"
          icon={ShoppingBag}
          title={t(lang, "noOrdersYet")}
          description={t(lang, "noOrdersYetDesc")}
        />
      ) : (
        <>
          {actionError && (
            <div className="rounded-lg border border-destructive/20 bg-destructive/5 px-4 py-3 text-sm text-destructive">
              {actionError}
              <button type="button" onClick={() => setActionError(null)} className="ml-2 text-xs font-medium underline">
                {t(lang, "close")}
              </button>
            </div>
          )}
          <div className="space-y-3">
            {data.orders.map((order) => (
              <OrderCard
                key={order.id}
                order={order}
                viewAs="buyer"
                actions={
                  <BuyerActions
                    order={order}
                    loading={actionLoading === order.id}
                    onStatusUpdate={handleStatusUpdate}
                    onViewDetail={() => router.push(`/orders/${order.id}`)}
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
                {t(lang, "previous")}
              </Button>
              <span className="text-sm text-muted-foreground">
                {t(lang, "paginationPageOf").replace("{page}", String(data.page)).replace("{total}", String(data.totalPages))}
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={page >= data.totalPages}
                onClick={() => setPage(page + 1)}
              >
                {t(lang, "next")}
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function BuyerActions({
  order,
  loading,
  onStatusUpdate,
  onViewDetail,
}: {
  order: OrderListItem;
  loading: boolean;
  onStatusUpdate: (id: number, status: string) => void;
  onViewDetail: () => void;
}) {
  const lang = useUIStore((s) => s.language);

  if (loading) {
    return <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />;
  }

  return (
    <>
      <Button variant="outline" size="sm" onClick={onViewDetail}>
        {t(lang, "viewDetails")}
      </Button>
      {order.status === "SHIPPED" && (
        <Button
          size="sm"
          onClick={() => onStatusUpdate(order.id, "DELIVERED")}
        >
          {t(lang, "confirmReceived")}
        </Button>
      )}
      {order.status === "AWAITING_PAYMENT" && (
        <Button
          variant="outline"
          size="sm"
          onClick={() => onStatusUpdate(order.id, "CANCELLED")}
        >
          {t(lang, "cancel")}
        </Button>
      )}
    </>
  );
}
