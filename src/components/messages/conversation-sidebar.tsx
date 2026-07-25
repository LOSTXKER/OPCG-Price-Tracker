"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { SegmentedControl } from "@/components/ui/segmented-control";
import { ArrowLeft, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { t } from "@/lib/i18n";
import { useUIStore } from "@/stores/ui-store";
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
  const lang = useUIStore((s) => s.language);
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
    { key: "all", label: t(lang, "msgConvTabAll") },
    { key: "buying", label: t(lang, "msgConvTabBuying") },
    { key: "selling", label: t(lang, "msgConvTabSelling") },
  ];

  return (
    <aside className={cn("flex h-full flex-col border-r bg-background", className)}>
      <div className="flex items-center gap-2 border-b px-3 py-2.5">
        <Link href="/">
          <Button variant="ghost" size="icon-sm" aria-label="Back to site">
            <ArrowLeft className="size-4" />
          </Button>
        </Link>
        <h1 className="text-h4">{t(lang, "msgConvTitle")}</h1>
      </div>

      <div className="border-b px-3 py-1.5">
        <SegmentedControl<TabFilter>
          value={tab}
          onChange={setTab}
          options={tabs.map((item) => ({
            value: item.key,
            label: item.label,
          }))}
          fullWidth
          size="sm"
          ariaLabel={t(lang, "msgConvTitle")}
        />
      </div>

      <div className="px-3 py-2">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t(lang, "msgConvSearchPlaceholder")}
            aria-label={t(lang, "msgConvSearchPlaceholder")}
            className="h-11 pl-8 text-xs sm:h-8"
          />
        </div>
      </div>

      <div className="flex-1 space-y-0.5 overflow-y-auto px-1.5 pb-2">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <p className="text-sm text-muted-foreground">
              {search ? t(lang, "msgConvEmptyNoResults") : t(lang, "msgConvEmptyNoChats")}
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
