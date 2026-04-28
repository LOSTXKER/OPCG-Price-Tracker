"use client";

import { Store } from "lucide-react";

import { EmptyState } from "@/components/shared/empty-state";
import { t } from "@/lib/i18n";
import { useUIStore } from "@/stores/ui-store";

export function MarketplaceErrorState() {
  const lang = useUIStore((s) => s.language);
  return (
    <EmptyState
      variant="error"
      icon={Store}
      title={t(lang, "marketplaceUnavailable")}
      description={t(lang, "marketplaceUnavailableDesc")}
    />
  );
}
