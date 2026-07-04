"use client";

import { Download, FileSpreadsheet, Layers, Package } from "lucide-react";

import { useUIStore } from "@/stores/ui-store";
import { t } from "@/lib/i18n";
import { useTierLimits } from "@/hooks/use-tier-limits";
import { LockOverlay } from "@/components/shared/upgrade-badge";
import { Surface } from "@/components/ui/surface";

export function SectionExport() {
  const lang = useUIStore((s) => s.language);
  const { limits } = useTierLimits();
  const locked = !limits.csvExport;

  const exports = [
    {
      labelKey: "exportPortfolio" as const,
      descKey: "exportPortfolioDesc" as const,
      href: "/api/analytics/export?type=portfolio",
      icon: FileSpreadsheet,
      color: "bg-emerald-100 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
    },
    {
      labelKey: "exportWatchlist" as const,
      descKey: "exportWatchlistDesc" as const,
      href: "/api/analytics/export?type=watchlist",
      icon: FileSpreadsheet,
      color: "bg-emerald-100 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
    },
    {
      labelKey: "exportListings" as const,
      descKey: "exportListingsDesc" as const,
      href: "/api/analytics/export?type=listings",
      icon: Package,
      color: "bg-pink-100 dark:bg-pink-500/10 text-pink-600 dark:text-pink-400",
    },
    {
      labelKey: "exportDecks" as const,
      descKey: "exportDecksDesc" as const,
      href: "/api/analytics/export?type=decks",
      icon: Layers,
      color: "bg-blue-100 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400",
    },
  ];

  return (
    <div className="space-y-6">
      <h2 className="text-h2 hidden md:block">{t(lang, "goToExport")}</h2>

      <LockOverlay locked={locked} featureKey="csvExport">
        <div className="grid gap-3 sm:grid-cols-2">
          {exports.map(({ labelKey, descKey, href, icon: Icon, color }) => (
            <Surface key={labelKey} variant="outline" padding="lg" className="flex flex-col justify-between">
              <div className="flex items-start gap-3">
                <div className={`flex size-10 shrink-0 items-center justify-center rounded-lg ${color}`}>
                  <Icon className="size-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="text-h5">{t(lang, labelKey)}</h3>
                  <p className="mt-0.5 text-meta">{t(lang, descKey)}</p>
                </div>
              </div>
              <div className="mt-4 flex items-center justify-between">
                <span className="rounded-md bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
                  CSV
                </span>
                <a
                  href={locked ? undefined : href}
                  download={!locked}
                  aria-disabled={locked}
                  className="ease-chrome inline-flex h-8 items-center gap-1.5 rounded-lg border border-input bg-background px-3 text-sm font-medium ring-offset-background transition-colors hover:bg-accent hover:text-accent-foreground"
                >
                  <Download className="size-3.5" />
                  {t(lang, "download")}
                </a>
              </div>
            </Surface>
          ))}
        </div>
      </LockOverlay>
    </div>
  );
}
