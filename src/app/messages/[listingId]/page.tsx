"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Send, Wifi, WifiOff } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { useUIStore } from "@/stores/ui-store";
import { getLocale, t } from "@/lib/i18n";

type ChatMessage = {
  id: number;
  content: string;
  senderId: string;
  isOwn: boolean;
  sender: { displayName: string | null; avatarUrl: string | null };
  createdAt: string;
};

// Fallback polling interval when Realtime is unavailable
const FALLBACK_POLL_MS = 10_000;

export default function ChatPage() {
  const params = useParams<{ listingId: string }>();
  const listingId = params.listingId;
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [sendError, setSendError] = useState<string | null>(null);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [isRealtime, setIsRealtime] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const lang = useUIStore((s) => s.language);
  const locale = getLocale(lang);

  const load = useCallback(async () => {
    try {
      const res = await fetch(`/api/messages?listingId=${listingId}`);
      if (res.ok) {
        const data = (await res.json()) as { messages: ChatMessage[] };
        setMessages(data.messages ?? []);
      }
    } catch (err) {
      console.error("Chat load error:", err);
    }
    setLoading(false);
  }, [listingId]);

  // Initial load + Supabase Realtime subscription with polling fallback
  useEffect(() => {
    void load();

    const supabase = createClient();
    let fallbackInterval: ReturnType<typeof setInterval> | null = null;

    const channel = supabase
      .channel(`messages:listing:${listingId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "Message",
          filter: `listingId=eq.${listingId}`,
        },
        () => {
          // Re-fetch on new message so we get full sender details + isOwn flag
          void load();
        }
      )
      .subscribe((status) => {
        if (status === "SUBSCRIBED") {
          setIsRealtime(true);
        } else if (status === "CHANNEL_ERROR" || status === "TIMED_OUT" || status === "CLOSED") {
          setIsRealtime(false);
          // Fall back to polling when Realtime is unavailable
          if (!fallbackInterval) {
            fallbackInterval = setInterval(() => void load(), FALLBACK_POLL_MS);
          }
        }
      });

    return () => {
      void supabase.removeChannel(channel);
      if (fallbackInterval) clearInterval(fallbackInterval);
    };
  }, [load, listingId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const send = async () => {
    const content = input.trim();
    if (!content) return;
    setSending(true);
    setSendError(null);
    try {
      const res = await fetch("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ listingId: parseInt(listingId, 10), content }),
      });
      if (!res.ok) {
        setSendError(t(lang, "sendFailed"));
      } else {
        const data = (await res.json()) as { message: ChatMessage };
        setMessages((prev) => [...prev, data.message]);
        setInput("");
      }
    } catch (err) {
      console.error("Send message error:", err);
      setSendError(t(lang, "sendFailed"));
    }
    setSending(false);
  };

  return (
    <div className="mx-auto flex max-w-2xl flex-col">
      <div className="mb-4 flex items-center gap-3">
        <Link href="/messages" className="text-muted-foreground hover:text-foreground">
          <ArrowLeft className="size-5" />
        </Link>
        <h1 className="min-w-0 flex-1 truncate text-lg font-semibold">
          {t(lang, "chatHeading")} #{listingId}
        </h1>
        <span
          title={isRealtime ? "Real-time connected" : "Polling mode"}
          className={cn(
            "flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium",
            isRealtime
              ? "bg-green-500/10 text-green-600 dark:text-green-400"
              : "bg-muted text-muted-foreground"
          )}
        >
          {isRealtime ? <Wifi className="size-3" /> : <WifiOff className="size-3" />}
          {isRealtime ? "Live" : "Polling"}
        </span>
      </div>

      <div
        className="flex-1 space-y-3 overflow-auto rounded-xl border bg-muted/20 p-4"
        style={{ minHeight: 300, maxHeight: "60vh" }}
      >
        {loading ? (
          <p className="text-center text-sm text-muted-foreground">{t(lang, "loading")}</p>
        ) : messages.length === 0 ? (
          <p className="text-center text-sm text-muted-foreground">{t(lang, "startConversation")}</p>
        ) : (
          messages.map((m) => (
            <div
              key={m.id}
              className={cn("flex", m.isOwn ? "justify-end" : "justify-start")}
            >
              <div
                className={cn(
                  "min-w-0 max-w-[75%] rounded-2xl px-3 py-2 text-sm",
                  m.isOwn ? "bg-primary text-primary-foreground" : "bg-card border"
                )}
              >
                {!m.isOwn && (
                  <p className="mb-0.5 text-xs font-medium text-muted-foreground">
                    {m.sender.displayName ?? "User"}
                  </p>
                )}
                <p className="break-words">{m.content}</p>
                <p className="mt-1 text-right text-[11px] opacity-60">
                  {new Date(m.createdAt).toLocaleTimeString(locale, {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
              </div>
            </div>
          ))
        )}
        <div ref={bottomRef} />
      </div>

      {sendError && <p className="mt-1 text-xs text-destructive">{sendError}</p>}

      <form
        className="mt-3 flex gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          void send();
        }}
      >
        <Input
          placeholder={t(lang, "typeMessage")}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          disabled={sending}
          className="flex-1"
        />
        <Button type="submit" disabled={sending || !input.trim()} size="icon">
          <Send className="size-4" />
        </Button>
      </form>
    </div>
  );
}
