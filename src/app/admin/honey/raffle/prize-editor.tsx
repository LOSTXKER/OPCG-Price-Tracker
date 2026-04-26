"use client";

import { Button } from "@/components/ui/button";
import { ImageUploader } from "@/components/admin/image-uploader";
import { Plus, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Prize } from "./raffle-manager";

const RANK_LABELS = ["1st Prize", "2nd Prize", "3rd Prize", "4th Prize", "5th Prize"];
const RANK_COLORS = [
  "border-amber-500/40 bg-amber-500/5",
  "border-slate-400/40 bg-slate-400/5",
  "border-orange-400/40 bg-orange-400/5",
  "border-border bg-card",
  "border-border bg-card",
];

export type PrizeEditorProps = {
  prizes: Prize[];
  onUpdate: (index: number, field: keyof Prize, value: string | number) => void;
  onAdd: () => void;
  onRemove: (index: number) => void;
};

export function PrizeEditor({ prizes, onUpdate, onAdd, onRemove }: PrizeEditorProps) {
  return (
    <>
      <div className="space-y-3">
        {prizes.map((prize, i) => (
          <div
            key={i}
            className={cn("rounded-xl border p-3", RANK_COLORS[i] ?? "border-border bg-card")}
          >
            <div className="mb-2 flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                {RANK_LABELS[i] ?? `#${prize.rank} Prize`}
              </span>
              {prizes.length > 1 && (
                <Button size="sm" variant="ghost" onClick={() => onRemove(i)} className="h-6 w-6 p-0 text-destructive hover:text-destructive">
                  <Trash2 className="size-3" />
                </Button>
              )}
            </div>
            <div className="grid gap-3 sm:grid-cols-[1fr_120px_auto]">
              <div className="space-y-2">
                <input
                  value={prize.name}
                  onChange={(e) => onUpdate(i, "name", e.target.value)}
                  placeholder="Prize name (e.g. OPCG Booster Box)"
                  className="mt-1 w-full rounded-lg border bg-background px-3 py-2 text-sm"
                />
                <div className="flex items-center gap-2">
                  <span className="shrink-0 text-xs text-muted-foreground">+ Honey Bonus</span>
                  <input
                    type="number"
                    value={prize.honeyBonus ?? 0}
                    onChange={(e) => onUpdate(i, "honeyBonus", +e.target.value)}
                    className="mt-1 w-24 rounded-lg border bg-background px-3 py-2 text-sm"
                  />
                </div>
              </div>
              <ImageUploader
                value={prize.imageUrl ?? ""}
                onChange={(url) => onUpdate(i, "imageUrl", url)}
                folder="prizes"
                height="h-20"
              />
            </div>
          </div>
        ))}
      </div>
      <Button size="sm" variant="outline" onClick={onAdd} className="mt-2 w-full gap-1.5 border-dashed">
        <Plus className="size-3.5" /> Add Another Prize
      </Button>
    </>
  );
}
