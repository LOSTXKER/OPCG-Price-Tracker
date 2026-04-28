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
  Star,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { OrderStatusBadge } from "@/components/orders/order-status-badge";
import { PageHeader } from "@/components/layout/page-header";
import { Surface } from "@/components/ui/surface";
import { t, getLocale } from "@/lib/i18n";
import { useUIStore } from "@/stores/ui-store";

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

const TIMELINE_STEPS = [
  { key: "createdAt", label: "สั่งซื้อ", icon: Clock },
  { key: "paidAt", label: "ชำระเงินแล้ว", icon: CreditCard },
  { key: "shippedAt", label: "จัดส่งแล้ว", icon: Truck },
  { key: "deliveredAt", label: "ได้รับสินค้า", icon: CheckCircle },
  { key: "completedAt", label: "เสร็จสิ้น", icon: CheckCircle },
] as const;

export default function BuyerOrderDetailPage() {
  const params = useParams();
  const lang = useUIStore((s) => s.language);
  const orderId = params.id as string;

  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const fetchOrder = useCallback(async () => {
    try {
      const res = await fetch(`/api/orders/${orderId}`);
      if (!res.ok) throw new Error("Failed to load order");
      const data = await res.json();
      setOrder(data.order);
    } catch (e) {
      setError(e instanceof Error ? e.message : "ไม่สามารถโหลดข้อมูลได้");
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
      const res = await fetch(`/api/orders/${orderId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) {
        const data = await res.json();
        setActionError(data.error ?? "ดำเนินการไม่สำเร็จ");
        return;
      }
      await fetchOrder();
    } catch {
      setActionError("เกิดข้อผิดพลาด");
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
          <Link
            href={`/marketplace/${order.listing.id}`}
            className="font-semibold hover:underline"
          >
            {cardName}
          </Link>
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

      {/* Seller info */}
      <div className="panel rounded-xl p-4">
        <h2 className="mb-3 text-h3">ข้อมูลผู้ขาย</h2>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted text-sm font-bold">
              {(order.seller.displayName ?? "S").charAt(0).toUpperCase()}
            </div>
            <p className="font-medium">
              {order.seller.displayName ?? "ผู้ขาย"}
            </p>
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

      {/* Shipping info */}
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

      {/* Action panel */}
      {order.status === "SHIPPED" && (
        <div className="panel space-y-3 rounded-xl border-cyan-500/30 bg-cyan-500/5 p-4">
          <p className="font-medium">สินค้ากำลังจัดส่ง</p>
          <p className="text-sm text-muted-foreground">
            เมื่อได้รับสินค้าแล้ว กรุณากด &quot;ยืนยันรับสินค้า&quot;
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
            ยืนยันรับสินค้า
          </Button>
        </div>
      )}

      {order.status === "DELIVERED" && (
        <div className="panel space-y-3 rounded-xl border-green-500/30 bg-green-500/5 p-4">
          <p className="font-medium">ได้รับสินค้าแล้ว</p>
          <p className="text-sm text-muted-foreground">
            ยืนยันเสร็จสิ้นเพื่อปิดคำสั่งซื้อ
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
            ยืนยันเสร็จสิ้น
          </Button>
        </div>
      )}

      {order.status === "AWAITING_PAYMENT" && (
        <div className="panel space-y-3 rounded-xl p-4">
          <p className="text-sm text-muted-foreground">
            รอการชำระเงิน คุณสามารถยกเลิกคำสั่งซื้อได้
          </p>
          <div className="flex gap-2">
            <Button
              onClick={() => handleStatusUpdate("PAID")}
              disabled={actionLoading}
            >
              {actionLoading && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              แจ้งชำระเงิน
            </Button>
            <Button
              variant="outline"
              onClick={() => handleStatusUpdate("CANCELLED")}
              disabled={actionLoading}
            >
              ยกเลิก
            </Button>
          </div>
        </div>
      )}

      {/* Review link */}
      {canReview && (
        <div className="panel flex items-center justify-between rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-500/10">
              <Star className="h-5 w-5 text-amber-500" />
            </div>
            <div>
              <p className="font-medium">ให้คะแนนผู้ขาย</p>
              <p className="text-sm text-muted-foreground">
                แบ่งปันประสบการณ์การซื้อขาย
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
            รีวิว
          </Button>
        </div>
      )}
    </div>
  );
}
