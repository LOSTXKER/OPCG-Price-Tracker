"use client";

import { Settings } from "lucide-react";

import { EmptyState } from "@/components/shared/empty-state";
import { PageHeader } from "@/components/layout/page-header";
import { t } from "@/lib/i18n";
import { useUIStore } from "@/stores/ui-store";

export default function SellerSettingsPage() {
  const lang = useUIStore((s) => s.language);
  return (
    <div className="space-y-6">
      <PageHeader
        title={t(lang, "sellerSettingsTitle")}
        description={t(lang, "sellerSettingsDesc")}
      />
      <EmptyState
        variant="dashed"
        icon={Settings}
        title={t(lang, "comingSoon")}
        description={t(lang, "sellerSettingsComingSoon")}
      />
    </div>
  );
}
