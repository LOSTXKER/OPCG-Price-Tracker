import {
  ArrowDown,
  ArrowUp,
  ChevronDown,
  Trash2,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AdminFormField } from "@/components/admin/admin-form-field";
import { ImageUploader } from "@/components/admin/image-uploader";
import { RankTierIcon } from "@/components/shared/rank-icon";
import { cn } from "@/lib/utils";
import {
  RANK_ICON_NAMES,
  type RankIconName,
  type RankTier,
} from "@/lib/honey/rank-tiers";
import { TierBadge } from "./tier-badge";

const ICON_OPTIONS: RankIconName[] = [...RANK_ICON_NAMES];

/** One tier: a collapsed summary row that expands into the full edit form. */
export function TierRow({
  tier,
  position,
  total,
  expanded,
  onToggle,
  onChange,
  onLabelChange,
  onRemove,
  onMoveUp,
  onMoveDown,
}: {
  tier: RankTier;
  position: number;
  total: number;
  expanded: boolean;
  onToggle: () => void;
  onChange: (patch: Partial<RankTier>) => void;
  onLabelChange: (lang: "TH" | "EN" | "JP", value: string) => void;
  onRemove: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
}) {
  return (
    <div className={cn("border-[var(--p-hair)]", position > 0 && "border-t")}>
      <div
        className={cn(
          "flex items-center gap-3 px-4 transition-colors hover:bg-muted/30",
          expanded && "bg-muted/20",
        )}
      >
        <button
          type="button"
          onClick={onToggle}
          aria-expanded={expanded}
          className="flex min-w-0 flex-1 items-center gap-3 py-3 text-left"
        >
          <TierBadge tier={tier} />
          <div className="min-w-0 flex-1">
            <div className="flex items-baseline gap-2">
              <span className="text-meta tabular-nums">Lv.{tier.level}</span>
              <span className="truncate font-medium">
                {tier.labels.TH || tier.labels.EN || "—"}
              </span>
            </div>
            <p className="text-meta tabular-nums">
              เริ่มที่ {tier.threshold.toLocaleString()} pt · โบนัส +
              {tier.levelUpBonus.toLocaleString()} 🍯
            </p>
          </div>
        </button>
        <div className="flex shrink-0 items-center gap-1">
          <Button
            variant="ghost"
            size="icon-xs"
            onClick={onMoveUp}
            disabled={position === 0}
            title="ขึ้น"
          >
            <ArrowUp className="size-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="icon-xs"
            onClick={onMoveDown}
            disabled={position === total - 1}
            title="ลง"
          >
            <ArrowDown className="size-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="icon-xs"
            onClick={onRemove}
            className="text-destructive hover:text-destructive"
            title="ลบ"
          >
            <Trash2 className="size-3.5" />
          </Button>
          <button
            type="button"
            onClick={onToggle}
            aria-label={expanded ? "ย่อ" : "ขยาย"}
            className="flex size-7 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted"
          >
            <ChevronDown
              className={cn(
                "size-4 transition-transform",
                expanded && "rotate-180",
              )}
            />
          </button>
        </div>
      </div>

      {expanded && (
        <div className="space-y-5 border-t border-[var(--p-hair)] bg-muted/10 px-4 py-5 sm:px-5">
          <div className="grid gap-4 sm:grid-cols-3">
            <NumberField
              label="ระดับ"
              value={tier.level}
              min={0}
              onChange={(v) => onChange({ level: v })}
              hint="หมายเลขลำดับ ห้ามซ้ำ"
            />
            <NumberField
              label="คะแนนสะสมขั้นต่ำ (pt)"
              value={tier.threshold}
              min={0}
              onChange={(v) => onChange({ threshold: v })}
              hint={position === 0 ? "ระดับแรกต้องเป็น 0" : "มากกว่าระดับก่อนหน้า"}
            />
            <NumberField
              label="โบนัสเมื่อเลื่อน (🍯)"
              value={tier.levelUpBonus}
              min={0}
              onChange={(v) => onChange({ levelUpBonus: v })}
              hint={position === 0 ? "ระดับแรกใส่ 0" : "Honey ที่ผู้ใช้ได้เมื่อเลื่อนถึง"}
            />
          </div>

          <AdminFormField label="ชื่อระดับ">
            <div className="grid gap-2 sm:grid-cols-3">
              <Input
                value={tier.labels.TH}
                onChange={(e) => onLabelChange("TH", e.target.value)}
                placeholder="ไทย — เช่น บรอนซ์"
              />
              <Input
                value={tier.labels.EN}
                onChange={(e) => onLabelChange("EN", e.target.value)}
                placeholder="English — e.g. Bronze"
              />
              <Input
                value={tier.labels.JP}
                onChange={(e) => onLabelChange("JP", e.target.value)}
                placeholder="日本語 — 例：ブロンズ"
              />
            </div>
          </AdminFormField>

          <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_auto_auto]">
            <AdminFormField
              label="ไอคอน"
              hint="ใช้เมื่อยังไม่ได้อัปโหลดรูปภาพ"
            >
              <div className="flex flex-wrap gap-1.5">
                {ICON_OPTIONS.map((name) => {
                  const active = tier.iconName === name;
                  return (
                    <button
                      key={name}
                      type="button"
                      onClick={() => onChange({ iconName: name })}
                      title={name}
                      className={cn(
                        "flex size-9 items-center justify-center rounded-lg border transition-colors",
                        active
                          ? "border-primary bg-primary/10 text-primary"
                          : "border-[var(--p-hair)] text-muted-foreground hover:bg-muted",
                      )}
                    >
                      <RankTierIcon name={name} className="size-4" />
                    </button>
                  );
                })}
              </div>
            </AdminFormField>

            <AdminFormField label="สีเน้น">
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={tier.color ?? "#888888"}
                  onChange={(e) => onChange({ color: e.target.value })}
                  className="size-9 cursor-pointer rounded-lg border border-[var(--p-hair)] bg-transparent"
                  aria-label="เลือกสี"
                />
                <Input
                  value={tier.color ?? ""}
                  onChange={(e) =>
                    onChange({ color: e.target.value.trim() || null })
                  }
                  placeholder="#b45309"
                  className="w-28 font-mono text-xs"
                />
                {tier.color && (
                  <button
                    type="button"
                    onClick={() => onChange({ color: null })}
                    className="text-meta hover:text-foreground"
                  >
                    ล้าง
                  </button>
                )}
              </div>
            </AdminFormField>

            <AdminFormField
              label="รูปภาพ"
              hint="ทับไอคอนถ้าตั้งไว้"
            >
              <div className="w-32">
                <ImageUploader
                  value={tier.imageUrl ?? ""}
                  onChange={(url) => onChange({ imageUrl: url || null })}
                  folder="rank-tiers"
                  height="h-24"
                />
              </div>
            </AdminFormField>
          </div>
        </div>
      )}
    </div>
  );
}

function NumberField({
  label,
  value,
  onChange,
  min,
  hint,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  min?: number;
  hint?: string;
}) {
  return (
    <AdminFormField label={label} hint={hint}>
      <Input
        type="number"
        min={min}
        value={value}
        onChange={(e) => {
          const n = Number(e.target.value);
          if (Number.isFinite(n)) onChange(Math.trunc(n));
        }}
      />
    </AdminFormField>
  );
}
