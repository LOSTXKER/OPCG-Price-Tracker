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
import { MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/shared/empty-state";
import { LoadingState } from "@/components/shared/loading-state";
import { t } from "@/lib/i18n";
import { useUIStore } from "@/stores/ui-store";
import { toast } from "sonner";

interface ChatLayoutProps {
  currentUserId: string;
  activeListingId: number | null;
}

export function ChatLayout({ currentUserId, activeListingId }: ChatLayoutProps) {
  const router = useRouter();
  const lang = useUIStore((state) => state.language);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [messagesLoading, setMessagesLoading] = useState(Boolean(activeListingId));
  const [messagesError, setMessagesError] = useState(false);
  const [sending, setSending] = useState(false);
  const [offerDialogOpen, setOfferDialogOpen] = useState(false);
  const [counterOfferId, setCounterOfferId] = useState<number | null>(null);
  // Closed by default below lg — otherwise the absolute 320px order panel covers
  // the whole chat AND its own toggle button on phones/tablets (unclosable). On
  // lg+ the panel is `lg:static` and always visible regardless of this flag.
  const [showOrderPanel, setShowOrderPanel] = useState(false);
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
  const messagesAbortRef = useRef<AbortController | null>(null);

  const activeConv = conversations.find(
    (c) => c.listingId === activeListingId
  );

  const fetchConversations = useCallback(async () => {
    try {
      const data = await apiGet<{ conversations?: Conversation[] }>(
        "/api/messages/conversations",
      );
      setConversations(data.conversations || []);
      return true;
    } catch {
      return false;
    }
  }, []);

  const fetchMessages = useCallback(
    async (
      listingId: number,
      signal?: AbortSignal,
      showLoading = false,
    ): Promise<boolean> => {
      if (showLoading) {
        setMessages([]);
        setMessagesError(false);
        setMessagesLoading(true);
      }

      try {
        const data = await apiGet<{ messages?: ChatMessage[] }>(
          `/api/messages?listingId=${listingId}`,
          signal,
        );
        if (signal?.aborted) return false;
        setMessages(data.messages || []);
        if (showLoading) setMessagesError(false);
        return true;
      } catch {
        if (signal?.aborted) return false;
        if (showLoading) setMessagesError(true);
        return false;
      } finally {
        if (showLoading && !signal?.aborted) setMessagesLoading(false);
      }
    },
    [],
  );

  const loadMessageThread = useCallback(
    (listingId: number) => {
      messagesAbortRef.current?.abort();
      const controller = new AbortController();
      messagesAbortRef.current = controller;
      void fetchMessages(listingId, controller.signal, true);
    },
    [fetchMessages],
  );

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
    let cancelled = false;
    void fetchConversations().then((ok) => {
      if (cancelled) return;
      setLoadError(!ok);
      setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [fetchConversations]);

  useEffect(() => {
    if (activeListingId) {
      loadMessageThread(activeListingId);
      setMobileView("chat");
    } else {
      messagesAbortRef.current?.abort();
      setMessages([]);
      setMessagesError(false);
      setMessagesLoading(false);
    }
    return () => messagesAbortRef.current?.abort();
  }, [activeListingId, loadMessageThread]);

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
    async (content: string): Promise<boolean> => {
      if (!activeListingId) return false;
      setSending(true);
      try {
        const data = await apiPost<{ message: ChatMessage }>("/api/messages", {
          listingId: activeListingId,
          content,
        });
        setMessages((prev) => [...prev, data.message]);
        void fetchConversations();
        return true;
      } catch {
        // A timed-out mutation may have reached the server. Reconcile before
        // the user retries so a successful send is visible instead of hidden.
        await fetchMessages(activeListingId);
        toast.error(t(lang, "sendFailed"));
        return false;
      } finally {
        setSending(false);
      }
    },
    [activeListingId, fetchConversations, fetchMessages, lang]
  );

  const handleMakeOffer = useCallback(
    async (priceThb: number, note: string): Promise<boolean> => {
      if (!activeListingId) return false;
      try {
        await apiPost("/api/offers", {
          listingId: activeListingId,
          priceThb,
          note: note || undefined,
          parentId: counterOfferId || undefined,
        });
        void fetchMessages(activeListingId);
        void fetchConversations();
        setCounterOfferId(null);
        return true;
      } catch {
        await fetchMessages(activeListingId);
        toast.error(t(lang, "offerFailed"));
        return false;
      }
    },
    [activeListingId, counterOfferId, fetchMessages, fetchConversations, lang]
  );

  const handleAcceptOffer = useCallback(
    async (offerId: number) => {
      try {
        await apiPatch(`/api/offers/${offerId}`, { action: "accept" });
        if (activeListingId) {
          void fetchMessages(activeListingId);
          void fetchConversations();
        }
      } catch {
        if (activeListingId) await fetchMessages(activeListingId);
        toast.error(t(lang, "offerFailed"));
      }
    },
    [activeListingId, fetchMessages, fetchConversations, lang]
  );

  const handleRejectOffer = useCallback(
    async (offerId: number) => {
      try {
        await apiPatch(`/api/offers/${offerId}`, { action: "reject" });
        if (activeListingId) {
          void fetchMessages(activeListingId);
          void fetchConversations();
        }
      } catch {
        if (activeListingId) await fetchMessages(activeListingId);
        toast.error(t(lang, "offerFailed"));
      }
    },
    [activeListingId, fetchMessages, fetchConversations, lang]
  );

  const handleCounterOffer = useCallback((offerId: number) => {
    setCounterOfferId(offerId);
    setOfferDialogOpen(true);
  }, []);

  const handleBuyNow = useCallback(async () => {
    if (!activeListingId) return;
    try {
      await apiPost("/api/orders", { listingId: activeListingId });
      void fetchMessages(activeListingId);
      void fetchConversations();
    } catch {
      await fetchMessages(activeListingId);
      toast.error(t(lang, "mktCreateGenericError"));
    }
  }, [activeListingId, fetchMessages, fetchConversations, lang]);

  const handleUpdateOrder = useCallback(
    async (orderId: number, status: string, data?: Record<string, string>) => {
      try {
        await apiPatch(`/api/orders/${orderId}`, { status, ...data });
        if (activeListingId) {
          void fetchMessages(activeListingId);
          void fetchConversations();
          void fetchActiveOrder(activeListingId);
        }
      } catch {
        if (activeListingId) {
          await Promise.all([
            fetchMessages(activeListingId),
            fetchActiveOrder(activeListingId),
          ]);
        }
        toast.error(t(lang, "orderUpdateFailed"));
      }
    },
    [activeListingId, fetchMessages, fetchConversations, fetchActiveOrder, lang]
  );

  if (loading) {
    return (
      <div className="h-dvh bg-background p-4">
        <LoadingState
          variant="skeleton-list"
          count={7}
          label={t(lang, "loading")}
          className="mx-auto max-w-xl"
        />
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="flex h-dvh items-center justify-center bg-background p-4">
        <EmptyState
          variant="error"
          icon={MessageCircle}
          title={t(lang, "failedToLoad")}
          action={
            <Button
              onClick={() => {
                setLoadError(false);
                setLoading(true);
                void fetchConversations().then((ok) => {
                  setLoadError(!ok);
                  setLoading(false);
                });
              }}
            >
              {t(lang, "retry")}
            </Button>
          }
        />
      </div>
    );
  }

  const listing = activeConv?.listing ?? null;
  const otherUser = activeConv?.otherUser ?? null;
  const isSeller = activeConv?.isSeller ?? false;

  return (
    <div className="relative flex h-dvh w-full overflow-hidden bg-background">
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
          "relative flex min-w-0 flex-1",
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
          messagesLoading={messagesLoading}
          messagesError={messagesError}
          onRetryMessages={
            activeListingId ? () => loadMessageThread(activeListingId) : undefined
          }
        />

        {/* Order sidebar - toggle on tablet, always on desktop */}
        {listing && otherUser && (
          <>
            {/* Tap-away backdrop below lg so the overlay panel is always closable. */}
            {showOrderPanel && (
              <button
                type="button"
                aria-label="Close order panel"
                onClick={() => setShowOrderPanel(false)}
                className="absolute inset-0 z-10 bg-foreground/20 lg:hidden"
              />
            )}
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
