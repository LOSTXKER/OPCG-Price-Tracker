"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Send } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

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
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  const load = useCallback(async () => {
    try {
      const res = await fetch(`/api/messages?listingId=${listingId}`);
      if (res.ok) {
        const data = (await res.json()) as { messages: ChatMessage[] };
        setMessages(data.messages ?? []);
      }
    } catch {
      /* ignore */
    }
    setLoading(false);
  }, [listingId]);

  useEffect(() => {
    void load();
    const interval = setInterval(() => void load(), 10000);
    return () => clearInterval(interval);
  }, [load]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const send = async () => {
    const content = input.trim();
    if (!content) return;
    setSending(true);
    try {
      const res = await fetch("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ listingId: parseInt(listingId, 10), content }),
      });
      if (res.ok) {
        const data = (await res.json()) as { message: ChatMessage };
        setMessages((prev) => [...prev, data.message]);
        setInput("");
      }
    } catch {
      /* ignore */
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
          แชท · Listing #{listingId}
        </h1>
      </div>

      <div className="flex-1 space-y-3 overflow-auto rounded-xl border bg-muted/20 p-4" style={{ minHeight: 300, maxHeight: "60vh" }}>
        {loading ? (
          <p className="text-muted-foreground text-center text-sm">กำลังโหลด...</p>
        ) : messages.length === 0 ? (
          <p className="text-muted-foreground text-center text-sm">เริ่มสนทนา</p>
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
                    {m.sender.displayName ?? "ผู้ใช้"}
                  </p>
                )}
                <p>{m.content}</p>
                <p className={cn("mt-1 text-right text-[11px] opacity-60")}>
                  {new Date(m.createdAt).toLocaleTimeString("th-TH", {
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

      <form
        className="mt-3 flex gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          void send();
        }}
      >
        <Input
          placeholder="พิมพ์ข้อความ..."
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
