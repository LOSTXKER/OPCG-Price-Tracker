"use client";

import { useRef, useEffect, useCallback } from "react";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowLeft, MessageCircle, PanelRight } from "lucide-react";
import { ChatMessageBubble } from "./chat-message";
import { ChatInput } from "./chat-input";
import type { ChatMessage, ChatListing, ChatUser } from "./types";
import { t, type TranslationKey } from "@/lib/i18n";
import { useUIStore } from "@/stores/ui-store";
import { EmptyState } from "@/components/shared/empty-state";
import { LoadingState } from "@/components/shared/loading-state";
import { baseCardCode } from "@/lib/cards/card-code";

interface ChatPanelProps {
  messages: ChatMessage[];
  currentUserId: string;
  listing: ChatListing | null;
  otherUser: ChatUser | null;
  onSend: (content: string) => Promise<boolean>;
  onAcceptOffer?: (offerId: number) => void;
  onRejectOffer?: (offerId: number) => void;
  onCounterOffer?: (offerId: number) => void;
  onBack?: () => void;
  onTogglePanel?: () => void;
  sending?: boolean;
  messagesLoading?: boolean;
  messagesError?: boolean;
  onRetryMessages?: () => void;
  className?: string;
}

const listingStatusKey: Record<string, TranslationKey> = {
  ACTIVE: "msgChatStatusActive",
  RESERVED: "msgChatStatusReserved",
  SOLD: "msgChatStatusSold",
  EXPIRED: "msgChatStatusExpired",
  CANCELLED: "msgChatStatusCancelled",
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
  messagesLoading = false,
  messagesError = false,
  onRetryMessages,
  className,
}: ChatPanelProps) {
  const lang = useUIStore((s) => s.language);
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
      <div className={cn("flex flex-1 flex-col items-center justify-center gap-4 bg-muted/20 px-6 text-center", className)}>
        <p className="text-muted-foreground">{t(lang, "msgChatEmptyState")}</p>
        {onBack && (
          <Button variant="outline" onClick={onBack}>
            <ArrowLeft className="size-4" />
            {t(lang, "back")}
          </Button>
        )}
      </div>
    );
  }

  return (
    <div className={cn("flex min-w-0 flex-1 flex-col", className)}>
      {/* Header */}
      <div className="flex min-w-0 items-center gap-3 border-b bg-background px-4 py-2.5">
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
          <p className="truncate text-meta">
            {listing.card.nameEn ?? listing.card.nameJp} · {baseCardCode(listing.card.cardCode)}
          </p>
        </div>
        <Badge variant="outline" className="shrink-0 text-xs">
          {listingStatusKey[listing.status] ? t(lang, listingStatusKey[listing.status]) : listing.status}
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
        className="min-w-0 flex-1 space-y-1 overflow-y-auto px-4 py-3"
      >
        {messagesLoading ? (
          <LoadingState
            variant="skeleton-list"
            count={5}
            label={t(lang, "loading")}
            size="sm"
          />
        ) : messagesError ? (
          <EmptyState
            variant="error"
            icon={MessageCircle}
            title={t(lang, "failedToLoad")}
            action={
              onRetryMessages ? (
                <Button variant="outline" size="sm" onClick={onRetryMessages}>
                  {t(lang, "retry")}
                </Button>
              ) : undefined
            }
          />
        ) : messages.length === 0 ? (
          <EmptyState
            variant="plain"
            appearance="minimal"
            icon={MessageCircle}
            title={t(lang, "startConversation")}
          />
        ) : (
          messages.map((msg) => (
            <ChatMessageBubble
              key={msg.id}
              message={msg}
              currentUserId={currentUserId}
              onAcceptOffer={onAcceptOffer}
              onRejectOffer={onRejectOffer}
              onCounterOffer={onCounterOffer}
            />
          ))
        )}
      </div>

      {/* Input */}
      {!messagesLoading && !messagesError && (
        <ChatInput onSend={onSend} disabled={sending} />
      )}
    </div>
  );
}
