"use client";

import { useState } from "react";
import { BarChart3, AlertTriangle } from "lucide-react";
import { useUIStore } from "@/stores/ui-store";
import { t } from "@/lib/i18n";
import { RarityBadge } from "@/components/shared/rarity-badge";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { SegmentedControl } from "@/components/ui/segmented-control";
import { cn } from "@/lib/utils";
import {
  pullChance,
  formatPullPct,
  PACKS_PER_BOX,
  BOXES_PER_CARTON,
} from "@/lib/utils/pull-rate";
import { RARITY_BAR_COLOR } from "@/lib/constants/rarities";
import { UNIT_I18N_KEYS, PULL_UNITS, type Unit } from "@/lib/constants/ui";
import type {
  PullRateData,
  RarityGroup,
} from "@/components/sets/set-detail-content";

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

  const rows = pullRateGroups.map((g) => {
    const pr = g.pullRate!;
    return {
      rarity: g.rarity,
      cardCount: g.cards.length,
      count: countForUnit(pr),
      chance: pullChance(rateForUnit(pr), g.cards.length),
      barWidth: Math.min((pr.avgPerBox / 6) * 100, 100),
      barColor: RARITY_BAR_COLOR[g.rarity] ?? "bg-muted-foreground/40",
    };
  });

  return (
    <Dialog>
      <DialogTrigger className="ease-chrome inline-flex min-h-11 items-center gap-1.5 rounded-full bg-muted/60 px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground md:min-h-9">
        <BarChart3 className="size-3.5 text-primary" />
        {t(lang, "dropRate")}
        <span className="tnum text-muted-foreground/60">{pullRateGroups.length}</span>
      </DialogTrigger>

      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <BarChart3 className="size-4 text-primary" />
            {t(lang, "dropRate")}
            <span className="rounded-full bg-muted px-2 py-0.5 text-xs tabular-nums text-muted-foreground">
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
            <SegmentedControl<Unit>
              value={unit}
              onChange={setUnit}
              options={PULL_UNITS.map((value) => ({
                value,
                label: t(lang, UNIT_I18N_KEYS[value]),
              }))}
              fullWidth
              size="sm"
              ariaLabel={t(lang, "dropRate")}
              className="w-full sm:w-64"
            />
            {packsPerBox && cardsPerPack && (
              <span className="text-meta">
                {packsPerBox} {t(lang, "perUnit")}/{t(lang, "packUnit")} ·{" "}
                {cardsPerPack} {t(lang, "cardsCount")}/{t(lang, "packUnit")}
              </span>
            )}
          </div>

          {/* <sm: list fallback (ตาราง 5 คอลัมน์อ่านไม่ออกบนจอแคบ) */}
          <div className="divide-y divide-hair sm:hidden">
            {rows.map((r) => (
              <div key={r.rarity} className="space-y-1.5 py-2.5">
                <div className="flex items-center justify-between gap-2">
                  <RarityBadge rarity={r.rarity} size="sm" />
                  <span className="font-mono text-sm font-bold tabular-nums">
                    {fmtCount(r.count)}
                    <span className="ml-1 text-xs font-medium text-muted-foreground">
                      /{t(lang, UNIT_I18N_KEYS[unit])}
                    </span>
                  </span>
                </div>
                <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                  <div
                    className={cn("h-full rounded-full", r.barColor)}
                    style={{ width: `${r.barWidth}%` }}
                  />
                </div>
                <div className="flex items-center justify-between text-xs tabular-nums text-muted-foreground">
                  <span>
                    {r.cardCount} {t(lang, "cardsCount")}
                  </span>
                  <span className="font-mono font-semibold text-primary">
                    {formatPullPct(r.chance)}
                  </span>
                </div>
              </div>
            ))}
          </div>

          <div className="hidden overflow-x-auto sm:block">
            <table className="w-full border-collapse text-sm">
              <thead className="text-xs font-medium text-muted-foreground">
                <tr className="border-b border-hair">
                  <th className="py-1.5 text-left font-medium">
                    {t(lang, "level")}
                  </th>
                  <th className="py-1.5 text-left font-medium" />
                  <th className="whitespace-nowrap py-1.5 pl-4 text-right font-medium">
                    {t(lang, "perUnit")}/{t(lang, UNIT_I18N_KEYS[unit])}
                  </th>
                  <th className="whitespace-nowrap py-1.5 pl-3 text-right font-medium">
                    {t(lang, "cardsCount")}
                  </th>
                  <th className="whitespace-nowrap py-1.5 pl-3 text-right font-medium">
                    {t(lang, "chancePerCard")}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-hair">
                {rows.map((r) => (
                  <tr key={r.rarity}>
                    <td className="whitespace-nowrap py-2 pl-0">
                      <RarityBadge rarity={r.rarity} size="sm" />
                    </td>
                    <td className="w-full px-3 py-2">
                      <div className="h-1.5 min-w-12 overflow-hidden rounded-full bg-muted">
                        <div
                          className={cn("h-full rounded-full", r.barColor)}
                          style={{ width: `${r.barWidth}%` }}
                        />
                      </div>
                    </td>
                    <td className="whitespace-nowrap py-2 pl-4 text-right font-mono text-sm font-bold tabular-nums">
                      {fmtCount(r.count)}
                    </td>
                    <td className="whitespace-nowrap py-2 pl-3 text-right text-xs tabular-nums text-muted-foreground">
                      {r.cardCount}
                    </td>
                    <td className="whitespace-nowrap py-2 pl-3 text-right font-mono text-xs font-semibold tabular-nums text-primary">
                      {formatPullPct(r.chance)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
