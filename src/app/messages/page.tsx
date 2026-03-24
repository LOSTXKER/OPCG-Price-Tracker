"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { MessageCircle } from "lucide-react";

import { Badge } from "@/components/ui/badge";

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

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/messages/conversations");
      if (!res.ok) {
        if (res.status === 401) {
          setError("กรุณาเข้าสู่ระบบ");
        } else {
          setError("โหลดข้อมูลไม่สำเร็จ");
        }
        setLoading(false);
        return;
      }
      const data = (await res.json()) as { conversations: Conversation[] };
      setConversations(data.conversations ?? []);
    } catch {
      setError("โหลดข้อมูลไม่สำเร็จ");
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  if (loading) {
    return (
      <div className="container mx-auto max-w-2xl px-4 py-8">
        <p className="text-muted-foreground text-sm">กำลังโหลด...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-2xl space-y-6 px-4 py-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">ข้อความ</h1>
        <p className="text-muted-foreground text-sm">
          สนทนากับผู้ซื้อ/ผู้ขาย
        </p>
      </div>

      {error && <p className="text-destructive text-sm">{error}</p>}

      {conversations.length === 0 ? (
        <div className="flex flex-col items-center gap-4 rounded-xl border border-dashed py-16 text-center">
          <MessageCircle className="text-muted-foreground size-8" />
          <p className="text-muted-foreground text-sm">ยังไม่มีข้อความ</p>
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
                  {conv.otherUser.displayName ?? "ผู้ใช้"}: {conv.lastMessage}
                </p>
              </div>
              <div className="flex shrink-0 flex-col items-end gap-1">
                <span className="text-muted-foreground text-xs">
                  {new Date(conv.lastMessageAt).toLocaleDateString("th-TH", {
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
