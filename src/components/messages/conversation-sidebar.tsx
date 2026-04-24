"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { ConversationItem } from "./conversation-item";
import type { Conversation } from "./types";

type TabFilter = "all" | "buying" | "selling";

interface ConversationSidebarProps {
  conversations: Conversation[];
  activeListingId: number | null;
  className?: string;
}

export function ConversationSidebar({
  conversations,
  activeListingId,
  className,
}: ConversationSidebarProps) {
  const [tab, setTab] = useState<TabFilter>("all");
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    let list = conversations;
    if (tab === "buying") list = list.filter((c) => !c.isSeller);
    if (tab === "selling") list = list.filter((c) => c.isSeller);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (c) =>
          c.otherUser.displayName?.toLowerCase().includes(q) ||
          c.listing.card.nameJp.toLowerCase().includes(q) ||
          c.listing.card.nameEn?.toLowerCase().includes(q) ||
          c.listing.card.cardCode.toLowerCase().includes(q)
      );
    }
    return list;
  }, [conversations, tab, search]);

  const tabs: { key: TabFilter; label: string }[] = [
    { key: "all", label: "ทั้งหมด" },
    { key: "buying", label: "ผู้ซื้อ" },
    { key: "selling", label: "ผู้ขาย" },
  ];

  return (
    <aside className={cn("flex h-full flex-col border-r bg-background", className)}>
      <div className="flex items-center gap-2 border-b px-3 py-2.5">
        <Link href="/">
          <Button variant="ghost" size="icon-sm" aria-label="Back to site">
            <ArrowLeft className="size-4" />
          </Button>
        </Link>
        <h1 className="text-sm font-semibold">แชท</h1>
      </div>

      <div className="flex gap-1 border-b px-3 py-1.5">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={cn(
              "rounded-md px-2.5 py-1 text-xs font-medium transition-colors",
              tab === t.key
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-muted"
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="px-3 py-2">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="ค้นหาแชท..."
            className="h-8 pl-8 text-xs"
          />
        </div>
      </div>

      <div className="flex-1 space-y-0.5 overflow-y-auto px-1.5 pb-2">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <p className="text-sm text-muted-foreground">
              {search ? "ไม่พบแชท" : "ยังไม่มีแชท"}
            </p>
          </div>
        ) : (
          filtered.map((conv) => (
            <ConversationItem
              key={conv.listingId}
              conversation={conv}
              isActive={conv.listingId === activeListingId}
            />
          ))
        )}
      </div>
    </aside>
  );
}
