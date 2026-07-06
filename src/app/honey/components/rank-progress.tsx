"use client";

import { t, type Language } from "@/lib/i18n";

/** Progress bar toward the next rank tier + the honey bonus it unlocks. */
export function RankProgress({
  lang,
  lifetimeEarned,
  currentMin,
  nextThreshold,
  nextLabel,
  nextBonus,
  accent,
}: {
  lang: Language;
  lifetimeEarned: number;
  currentMin: number;
  nextThreshold: number | null;
  nextLabel: string | undefined;
  nextBonus: number;
  accent?: string | null;
}) {
  if (nextThreshold === null) {
    return (
      <p className="text-meta tabular-nums">
        {t(lang, "rankMaxRank")}
      </p>
    );
  }
  const span = Math.max(1, nextThreshold - currentMin);
  const filled = Math.min(span, Math.max(0, lifetimeEarned - currentMin));
  const pct = Math.round((filled / span) * 100);
  const current = Math.min(span, filled);

  const progressText =
    lang === "TH"
      ? `${current.toLocaleString()} / ${span.toLocaleString()} pt → ${nextLabel ?? ""}`
      : lang === "JP"
        ? `${current.toLocaleString()} / ${span.toLocaleString()} pt → ${nextLabel ?? ""}`
        : `${current.toLocaleString()} / ${span.toLocaleString()} pt → ${nextLabel ?? "next rank"}`;

  const rewardText =
    nextBonus > 0
      ? lang === "TH"
        ? `ถึง${nextLabel ?? "ขั้นถัดไป"} รับโบนัส +${nextBonus.toLocaleString()} 🍯`
        : lang === "JP"
          ? `${nextLabel ?? "次ランク"}到達で +${nextBonus.toLocaleString()} 🍯 ボーナス`
          : `Reach ${nextLabel ?? "next rank"} to earn +${nextBonus.toLocaleString()} 🍯`
      : null;

  return (
    <div className="space-y-1.5">
      <div className="flex items-center gap-2">
        <div className="h-1 flex-1 overflow-hidden rounded-full bg-muted">
          <div
            className="h-full rounded-full bg-primary motion-base"
            style={{
              width: `${pct}%`,
              backgroundColor: accent ?? undefined,
            }}
          />
        </div>
        <span className="shrink-0 text-xs font-semibold tabular-nums text-foreground">
          {pct}%
        </span>
      </div>
      <p className="text-meta tabular-nums">{progressText}</p>
      {rewardText && (
        <p className="text-meta font-medium tabular-nums text-foreground">
          {rewardText}
        </p>
      )}
    </div>
  );
}
