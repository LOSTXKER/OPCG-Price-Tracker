"use client";

import { useState } from "react";
import { BarChart3, AlertTriangle } from "lucide-react";
import { useUIStore } from "@/stores/ui-store";
import { t } from "@/lib/i18n";
import { Price } from "@/components/shared/price-inline";
import { RarityBadge } from "@/components/shared/rarity-badge";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import {
  pullChance,
  formatPullPct,
  PACKS_PER_BOX,
  BOXES_PER_CARTON,
} from "@/lib/utils/pull-rate";
import { RARITY_BAR_COLOR } from "@/lib/constants/rarities";
import { UNIT_I18N_KEYS, PULL_UNITS, type Unit } from "@/lib/constants/ui";
import type { PullRateData, RarityGroup } from "@/components/sets/set-detail-content";

export function SetPageStats({
  cardCount,
  totalValue,
  avgPrice,
}: {
  cardCount: number;
  totalValue: number;
  avgPrice: number;
}) {
  const lang = useUIStore((s) => s.language);
  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground">
      <span>
        <strong className="font-mono font-semibold text-foreground">
          {cardCount}
        </strong>{" "}
        {t(lang, "card")}
      </span>
      <span className="text-border">·</span>
      <span>
        {t(lang, "totalValue")}{" "}
        <strong className="font-mono font-semibold text-foreground">
          <Price jpy={totalValue} />
        </strong>
      </span>
      <span className="text-border">·</span>
      <span>
        Avg{" "}
        <strong className="font-mono font-semibold text-foreground">
          <Price jpy={avgPrice} />
        </strong>
      </span>
    </div>
  );
}

export function SetPageTopCardLabel() {
  const lang = useUIStore((s) => s.language);
  return (
    <span className="text-[11px] font-medium text-muted-foreground">
      {t(lang, "highestValue")}
    </span>
  );
}

export function SetPageBreadcrumbLabels() {
  const lang = useUIStore((s) => s.language);
  return { home: t(lang, "home"), sets: t(lang, "sets") };
}

/* ------------------------------------------------------------------ */
/*  Drop-rate dialog                                                   */
/* ------------------------------------------------------------------ */

function fmtCount(v: number): string {
  if (v >= 100) return `~${Math.round(v)}`;
  if (v >= 10) return `~${v.toFixed(0)}`;
  if (v >= 1) return `~${v.toFixed(1)}`;
  if (v >= 0.01) return `~${v.toFixed(2)}`;
  return `~${v.toFixed(3)}`;
}

export function DropRateDialog({
  groups,
  packsPerBox,
  cardsPerPack,
}: {
  groups: RarityGroup[];
  packsPerBox: number | null;
  cardsPerPack: number | null;
}) {
  const lang = useUIStore((s) => s.language);
  const [unit, setUnit] = useState<Unit>("box");

  const pullRateGroups = groups.filter((g) => g.pullRate);
  if (pullRateGroups.length === 0) return null;

  const countForUnit = (pr: PullRateData) =>
    unit === "pack"
      ? pr.avgPerBox / PACKS_PER_BOX
      : unit === "carton"
        ? pr.avgPerBox * BOXES_PER_CARTON
        : pr.avgPerBox;

  const rateForUnit = (pr: PullRateData) =>
    unit === "pack"
      ? pr.ratePerPack
      : unit === "carton"
        ? pr.avgPerBox * BOXES_PER_CARTON
        : pr.avgPerBox;

  return (
    <Dialog>
      <DialogTrigger
        className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-muted/50 px-2.5 py-1 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
      >
        <BarChart3 className="size-3.5 text-primary" />
        {t(lang, "dropRate")}
      </DialogTrigger>

      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <BarChart3 className="size-4 text-primary" />
            {t(lang, "dropRate")}
            <span className="rounded-full bg-muted px-2 py-0.5 text-[11px] tabular-nums text-muted-foreground">
              {pullRateGroups.length}
            </span>
          </DialogTitle>
          <DialogDescription className="flex items-center gap-1.5">
            <AlertTriangle className="size-3 text-warning" />
            {t(lang, "communityEstimate")}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <div className="inline-flex rounded-lg bg-muted/60 p-0.5">
              {PULL_UNITS.map((u) => (
                <button
                  key={u}
                  onClick={() => setUnit(u)}
                  className={cn(
                    "rounded-md px-3 py-1 text-xs font-medium transition-all",
                    unit === u
                      ? "bg-background text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  {t(lang, UNIT_I18N_KEYS[u])}
                </button>
              ))}
            </div>
            {packsPerBox && cardsPerPack && (
              <span className="text-[11px] text-muted-foreground">
                {packsPerBox} {t(lang, "perUnit")}/{t(lang, "packUnit")} · {cardsPerPack} {t(lang, "cardsCount")}/{t(lang, "packUnit")}
              </span>
            )}
          </div>

          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-sm">
              <thead className="text-[11px] font-medium text-muted-foreground">
                <tr className="border-b border-border/30">
                  <th className="py-1.5 text-left font-medium">{t(lang, "level")}</th>
                  <th className="py-1.5 text-left font-medium" />
                  <th className="whitespace-nowrap py-1.5 pl-4 text-right font-medium">{t(lang, "perUnit")}/{t(lang, UNIT_I18N_KEYS[unit])}</th>
                  <th className="whitespace-nowrap py-1.5 pl-3 text-right font-medium">{t(lang, "cardsCount")}</th>
                  <th className="whitespace-nowrap py-1.5 pl-3 text-right font-medium">{t(lang, "chancePerCard")}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/20">
                {pullRateGroups.map((g) => {
                  const pr = g.pullRate!;
                  const count = countForUnit(pr);
                  const chance = pullChance(rateForUnit(pr), g.cards.length);
                  const barWidth = Math.min((pr.avgPerBox / 6) * 100, 100);
                  const barColor = RARITY_BAR_COLOR[g.rarity] ?? "bg-neutral-400";
                  return (
                    <tr key={g.rarity}>
                      <td className="whitespace-nowrap py-2 pl-0"><RarityBadge rarity={g.rarity} size="sm" /></td>
                      <td className="w-full px-3 py-2">
                        <div className="h-1.5 min-w-12 overflow-hidden rounded-full bg-muted">
                          <div className={cn("h-full rounded-full", barColor)} style={{ width: `${barWidth}%` }} />
                        </div>
                      </td>
                      <td className="whitespace-nowrap py-2 pl-4 text-right font-mono text-sm font-bold tabular-nums">{fmtCount(count)}</td>
                      <td className="whitespace-nowrap py-2 pl-3 text-right text-xs tabular-nums text-muted-foreground">{g.cards.length}</td>
                      <td className="whitespace-nowrap py-2 pl-3 text-right font-mono text-xs font-semibold tabular-nums text-primary">{formatPullPct(chance)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
