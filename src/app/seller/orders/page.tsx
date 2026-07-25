"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState, useCallback } from "react";
import { Loader2, ShoppingCart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { OrderCard, type OrderListItem } from "@/components/orders/order-card";
import { PageHeader } from "@/components/layout/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { LoadingState } from "@/components/shared/loading-state";
import { SegmentedControl } from "@/components/ui/segmented-control";
import { t, type TranslationKey } from "@/lib/i18n";
import { useUIStore } from "@/stores/ui-store";
import { ApiError, apiGet, apiPatch } from "@/lib/api/client";
import { toast } from "sonner";

type ApiResponse = {
  orders: OrderListItem[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  statusCounts: Record<string, number>;
};

const STATUS_TABS: ReadonlyArray<{ key: string; labelKey: TranslationKey }> = [
  { key: "ALL", labelKey: "orderStatusAll" },
  { key: "AWAITING_PAYMENT", labelKey: "orderStatusAwaitingPayment" },
  { key: "PAID", labelKey: "orderStatusPaidExt" },
  { key: "SHIPPED", labelKey: "orderStatusShippedExt" },
  { key: "COMPLETED", labelKey: "orderStatusCompleted" },
  { key: "CANCELLED", labelKey: "orderStatusCancelled" },
];

export default function SellerOrdersPage() {
  const lang = useUIStore((s) => s.language);
  const router = useRouter();
  const [data, setData] = useState<ApiResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("ALL");
  const [page, setPage] = useState(1);
  const [actionLoading, setActionLoading] = useState<number | null>(null);

  const fetchOrders = useCallback(async (signal?: AbortSignal) => {
    setLoading(true);
    setError(null);
    const params = new URLSearchParams();
    params.set("role", "seller");
    params.set("page", String(page));
    params.set("limit", "20");
    if (activeTab !== "ALL") params.set("status", activeTab);

    try {
      const j = await apiGet<ApiResponse>(`/api/orders?${params}`, signal);
      setData(j);
    } catch (err) {
      if (signal?.aborted) return;
      setData(null);
      setError(
        err instanceof ApiError
          ? err.message
          : t(useUIStore.getState().language, "ordersLoadFailed"),
      );
    } finally {
      if (!signal?.aborted) setLoading(false);
    }
  }, [activeTab, page]);

  useEffect(() => {
    const controller = new AbortController();
    void fetchOrders(controller.signal);
    return () => controller.abort();
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
      await apiPatch(`/api/orders/${orderId}`, { status, ...extra });
      await fetchOrders();
    } catch {
      toast.error(t(lang, "orderUpdateFailed"));
    } finally {
      setActionLoading(null);
    }
  };

  const totalAll = data
    ? Object.values(data.statusCounts).reduce((a, b) => a + b, 0)
    : 0;

  return (
    <div className="space-y-6">
      <PageHeader
        title={t(lang, "sellerOrdersTitle")}
        description={t(lang, "sellerOrdersDesc")}
      />

      <div className="no-sb overflow-x-auto">
        <SegmentedControl
          value={activeTab}
          onChange={handleTabChange}
          ariaLabel="Filter orders by status"
          className="shrink-0"
          options={STATUS_TABS.map((tab) => {
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
          })}
        />
      </div>

      {/* Content */}
      {loading ? (
        <LoadingState
          variant="skeleton-list"
          count={5}
          label={t(lang, "loading")}
        />
      ) : error ? (
        <EmptyState
          variant="error"
          icon={ShoppingCart}
          title={error}
          action={
            <Button variant="outline" size="sm" onClick={() => void fetchOrders()}>
              {t(lang, "retry")}
            </Button>
          }
        />
      ) : !data || data.orders.length === 0 ? (
        <EmptyState
          mascot="kuma"
          variant="dashed"
          icon={ShoppingCart}
          title={t(lang, "noOrdersYet")}
          description={t(lang, "sellerNoOrdersDesc")}
        />
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
  const lang = useUIStore((s) => s.language);

  if (loading) {
    return <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />;
  }

  return (
    <>
      <Button variant="outline" size="sm" onClick={onViewDetail}>
        {t(lang, "viewDetails")}
      </Button>
      {order.status === "PAID" && (
        <Button size="sm" onClick={onViewDetail}>
          {t(lang, "ship")}
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
