"use client";

import Link from "next/link";
import Image from "next/image";
import { Package, MessageCircle } from "lucide-react";
import { formatThb, formatJpy } from "@/lib/utils/currency";
import { OrderStatusBadge } from "./order-status-badge";

export type OrderListItem = {
  id: number;
  status: string;
  priceThb: number;
  trackingNumber: string | null;
  shippingMethod: string | null;
  createdAt: string;
  paidAt: string | null;
  shippedAt: string | null;
  deliveredAt: string | null;
  completedAt: string | null;
  cancelledAt: string | null;
  listing: {
    id: number;
    priceJpy: number;
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
};

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "เมื่อสักครู่";
  if (mins < 60) return `${mins} นาทีที่แล้ว`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} ชม.ที่แล้ว`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days} วันที่แล้ว`;
  return new Date(dateStr).toLocaleDateString("th-TH");
}

export function OrderCard({
  order,
  viewAs,
  actions,
}: {
  order: OrderListItem;
  viewAs: "buyer" | "seller";
  actions?: React.ReactNode;
}) {
  const counterparty = viewAs === "buyer" ? order.seller : order.buyer;
  const detailHref =
    viewAs === "seller"
      ? `/seller/orders/${order.id}`
      : `/orders/${order.id}`;
  const cardName =
    order.listing.card.nameEn ?? order.listing.card.nameJp;

  return (
    <div className="panel rounded-xl p-4 transition-colors hover:bg-muted/20">
      {/* Top row: counterparty + status */}
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm">
          <span className="font-medium">
            {viewAs === "buyer" ? "ผู้ขาย" : "ผู้ซื้อ"}:{" "}
          </span>
          <span className="text-muted-foreground">
            {counterparty.displayName ?? "ผู้ใช้"}
          </span>
        </div>
        <OrderStatusBadge status={order.status} />
      </div>

      {/* Main content */}
      <Link href={detailHref} className="flex items-center gap-4">
        {order.listing.card.imageUrl ? (
          <Image
            src={order.listing.card.imageUrl}
            alt={cardName}
            width={56}
            height={78}
            className="shrink-0 rounded object-cover"
          />
        ) : (
          <div className="flex h-[78px] w-[56px] shrink-0 items-center justify-center rounded bg-muted">
            <Package className="h-5 w-5 text-muted-foreground" />
          </div>
        )}

        <div className="min-w-0 flex-1">
          <p className="truncate font-medium">{cardName}</p>
          <p className="text-sm text-muted-foreground">
            {order.listing.card.cardCode} • {order.listing.card.rarity}
          </p>
          {order.trackingNumber && (
            <p className="mt-1 text-xs text-muted-foreground">
              Tracking: {order.trackingNumber}
            </p>
          )}
        </div>

        <div className="shrink-0 text-right">
          <p className="text-lg font-bold">
            {formatThb(order.priceThb)}
          </p>
          <p className="text-xs text-muted-foreground">
            {formatJpy(order.listing.priceJpy)}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            {timeAgo(order.createdAt)}
          </p>
        </div>
      </Link>

      {/* Actions row */}
      {actions && (
        <div className="mt-3 flex items-center justify-end gap-2 border-t border-border/50 pt-3">
          <Link
            href={`/messages/${order.listing.id}`}
            className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <MessageCircle className="h-3.5 w-3.5" />
            แชท
          </Link>
          {actions}
        </div>
      )}
    </div>
  );
}
