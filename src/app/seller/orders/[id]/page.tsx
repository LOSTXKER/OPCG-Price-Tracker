"use client";

import Link from "next/link";
import Image from "next/image";
import { useParams } from "next/navigation";
import { useEffect, useState, useCallback } from "react";
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
import { t, getLocale } from "@/lib/i18n";
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

const SHIPPING_OPTIONS = [
  "Kerry Express",
  "Flash Express",
  "EMS / ไปรษณีย์",
  "J&T Express",
  "นัดรับ",
  "อื่นๆ",
];

const TIMELINE_STEPS = [
  { key: "createdAt", label: "สร้างคำสั่งซื้อ", icon: Clock },
  { key: "paidAt", label: "ชำระเงินแล้ว", icon: CreditCard },
  { key: "shippedAt", label: "จัดส่งแล้ว", icon: Truck },
  { key: "deliveredAt", label: "ได้รับสินค้า", icon: CheckCircle },
  { key: "completedAt", label: "เสร็จสิ้น", icon: CheckCircle },
] as const;

export default function SellerOrderDetailPage() {
  const params = useParams();
  const lang = useUIStore((s) => s.language);
  const orderId = params.id as string;

  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [trackingNumber, setTrackingNumber] = useState("");
  const [shippingMethod, setShippingMethod] = useState(SHIPPING_OPTIONS[0]);

  const fetchOrder = useCallback(async () => {
    try {
      const data = await apiGet<{ order: OrderDetail }>(
        `/api/orders/${orderId}`
      );
      setOrder(data.order);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "ไม่สามารถโหลดข้อมูลได้");
    } finally {
      setLoading(false);
    }
  }, [orderId]);

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
        err instanceof ApiError ? err.message : "เกิดข้อผิดพลาด"
      );
    } finally {
      setActionLoading(false);
    }
  };

  const handleShip = () => {
    if (!trackingNumber.trim()) {
      setActionError("กรุณากรอกหมายเลขพัสดุ");
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
          กลับ
        </Button>
        <div className="flex flex-col items-center justify-center py-20 text-center text-muted-foreground">
          <Package className="mb-3 h-12 w-12 opacity-30" />
          <p>{error ?? "ไม่พบคำสั่งซื้อ"}</p>
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
      <div className="panel flex items-center gap-4 rounded-xl p-4">
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
      </div>

      {/* Buyer info */}
      <div className="panel rounded-xl p-4">
        <h2 className="mb-3 text-h3">ข้อมูลผู้ซื้อ</h2>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted text-sm font-bold">
              {(order.buyer.displayName ?? "U").charAt(0).toUpperCase()}
            </div>
            <div>
              <p className="font-medium">
                {order.buyer.displayName ?? "ผู้ใช้"}
              </p>
              {order.offer?.note && (
                <p className="text-sm text-muted-foreground">
                  หมายเหตุ: {order.offer.note}
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
            แชท
          </Button>
        </div>
      </div>

      {/* Status Timeline */}
      <div className="panel rounded-xl p-4">
        <h2 className="mb-4 text-h3">สถานะคำสั่งซื้อ</h2>
        <div className="space-y-4">
          {TIMELINE_STEPS.map((step, i) => {
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
                  {i < TIMELINE_STEPS.length - 1 && (
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
                      {new Date(dateVal).toLocaleString("th-TH")}
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
                  ยกเลิก
                </p>
                {order.cancelledAt && (
                  <p className="text-meta">
                    {new Date(order.cancelledAt).toLocaleString("th-TH")}
                  </p>
                )}
                {order.cancelReason && (
                  <p className="text-meta">
                    เหตุผล: {order.cancelReason}
                  </p>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Shipping info (if shipped) */}
      {order.trackingNumber && (
        <div className="panel rounded-xl p-4">
          <h2 className="mb-3 text-h3">ข้อมูลจัดส่ง</h2>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">วิธีจัดส่ง</span>
              <span className="font-medium">
                {order.shippingMethod ?? "—"}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">หมายเลขพัสดุ</span>
              <span className="font-mono font-medium">
                {order.trackingNumber}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Action Panel */}
      {order.status === "PAID" && (
        <div className="panel space-y-4 rounded-xl p-4">
          <h2 className="text-h3">จัดส่งสินค้า</h2>
          <p className="text-sm text-muted-foreground">
            ผู้ซื้อชำระเงินแล้ว กรุณาจัดส่งสินค้าและกรอกข้อมูลการจัดส่ง
          </p>
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium">
                วิธีจัดส่ง
              </label>
              <Select value={shippingMethod} onValueChange={(value) => setShippingMethod(value ?? "")}>
                <SelectTrigger className="h-10 w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SHIPPING_OPTIONS.map((opt) => (
                    <SelectItem key={opt} value={opt}>
                      {opt}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">
                หมายเลขพัสดุ *
              </label>
              <Input
                value={trackingNumber}
                onChange={(e) => setTrackingNumber(e.target.value)}
                placeholder="เช่น TH1234567890"
              />
            </div>
          </div>
          <Button onClick={handleShip} disabled={actionLoading}>
            {actionLoading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Truck className="mr-2 h-4 w-4" />
            )}
            จัดส่งแล้ว
          </Button>
        </div>
      )}

      {order.status === "AWAITING_PAYMENT" && (
        <div className="panel space-y-3 rounded-xl p-4">
          <p className="text-sm text-muted-foreground">
            รอผู้ซื้อชำระเงิน คุณสามารถยกเลิกคำสั่งซื้อได้
          </p>
          <Button
            variant="outline"
            onClick={() => handleStatusUpdate("CANCELLED")}
            disabled={actionLoading}
          >
            {actionLoading && (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            )}
            ยกเลิกคำสั่งซื้อ
          </Button>
        </div>
      )}

      {order.status === "SHIPPED" && (
        <div className="panel rounded-xl p-4">
          <p className="text-sm text-muted-foreground">
            จัดส่งสินค้าแล้ว รอผู้ซื้อยืนยันรับสินค้า
          </p>
        </div>
      )}

      {order.status === "DELIVERED" && (
        <div className="panel rounded-xl p-4">
          <p className="text-sm text-muted-foreground">
            ผู้ซื้อได้รับสินค้าแล้ว รอยืนยันเสร็จสิ้น
          </p>
          <Button
            className="mt-3"
            onClick={() => handleStatusUpdate("COMPLETED")}
            disabled={actionLoading}
          >
            {actionLoading && (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            )}
            ยืนยันเสร็จสิ้น
          </Button>
        </div>
      )}
    </div>
  );
}
