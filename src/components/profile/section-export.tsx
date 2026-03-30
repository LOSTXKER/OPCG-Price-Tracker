"use client";

import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useUIStore } from "@/stores/ui-store";
import { t } from "@/lib/i18n";

export function SectionExport() {
  const lang = useUIStore((s) => s.language);

  return (
    <div className="space-y-5">
      <div>
        <h2 className="flex items-center gap-2 text-lg font-semibold">
          <Download className="size-5" />
          {t(lang, "exportCsv")}
        </h2>
        <p className="text-muted-foreground mt-1 text-sm">
          {t(lang, "goToExport")}
        </p>
      </div>

      <div className="rounded-xl border border-border/40 bg-card p-5 space-y-3">
        <a href="/api/analytics/export?type=portfolio" download>
          <Button variant="outline" className="w-full justify-start gap-2">
            <Download className="size-4" />
            {t(lang, "exportPortfolio")}
          </Button>
        </a>
        <a href="/api/analytics/export?type=watchlist" download>
          <Button variant="outline" className="w-full justify-start gap-2">
            <Download className="size-4" />
            {t(lang, "exportWatchlist")}
          </Button>
        </a>
      </div>
    </div>
  );
}
