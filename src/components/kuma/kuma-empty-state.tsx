"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { useUIStore } from "@/stores/ui-store";
import { t } from "@/lib/i18n";

type KumaMood = "happy" | "excited" | "calm" | "worried" | "searching" | "shrug" | "sad" | "lost";
type KumaEmptyPreset = "no-results" | "empty-portfolio" | "empty-watchlist" | "not-found" | "error";

export function KumaEmptyState({
  preset,
  title,
  description,
  action,
  className,
}: {
  preset?: KumaEmptyPreset;
  title?: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}) {
  const lang = useUIStore((s) => s.language);

  const PRESETS: Record<KumaEmptyPreset, { mood: KumaMood; emoji: string; title: string; description?: string }> = {
    "no-results": { mood: "shrug", emoji: "🐻", title: t(lang, "noResults"), description: t(lang, "noResultsDesc") },
    "empty-portfolio": { mood: "sad", emoji: "🐻", title: t(lang, "emptyPortfolio"), description: t(lang, "emptyPortfolioDesc") },
    "empty-watchlist": { mood: "calm", emoji: "🐻", title: t(lang, "emptyWatchlist"), description: t(lang, "emptyWatchlistDesc") },
    "not-found": { mood: "lost", emoji: "🗺️", title: t(lang, "emptyNotFound"), description: t(lang, "emptyNotFoundDesc") },
    error: { mood: "worried", emoji: "🐻", title: t(lang, "emptyError"), description: t(lang, "emptyErrorDesc") },
  };

  const config = preset ? PRESETS[preset] : null;
  const displayTitle = title || config?.title || t(lang, "noData");
  const displayDesc = description || config?.description;
  const emoji = config?.emoji || "🐻";

  return (
    <div
      className={cn(
        "panel flex flex-col items-center justify-center gap-4 px-6 py-16 text-center",
        className
      )}
    >
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", stiffness: 200, damping: 15 }}
        className="text-5xl select-none"
      >
        {emoji}
      </motion.div>
      <div className="space-y-1">
        <h2 className="text-base font-semibold">{displayTitle}</h2>
        {displayDesc && (
          <p className="max-w-sm text-sm text-muted-foreground">{displayDesc}</p>
        )}
      </div>
      {action}
    </div>
  );
}
