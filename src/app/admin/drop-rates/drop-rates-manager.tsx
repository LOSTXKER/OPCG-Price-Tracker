"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp, Save, Loader2, Check } from "lucide-react";

interface DropRate {
  id: number;
  rarity: string;
  avgPerBox: number | null;
  ratePerPack: number | null;
}

interface SetData {
  id: number;
  code: string;
  name: string;
  nameEn: string | null;
  type: string;
  packsPerBox: number | null;
  cardsPerPack: number | null;
  dropRates: DropRate[];
}

export function DropRatesManager({
  initialSets,
  rarityCounts,
}: {
  initialSets: SetData[];
  rarityCounts: Record<string, number>;
}) {
  const [sets] = useState(initialSets);
  const [expandedCode, setExpandedCode] = useState<string | null>(null);
  const [editRates, setEditRates] = useState<Record<string, { avgPerBox: string; ratePerPack: string }>>({});
  const [saving, setSaving] = useState<string | null>(null);
  const [saved, setSaved] = useState<Set<string>>(new Set());

  function toggleExpand(code: string) {
    setExpandedCode((prev) => (prev === code ? null : code));
  }

  function initEdit(set: SetData) {
    const rates: Record<string, { avgPerBox: string; ratePerPack: string }> = {};
    for (const dr of set.dropRates) {
      rates[dr.rarity] = {
        avgPerBox: dr.avgPerBox?.toString() ?? "",
        ratePerPack: dr.ratePerPack?.toString() ?? "",
      };
    }
    setEditRates(rates);
  }

  async function saveRate(setId: number, rarity: string) {
    const key = `${setId}-${rarity}`;
    setSaving(key);
    const rate = editRates[rarity];
    if (!rate) return;

    try {
      await fetch("/api/admin/drop-rates", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          setId,
          rarity,
          avgPerBox: rate.avgPerBox ? parseFloat(rate.avgPerBox) : null,
          ratePerPack: rate.ratePerPack ? parseFloat(rate.ratePerPack) : null,
        }),
      });
      setSaved((prev) => new Set(prev).add(key));
    } finally {
      setSaving(null);
    }
  }

  function getCount(setId: number, rarity: string, isParallel: boolean): number {
    return rarityCounts[`${setId}-${rarity}-${isParallel}`] ?? 0;
  }

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Drop Rates</h1>
      <p className="text-sm text-muted-foreground">
        View and edit pull rates per set. Changes are saved per-rarity.
      </p>

      <div className="space-y-2">
        {sets.map((set) => {
          const expanded = expandedCode === set.code;
          return (
            <div key={set.id} className="rounded-xl border border-border/50">
              <button
                onClick={() => {
                  toggleExpand(set.code);
                  if (!expanded) initEdit(set);
                }}
                className="flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-muted/20"
              >
                <span className="font-mono text-sm font-bold uppercase">{set.code}</span>
                <span className="flex-1 text-sm">{set.nameEn || set.name}</span>
                <span className="text-xs text-muted-foreground">
                  {set.dropRates.length} rates · {set.type}
                </span>
                {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </button>

              {expanded && (
                <div className="border-t border-border/30 p-4">
                  <div className="mb-3 text-xs text-muted-foreground">
                    Packs/Box: {set.packsPerBox ?? "—"} · Cards/Pack: {set.cardsPerPack ?? "—"}
                  </div>

                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border/30 text-xs text-muted-foreground">
                        <th className="px-2 py-1 text-left">Rarity</th>
                        <th className="px-2 py-1 text-center">Cards in Pool</th>
                        <th className="px-2 py-1 text-right">Avg/Box</th>
                        <th className="px-2 py-1 text-right">Rate/Pack</th>
                        <th className="w-10 px-2 py-1"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {set.dropRates.map((dr) => {
                        const key = `${set.id}-${dr.rarity}`;
                        const isSaving = saving === key;
                        const isSaved = saved.has(key);
                        const isParallel = dr.rarity.startsWith("P-");
                        const pool = getCount(set.id, dr.rarity, isParallel);

                        return (
                          <tr key={dr.rarity} className="border-b border-border/20">
                            <td className="px-2 py-1.5">
                              <span className={`font-mono text-xs font-bold ${isParallel ? "text-amber-500" : ""}`}>
                                {dr.rarity}
                              </span>
                            </td>
                            <td className="px-2 py-1.5 text-center text-xs text-muted-foreground">
                              {pool || "—"}
                            </td>
                            <td className="px-2 py-1.5 text-right">
                              <input
                                type="number"
                                step="0.01"
                                value={editRates[dr.rarity]?.avgPerBox ?? ""}
                                onChange={(e) =>
                                  setEditRates((prev) => ({
                                    ...prev,
                                    [dr.rarity]: {
                                      ...prev[dr.rarity],
                                      avgPerBox: e.target.value,
                                    },
                                  }))
                                }
                                className="w-20 rounded border border-border bg-background px-1.5 py-0.5 text-right text-xs"
                              />
                            </td>
                            <td className="px-2 py-1.5 text-right">
                              <input
                                type="number"
                                step="0.001"
                                value={editRates[dr.rarity]?.ratePerPack ?? ""}
                                onChange={(e) =>
                                  setEditRates((prev) => ({
                                    ...prev,
                                    [dr.rarity]: {
                                      ...prev[dr.rarity],
                                      ratePerPack: e.target.value,
                                    },
                                  }))
                                }
                                className="w-20 rounded border border-border bg-background px-1.5 py-0.5 text-right text-xs"
                              />
                            </td>
                            <td className="px-2 py-1.5 text-center">
                              <button
                                onClick={() => saveRate(set.id, dr.rarity)}
                                disabled={isSaving}
                                className="rounded p-0.5 text-muted-foreground hover:bg-muted hover:text-foreground disabled:opacity-50"
                                title="Save"
                              >
                                {isSaving ? (
                                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                ) : isSaved ? (
                                  <Check className="h-3.5 w-3.5 text-green-500" />
                                ) : (
                                  <Save className="h-3.5 w-3.5" />
                                )}
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
