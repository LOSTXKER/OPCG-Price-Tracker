"use client";

import { Lock } from "lucide-react";

import { t, type Language } from "@/lib/i18n";
import type { CollectionStats } from "@/lib/profile/load-public-profile";

function SummaryStat({ value, label }: { value: number; label: string }) {
  return (
    <div className="rounded-xl border border-border/40 bg-card px-4 py-3">
      <p className="text-2xl font-bold tabular-nums leading-none">{value}</p>
      <p className="mt-1 text-meta">{label}</p>
    </div>
  );
}

export function SummaryOnlyBanner({
  stats,
  lang,
}: {
  stats: CollectionStats;
  lang: Language;
}) {
  return (
    <div className="flex flex-col items-center gap-4 rounded-2xl border border-border/40 bg-card/40 px-6 py-12 text-center">
      <div className="flex size-12 items-center justify-center rounded-xl bg-muted/60">
        <Lock className="size-6 text-muted-foreground/50" />
      </div>
      <p className="text-sm font-medium text-muted-foreground">{t(lang, "summaryOnlyBanner")}</p>
      <div className="grid grid-cols-3 gap-3 pt-2">
        <SummaryStat value={stats.totalCards} label={t(lang, "summaryCardCount")} />
        <SummaryStat value={stats.setsCollected} label={t(lang, "summarySets")} />
        <SummaryStat value={stats.rareCount} label={t(lang, "rareCardsLabel")} />
      </div>
    </div>
  );
}
