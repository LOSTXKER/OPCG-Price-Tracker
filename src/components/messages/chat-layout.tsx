"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { ConversationSidebar } from "./conversation-sidebar";
import { ChatPanel } from "./chat-panel";
import { OrderSidebar } from "./order-sidebar";
import { MakeOfferDialog } from "./make-offer-dialog";
import type { Conversation, ChatMessage } from "./types";
import { createClient } from "@/lib/supabase/client";
import { apiGet, apiPatch, apiPost, apiTry } from "@/lib/api/client";
import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";

interface ChatLayoutProps {
  currentUserId: string;
  activeListingId: number | null;
}

export function ChatLayout({ currentUserId, activeListingId }: ChatLayoutProps) {
  const router = useRouter();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [offerDialogOpen, setOfferDialogOpen] = useState(false);
  const [counterOfferId, setCounterOfferId] = useState<number | null>(null);
  const [showOrderPanel, setShowOrderPanel] = useState(true);
  const [mobileView, setMobileView] = useState<"list" | "chat">(
    activeListingId ? "chat" : "list"
  );
  const [activeOrder, setActiveOrder] = useState<{
    id: number;
    status: string;
    priceThb: number;
    trackingNumber?: string | null;
    shippingMethod?: string | null;
  } | null>(null);

  const pollingRef = useRef<NodeJS.Timeout | null>(null);

  const activeConv = conversations.find(
    (c) => c.listingId === activeListingId
  );

  const fetchConversations = useCallback(async () => {
    const data = await apiTry(
      apiGet<{ conversations?: Conversation[] }>("/api/messages/conversations")
    );
    if (data) setConversations(data.conversations || []);
  }, []);

  const fetchMessages = useCallback(async (listingId: number) => {
    const data = await apiTry(
      apiGet<{ messages?: ChatMessage[] }>(`/api/messages?listingId=${listingId}`)
    );
    if (data) setMessages(data.messages || []);
  }, []);

  const fetchActiveOrder = useCallback(
    async (listingId: number) => {
      const conv = conversations.find((c) => c.listingId === listingId);
      if (conv?.activeOrder) {
        const data = await apiTry(
          apiGet<{ order: typeof activeOrder }>(`/api/orders/${conv.activeOrder.id}`)
        );
        setActiveOrder(data?.order ?? null);
      } else {
        setActiveOrder(null);
      }
    },
    [conversations]
  );

  useEffect(() => {
    fetchConversations().then(() => setLoading(false));
  }, [fetchConversations]);

  useEffect(() => {
    if (activeListingId) {
      fetchMessages(activeListingId);
      setMobileView("chat");
    }
  }, [activeListingId, fetchMessages]);

  useEffect(() => {
    if (activeListingId && conversations.length > 0) {
      fetchActiveOrder(activeListingId);
    }
  }, [activeListingId, conversations, fetchActiveOrder]);

  // Supabase Realtime for messages, offers, and orders
  useEffect(() => {
    if (!activeListingId) return;

    const supabase = createClient();
    const channel = supabase
      .channel(`chat:${activeListingId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "Message",
          filter: `listingId=eq.${activeListingId}`,
        },
        () => {
          fetchMessages(activeListingId);
          fetchConversations();
        }
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "Offer",
          filter: `listingId=eq.${activeListingId}`,
        },
        () => {
          fetchMessages(activeListingId);
          fetchConversations();
        }
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "Order",
          filter: `listingId=eq.${activeListingId}`,
        },
        () => {
          fetchMessages(activeListingId);
          fetchConversations();
          fetchActiveOrder(activeListingId);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [activeListingId, fetchMessages, fetchConversations, fetchActiveOrder]);

  // Polling fallback for conversations
  useEffect(() => {
    pollingRef.current = setInterval(fetchConversations, 30000);
    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current);
    };
  }, [fetchConversations]);

  const handleSend = useCallback(
    async (content: string) => {
      if (!activeListingId) return;
      setSending(true);
      try {
        const data = await apiTry(
          apiPost<{ message: ChatMessage }>("/api/messages", {
            listingId: activeListingId,
            content,
          })
        );
        if (data) {
          setMessages((prev) => [...prev, data.message]);
          fetchConversations();
        }
      } finally {
        setSending(false);
      }
    },
    [activeListingId, fetchConversations]
  );

  const handleMakeOffer = useCallback(
    async (priceThb: number, note: string) => {
      if (!activeListingId) return;
      const ok = await apiTry(
        apiPost("/api/offers", {
          listingId: activeListingId,
          priceThb,
          note: note || undefined,
          parentId: counterOfferId || undefined,
        })
      );
      if (ok !== null) {
        fetchMessages(activeListingId);
        fetchConversations();
        setCounterOfferId(null);
      }
    },
    [activeListingId, counterOfferId, fetchMessages, fetchConversations]
  );

  const handleAcceptOffer = useCallback(
    async (offerId: number) => {
      const ok = await apiTry(
        apiPatch(`/api/offers/${offerId}`, { action: "accept" })
      );
      if (ok !== null && activeListingId) {
        fetchMessages(activeListingId);
        fetchConversations();
      }
    },
    [activeListingId, fetchMessages, fetchConversations]
  );

  const handleRejectOffer = useCallback(
    async (offerId: number) => {
      const ok = await apiTry(
        apiPatch(`/api/offers/${offerId}`, { action: "reject" })
      );
      if (ok !== null && activeListingId) {
        fetchMessages(activeListingId);
        fetchConversations();
      }
    },
    [activeListingId, fetchMessages, fetchConversations]
  );

  const handleCounterOffer = useCallback((offerId: number) => {
    setCounterOfferId(offerId);
    setOfferDialogOpen(true);
  }, []);

  const handleBuyNow = useCallback(async () => {
    if (!activeListingId) return;
    const ok = await apiTry(
      apiPost("/api/orders", { listingId: activeListingId })
    );
    if (ok !== null) {
      fetchMessages(activeListingId);
      fetchConversations();
    }
  }, [activeListingId, fetchMessages, fetchConversations]);

  const handleUpdateOrder = useCallback(
    async (orderId: number, status: string, data?: Record<string, string>) => {
      const ok = await apiTry(
        apiPatch(`/api/orders/${orderId}`, { status, ...data })
      );
      if (ok !== null && activeListingId) {
        fetchMessages(activeListingId);
        fetchConversations();
        fetchActiveOrder(activeListingId);
      }
    },
    [activeListingId, fetchMessages, fetchConversations, fetchActiveOrder]
  );

  if (loading) {
    return (
      <div className="flex h-dvh items-center justify-center">
        <Loader2 className="size-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const listing = activeConv?.listing ?? null;
  const otherUser = activeConv?.otherUser ?? null;
  const isSeller = activeConv?.isSeller ?? false;

  return (
    <div className="relative flex h-dvh bg-background">
      {/* Sidebar - hidden on mobile when chat is active */}
      <ConversationSidebar
        conversations={conversations}
        activeListingId={activeListingId}
        className={cn(
          "absolute inset-y-0 left-0 z-20 w-full",
          "md:static md:z-auto md:w-80 md:shrink-0",
          mobileView === "chat" && "hidden md:flex"
        )}
      />

      {/* Chat panel */}
      <div
        className={cn(
          "relative flex flex-1",
          mobileView === "list" && "hidden md:flex"
        )}
      >
        <ChatPanel
          messages={messages}
          currentUserId={currentUserId}
          listing={listing}
          otherUser={otherUser}
          onSend={handleSend}
          onAcceptOffer={handleAcceptOffer}
          onRejectOffer={handleRejectOffer}
          onCounterOffer={handleCounterOffer}
          onBack={activeListingId ? () => { setMobileView("list"); router.push("/messages"); } : undefined}
          onTogglePanel={listing && otherUser ? () => setShowOrderPanel((v) => !v) : undefined}
          sending={sending}
        />

        {/* Order sidebar - toggle on tablet, always on desktop */}
        {listing && otherUser && (
          <>
            <OrderSidebar
              listing={listing}
              otherUser={otherUser}
              isSeller={isSeller}
              currentUserId={currentUserId}
              activeOrder={activeOrder}
              onBuyNow={handleBuyNow}
              onMakeOffer={() => {
                setCounterOfferId(null);
                setOfferDialogOpen(true);
              }}
              onUpdateOrder={handleUpdateOrder}
              className={cn(
                "absolute inset-y-0 right-0 z-20 w-80 shrink-0 shadow-xl",
                "lg:static lg:z-auto lg:shadow-none",
                !showOrderPanel && "hidden lg:flex"
              )}
            />
          </>
        )}
      </div>

      {/* Make Offer Dialog */}
      <MakeOfferDialog
        open={offerDialogOpen}
        onOpenChange={setOfferDialogOpen}
        listingPrice={listing?.priceThb ?? null}
        marketPrice={listing?.card.latestPriceThb ?? null}
        onSubmit={handleMakeOffer}
        isCounter={counterOfferId !== null}
        parentOfferId={counterOfferId ?? undefined}
      />
    </div>
  );
}
