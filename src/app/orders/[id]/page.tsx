"use client";

import Link from "next/link";
import Image from "next/image";
import { useParams } from "next/navigation";
import { useEffect, useState, useCallback, useMemo } from "react";
import {
  ArrowLeft,
  Loader2,
  Package,
  Truck,
  MessageCircle,
  Clock,
  CreditCard,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Star,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { OrderStatusBadge } from "@/components/orders/order-status-badge";
import { PageHeader } from "@/components/layout/page-header";
import { Surface } from "@/components/ui/surface";
import { t, getLocale, type Language } from "@/lib/i18n";
import { useUIStore } from "@/stores/ui-store";
import { ApiError, apiGet, apiPatch } from "@/lib/api/client";

type OrderDetail = {
  id: number;
  status: string;
  priceThb: number;
  trackingNumber: string | null;
  shippingMethod: string | null;
  cancelReason: string | null;
  createdAt: string;
  paidAt: string | null;
  shippedAt: string | null;
  deliveredAt: string | null;
  completedAt: string | null;
  cancelledAt: string | null;
  listing: {
    id: number;
    priceJpy: number;
    priceThb: number | null;
    condition: string;
    status: string;
    card: {
      cardCode: string;
      nameJp: string;
      nameEn: string | null;
      imageUrl: string | null;
      rarity: string;
    };
  };
  buyer: { id: string; displayName: string | null; avatarUrl: string | null };
  seller: { id: string; displayName: string | null; avatarUrl: string | null };
  offer: { id: number; priceThb: number; note: string | null } | null;
};

function getTimelineSteps(lang: Language) {
  return [
    { key: "createdAt", label: t(lang, "buyOrderStepOrdered"), icon: Clock },
    { key: "paidAt", label: t(lang, "buyOrderStepPaid"), icon: CreditCard },
    { key: "shippedAt", label: t(lang, "buyOrderStepShipped"), icon: Truck },
    { key: "deliveredAt", label: t(lang, "buyOrderStepDelivered"), icon: CheckCircle },
    { key: "completedAt", label: t(lang, "buyOrderStepCompleted"), icon: CheckCircle },
  ] as const;
}

export default function BuyerOrderDetailPage() {
  const params = useParams();
  const lang = useUIStore((s) => s.language);
  const orderId = params.id as string;

  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const timelineSteps = useMemo(() => getTimelineSteps(lang), [lang]);

  const fetchOrder = useCallback(async () => {
    try {
      const data = await apiGet<{ order: OrderDetail }>(
        `/api/orders/${orderId}`,
      );
      setOrder(data.order);
    } catch (e) {
      // read lang imperatively so this fetch callback isn't language-dependent
      setError(e instanceof ApiError ? e.message : t(useUIStore.getState().language, "loadFailed"));
    } finally {
      setLoading(false);
    }
  }, [orderId]);

  useEffect(() => {
    fetchOrder();
  }, [fetchOrder]);

  const handleStatusUpdate = async (status: string) => {
    setActionLoading(true);
    setActionError(null);
    try {
      await apiPatch(`/api/orders/${orderId}`, { status });
      await fetchOrder();
    } catch (err) {
      setActionError(
        err instanceof ApiError ? err.message : t(lang, "buyOrderGenericError"),
      );
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="space-y-4">
        <Button variant="ghost" size="sm" render={<Link href="/orders" />}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          {t(lang, "back")}
        </Button>
        <div className="flex flex-col items-center justify-center py-20 text-center text-muted-foreground">
          <Package className="mb-3 h-12 w-12 opacity-30" />
          <p>{error ?? t(lang, "buyOrderNotFound")}</p>
        </div>
      </div>
    );
  }

  const cardName = order.listing.card.nameEn ?? order.listing.card.nameJp;
  const isCancelled = order.status === "CANCELLED";
  const canReview =
    order.status === "DELIVERED" || order.status === "COMPLETED";

  return (
    <div className="space-y-6">
      <PageHeader
        title={t(lang, "orderNumber").replace("{id}", String(order.id))}
        description={new Date(order.createdAt).toLocaleString(getLocale(lang))}
        breadcrumb={
          <Button variant="ghost" size="sm" render={<Link href="/orders" />}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            {t(lang, "back")}
          </Button>
        }
        actions={<OrderStatusBadge status={order.status} />}
      />

      {actionError && (
        <Surface variant="subtle" padding="sm" className="border border-destructive/30 bg-destructive/5">
          <div className="flex items-center gap-2 text-sm text-destructive">
            <AlertTriangle className="h-4 w-4 shrink-0" />
            {actionError}
          </div>
        </Surface>
      )}

      {/* Product info */}
      <Surface variant="panel" className="flex items-center gap-4 p-4">
        {order.listing.card.imageUrl ? (
          <Image
            src={order.listing.card.imageUrl}
            alt={cardName}
            width={64}
            height={90}
            className="shrink-0 rounded-sm object-cover"
          />
        ) : (
          <div className="flex h-[90px] w-[64px] shrink-0 items-center justify-center rounded-sm bg-muted">
            <Package className="h-6 w-6 text-muted-foreground" />
          </div>
        )}
        <div className="flex-1">
          <Link
            href={`/marketplace/${order.listing.id}`}
            className="text-h4 hover:underline"
          >
            {cardName}
          </Link>
          <p className="text-sm text-muted-foreground">
            {order.listing.card.cardCode} • {order.listing.card.rarity} •{" "}
            {order.listing.condition}
          </p>
          <div className="mt-2">
            <span className="text-lg font-bold">
              ฿{order.priceThb.toLocaleString()}
            </span>
            <span className="ml-2 text-sm text-muted-foreground">
              (¥{order.listing.priceJpy.toLocaleString()})
            </span>
          </div>
        </div>
      </Surface>

      {/* Seller info */}
      <Surface variant="panel" className="p-4">
        <h2 className="mb-3 text-h3">{t(lang, "buyOrderSellerInfo")}</h2>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted text-sm font-bold">
              {(order.seller.displayName ?? "S").charAt(0).toUpperCase()}
            </div>
            <p className="font-medium">
              {order.seller.displayName ?? t(lang, "seller")}
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            render={<Link href={`/messages/${order.listing.id}`} />}
          >
            <MessageCircle className="mr-1.5 h-3.5 w-3.5" />
            {t(lang, "chat")}
          </Button>
        </div>
      </Surface>

      {/* Status Timeline */}
      <Surface variant="panel" className="p-4">
        <h2 className="mb-4 text-h3">{t(lang, "buyOrderStatusTitle")}</h2>
        <div className="space-y-4">
          {timelineSteps.map((step, i) => {
            const dateVal = order[step.key as keyof OrderDetail] as
              | string
              | null;
            const isCompleted = dateVal != null;
            const isCancelledOrder =
              isCancelled && step.key !== "createdAt" && !dateVal;
            const Icon = step.icon;

            return (
              <div key={step.key} className="flex items-start gap-3">
                <div className="relative flex flex-col items-center">
                  <div
                    className={`flex h-8 w-8 items-center justify-center rounded-full ${
                      isCompleted
                        ? "bg-success/15 text-success"
                        : isCancelledOrder
                          ? "bg-muted text-muted-foreground/40"
                          : "bg-muted text-muted-foreground"
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                  </div>
                  {i < timelineSteps.length - 1 && (
                    <div
                      className={`mt-1 h-6 w-px ${
                        isCompleted ? "bg-success/30" : "bg-hair"
                      }`}
                    />
                  )}
                </div>
                <div className="pt-1">
                  <p
                    className={`text-sm font-medium ${
                      isCancelledOrder ? "text-muted-foreground/40" : ""
                    }`}
                  >
                    {step.label}
                  </p>
                  {dateVal && (
                    <p className="text-meta">
                      {new Date(dateVal).toLocaleString(getLocale(lang))}
                    </p>
                  )}
                </div>
              </div>
            );
          })}
          {isCancelled && (
            <div className="flex items-start gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-danger/15 text-danger">
                <XCircle className="h-4 w-4" />
              </div>
              <div className="pt-1">
                <p className="text-sm font-medium text-danger">
                  {t(lang, "cancel")}
                </p>
                {order.cancelledAt && (
                  <p className="text-meta">
                    {new Date(order.cancelledAt).toLocaleString(getLocale(lang))}
                  </p>
                )}
                {order.cancelReason && (
                  <p className="text-meta">
                    {t(lang, "buyOrderReasonLabel").replace("{reason}", order.cancelReason)}
                  </p>
                )}
              </div>
            </div>
          )}
        </div>
      </Surface>

      {/* Shipping info */}
      {order.trackingNumber && (
        <Surface variant="panel" className="p-4">
          <h2 className="mb-3 text-h3">{t(lang, "buyOrderShippingInfo")}</h2>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">{t(lang, "buyOrderShippingMethod")}</span>
              <span className="font-medium">
                {order.shippingMethod ?? "—"}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">{t(lang, "buyOrderTrackingNumber")}</span>
              <span className="font-mono font-medium">
                {order.trackingNumber}
              </span>
            </div>
          </div>
        </Surface>
      )}

      {/* Action panel */}
      {order.status === "SHIPPED" && (
        <Surface variant="panel" className="space-y-3 border-info/30 bg-info/5 p-4">
          <p className="font-medium">{t(lang, "buyOrderShippingTitle")}</p>
          <p className="text-sm text-muted-foreground">
            {t(lang, "buyOrderShippingPrompt")}
          </p>
          <Button
            onClick={() => handleStatusUpdate("DELIVERED")}
            disabled={actionLoading}
          >
            {actionLoading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <CheckCircle className="mr-2 h-4 w-4" />
            )}
            {t(lang, "buyOrderConfirmReceipt")}
          </Button>
        </Surface>
      )}

      {order.status === "DELIVERED" && (
        <Surface variant="panel" className="space-y-3 border-success/30 bg-success/5 p-4">
          <p className="font-medium">{t(lang, "buyOrderReceivedTitle")}</p>
          <p className="text-sm text-muted-foreground">
            {t(lang, "buyOrderReceivedPrompt")}
          </p>
          <Button
            onClick={() => handleStatusUpdate("COMPLETED")}
            disabled={actionLoading}
          >
            {actionLoading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <CheckCircle className="mr-2 h-4 w-4" />
            )}
            {t(lang, "buyOrderConfirmComplete")}
          </Button>
        </Surface>
      )}

      {order.status === "AWAITING_PAYMENT" && (
        <Surface variant="panel" className="space-y-3 p-4">
          <p className="text-sm text-muted-foreground">
            {t(lang, "buyOrderAwaitingPrompt")}
          </p>
          <div className="flex gap-2">
            <Button
              onClick={() => handleStatusUpdate("PAID")}
              disabled={actionLoading}
            >
              {actionLoading && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              {t(lang, "buyOrderNotifyPayment")}
            </Button>
            <Button
              variant="outline"
              onClick={() => handleStatusUpdate("CANCELLED")}
              disabled={actionLoading}
            >
              {t(lang, "cancel")}
            </Button>
          </div>
        </Surface>
      )}

      {/* Review link */}
      {canReview && (
        <Surface variant="panel" className="flex items-center justify-between p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-500/10">
              <Star className="h-5 w-5 text-amber-500" />
            </div>
            <div>
              <p className="font-medium">{t(lang, "buyOrderRateSeller")}</p>
              <p className="text-sm text-muted-foreground">
                {t(lang, "buyOrderRateSellerDesc")}
              </p>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            render={
              <Link href={`/profile/${order.seller.id}?review=true`} />
            }
          >
            {t(lang, "buyOrderReview")}
          </Button>
        </Surface>
      )}
    </div>
  );
}
