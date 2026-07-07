import {
  AlertCircle,
  Check,
  CheckCircle2,
  ChevronDown,
  Loader2,
  RotateCcw,
  Save,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Surface } from "@/components/ui/surface";
import { cn } from "@/lib/utils";
import type { SetData } from "./types";
import type { DropRatesEditor } from "./use-drop-rates-editor";

function calcSuggestedRate(
  avgPerBox: string,
  packsPerBox: number | null,
): string | null {
  if (!packsPerBox || !avgPerBox) return null;
  const avg = parseFloat(avgPerBox);
  if (isNaN(avg) || avg <= 0) return null;
  return (avg / packsPerBox).toFixed(4);
}

/** One set: a collapsed code/name row that expands into a per-rarity rate
 *  table. The editing state is owned by the parent `editor` (a single set is
 *  open at a time). */
export function SetRow({
  set,
  expanded,
  complete,
  rarityCounts,
  onToggle,
  editor,
}: {
  set: SetData;
  expanded: boolean;
  complete: boolean;
  rarityCounts: Record<string, number>;
  onToggle: () => void;
  editor: DropRatesEditor;
}) {
  const {
    editRates,
    setEditRates,
    saving,
    saved,
    savingAll,
    hasAnyDirty,
    isDirty,
    resetRate,
    resetAll,
    saveRate,
    saveAllRates,
  } = editor;

  const getCount = (setId: number, rarity: string, isParallel: boolean): number =>
    rarityCounts[`${setId}-${rarity}-${isParallel}`] ?? 0;

  return (
    <Surface
      variant="outline"
      className={cn(
        "overflow-hidden motion-base",
        expanded
          ? "border-hair"
          : "border-hair hover:border-hair",
      )}
    >
      {/* Collapsed Header */}
      <button
        onClick={onToggle}
        className="flex w-full items-center gap-3 px-5 py-3.5 text-left motion-base hover:bg-muted/70"
      >
        <span className="min-w-[4rem] font-mono text-sm font-bold uppercase tracking-wide">
          {set.code}
        </span>
        <span className="flex-1 text-sm font-medium">
          {set.nameEn || set.name}
        </span>

        {/* Completeness indicator */}
        {complete ? (
          <span className="flex items-center gap-1 text-xs text-success">
            <CheckCircle2 className="size-3.5" />
            <span className="hidden sm:inline">ครบ</span>
          </span>
        ) : (
          <span className="flex items-center gap-1 text-xs text-warning">
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
            "size-4 text-muted-foreground transition-transform duration-[var(--dur-base)]",
            expanded && "rotate-180",
          )}
        />
      </button>

      {/* Expanded Content */}
      <div
        className={cn(
          "grid transition-[grid-template-rows] duration-[var(--dur-base)] ease-in-out",
          expanded ? "grid-rows-[1fr]" : "grid-rows-[0fr]",
        )}
      >
        <div className="overflow-hidden">
          {expanded && (
            <div className="border-t border-hair px-5 py-4">
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
              <div className="overflow-x-auto rounded-lg border border-hair">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-hair bg-muted/30">
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
                      const pool = getCount(set.id, dr.rarity, isParallel);
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
                            "group border-b border-hair motion-base hover:bg-muted/70",
                            idx % 2 === 1 && "bg-muted/5",
                            dirty && "bg-info-soft",
                            showSeparator &&
                              "border-t-2 border-t-warning/30",
                          )}
                        >
                          <td className="px-4 py-2.5">
                            <span
                              className={cn(
                                "font-mono text-xs font-bold",
                                isParallel
                                  ? "text-warning"
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
                                className="h-8 w-28 text-right text-xs tabular-nums"
                              />
                            </div>
                          </td>
                          <td className="px-4 py-2.5">
                            <div className="flex items-center justify-end gap-1">
                              <Input
                                type="number"
                                step="0.0001"
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
                                  onClick={() => resetRate(dr.rarity)}
                                  title="รีเซ็ต"
                                  className="opacity-0 group-hover:opacity-100 transition-opacity"
                                >
                                  <RotateCcw className="size-3 text-muted-foreground" />
                                </Button>
                              )}
                              <Button
                                variant="ghost"
                                size="icon-xs"
                                onClick={() => saveRate(set.id, dr.rarity, set.code)}
                                disabled={isSaving}
                                title="บันทึก"
                              >
                                {isSaving ? (
                                  <Loader2 className="size-3.5 animate-spin" />
                                ) : isSaved && !dirty ? (
                                  <Check className="size-3.5 text-success" />
                                ) : (
                                  <Save
                                    className={cn(
                                      "size-3.5",
                                      dirty && "text-info",
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
    </Surface>
  );
}
