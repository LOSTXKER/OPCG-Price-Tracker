"use client";

import { FileText } from "lucide-react";

import { EmptyState } from "@/components/shared/empty-state";
import { t } from "@/lib/i18n";
import { useUIStore } from "@/stores/ui-store";

export function BlogEmptyState() {
  const lang = useUIStore((s) => s.language);
  return (
    <EmptyState
      variant="dashed"
      icon={FileText}
      title={t(lang, "blogEmptyTitle")}
      description={t(lang, "blogEmptyDesc")}
    />
  );
}
