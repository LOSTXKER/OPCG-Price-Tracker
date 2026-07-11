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
import { t, type TranslationKey } from "@/lib/i18n";
import { useUIStore } from "@/stores/ui-store";
import { formatOrderMessageContent } from "@/lib/orders/message-events";

const orderStatusLabelKey: Record<string, TranslationKey> = {
  AWAITING_PAYMENT: "msgConvStatusAwaitingPayment",
  PAID: "msgConvStatusPaid",
  SHIPPED: "msgConvStatusShipped",
  DELIVERED: "msgConvStatusDelivered",
  COMPLETED: "msgConvStatusCompleted",
  CANCELLED: "msgConvStatusCancelled",
  DISPUTED: "msgConvStatusDisputed",
};

interface ConversationItemProps {
  conversation: Conversation;
  isActive: boolean;
}

export function ConversationItem({
  conversation: conv,
  isActive,
}: ConversationItemProps) {
  const lang = useUIStore((s) => s.language);
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
            <span className="flex size-full items-center justify-center text-meta">
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
            {otherUser.displayName ?? t(lang, "msgConvUser")}
          </p>
          <span className="shrink-0 text-meta">
            {formatRelativeShort(conv.lastMessageAt)}
          </span>
        </div>
        <p className="truncate text-meta">
          {listing.card.nameEn ?? listing.card.nameJp}
        </p>
        <div className="mt-0.5 flex items-center gap-1.5">
          <p className="min-w-0 flex-1 truncate text-meta text-muted-foreground/80">
            {conv.lastMessageType === "SYSTEM" ||
            conv.lastMessageType === "ORDER_UPDATE" ||
            conv.lastMessageType === "OFFER"
              ? formatOrderMessageContent(conv.lastMessage, lang)
              : conv.lastMessage}
          </p>
          {conv.unread > 0 && (
            <span className="flex size-4.5 shrink-0 items-center justify-center rounded-full bg-primary text-micro text-primary-foreground">
              {conv.unread > 9 ? "9+" : conv.unread}
            </span>
          )}
        </div>
        {conv.activeOrder && (
          <Badge variant="outline" className="mt-1 text-xs">
            {orderStatusLabelKey[conv.activeOrder.status]
              ? t(lang, orderStatusLabelKey[conv.activeOrder.status])
              : conv.activeOrder.status}
          </Badge>
        )}
        {!conv.activeOrder && conv.pendingOffer && (
          <Badge variant="default" className="mt-1 text-xs">
            {t(lang, "msgConvOffer").replace(
              "{n}",
              formatThb(conv.pendingOffer.priceThb)
            )}
          </Badge>
        )}
      </div>
    </Link>
  );
}
