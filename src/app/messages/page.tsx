"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { MessageCircle } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { AuthPreviewGate } from "@/components/shared/login-gate";
import { useAuthState } from "@/hooks/use-auth-state";
import { useUIStore } from "@/stores/ui-store";
import { getLocale, t, type Language } from "@/lib/i18n";

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
  const { authed } = useAuthState();
  const lang = useUIStore((s) => s.language);

  if (authed === null) {
    return (
      <div className="mx-auto max-w-2xl space-y-4">
        <Skeleton className="h-8 w-40" />
        <Skeleton className="h-20 rounded-xl" />
        <Skeleton className="h-20 rounded-xl" />
        <Skeleton className="h-20 rounded-xl" />
      </div>
    );
  }

  if (authed === false) {
    return <AuthPreviewGate preview={<MessagesPreview lang={lang} />} />;
  }

  return <MessagesContent />;
}

function MessagesContent() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const lang = useUIStore((s) => s.language);
  const locale = getLocale(lang);

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/messages/conversations");
      if (!res.ok) {
        setError(t(lang, "loadFailed"));
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

  useEffect(() => { void load(); }, [load]);

  if (loading) {
    return (
      <div className="mx-auto max-w-2xl space-y-4">
        <Skeleton className="h-8 w-40" />
        <Skeleton className="h-20 rounded-xl" />
        <Skeleton className="h-20 rounded-xl" />
        <Skeleton className="h-20 rounded-xl" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{t(lang, "messagesTitle")}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{t(lang, "messagesChatSubtitle")}</p>
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      {conversations.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed py-20 text-center">
          <div className="flex size-12 items-center justify-center rounded-full bg-muted">
            <MessageCircle className="size-5 text-muted-foreground" />
          </div>
          <div>
            <p className="font-medium">{t(lang, "messagesTitle")}</p>
            <p className="mt-0.5 text-sm text-muted-foreground">{t(lang, "messagesChatSubtitle")}</p>
          </div>
          <Link href="/marketplace" className="mt-1 text-sm font-medium text-primary hover:underline">
            {t(lang, "marketplace")} →
          </Link>
        </div>
      ) : (
        <div className="space-y-2">
          {conversations.map((conv) => {
            const cardName = conv.listing.card.nameEn ?? conv.listing.card.nameJp;
            const otherName = conv.otherUser.displayName ?? "User";
            return (
              <Link
                key={conv.listingId}
                href={`/messages/${conv.listingId}`}
                className="flex items-center gap-3 rounded-xl border bg-card p-3 transition-colors hover:bg-muted/40"
              >
                {/* Card image */}
                {conv.listing.card.imageUrl ? (
                  <Image
                    src={conv.listing.card.imageUrl}
                    alt={cardName}
                    width={40}
                    height={56}
                    className="shrink-0 rounded object-cover"
                  />
                ) : (
                  <div className="size-10 shrink-0 rounded bg-muted" />
                )}

                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <Avatar className="size-5 shrink-0">
                      {conv.otherUser.avatarUrl && <AvatarImage src={conv.otherUser.avatarUrl} alt="" />}
                      <AvatarFallback className="text-[9px]">
                        {otherName.slice(0, 1).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <p className="truncate text-sm font-semibold">{otherName}</p>
                    {conv.listing.status !== "active" && (
                      <span className="shrink-0 rounded-full bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground">
                        {conv.listing.status}
                      </span>
                    )}
                  </div>
                  <p className="mt-0.5 truncate text-xs text-muted-foreground">
                    <span className="font-medium text-foreground/70">{cardName}</span>
                    {" · "}
                    {conv.lastMessage}
                  </p>
                </div>

                <div className="flex shrink-0 flex-col items-end gap-1.5">
                  <span className="text-[11px] text-muted-foreground">
                    {new Date(conv.lastMessageAt).toLocaleDateString(locale, {
                      month: "short",
                      day: "numeric",
                    })}
                  </span>
                  {conv.unread > 0 && (
                    <Badge className="h-4 min-w-4 rounded-full px-1 text-[10px] leading-none">
                      {conv.unread}
                    </Badge>
                  )}
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}

function MessagesPreview({ lang }: { lang: Language }) {
  const mockConvs = [
    { name: "Monkey D. Luffy (Alt Art)", user: "ยอด_เซลเลอร์", time: "วันนี้", unread: 2 },
    { name: "Roronoa Zoro SEC", user: "CardShop_BKK", time: "เมื่อวาน", unread: 0 },
    { name: "Portgas D. Ace SP", user: "Collector01", time: "2 วันที่แล้ว", unread: 1 },
  ];
  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{t(lang, "messagesTitle")}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{t(lang, "messagesChatSubtitle")}</p>
      </div>
      <div className="space-y-2">
        {mockConvs.map((c) => (
          <div key={c.name} className="flex items-center gap-3 rounded-xl border bg-card p-3">
            <div className="size-10 shrink-0 rounded bg-muted" />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold">{c.user}</p>
              <p className="mt-0.5 truncate text-xs text-muted-foreground">
                <span className="font-medium text-foreground/70">{c.name}</span>
                {" · "}สนใจซื้อครับ...
              </p>
            </div>
            <div className="flex shrink-0 flex-col items-end gap-1.5">
              <span className="text-[11px] text-muted-foreground">{c.time}</span>
              {c.unread > 0 && (
                <Badge className="h-4 min-w-4 rounded-full px-1 text-[10px] leading-none">
                  {c.unread}
                </Badge>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
