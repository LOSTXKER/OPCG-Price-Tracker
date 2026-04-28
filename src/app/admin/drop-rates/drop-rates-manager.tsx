"use client";

import { useState, useMemo, useCallback } from "react";
import {
  ChevronDown,
  ChevronUp,
  Save,
  Loader2,
  Check,
  BarChart3,
  Search,
  RotateCcw,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

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

type RateEdits = Record<string, { avgPerBox: string; ratePerPack: string }>;
type FilterMode = "all" | "complete" | "incomplete";

function isSetComplete(set: SetData): boolean {
  if (set.dropRates.length === 0) return false;
  return set.dropRates.every(
    (dr) => dr.avgPerBox != null && dr.ratePerPack != null,
  );
}

export function DropRatesManager({
  initialSets,
  rarityCounts,
}: {
  initialSets: SetData[];
  rarityCounts: Record<string, number>;
}) {
  const sets = initialSets;
  const [expandedCode, setExpandedCode] = useState<string | null>(null);
  const [editRates, setEditRates] = useState<RateEdits>({});
  const [originalRates, setOriginalRates] = useState<RateEdits>({});
  const [saving, setSaving] = useState<string | null>(null);
  const [saved, setSaved] = useState<Set<string>>(new Set());
  const [savingAll, setSavingAll] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterMode, setFilterMode] = useState<FilterMode>("all");

  const filteredSets = useMemo(() => {
    let result = sets;

    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      result = result.filter(
        (s) =>
          s.code.toLowerCase().includes(q) ||
          s.name.toLowerCase().includes(q) ||
          (s.nameEn && s.nameEn.toLowerCase().includes(q)),
      );
    }

    if (filterMode === "complete") {
      result = result.filter(isSetComplete);
    } else if (filterMode === "incomplete") {
      result = result.filter((s) => !isSetComplete(s));
    }

    return result;
  }, [sets, searchQuery, filterMode]);

  const completeCounts = useMemo(() => {
    const complete = sets.filter(isSetComplete).length;
    return { complete, incomplete: sets.length - complete };
  }, [sets]);

  function toggleExpand(code: string) {
    setExpandedCode((prev) => (prev === code ? null : code));
  }

  function initEdit(set: SetData) {
    const rates: RateEdits = {};
    for (const dr of set.dropRates) {
      rates[dr.rarity] = {
        avgPerBox: dr.avgPerBox?.toString() ?? "",
        ratePerPack: dr.ratePerPack?.toString() ?? "",
      };
    }
    setEditRates(rates);
    setOriginalRates(rates);
    setSaved(new Set());
  }

  const isDirty = useCallback(
    (rarity: string) => {
      const edit = editRates[rarity];
      const orig = originalRates[rarity];
      if (!edit || !orig) return false;
      return (
        edit.avgPerBox !== orig.avgPerBox ||
        edit.ratePerPack !== orig.ratePerPack
      );
    },
    [editRates, originalRates],
  );

  const hasAnyDirty = useMemo(() => {
    return Object.keys(editRates).some((rarity) => isDirty(rarity));
  }, [editRates, isDirty]);

  function resetRate(rarity: string) {
    const orig = originalRates[rarity];
    if (!orig) return;
    setEditRates((prev) => ({ ...prev, [rarity]: { ...orig } }));
  }

  function resetAll() {
    setEditRates({ ...originalRates });
  }

  function calcSuggestedRate(
    avgPerBox: string,
    packsPerBox: number | null,
  ): string | null {
    if (!packsPerBox || !avgPerBox) return null;
    const avg = parseFloat(avgPerBox);
    if (isNaN(avg) || avg <= 0) return null;
    return (avg / packsPerBox).toFixed(4);
  }

  async function saveRate(setId: number, rarity: string, setCode: string) {
    const key = `${setId}-${rarity}`;
    setSaving(key);
    const rate = editRates[rarity];
    if (!rate) return;

    try {
      const res = await fetch("/api/admin/drop-rates", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          setId,
          rarity,
          avgPerBox: rate.avgPerBox ? parseFloat(rate.avgPerBox) : null,
          ratePerPack: rate.ratePerPack ? parseFloat(rate.ratePerPack) : null,
        }),
      });
      if (res.ok) {
        setSaved((prev) => new Set(prev).add(key));
        setOriginalRates((prev) => ({
          ...prev,
          [rarity]: { ...rate },
        }));
        toast.success(`${setCode} — บันทึก ${rarity} สำเร็จ`);
      } else {
        toast.error(`${setCode} — บันทึก ${rarity} ไม่สำเร็จ`);
      }
    } catch {
      toast.error("เกิดข้อผิดพลาดในการเชื่อมต่อ");
    } finally {
      setSaving(null);
    }
  }

  async function saveAllRates(set: SetData) {
    setSavingAll(true);

    const batch = set.dropRates
      .map((dr) => {
        const rate = editRates[dr.rarity];
        if (!rate) return null;
        return {
          setId: set.id,
          rarity: dr.rarity,
          avgPerBox: rate.avgPerBox ? parseFloat(rate.avgPerBox) : null,
          ratePerPack: rate.ratePerPack ? parseFloat(rate.ratePerPack) : null,
        };
      })
      .filter(Boolean);

    try {
      const res = await fetch("/api/admin/drop-rates", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ batch }),
      });

      if (res.ok) {
        const newSaved = new Set(saved);
        const newOriginals = { ...originalRates };
        for (const dr of set.dropRates) {
          const key = `${set.id}-${dr.rarity}`;
          newSaved.add(key);
          if (editRates[dr.rarity]) {
            newOriginals[dr.rarity] = { ...editRates[dr.rarity] };
          }
        }
        setSaved(newSaved);
        setOriginalRates(newOriginals);
        toast.success(
          `${set.code} — บันทึกทั้งหมด ${batch.length} รายการสำเร็จ`,
        );
      } else {
        toast.error(`${set.code} — บันทึกไม่สำเร็จ`);
      }
    } catch {
      toast.error("เกิดข้อผิดพลาดในการเชื่อมต่อ");
    } finally {
      setSavingAll(false);
    }
  }

  function getCount(
    setId: number,
    rarity: string,
    isParallel: boolean,
  ): number {
    return rarityCounts[`${setId}-${rarity}-${isParallel}`] ?? 0;
  }

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="อัตราดรอป"
        description="ดูและแก้ไขอัตราการเปิดได้ในแต่ละชุดการ์ด บันทึกได้ทีละรายการหรือทั้งชุด"
        icon={BarChart3}
        badge={<Badge variant="secondary">{sets.length} ชุด</Badge>}
      />

      {/* Search + Filter */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="ค้นหาชุดการ์ด (รหัส / ชื่อ)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex items-center gap-1 rounded-lg border border-border/50 bg-muted/30 p-1">
          {(
            [
              { key: "all", label: "ทั้งหมด", count: sets.length },
              {
                key: "complete",
                label: "ครบ",
                count: completeCounts.complete,
              },
              {
                key: "incomplete",
                label: "ไม่ครบ",
                count: completeCounts.incomplete,
              },
            ] as const
          ).map((f) => (
            <button
              key={f.key}
              onClick={() => setFilterMode(f.key)}
              className={cn(
                "rounded-md px-3 py-1.5 text-xs font-medium transition-colors",
                filterMode === f.key
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {f.label}
              <span className="ml-1 opacity-60">{f.count}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Set List */}
      <div className="space-y-2">
        {filteredSets.length === 0 && (
          <div className="flex items-center justify-center rounded-xl border border-dashed border-border/50 py-12 text-sm text-muted-foreground">
            ไม่พบชุดการ์ดที่ตรงกับการค้นหา
          </div>
        )}

        {filteredSets.map((set) => {
          const expanded = expandedCode === set.code;
          const complete = isSetComplete(set);

          return (
            <div
              key={set.id}
              className={cn(
                "overflow-hidden rounded-xl border bg-card transition-shadow",
                expanded
                  ? "border-border shadow-sm"
                  : "border-border/50 hover:border-border/80",
              )}
            >
              {/* Collapsed Header */}
              <button
                onClick={() => {
                  toggleExpand(set.code);
                  if (!expanded) initEdit(set);
                }}
                className="flex w-full items-center gap-3 px-5 py-3.5 text-left transition-colors hover:bg-muted/20"
              >
                <span className="min-w-[4rem] font-mono text-sm font-bold uppercase tracking-wide">
                  {set.code}
                </span>
                <span className="flex-1 text-sm font-medium">
                  {set.nameEn || set.name}
                </span>

                {/* Completeness indicator */}
                {complete ? (
                  <span className="flex items-center gap-1 text-xs text-green-600 dark:text-green-400">
                    <CheckCircle2 className="size-3.5" />
                    <span className="hidden sm:inline">ครบ</span>
                  </span>
                ) : (
                  <span className="flex items-center gap-1 text-xs text-amber-600 dark:text-amber-400">
                    <AlertCircle className="size-3.5" />
                    <span className="hidden sm:inline">ไม่ครบ</span>
                  </span>
                )}

                <span className="hidden text-meta sm:inline">
                  {set.dropRates.length} ระดับ
                </span>
                <Badge
                  variant="outline"
                  className="hidden text-overlay sm:inline-flex"
                >
                  {set.type.replace("_", " ")}
                </Badge>
                <ChevronDown
                  className={cn(
                    "size-4 text-muted-foreground transition-transform duration-200",
                    expanded && "rotate-180",
                  )}
                />
              </button>

              {/* Expanded Content */}
              <div
                className={cn(
                  "grid transition-[grid-template-rows] duration-200 ease-in-out",
                  expanded ? "grid-rows-[1fr]" : "grid-rows-[0fr]",
                )}
              >
                <div className="overflow-hidden">
                  {expanded && (
                    <div className="border-t border-border/30 px-5 py-4">
                      {/* Info bar */}
                      <div className="mb-4 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <span className="text-meta">
                            ซอง/กล่อง:{" "}
                            <span className="font-medium text-foreground">
                              {set.packsPerBox ?? "—"}
                            </span>
                          </span>
                          <span className="text-border">·</span>
                          <span className="text-meta">
                            ใบ/ซอง:{" "}
                            <span className="font-medium text-foreground">
                              {set.cardsPerPack ?? "—"}
                            </span>
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          {hasAnyDirty && (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={resetAll}
                              className="text-muted-foreground"
                            >
                              <RotateCcw className="size-3.5" />
                              รีเซ็ต
                            </Button>
                          )}
                          <Button
                            size="sm"
                            variant={hasAnyDirty ? "default" : "outline"}
                            onClick={() => saveAllRates(set)}
                            disabled={savingAll}
                          >
                            {savingAll ? (
                              <Loader2 className="size-3.5 animate-spin" />
                            ) : (
                              <Save className="size-3.5" />
                            )}
                            บันทึกทั้งหมด
                          </Button>
                        </div>
                      </div>

                      {/* Table */}
                      <div className="overflow-x-auto rounded-lg border border-border/40">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="border-b border-border/40 bg-muted/30">
                              <th className="w-20 px-4 py-2.5 text-left text-eyebrow text-muted-foreground/70">
                                ระดับ
                              </th>
                              <th className="w-24 px-4 py-2.5 text-center text-eyebrow text-muted-foreground/70">
                                ในพูล
                              </th>
                              <th className="px-4 py-2.5 text-right text-eyebrow text-muted-foreground/70">
                                เฉลี่ย/กล่อง
                              </th>
                              <th className="px-4 py-2.5 text-right text-eyebrow text-muted-foreground/70">
                                อัตรา/ซอง
                              </th>
                              <th className="w-20 px-2 py-2.5" />
                            </tr>
                          </thead>
                          <tbody>
                            {set.dropRates.map((dr, idx) => {
                              const key = `${set.id}-${dr.rarity}`;
                              const isSaving = saving === key;
                              const isSaved = saved.has(key);
                              const isParallel = dr.rarity.startsWith("P-");
                              const pool = getCount(
                                set.id,
                                dr.rarity,
                                isParallel,
                              );
                              const dirty = isDirty(dr.rarity);

                              const prevIsParallel =
                                idx > 0 &&
                                set.dropRates[idx - 1].rarity.startsWith("P-");
                              const showSeparator =
                                isParallel && !prevIsParallel && idx > 0;

                              const suggestedRate = calcSuggestedRate(
                                editRates[dr.rarity]?.avgPerBox ?? "",
                                set.packsPerBox,
                              );

                              return (
                                <tr
                                  key={dr.rarity}
                                  className={cn(
                                    "group border-b border-border/10 transition-colors hover:bg-muted/10",
                                    idx % 2 === 1 && "bg-muted/5",
                                    dirty &&
                                      "bg-blue-50/50 dark:bg-blue-950/20",
                                    showSeparator && "border-t-2 border-t-amber-200/50 dark:border-t-amber-800/30",
                                  )}
                                >
                                  <td className="px-4 py-2.5">
                                    <span
                                      className={cn(
                                        "font-mono text-xs font-bold",
                                        isParallel
                                          ? "text-amber-600 dark:text-amber-400"
                                          : "text-foreground",
                                      )}
                                    >
                                      {dr.rarity}
                                    </span>
                                  </td>
                                  <td className="px-4 py-2.5 text-center">
                                    <span className="font-mono text-xs text-muted-foreground">
                                      {pool || "—"}
                                    </span>
                                  </td>
                                  <td className="px-4 py-2.5">
                                    <div className="flex justify-end">
                                      <Input
                                        type="number"
                                        step="0.01"
                                        value={
                                          editRates[dr.rarity]?.avgPerBox ?? ""
                                        }
                                        onChange={(e) =>
                                          setEditRates((prev) => ({
                                            ...prev,
                                            [dr.rarity]: {
                                              ...prev[dr.rarity],
                                              avgPerBox: e.target.value,
                                            },
                                          }))
                                        }
                                        className="h-8 w-28 text-right text-xs tabular-nums"
                                      />
                                    </div>
                                  </td>
                                  <td className="px-4 py-2.5">
                                    <div className="flex items-center justify-end gap-1">
                                      <Input
                                        type="number"
                                        step="0.0001"
                                        value={
                                          editRates[dr.rarity]?.ratePerPack ??
                                          ""
                                        }
                                        onChange={(e) =>
                                          setEditRates((prev) => ({
                                            ...prev,
                                            [dr.rarity]: {
                                              ...prev[dr.rarity],
                                              ratePerPack: e.target.value,
                                            },
                                          }))
                                        }
                                        placeholder={
                                          suggestedRate
                                            ? `≈${suggestedRate}`
                                            : undefined
                                        }
                                        className="h-8 w-28 text-right text-xs tabular-nums"
                                      />
                                    </div>
                                  </td>
                                  <td className="px-2 py-2.5">
                                    <div className="flex items-center justify-center gap-0.5">
                                      {dirty && (
                                        <Button
                                          variant="ghost"
                                          size="icon-xs"
                                          onClick={() =>
                                            resetRate(dr.rarity)
                                          }
                                          title="รีเซ็ต"
                                          className="opacity-0 group-hover:opacity-100 transition-opacity"
                                        >
                                          <RotateCcw className="size-3 text-muted-foreground" />
                                        </Button>
                                      )}
                                      <Button
                                        variant="ghost"
                                        size="icon-xs"
                                        onClick={() =>
                                          saveRate(
                                            set.id,
                                            dr.rarity,
                                            set.code,
                                          )
                                        }
                                        disabled={isSaving}
                                        title="บันทึก"
                                      >
                                        {isSaving ? (
                                          <Loader2 className="size-3.5 animate-spin" />
                                        ) : isSaved && !dirty ? (
                                          <Check className="size-3.5 text-green-500" />
                                        ) : (
                                          <Save
                                            className={cn(
                                              "size-3.5",
                                              dirty &&
                                                "text-blue-500",
                                            )}
                                          />
                                        )}
                                      </Button>
                                    </div>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
