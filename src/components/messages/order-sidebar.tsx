"use client";

import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CARD_BG } from "@/lib/constants/ui";
import { formatThb } from "@/lib/utils/currency";
import { OrderStatusTracker } from "./order-status-tracker";
import type { ChatListing, ChatUser } from "./types";
import {
  ShoppingCart,
  HandCoins,
  CreditCard,
  Truck,
  PackageCheck,
  Star,
  ExternalLink,
} from "lucide-react";

interface OrderSidebarProps {
  listing: ChatListing;
  otherUser: ChatUser;
  isSeller: boolean;
  currentUserId: string;
  activeOrder: {
    id: number;
    status: string;
    priceThb: number;
    trackingNumber?: string | null;
    shippingMethod?: string | null;
  } | null;
  onBuyNow?: () => void;
  onMakeOffer?: () => void;
  onUpdateOrder?: (orderId: number, status: string, data?: Record<string, string>) => void;
  className?: string;
}

export function OrderSidebar({
  listing,
  otherUser,
  isSeller,
  currentUserId: _currentUserId,
  activeOrder,
  onBuyNow,
  onMakeOffer,
  onUpdateOrder,
  className,
}: OrderSidebarProps) {
  const { card } = listing;
  const marketPrice = card.latestPriceThb;
  const listingPrice = listing.priceThb;
  const diffPct =
    marketPrice && listingPrice
      ? ((listingPrice - marketPrice) / marketPrice) * 100
      : null;

  return (
    <aside
      className={cn(
        "flex h-full flex-col overflow-y-auto border-l bg-background",
        className
      )}
    >
      {/* Card info */}
      <div className="border-b p-4">
        <div className={cn("relative mx-auto mb-3 aspect-[3/4] w-32 overflow-hidden rounded-lg", CARD_BG)}>
          {card.imageUrl ? (
            <Image
              src={card.imageUrl}
              alt={card.nameEn ?? card.nameJp}
              fill
              className="object-contain"
            />
          ) : (
            <span className="flex size-full items-center justify-center text-xs text-muted-foreground">
              No image
            </span>
          )}
        </div>
        <Link
          href={`/cards/${encodeURIComponent(card.cardCode)}`}
          className="group block text-center"
        >
          <p className="text-sm font-medium group-hover:text-primary transition-colors">
            {card.nameEn ?? card.nameJp}
          </p>
          <p className="text-xs text-muted-foreground">{card.cardCode}</p>
        </Link>
      </div>

      {/* Pricing */}
      <div className="space-y-2 border-b p-4">
        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground">ราคาลงขาย</span>
          <span className="text-sm font-bold tabular-nums">
            {formatThb(listingPrice ?? 0)}
          </span>
        </div>
        {marketPrice != null && (
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">ราคาตลาด</span>
            <span className="text-sm tabular-nums">
              {formatThb(marketPrice)}
            </span>
          </div>
        )}
        {diffPct != null && (
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">ส่วนต่าง</span>
            <Badge
              variant={diffPct <= -10 ? "default" : diffPct >= 15 ? "destructive" : "secondary"}
            >
              {diffPct > 0 ? "+" : ""}
              {diffPct.toFixed(0)}%
            </Badge>
          </div>
        )}
      </div>

      {/* Order status */}
      {activeOrder && (
        <div className="space-y-3 border-b p-4">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            สถานะคำสั่งซื้อ
          </h3>
          <OrderStatusTracker
            status={activeOrder.status}
            trackingNumber={activeOrder.trackingNumber}
            shippingMethod={activeOrder.shippingMethod}
          />

          {/* Link to order detail page */}
          <Link
            href={
              isSeller
                ? `/seller/orders/${activeOrder.id}`
                : `/orders/${activeOrder.id}`
            }
            className="flex items-center justify-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <ExternalLink className="size-3" />
            ดูคำสั่งซื้อ
          </Link>

          {/* Action buttons based on status and role */}
          <div className="space-y-2 pt-1">
            {activeOrder.status === "AWAITING_PAYMENT" && !isSeller && (
              <Button
                className="w-full gap-2"
                onClick={() => onUpdateOrder?.(activeOrder.id, "PAID")}
              >
                <CreditCard className="size-4" />
                แจ้งจ่ายเงินแล้ว
              </Button>
            )}
            {activeOrder.status === "PAID" && isSeller && (
              <Button
                className="w-full gap-2"
                onClick={() => onUpdateOrder?.(activeOrder.id, "SHIPPED")}
              >
                <Truck className="size-4" />
                ส่งของแล้ว
              </Button>
            )}
            {activeOrder.status === "SHIPPED" && !isSeller && (
              <Button
                className="w-full gap-2"
                onClick={() => onUpdateOrder?.(activeOrder.id, "DELIVERED")}
              >
                <PackageCheck className="size-4" />
                ได้รับของแล้ว
              </Button>
            )}
            {activeOrder.status === "DELIVERED" && (
              <Button
                className="w-full gap-2"
                onClick={() => onUpdateOrder?.(activeOrder.id, "COMPLETED")}
              >
                <Star className="size-4" />
                ยืนยันเสร็จสิ้น
              </Button>
            )}
          </div>
        </div>
      )}

      {/* Actions when no order */}
      {!activeOrder && !isSeller && listing.status === "ACTIVE" && (
        <div className="space-y-2 border-b p-4">
          <Button className="w-full gap-2" onClick={onBuyNow}>
            <ShoppingCart className="size-4" />
            ซื้อตามราคา
          </Button>
          <Button variant="outline" className="w-full gap-2" onClick={onMakeOffer}>
            <HandCoins className="size-4" />
            เสนอราคา
          </Button>
        </div>
      )}

      {/* Seller info */}
      <div className="p-4">
        <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          {isSeller ? "ผู้ซื้อ" : "ผู้ขาย"}
        </h3>
        <div className="flex items-center gap-2">
          <Avatar>
            {otherUser.avatarUrl && (
              <AvatarImage src={otherUser.avatarUrl} alt="" />
            )}
            <AvatarFallback>
              {(otherUser.displayName ?? "?")[0]?.toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium">
              {otherUser.displayName ?? "User"}
            </p>
          </div>
          <Link href={`/profile/${otherUser.id}`}>
            <Button variant="ghost" size="icon-sm">
              <ExternalLink className="size-3.5" />
            </Button>
          </Link>
        </div>
      </div>
    </aside>
  );
}
