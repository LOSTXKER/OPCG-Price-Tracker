"use client";

import Link from "next/link";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import type { Conversation } from "./types";
import { CARD_BG } from "@/lib/constants/ui";
import { formatThb } from "@/lib/utils/currency";
import { formatRelativeShort } from "@/lib/utils/time";

const orderStatusLabel: Record<string, string> = {
  AWAITING_PAYMENT: "รอชำระ",
  PAID: "ชำระแล้ว",
  SHIPPED: "กำลังส่ง",
  DELIVERED: "ได้รับแล้ว",
  COMPLETED: "เสร็จสิ้น",
  CANCELLED: "ยกเลิก",
  DISPUTED: "มีปัญหา",
};

interface ConversationItemProps {
  conversation: Conversation;
  isActive: boolean;
}

export function ConversationItem({
  conversation: conv,
  isActive,
}: ConversationItemProps) {
  const { listing, otherUser } = conv;

  return (
    <Link
      href={`/messages/${conv.listingId}`}
      className={cn(
        "flex gap-3 rounded-lg px-3 py-2.5 transition-colors hover:bg-muted/60",
        isActive && "bg-muted"
      )}
    >
      <div className="relative shrink-0">
        <div className={cn("size-11 overflow-hidden rounded-lg", CARD_BG)}>
          {listing.card.imageUrl ? (
            <Image
              src={listing.card.imageUrl}
              alt=""
              width={44}
              height={44}
              className="size-full object-contain"
            />
          ) : (
            <span className="flex size-full items-center justify-center text-xs text-muted-foreground">
              N/A
            </span>
          )}
        </div>
        <Avatar
          size="sm"
          className="absolute -bottom-1 -right-1 ring-2 ring-background"
        >
          {otherUser.avatarUrl && (
            <AvatarImage src={otherUser.avatarUrl} alt="" />
          )}
          <AvatarFallback className="text-xs">
            {(otherUser.displayName ?? "?")[0]?.toUpperCase()}
          </AvatarFallback>
        </Avatar>
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-2">
          <p className="truncate text-sm font-medium">
            {otherUser.displayName ?? "User"}
          </p>
          <span className="shrink-0 text-xs text-muted-foreground">
            {formatRelativeShort(conv.lastMessageAt)}
          </span>
        </div>
        <p className="truncate text-xs text-muted-foreground">
          {listing.card.nameEn ?? listing.card.nameJp}
        </p>
        <div className="mt-0.5 flex items-center gap-1.5">
          <p className="min-w-0 flex-1 truncate text-xs text-muted-foreground/80">
            {conv.lastMessage}
          </p>
          {conv.unread > 0 && (
            <span className="flex size-4.5 shrink-0 items-center justify-center rounded-full bg-primary text-[11px] font-bold text-primary-foreground">
              {conv.unread > 9 ? "9+" : conv.unread}
            </span>
          )}
        </div>
        {conv.activeOrder && (
          <Badge variant="outline" className="mt-1 text-xs">
            {orderStatusLabel[conv.activeOrder.status] ?? conv.activeOrder.status}
          </Badge>
        )}
        {!conv.activeOrder && conv.pendingOffer && (
          <Badge variant="default" className="mt-1 text-xs">
            ข้อเสนอ {formatThb(conv.pendingOffer.priceThb)}
          </Badge>
        )}
      </div>
    </Link>
  );
}
