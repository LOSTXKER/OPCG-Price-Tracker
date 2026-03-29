"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Send } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { useUIStore } from "@/stores/ui-store";
import { getLocale, t } from "@/lib/i18n";

const CHAT_POLL_INTERVAL_MS = 10_000;

type ChatMessage = {
  id: number;
  content: string;
  senderId: string;
  isOwn: boolean;
  sender: { displayName: string | null; avatarUrl: string | null };
  createdAt: string;
};

export default function ChatPage() {
  const params = useParams<{ listingId: string }>();
  const listingId = params.listingId;
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [sendError, setSendError] = useState<string | null>(null);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const lang = useUIStore((s) => s.language);
  const locale = getLocale(lang);

  const load = useCallback(async () => {
    try {
      const res = await fetch(`/api/messages?listingId=${listingId}`);
      if (!res.ok) {
        console.error(`Failed to load messages: ${res.status}`);
      } else {
        const data = (await res.json()) as { messages: ChatMessage[] };
        setMessages(data.messages ?? []);
      }
    } catch (err) {
      console.error("Chat load error:", err);
    }
    setLoading(false);
  }, [listingId]);

  useEffect(() => {
    void load();
    const interval = setInterval(() => void load(), CHAT_POLL_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [load]);

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
    <div className="container mx-auto flex max-w-2xl flex-col px-4 py-4">
      <div className="mb-4 flex items-center gap-3">
        <Link href="/messages" className="text-muted-foreground hover:text-foreground">
          <ArrowLeft className="size-5" />
        </Link>
        <h1 className="text-lg font-semibold">
          {t(lang, "chatHeading")} #{listingId}
        </h1>
      </div>

      <div className="flex-1 space-y-3 overflow-auto rounded-xl border bg-muted/20 p-4" style={{ minHeight: 300, maxHeight: "60vh" }}>
        {loading ? (
          <p className="text-muted-foreground text-center text-sm">{t(lang, "loading")}</p>
        ) : messages.length === 0 ? (
          <p className="text-muted-foreground text-center text-sm">{t(lang, "startConversation")}</p>
        ) : (
          messages.map((m) => (
            <div
              key={m.id}
              className={cn("flex", m.isOwn ? "justify-end" : "justify-start")}
            >
              <div
                className={cn(
                  "max-w-[75%] rounded-2xl px-3 py-2 text-sm",
                  m.isOwn
                    ? "bg-primary text-primary-foreground"
                    : "bg-card border"
                )}
              >
                {!m.isOwn && (
                  <p className="text-muted-foreground mb-0.5 text-xs font-medium">
                    {m.sender.displayName ?? "User"}
                  </p>
                )}
                <p>{m.content}</p>
                <p className={cn("mt-1 text-right text-[11px] opacity-60")}>
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
