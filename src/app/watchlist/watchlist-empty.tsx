"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { KumaEmptyState } from "@/components/kuma/kuma-empty-state";
import { Button } from "@/components/ui/button";
import { t } from "@/lib/i18n";
import { useUIStore } from "@/stores/ui-store";

export function WatchlistEmpty() {
  const lang = useUIStore((s) => s.language);

  return (
    <div className="flex flex-col items-center gap-4 py-6">
      <KumaEmptyState preset="empty-watchlist" />
      <Link href="/cards">
        <Button variant="outline" size="sm" className="gap-1.5">
          {t(lang, "watchlistBrowseCards")}
          <ArrowRight className="size-3.5" />
        </Button>
      </Link>
    </div>
  );
}
