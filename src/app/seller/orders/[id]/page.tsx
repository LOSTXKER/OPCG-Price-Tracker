"use client";

import Link from "next/link";
import Image from "next/image";
import { useParams } from "next/navigation";
import { useEffect, useMemo, useState, useCallback } from "react";
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
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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

const getShippingOptions = (lang: Language) => [
  "Kerry Express",
  "Flash Express",
  t(lang, "sellOrderShipEms"),
  "J&T Express",
  t(lang, "sellOrderShipPickup"),
  t(lang, "sellOrderShipOther"),
];

const getTimelineSteps = (lang: Language) =>
  [
    { key: "createdAt", label: t(lang, "sellOrderStepCreated"), icon: Clock },
    { key: "paidAt", label: t(lang, "sellOrderStepPaid"), icon: CreditCard },
    { key: "shippedAt", label: t(lang, "sellOrderStepShipped"), icon: Truck },
    { key: "deliveredAt", label: t(lang, "sellOrderStepDelivered"), icon: CheckCircle },
    { key: "completedAt", label: t(lang, "sellOrderStepCompleted"), icon: CheckCircle },
  ] as const;

export default function SellerOrderDetailPage() {
  const params = useParams();
  const lang = useUIStore((s) => s.language);
  const orderId = params.id as string;

  const shippingOptions = useMemo(() => getShippingOptions(lang), [lang]);
  const timelineSteps = useMemo(() => getTimelineSteps(lang), [lang]);

  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [trackingNumber, setTrackingNumber] = useState("");
  const [shippingMethod, setShippingMethod] = useState(shippingOptions[0]);

  const fetchOrder = useCallback(async () => {
    try {
      const data = await apiGet<{ order: OrderDetail }>(
        `/api/orders/${orderId}`
      );
      setOrder(data.order);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : t(lang, "sellOrderLoadFailed"));
    } finally {
      setLoading(false);
    }
  }, [orderId, lang]);

  useEffect(() => {
    fetchOrder();
  }, [fetchOrder]);

  const handleStatusUpdate = async (
    status: string,
    extra?: Record<string, string>
  ) => {
    setActionLoading(true);
    setActionError(null);
    try {
      await apiPatch(`/api/orders/${orderId}`, { status, ...extra });
      await fetchOrder();
    } catch (err) {
      setActionError(
        err instanceof ApiError ? err.message : t(lang, "sellOrderGenericError")
      );
    } finally {
      setActionLoading(false);
    }
  };

  const handleShip = () => {
    if (!trackingNumber.trim()) {
      setActionError(t(lang, "sellOrderEnterTracking"));
      return;
    }
    handleStatusUpdate("SHIPPED", {
      trackingNumber: trackingNumber.trim(),
      shippingMethod,
    });
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
        <Button variant="ghost" size="sm" render={<Link href="/seller/orders" />}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          {t(lang, "back")}
        </Button>
        <div className="flex flex-col items-center justify-center py-20 text-center text-muted-foreground">
          <Package className="mb-3 h-12 w-12 opacity-30" />
          <p>{error ?? t(lang, "sellOrderNotFound")}</p>
        </div>
      </div>
    );
  }

  const cardName = order.listing.card.nameEn ?? order.listing.card.nameJp;
  const isCancelled = order.status === "CANCELLED";

  return (
    <div className="space-y-6">
      <PageHeader
        title={t(lang, "orderNumber").replace("{id}", String(order.id))}
        description={new Date(order.createdAt).toLocaleString(getLocale(lang))}
        breadcrumb={
          <Button variant="ghost" size="sm" render={<Link href="/seller/orders" />}>
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
      <Surface variant="panel" padding="md" className="flex items-center gap-4">
        {order.listing.card.imageUrl ? (
          <Image
            src={order.listing.card.imageUrl}
            alt={cardName}
            width={64}
            height={90}
            className="shrink-0 rounded object-cover"
          />
        ) : (
          <div className="flex h-[90px] w-[64px] shrink-0 items-center justify-center rounded bg-muted">
            <Package className="h-6 w-6 text-muted-foreground" />
          </div>
        )}
        <div className="flex-1">
          <p className="font-semibold">{cardName}</p>
          <p className="text-sm text-muted-foreground">
            {order.listing.card.cardCode} • {order.listing.card.rarity} •{" "}
            {order.listing.condition}
          </p>
          <div className="mt-2">
            <span className="text-xl font-bold">
              ฿{order.priceThb.toLocaleString()}
            </span>
            <span className="ml-2 text-sm text-muted-foreground">
              (¥{order.listing.priceJpy.toLocaleString()})
            </span>
          </div>
        </div>
      </Surface>

      {/* Buyer info */}
      <Surface variant="panel" padding="md">
        <h2 className="mb-3 text-h3">{t(lang, "sellOrderBuyerInfo")}</h2>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted text-sm font-bold">
              {(order.buyer.displayName ?? "U").charAt(0).toUpperCase()}
            </div>
            <div>
              <p className="font-medium">
                {order.buyer.displayName ?? t(lang, "sellOrderUser")}
              </p>
              {order.offer?.note && (
                <p className="text-sm text-muted-foreground">
                  {t(lang, "sellOrderNoteLabel").replace("{note}", order.offer.note)}
                </p>
              )}
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            render={<Link href={`/messages/${order.listing.id}`} />}
          >
            <MessageCircle className="mr-1.5 h-3.5 w-3.5" />
            {t(lang, "sellOrderChat")}
          </Button>
        </div>
      </Surface>

      {/* Status Timeline */}
      <Surface variant="panel" padding="md">
        <h2 className="mb-4 text-h3">{t(lang, "sellOrderStatusTitle")}</h2>
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
                        ? "bg-green-500/15 text-green-600 dark:text-green-400"
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
                        isCompleted ? "bg-green-500/30" : "bg-border"
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
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-red-500/15 text-red-600 dark:text-red-400">
                <XCircle className="h-4 w-4" />
              </div>
              <div className="pt-1">
                <p className="text-sm font-medium text-red-700 dark:text-red-400">
                  {t(lang, "sellOrderCancelled")}
                </p>
                {order.cancelledAt && (
                  <p className="text-meta">
                    {new Date(order.cancelledAt).toLocaleString(getLocale(lang))}
                  </p>
                )}
                {order.cancelReason && (
                  <p className="text-meta">
                    {t(lang, "sellOrderReasonLabel").replace("{reason}", order.cancelReason)}
                  </p>
                )}
              </div>
            </div>
          )}
        </div>
      </Surface>

      {/* Shipping info (if shipped) */}
      {order.trackingNumber && (
        <Surface variant="panel" padding="md">
          <h2 className="mb-3 text-h3">{t(lang, "sellOrderShippingInfo")}</h2>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">{t(lang, "sellOrderShippingMethod")}</span>
              <span className="font-medium">
                {order.shippingMethod ?? "—"}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">{t(lang, "sellOrderTrackingNumber")}</span>
              <span className="font-mono font-medium">
                {order.trackingNumber}
              </span>
            </div>
          </div>
        </Surface>
      )}

      {/* Action Panel */}
      {order.status === "PAID" && (
        <Surface variant="panel" padding="md" className="space-y-4">
          <h2 className="text-h3">{t(lang, "sellOrderShipTitle")}</h2>
          <p className="text-sm text-muted-foreground">
            {t(lang, "sellOrderPaidPrompt")}
          </p>
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-label">
                {t(lang, "sellOrderShippingMethod")}
              </label>
              <Select value={shippingMethod} onValueChange={(value) => setShippingMethod(value ?? "")}>
                <SelectTrigger className="h-10 w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {shippingOptions.map((opt) => (
                    <SelectItem key={opt} value={opt}>
                      {opt}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="mb-1 block text-label">
                {t(lang, "sellOrderTrackingNumberRequired")}
              </label>
              <Input
                value={trackingNumber}
                onChange={(e) => setTrackingNumber(e.target.value)}
                placeholder={t(lang, "sellOrderTrackingPlaceholder")}
              />
            </div>
          </div>
          <Button onClick={handleShip} disabled={actionLoading}>
            {actionLoading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Truck className="mr-2 h-4 w-4" />
            )}
            {t(lang, "sellOrderMarkShipped")}
          </Button>
        </Surface>
      )}

      {order.status === "AWAITING_PAYMENT" && (
        <Surface variant="panel" padding="md" className="space-y-3">
          <p className="text-sm text-muted-foreground">
            {t(lang, "sellOrderAwaitingPaymentPrompt")}
          </p>
          <Button
            variant="outline"
            onClick={() => handleStatusUpdate("CANCELLED")}
            disabled={actionLoading}
          >
            {actionLoading && (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            )}
            {t(lang, "sellOrderCancelOrder")}
          </Button>
        </Surface>
      )}

      {order.status === "SHIPPED" && (
        <Surface variant="panel" padding="md">
          <p className="text-sm text-muted-foreground">
            {t(lang, "sellOrderShippedPrompt")}
          </p>
        </Surface>
      )}

      {order.status === "DELIVERED" && (
        <Surface variant="panel" padding="md">
          <p className="text-sm text-muted-foreground">
            {t(lang, "sellOrderDeliveredPrompt")}
          </p>
          <Button
            className="mt-3"
            onClick={() => handleStatusUpdate("COMPLETED")}
            disabled={actionLoading}
          >
            {actionLoading && (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            )}
            {t(lang, "sellOrderConfirmComplete")}
          </Button>
        </Surface>
      )}
    </div>
  );
}
