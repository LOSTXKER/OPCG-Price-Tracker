"use client";

import { cn } from "@/lib/utils";
import { formatChatTime } from "@/lib/utils/time";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { OfferCard } from "./offer-card";
import type { ChatMessage } from "./types";
import { Info } from "lucide-react";

interface ChatMessageProps {
  message: ChatMessage;
  currentUserId: string;
  onAcceptOffer?: (offerId: number) => void;
  onRejectOffer?: (offerId: number) => void;
  onCounterOffer?: (offerId: number) => void;
}

export function ChatMessageBubble({
  message,
  currentUserId,
  onAcceptOffer,
  onRejectOffer,
  onCounterOffer,
}: ChatMessageProps) {
  if (message.type === "SYSTEM" || message.type === "ORDER_UPDATE") {
    return (
      <div className="flex justify-center py-1">
        <div className="flex items-center gap-1.5 rounded-full bg-muted/60 px-3 py-1">
          <Info className="size-3 text-muted-foreground" />
          <span className="text-xs text-muted-foreground">{message.content}</span>
          <span className="text-xs text-muted-foreground/60">
            {formatChatTime(message.createdAt)}
          </span>
        </div>
      </div>
    );
  }

  if (message.type === "OFFER" && message.offer) {
    return (
      <div className={cn("flex gap-2 py-1", message.isOwn ? "justify-end" : "justify-start")}>
        {!message.isOwn && (
          <Avatar size="sm" className="mt-1 shrink-0">
            {message.sender.avatarUrl && (
              <AvatarImage src={message.sender.avatarUrl} alt="" />
            )}
            <AvatarFallback className="text-xs">
              {(message.sender.displayName ?? "?")[0]?.toUpperCase()}
            </AvatarFallback>
          </Avatar>
        )}
        <div className={cn("max-w-[280px]", message.isOwn && "order-first")}>
          <OfferCard
            offer={message.offer}
            currentUserId={currentUserId}
            onAccept={onAcceptOffer}
            onReject={onRejectOffer}
            onCounter={onCounterOffer}
          />
          <p className={cn("mt-0.5 text-xs text-muted-foreground", message.isOwn && "text-right")}>
            {formatChatTime(message.createdAt)}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "flex gap-2 py-0.5",
        message.isOwn ? "justify-end" : "justify-start"
      )}
    >
      {!message.isOwn && (
        <Avatar size="sm" className="mt-1 shrink-0">
          {message.sender.avatarUrl && (
            <AvatarImage src={message.sender.avatarUrl} alt="" />
          )}
          <AvatarFallback className="text-xs">
            {(message.sender.displayName ?? "?")[0]?.toUpperCase()}
          </AvatarFallback>
        </Avatar>
      )}
      <div className={cn("max-w-[75%] space-y-0.5", message.isOwn && "items-end")}>
        <div
          className={cn(
            "rounded-2xl px-3 py-2 text-sm leading-relaxed",
            message.isOwn
              ? "rounded-br-md bg-primary text-primary-foreground"
              : "rounded-bl-md bg-muted"
          )}
        >
          {message.content}
        </div>
        <p
          className={cn(
            "text-xs text-muted-foreground",
            message.isOwn && "text-right"
          )}
        >
          {formatChatTime(message.createdAt)}
        </p>
      </div>
    </div>
  );
}
