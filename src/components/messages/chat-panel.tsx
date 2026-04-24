"use client";

import { useRef, useEffect, useCallback } from "react";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowLeft, PanelRight } from "lucide-react";
import { ChatMessageBubble } from "./chat-message";
import { ChatInput } from "./chat-input";
import type { ChatMessage, ChatListing, ChatUser } from "./types";

interface ChatPanelProps {
  messages: ChatMessage[];
  currentUserId: string;
  listing: ChatListing | null;
  otherUser: ChatUser | null;
  onSend: (content: string) => void;
  onAcceptOffer?: (offerId: number) => void;
  onRejectOffer?: (offerId: number) => void;
  onCounterOffer?: (offerId: number) => void;
  onBack?: () => void;
  onTogglePanel?: () => void;
  sending?: boolean;
  className?: string;
}

const listingStatusLabel: Record<string, string> = {
  ACTIVE: "ขายอยู่",
  RESERVED: "จอง",
  SOLD: "ขายแล้ว",
  EXPIRED: "หมดอายุ",
  CANCELLED: "ยกเลิก",
};

export function ChatPanel({
  messages,
  currentUserId,
  listing,
  otherUser,
  onSend,
  onAcceptOffer,
  onRejectOffer,
  onCounterOffer,
  onBack,
  onTogglePanel,
  sending = false,
  className,
}: ChatPanelProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = useCallback(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages.length, scrollToBottom]);

  if (!listing || !otherUser) {
    return (
      <div className={cn("flex flex-1 flex-col items-center justify-center bg-muted/20", className)}>
        <p className="text-muted-foreground">เลือกแชทเพื่อเริ่มสนทนา</p>
      </div>
    );
  }

  return (
    <div className={cn("flex flex-1 flex-col", className)}>
      {/* Header */}
      <div className="flex items-center gap-3 border-b bg-background px-4 py-2.5">
        {onBack && (
          <Button variant="ghost" size="icon-sm" aria-label="Go back" className="shrink-0 md:hidden" onClick={onBack}>
            <ArrowLeft className="size-4" />
          </Button>
        )}
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
          <p className="truncate text-xs text-muted-foreground">
            {listing.card.nameEn ?? listing.card.nameJp} · {listing.card.cardCode}
          </p>
        </div>
        <Badge variant="outline" className="shrink-0 text-xs">
          {listingStatusLabel[listing.status] ?? listing.status}
        </Badge>
        {onTogglePanel && (
          <Button variant="ghost" size="icon-sm" aria-label="Toggle order panel" className="shrink-0 lg:hidden" onClick={onTogglePanel}>
            <PanelRight className="size-4" />
          </Button>
        )}
      </div>

      {/* Messages */}
      <div
        ref={scrollRef}
        className="flex-1 space-y-1 overflow-y-auto px-4 py-3"
      >
        {messages.map((msg) => (
          <ChatMessageBubble
            key={msg.id}
            message={msg}
            currentUserId={currentUserId}
            onAcceptOffer={onAcceptOffer}
            onRejectOffer={onRejectOffer}
            onCounterOffer={onCounterOffer}
          />
        ))}
      </div>

      {/* Input */}
      <ChatInput onSend={onSend} disabled={sending} />
    </div>
  );
}
