"use client";

import { Shield, Star, Crown, Trophy } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Language } from "@/lib/i18n";
import type { HoneyLevel } from "../types";

const RANK_TIERS = [
  { level: 0, icon: Shield, threshold: 0 },
  { level: 1, icon: Shield, threshold: 100 },
  { level: 2, icon: Star, threshold: 500 },
  { level: 3, icon: Crown, threshold: 2000 },
  { level: 4, icon: Trophy, threshold: 5000 },
] as const;

const RANK_NAMES: Record<string, string[]> = {
  TH: ["มือใหม่", "บรอนซ์", "ซิลเวอร์", "โกลด์", "ไดมอนด์"],
  EN: ["Newbie", "Bronze", "Silver", "Gold", "Diamond"],
  JP: ["ニュービー", "ブロンズ", "シルバー", "ゴールド", "ダイヤモンド"],
};

/**
 * Popup body for the Rank card guide — list of tier thresholds + lifetime total.
 * The trigger and Popover chrome live in the parent stat card.
 */
export function RankGuideContent({
  lang,
  level,
  lifetimeEarned,
}: {
  lang: Language;
  level: HoneyLevel | null;
  lifetimeEarned: number;
}) {
  const currentLevel = level?.level ?? 0;
  const names = RANK_NAMES[lang] ?? RANK_NAMES.EN;

  return (
    <>
      <p className="mb-2 text-xs font-semibold text-foreground">
        {lang === "TH" ? "ระดับแรงค์" : lang === "JP" ? "ランク一覧" : "Rank Tiers"}
      </p>
      <div className="space-y-1.5">
        {RANK_TIERS.map((tier) => {
          const Icon = tier.icon;
          const active = tier.level === currentLevel;
          const reached = tier.level <= currentLevel;
          return (
            <div
              key={tier.level}
              className={cn(
                "flex items-center gap-2 rounded-md px-2 py-1 text-xs",
                active && "bg-primary/10 font-semibold text-primary",
                !active && reached && "text-foreground",
                !reached && "text-muted-foreground",
              )}
            >
              <Icon className="size-3.5 shrink-0" />
              <span className="flex-1">{names[tier.level]}</span>
              <span className="tabular-nums">
                {tier.threshold.toLocaleString()} pt
              </span>
            </div>
          );
        })}
      </div>
      <div className="mt-2 border-t pt-2 text-meta">
        {lang === "TH"
          ? `สะสมทั้งหมด: ${lifetimeEarned.toLocaleString()} pt`
          : lang === "JP"
            ? `累計: ${lifetimeEarned.toLocaleString()} pt`
            : `Lifetime: ${lifetimeEarned.toLocaleString()} pt`}
      </div>
    </>
  );
}
