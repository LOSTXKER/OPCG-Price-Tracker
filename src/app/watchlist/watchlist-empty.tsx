"use client";

import { Plus } from "lucide-react";

import { EmptyState } from "@/components/shared/empty-state";
import { Button } from "@/components/ui/button";
import { t } from "@/lib/i18n";
import { useUIStore } from "@/stores/ui-store";

export function WatchlistEmpty({ onAdd }: { onAdd: () => void }) {
  const lang = useUIStore((s) => s.language);

  return (
    <EmptyState
      preset="empty-watchlist"
      lang={lang}
      action={
        <Button
          onClick={onAdd}
          className="gap-1.5 sm:min-h-11 md:min-h-0"
        >
          <Plus className="size-4" />
          {t(lang, "addCard")}
        </Button>
      }
    />
  );
}
