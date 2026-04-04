"use client";

import { Info, Shield, Star, Crown, Trophy } from "lucide-react";
import { Popover } from "@base-ui/react/popover";
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

export function RankInfoPopover({
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
    <Popover.Root>
      <Popover.Trigger
        className="inline-flex size-5 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
      >
        <Info className="size-3.5" />
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Positioner side="bottom" sideOffset={6} align="center" className="z-50">
          <Popover.Popup className="w-56 rounded-lg border bg-background p-3 shadow-lg data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95 data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-95">
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
            <div className="mt-2 border-t pt-2 text-[10px] text-muted-foreground">
              {lang === "TH"
                ? `สะสมทั้งหมด: ${lifetimeEarned.toLocaleString()} pt`
                : lang === "JP"
                  ? `累計: ${lifetimeEarned.toLocaleString()} pt`
                  : `Lifetime: ${lifetimeEarned.toLocaleString()} pt`}
            </div>
            <Popover.Arrow className="size-2.5 translate-y-[calc(-50%-2px)] rotate-45 rounded-[2px] border bg-background data-[side=bottom]:top-1 data-[side=top]:-bottom-2.5" />
          </Popover.Popup>
        </Popover.Positioner>
      </Popover.Portal>
    </Popover.Root>
  );
}
