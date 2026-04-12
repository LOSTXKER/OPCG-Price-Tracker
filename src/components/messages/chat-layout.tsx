"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { ConversationSidebar } from "./conversation-sidebar";
import { ChatPanel } from "./chat-panel";
import { OrderSidebar } from "./order-sidebar";
import { MakeOfferDialog } from "./make-offer-dialog";
import type { Conversation, ChatMessage, ChatListing, ChatUser } from "./types";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ArrowLeft, PanelRight } from "lucide-react";

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
    try {
      const res = await fetch("/api/messages/conversations");
      if (res.ok) {
        const data = await res.json();
        setConversations(data.conversations || []);
      }
    } catch {
      /* ignore */
    }
  }, []);

  const fetchMessages = useCallback(async (listingId: number) => {
    try {
      const res = await fetch(`/api/messages?listingId=${listingId}`);
      if (res.ok) {
        const data = await res.json();
        setMessages(data.messages || []);
      }
    } catch {
      /* ignore */
    }
  }, []);

  const fetchActiveOrder = useCallback(
    async (listingId: number) => {
      try {
        const conv = conversations.find((c) => c.listingId === listingId);
        if (conv?.activeOrder) {
          const res = await fetch(`/api/orders/${conv.activeOrder.id}`);
          if (res.ok) {
            const data = await res.json();
            setActiveOrder(data.order);
          }
        } else {
          setActiveOrder(null);
        }
      } catch {
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
        const res = await fetch("/api/messages", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ listingId: activeListingId, content }),
        });
        if (res.ok) {
          const data = await res.json();
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
      const res = await fetch("/api/offers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          listingId: activeListingId,
          priceThb,
          note: note || undefined,
          parentId: counterOfferId || undefined,
        }),
      });
      if (res.ok) {
        fetchMessages(activeListingId);
        fetchConversations();
        setCounterOfferId(null);
      }
    },
    [activeListingId, counterOfferId, fetchMessages, fetchConversations]
  );

  const handleAcceptOffer = useCallback(
    async (offerId: number) => {
      const res = await fetch(`/api/offers/${offerId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "accept" }),
      });
      if (res.ok && activeListingId) {
        fetchMessages(activeListingId);
        fetchConversations();
      }
    },
    [activeListingId, fetchMessages, fetchConversations]
  );

  const handleRejectOffer = useCallback(
    async (offerId: number) => {
      const res = await fetch(`/api/offers/${offerId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "reject" }),
      });
      if (res.ok && activeListingId) {
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
    const res = await fetch("/api/orders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ listingId: activeListingId }),
    });
    if (res.ok) {
      fetchMessages(activeListingId);
      fetchConversations();
    }
  }, [activeListingId, fetchMessages, fetchConversations]);

  const handleUpdateOrder = useCallback(
    async (orderId: number, status: string, data?: Record<string, string>) => {
      const res = await fetch(`/api/orders/${orderId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status, ...data }),
      });
      if (res.ok && activeListingId) {
        fetchMessages(activeListingId);
        fetchConversations();
        fetchActiveOrder(activeListingId);
      }
    },
    [activeListingId, fetchMessages, fetchConversations, fetchActiveOrder]
  );

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="size-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  const listing = activeConv?.listing ?? null;
  const otherUser = activeConv?.otherUser ?? null;
  const isSeller = activeConv?.isSeller ?? false;

  return (
    <div className="relative flex h-screen bg-background">
      {/* Sidebar - hidden on mobile when chat is active */}
      <ConversationSidebar
        conversations={conversations}
        activeListingId={activeListingId}
        className={cn(
          "w-80 shrink-0",
          "max-md:absolute max-md:inset-y-0 max-md:left-0 max-md:z-20 max-md:w-full",
          mobileView === "chat" && "max-md:hidden"
        )}
      />

      {/* Chat panel */}
      <div
        className={cn(
          "relative flex flex-1",
          mobileView === "list" && "max-md:hidden"
        )}
      >
        {/* Mobile back button */}
        {activeListingId && (
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label="Go back"
            className="absolute left-2 top-3 z-30 md:hidden"
            onClick={() => {
              setMobileView("list");
              router.push("/messages");
            }}
          >
            <ArrowLeft className="size-4" />
          </Button>
        )}

        <ChatPanel
          messages={messages}
          currentUserId={currentUserId}
          listing={listing}
          otherUser={otherUser}
          onSend={handleSend}
          onAcceptOffer={handleAcceptOffer}
          onRejectOffer={handleRejectOffer}
          onCounterOffer={handleCounterOffer}
          sending={sending}
        />

        {/* Order sidebar - toggle on tablet, always on desktop */}
        {listing && otherUser && (
          <>
            <Button
              variant="ghost"
              size="icon-sm"
              aria-label="Toggle order panel"
              className="absolute right-2 top-3 z-30 lg:hidden"
              onClick={() => setShowOrderPanel((v) => !v)}
            >
              <PanelRight className="size-4" />
            </Button>
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
                "w-80 shrink-0",
                "max-lg:absolute max-lg:inset-y-0 max-lg:right-0 max-lg:z-20 max-lg:w-80 max-lg:shadow-xl",
                !showOrderPanel && "max-lg:hidden"
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
