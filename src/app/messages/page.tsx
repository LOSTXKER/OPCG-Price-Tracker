"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { MessageCircle } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useUIStore } from "@/stores/ui-store";
import { getLocale, t } from "@/lib/i18n";

type Conversation = {
  listingId: number;
  listing: {
    id: number;
    priceJpy: number;
    status: string;
    card: { cardCode: string; nameJp: string; nameEn?: string | null; imageUrl: string | null };
  };
  otherUser: { id: string; displayName: string | null; avatarUrl: string | null };
  lastMessage: string;
  lastMessageAt: string;
  unread: number;
};

export default function MessagesPage() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const lang = useUIStore((s) => s.language);
  const locale = getLocale(lang);

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/messages/conversations");
      if (!res.ok) {
        if (res.status === 401) {
          setError(t(lang, "login"));
        } else {
          setError(t(lang, "loadFailed"));
        }
        setLoading(false);
        return;
      }
      const data = (await res.json()) as { conversations: Conversation[] };
      setConversations(data.conversations ?? []);
    } catch {
      setError(t(lang, "loadFailed"));
    }
    setLoading(false);
  }, [lang]);

  useEffect(() => {
    void load();
  }, [load]);

  if (loading) {
    return (
      <div className="mx-auto max-w-2xl space-y-6">
        <Skeleton className="h-8 w-40" />
        <div className="space-y-3">
          <Skeleton className="h-20 rounded-xl" />
          <Skeleton className="h-20 rounded-xl" />
          <Skeleton className="h-20 rounded-xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{t(lang, "messagesTitle")}</h1>
        <p className="text-muted-foreground text-sm">{t(lang, "messagesChatSubtitle")}</p>
      </div>

      {error && <p className="text-destructive text-sm">{error}</p>}

      {conversations.length === 0 ? (
        <div className="flex flex-col items-center gap-4 rounded-xl border border-dashed py-16 text-center">
          <MessageCircle className="text-muted-foreground size-8" />
          <p className="text-muted-foreground text-sm">{t(lang, "noTransactions")}</p>
        </div>
      ) : (
        <div className="space-y-2">
          {conversations.map((conv) => (
            <Link
              key={conv.listingId}
              href={`/messages/${conv.listingId}`}
              className="flex items-center gap-3 rounded-xl border bg-card p-3 transition-colors hover:bg-muted/40"
            >
              {conv.listing.card.imageUrl && (
                <Image
                  src={conv.listing.card.imageUrl}
                  alt={conv.listing.card.nameEn ?? conv.listing.card.nameJp}
                  width={40}
                  height={56}
                  className="rounded"
                />
              )}
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">
                  {conv.listing.card.nameEn ?? conv.listing.card.nameJp}
                </p>
                <p className="text-muted-foreground truncate text-xs">
                  {conv.otherUser.displayName ?? "User"}: {conv.lastMessage}
                </p>
              </div>
              <div className="flex shrink-0 flex-col items-end gap-1">
                <span className="text-muted-foreground text-xs">
                  {new Date(conv.lastMessageAt).toLocaleDateString(locale, {
                    month: "short",
                    day: "numeric",
                  })}
                </span>
                {conv.unread > 0 && (
                  <Badge variant="default" className="text-xs">
                    {conv.unread}
                  </Badge>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
