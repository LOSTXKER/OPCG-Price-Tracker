"use client";

import { useState } from "react";
import { AlertTriangle } from "lucide-react";

import { RarityBadge } from "@/components/shared/rarity-badge";
import { pullChance, formatPct, PACKS_PER_BOX, BOXES_PER_CARTON } from "@/lib/utils/pull-rate";
import { RARITY_BAR_COLOR } from "@/lib/constants/rarity";
import { UNIT_LABELS, type Unit } from "@/lib/constants/ui";
import { t } from "@/lib/i18n";
import { useUIStore } from "@/stores/ui-store";

export interface PullRateRow {
  rarity: string;
  cardCount: number;
  avgPerBox: number;
  ratePerPack: number;
}

interface PullRatesTableProps {
  rows: PullRateRow[];
  packsPerBox?: number | null;
  cardsPerPack?: number | null;
}

function fmtCount(v: number): string {
  if (v >= 100) return `~${Math.round(v)}`;
  if (v >= 10) return `~${v.toFixed(0)}`;
  if (v >= 1) return `~${v.toFixed(1)}`;
  if (v >= 0.01) return `~${v.toFixed(2)}`;
  return `~${v.toFixed(3)}`;
}

export function PullRatesTable({ rows, packsPerBox, cardsPerPack }: PullRatesTableProps) {
  const [unit, setUnit] = useState<Unit>("box");
  const lang = useUIStore((s) => s.language);

  const rateForUnit = (row: PullRateRow) =>
    unit === "pack" ? row.ratePerPack
    : unit === "carton" ? row.avgPerBox * BOXES_PER_CARTON
    : row.avgPerBox;

  const countForUnit = (row: PullRateRow) =>
    unit === "pack" ? row.avgPerBox / PACKS_PER_BOX
    : unit === "carton" ? row.avgPerBox * BOXES_PER_CARTON
    : row.avgPerBox;

  return (
    <div className="pt-3">
      {/* Header row */}
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <span className="flex items-center gap-1.5 rounded-full bg-warning/10 px-2.5 py-1 text-[11px] font-medium text-warning">
          <AlertTriangle className="size-3" />
          Community estimates
        </span>
        <div className="ml-auto inline-flex rounded-lg bg-muted/60 p-0.5">
          {(["pack", "box", "carton"] as Unit[]).map((u) => (
            <button
              key={u}
              onClick={() => setUnit(u)}
              className={`rounded-md px-3 py-1.5 text-xs font-medium transition-all ${
                unit === u
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {UNIT_LABELS[u]}
            </button>
          ))}
        </div>
      </div>

      {/* Table header */}
      <div className="mb-1 hidden items-center px-3 text-[11px] font-medium text-muted-foreground sm:flex">
        <span className="w-20">Rarity</span>
        <span className="flex-1" />
        <span className="w-28 text-right">{t(lang, "perUnit")}/{UNIT_LABELS[unit]}</span>
        <span className="w-20 text-right">{t(lang, "cardsCount")}</span>
        <span className="w-24 text-right">{t(lang, "chancePerCard")}</span>
      </div>

      {/* Rows */}
      <div className="divide-y divide-border/40">
        {rows.map((row) => {
          const count = countForUnit(row);
          const chance = pullChance(rateForUnit(row), row.cardCount);
          const maxBar = 6;
          const barWidth = Math.min((row.avgPerBox / maxBar) * 100, 100);
          const accent = RARITY_BAR_COLOR[row.rarity] ?? "bg-neutral-400";

          return (
            <div key={row.rarity} className="flex flex-col gap-1.5 px-3 py-3 transition-colors hover:bg-muted/20 sm:flex-row sm:items-center sm:gap-0">
              {/* Badge + bar */}
              <div className="flex items-center gap-2.5 sm:w-20">
                <RarityBadge rarity={row.rarity} size="sm" />
              </div>
              <div className="hidden flex-1 px-3 sm:block">
                <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                  <div className={`h-full rounded-full transition-all ${accent}`} style={{ width: `${barWidth}%` }} />
                </div>
              </div>

              {/* Mobile: bar + stats inline */}
              <div className="flex items-center gap-3 sm:hidden">
                <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
                  <div className={`h-full rounded-full ${accent}`} style={{ width: `${barWidth}%` }} />
                </div>
                <span className="shrink-0 font-mono text-sm font-bold tabular-nums">{fmtCount(count)}</span>
                <span className="shrink-0 text-[11px] text-muted-foreground">{row.cardCount}{t(lang, "cardsCount")}</span>
                <span className="shrink-0 font-mono text-xs font-semibold tabular-nums text-primary">{formatPct(chance)}</span>
              </div>

              {/* Desktop stats */}
              <span className="hidden w-28 text-right font-mono text-sm font-bold tabular-nums sm:block">
                {fmtCount(count)}
              </span>
              <span className="hidden w-20 text-right text-xs text-muted-foreground sm:block">
                {row.cardCount} {t(lang, "cardsCount")}
              </span>
              <span className="hidden w-24 text-right font-mono text-xs font-semibold tabular-nums text-primary sm:block">
                {formatPct(chance)}
              </span>
            </div>
          );
        })}
      </div>

      {/* Footer */}
      {packsPerBox && cardsPerPack && (
        <div className="mt-3 border-t border-border/40 pt-3 text-[11px] text-muted-foreground">
          {packsPerBox} {t(lang, "perUnit")}/{UNIT_LABELS["pack"]} · {cardsPerPack} {t(lang, "cardsCount")}/{UNIT_LABELS["pack"]} · {BOXES_PER_CARTON} {UNIT_LABELS["box"]}/{UNIT_LABELS["carton"]}
        </div>
      )}
    </div>
  );
}
