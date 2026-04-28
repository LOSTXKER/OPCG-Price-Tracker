"use client";

import type { LucideIcon } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { useUIStore } from "@/stores/ui-store";
import { t } from "@/lib/i18n";

type KumaMood = "happy" | "excited" | "calm" | "worried" | "searching" | "shrug" | "sad" | "lost";
type KumaEmptyPreset = "no-results" | "empty-portfolio" | "empty-watchlist" | "not-found" | "error";
type EmptyVariant = "product" | "admin" | "minimal" | "dashed";

export function KumaEmptyState({
  preset,
  title,
  description,
  action,
  className,
  icon: Icon,
  variant = "product",
}: {
  preset?: KumaEmptyPreset;
  title?: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
  icon?: LucideIcon;
  variant?: EmptyVariant;
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

  if (variant === "minimal" && Icon) {
    return (
      <div className={cn("flex flex-col items-center gap-2 py-14 text-center", className)}>
        <Icon className="size-8 text-muted-foreground/20" />
        <p className="text-meta text-muted-foreground/60">{displayTitle}</p>
      </div>
    );
  }

  if (variant === "admin" && Icon) {
    return (
      <div className={cn("flex flex-col items-center gap-3 py-16 text-center", className)}>
        <div className="rounded-xl bg-muted/50 p-4">
          <Icon className="h-8 w-8 text-muted-foreground/40" />
        </div>
        <div>
          <p className="font-medium text-muted-foreground">{displayTitle}</p>
          {displayDesc && (
            <p className="mt-1 text-sm text-muted-foreground/70">{displayDesc}</p>
          )}
        </div>
        {action}
      </div>
    );
  }

  if (variant === "dashed") {
    return (
      <div
        className={cn(
          "flex flex-col items-center justify-center rounded-xl border border-dashed border-border py-16 text-center text-muted-foreground",
          className,
        )}
      >
        {Icon && <Icon className="mb-3 h-12 w-12 opacity-30" />}
        <p className="text-lg font-medium text-foreground">{displayTitle}</p>
        {displayDesc && (
          <p className="mb-4 mt-1 text-sm text-muted-foreground">{displayDesc}</p>
        )}
        {action}
      </div>
    );
  }

  return (
    <div
      className={cn(
        "panel flex flex-col items-center justify-center gap-4 bg-accent/30 px-6 py-16 text-center",
        className
      )}
    >
      {Icon ? (
        <div className="rounded-xl bg-muted/50 p-4">
          <Icon className="h-8 w-8 text-muted-foreground/40" />
        </div>
      ) : (
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 200, damping: 15 }}
          className="text-5xl select-none"
        >
          {emoji}
        </motion.div>
      )}
      <div className="space-y-1">
        <h2 className="text-h3">{displayTitle}</h2>
        {displayDesc && (
          <p className="max-w-sm text-sm text-muted-foreground">{displayDesc}</p>
        )}
      </div>
      {action}
    </div>
  );
}
