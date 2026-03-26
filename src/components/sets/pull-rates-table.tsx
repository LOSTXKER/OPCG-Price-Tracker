"use client";

import { useState } from "react";
import { AlertTriangle } from "lucide-react";

import { RarityBadge } from "@/components/shared/rarity-badge";
import { pullChance, formatPct, PACKS_PER_BOX, BOXES_PER_CARTON } from "@/lib/utils/pull-rate";

type Unit = "pack" | "box" | "carton";

const UNIT_LABELS: Record<Unit, string> = {
  pack: "ซอง",
  box: "กล่อง",
  carton: "คาตั้น",
};

const TIER_ACCENT_BG: Record<string, string> = {
  SP: "bg-pink-500",
  "P-SEC": "bg-amber-500",
  SEC: "bg-amber-500",
  "P-SR": "bg-purple-500",
  SR: "bg-purple-500",
  "P-R": "bg-blue-500",
  R: "bg-blue-500",
  L: "bg-orange-500",
  "P-L": "bg-orange-500",
  "P-UC": "bg-emerald-500",
  UC: "bg-emerald-500",
  "P-C": "bg-neutral-400",
  C: "bg-neutral-400",
  DON: "bg-red-500",
};

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

  const rateForUnit = (row: PullRateRow) =>
    unit === "pack" ? row.ratePerPack
    : unit === "carton" ? row.avgPerBox * BOXES_PER_CARTON
    : row.avgPerBox;

  const countForUnit = (row: PullRateRow) =>
    unit === "pack" ? row.avgPerBox / PACKS_PER_BOX
    : unit === "carton" ? row.avgPerBox * BOXES_PER_CARTON
    : row.avgPerBox;

  return (
    <div className="panel p-4 sm:p-5">
      {/* Header */}
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <h2 className="text-sm font-semibold">Pull Rates</h2>
        <span className="flex items-center gap-1 rounded-full bg-warning/10 px-2 py-0.5 text-[11px] font-medium text-warning">
          <AlertTriangle className="size-3" />
          Community estimates
        </span>
      </div>

      {/* Unit toggle */}
      <div className="mb-4 inline-flex rounded-lg border border-border bg-muted/50 p-0.5">
        {(["pack", "box", "carton"] as Unit[]).map((u) => (
          <button
            key={u}
            onClick={() => setUnit(u)}
            className={`rounded-md px-3.5 py-1.5 text-xs font-medium transition-all ${
              unit === u
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {UNIT_LABELS[u]}
          </button>
        ))}
      </div>

      {/* Rows */}
      <div className="space-y-2">
        {rows.map((row) => {
          const count = countForUnit(row);
          const chance = pullChance(rateForUnit(row), row.cardCount);
          const maxBar = 6;
          const barWidth = Math.min((row.avgPerBox / maxBar) * 100, 100);
          const accent = TIER_ACCENT_BG[row.rarity] ?? "bg-neutral-400";

          return (
            <div key={row.rarity} className="rounded-lg border border-border/50 p-3">
              {/* Rarity badge */}
              <div className="mb-2 flex items-center gap-2">
                <RarityBadge rarity={row.rarity} size="sm" />
                <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
                  <div className={`h-full rounded-full ${accent}`} style={{ width: `${barWidth}%` }} />
                </div>
              </div>

              {/* Main stats - always visible */}
              <div className="flex items-baseline justify-between">
                <div>
                  <span className="font-mono text-xl font-bold tabular-nums text-primary">
                    {fmtCount(count)}
                  </span>
                  <span className="ml-1 text-sm text-muted-foreground">
                    ใบ/{UNIT_LABELS[unit]}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-xs text-muted-foreground">โอกาส/ใบ </span>
                  <span className="font-mono text-sm font-bold tabular-nums">{formatPct(chance)}</span>
                </div>
              </div>

              {/* Context */}
              <p className="mt-1 text-xs text-muted-foreground">
                rarity นี้มี {row.cardCount} ใบ
              </p>
            </div>
          );
        })}
      </div>

      {/* Footer */}
      <div className="mt-3 border-t border-border pt-3 text-xs text-muted-foreground">
        {packsPerBox && cardsPerPack && (
          <p>{packsPerBox} ซอง/กล่อง · {cardsPerPack} ใบ/ซอง · {BOXES_PER_CARTON} กล่อง/คาตั้น</p>
        )}
      </div>
    </div>
  );
}
