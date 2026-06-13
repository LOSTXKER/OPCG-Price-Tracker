"use client";

import { useMemo, useState } from "react";
import {
  ArrowDown,
  ArrowUp,
  ChevronDown,
  Crown,
  Eye,
  Plus,
  RotateCcw,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";

import { adminFetch } from "@/lib/admin/admin-fetch";
import { ImageUploader } from "@/components/admin/image-uploader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AdminPage } from "@/components/admin/admin-page";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { AdminPanel } from "@/components/admin/admin-panel";
import { AdminSaveBar } from "@/components/admin/admin-save-bar";
import { AdminFormField } from "@/components/admin/admin-form-field";
import { useConfirm } from "@/components/admin/confirm-dialog";
import { cn } from "@/lib/utils";
import {
  DEFAULT_RANK_TIERS,
  RANK_ICON_NAMES,
  RankTiersSchema,
  getHoneyLevelFromTiers,
  type RankIconName,
  type RankTier,
} from "@/lib/honey/rank-tiers";
import { RankTierIcon } from "@/components/shared/rank-icon";
import { invalidateRankTiers } from "@/hooks/use-rank-tiers";

type DraftTier = RankTier & { _key: string };

let keyCounter = 0;
function newKey() {
  keyCounter += 1;
  return `tier_${Date.now()}_${keyCounter}`;
}

function withKeys(tiers: RankTier[]): DraftTier[] {
  return tiers.map((t) => ({ ...t, _key: newKey() }));
}

function stripKeys(tiers: DraftTier[]): RankTier[] {
  return tiers.map(({ _key, ...rest }) => {
    void _key;
    return rest;
  });
}

function nextLevel(tiers: DraftTier[]): number {
  if (tiers.length === 0) return 0;
  return Math.max(...tiers.map((t) => t.level)) + 1;
}

function nextThreshold(tiers: DraftTier[]): number {
  if (tiers.length === 0) return 0;
  const maxThreshold = Math.max(...tiers.map((t) => t.threshold));
  if (maxThreshold === 0) return 100;
  // Roughly 2-3x the previous step so the default add lands in a sensible-
  // looking spot rather than +1.
  return Math.round(maxThreshold * 2.5);
}

const ICON_OPTIONS: RankIconName[] = [...RANK_ICON_NAMES];

export function RankTiersEditor({ initialTiers }: { initialTiers: RankTier[] }) {
  const [tiers, setTiers] = useState<DraftTier[]>(() => withKeys(initialTiers));
  const [pristineSnapshot, setPristineSnapshot] = useState<string>(() =>
    JSON.stringify(stripKeys(withKeys(initialTiers))),
  );
  const [saving, setSaving] = useState(false);
  // Only one tier is expanded for editing at a time — keeps the page short
  // and forces admins to focus on a single tier instead of scrolling through
  // 10 fully-expanded panels.
  const [expandedKey, setExpandedKey] = useState<string | null>(null);
  const confirmDialog = useConfirm();
  const dirty = JSON.stringify(stripKeys(tiers)) !== pristineSnapshot;

  const sortedForDisplay = useMemo(
    () => [...tiers].sort((a, b) => a.level - b.level),
    [tiers],
  );

  const validation = useMemo(() => {
    const result = RankTiersSchema.safeParse(stripKeys(tiers));
    if (result.success) return { ok: true as const, issues: [] as string[] };
    return {
      ok: false as const,
      issues: result.error.issues.map((i) => {
        const path = i.path.length > 0 ? `[${i.path.join(".")}]` : "";
        return `${path} ${i.message}`.trim();
      }),
    };
  }, [tiers]);

  const updateTier = (key: string, patch: Partial<RankTier>) => {
    setTiers((prev) =>
      prev.map((t) => (t._key === key ? { ...t, ...patch } : t)),
    );
  };

  const updateLabel = (
    key: string,
    lang: "TH" | "EN" | "JP",
    value: string,
  ) => {
    setTiers((prev) =>
      prev.map((t) =>
        t._key === key ? { ...t, labels: { ...t.labels, [lang]: value } } : t,
      ),
    );
  };

  const removeTier = async (key: string) => {
    if (tiers.length <= 1) {
      toast.error("ต้องมีอย่างน้อย 1 ระดับ");
      return;
    }
    const ok = await confirmDialog({
      title: "ลบระดับแรงค์",
      description:
        "ผู้ใช้ที่อยู่ในระดับนี้จะถูกย้ายไประดับที่ใกล้เคียงโดยอัตโนมัติเมื่อบันทึก",
      confirmLabel: "ลบ",
      variant: "destructive",
    });
    if (!ok) return;
    setTiers((prev) => prev.filter((t) => t._key !== key));
    if (expandedKey === key) setExpandedKey(null);
  };

  const addTier = () => {
    const draft: DraftTier = {
      _key: newKey(),
      level: nextLevel(tiers),
      threshold: nextThreshold(tiers),
      levelUpBonus: 100,
      iconName: "Award",
      imageUrl: null,
      color: "#a855f7",
      labels: { TH: "ระดับใหม่", EN: "New tier", JP: "新ランク" },
    };
    setTiers((prev) => [...prev, draft]);
    setExpandedKey(draft._key);
  };

  const moveTier = (key: string, direction: -1 | 1) => {
    setTiers((prev) => {
      const sorted = [...prev].sort((a, b) => a.level - b.level);
      const idx = sorted.findIndex((t) => t._key === key);
      if (idx === -1) return prev;
      const swapWith = idx + direction;
      if (swapWith < 0 || swapWith >= sorted.length) return prev;
      const a = sorted[idx];
      const b = sorted[swapWith];
      // Swap levels (and thresholds so ordering stays valid).
      return prev.map((t) => {
        if (t._key === a._key) return { ...t, level: b.level, threshold: b.threshold };
        if (t._key === b._key) return { ...t, level: a.level, threshold: a.threshold };
        return t;
      });
    });
  };

  const resetToDefaults = async () => {
    const ok = await confirmDialog({
      title: "รีเซ็ตเป็นค่าเริ่มต้น",
      description: "การเปลี่ยนแปลงที่ยังไม่ได้บันทึกจะหายไป",
      confirmLabel: "รีเซ็ต",
      variant: "destructive",
    });
    if (!ok) return;
    setTiers(withKeys(DEFAULT_RANK_TIERS));
    setExpandedKey(null);
  };

  const handleSave = async () => {
    if (!validation.ok) {
      toast.error("ยังมีข้อผิดพลาด ตรวจสอบฟอร์มก่อนบันทึก");
      return;
    }
    setSaving(true);
    try {
      const data = await adminFetch<{ tiers?: RankTier[] }>(
        "/api/admin/honey/ranks",
        { method: "PUT", body: stripKeys(tiers) },
      );
      toast.success("บันทึกระดับแรงค์สำเร็จ");
      invalidateRankTiers();
      if (Array.isArray(data?.tiers)) {
        const next = withKeys(data.tiers);
        setTiers(next);
        setPristineSnapshot(JSON.stringify(stripKeys(next)));
      } else {
        setPristineSnapshot(JSON.stringify(stripKeys(tiers)));
      }
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "เกิดข้อผิดพลาดในการเชื่อมต่อ",
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <AdminPage
      header={
        <AdminPageHeader
          title="ระดับแรงค์"
          description="ตั้งค่าระดับ ขอบเขตคะแนน ชื่อ ไอคอน และโบนัสเลื่อนระดับ — มีผลทันทีทั่วทั้งระบบ"
          icon={Crown}
          meta={
            <span className="text-meta">{sortedForDisplay.length} ระดับ</span>
          }
          actions={
            <>
              <Button onClick={resetToDefaults} variant="outline" size="sm">
                <RotateCcw className="size-4" /> ค่าเริ่มต้น
              </Button>
              <Button onClick={addTier} size="sm">
                <Plus className="size-4" /> เพิ่มระดับ
              </Button>
            </>
          }
        />
      }
      footer={
        <AdminSaveBar
          dirty={dirty}
          saving={saving}
          disabled={!validation.ok}
          onSave={() => void handleSave()}
          description={
            !validation.ok ? (
              <span className="text-danger">
                มีข้อผิดพลาด {validation.issues.length} รายการ
              </span>
            ) : undefined
          }
        />
      }
    >
      {!validation.ok && (
        <div className="status-danger rounded-lg border border-destructive/30 p-3 text-xs">
          <p className="font-semibold">ยังมีข้อผิดพลาด:</p>
          <ul className="ml-4 mt-1 list-disc space-y-0.5">
            {validation.issues.slice(0, 4).map((m, i) => (
              <li key={i}>{m}</li>
            ))}
            {validation.issues.length > 4 && (
              <li className="opacity-60">…และอีก {validation.issues.length - 4} ข้อ</li>
            )}
          </ul>
        </div>
      )}

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="overflow-hidden rounded-xl border border-border/60 bg-card">
          {sortedForDisplay.map((tier, idx) => (
            <TierRow
              key={tier._key}
              tier={tier}
              position={idx}
              total={sortedForDisplay.length}
              expanded={expandedKey === tier._key}
              onToggle={() =>
                setExpandedKey((prev) => (prev === tier._key ? null : tier._key))
              }
              onChange={(patch) => updateTier(tier._key, patch)}
              onLabelChange={(lang, value) => updateLabel(tier._key, lang, value)}
              onRemove={() => void removeTier(tier._key)}
              onMoveUp={() => moveTier(tier._key, -1)}
              onMoveDown={() => moveTier(tier._key, 1)}
            />
          ))}
        </div>

        <aside className="lg:sticky lg:top-4 lg:self-start">
          <RankPreview tiers={stripKeys(sortedForDisplay)} />
        </aside>
      </div>
    </AdminPage>
  );
}

/* ── Tier row (collapsed summary + expandable edit form) ─────────────── */

function TierRow({
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
  tier: DraftTier;
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
    <div className={cn("border-border/50", position > 0 && "border-t")}>
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
        <div className="space-y-5 border-t border-border/40 bg-muted/10 px-4 py-5 sm:px-5">
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
                          : "border-border/60 text-muted-foreground hover:bg-muted",
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
                  className="size-9 cursor-pointer rounded-lg border border-border/60 bg-transparent"
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

/* ── Live preview ────────────────────────────────────────────────── */

function RankPreview({ tiers }: { tiers: RankTier[] }) {
  const sample = useMemo(() => {
    if (tiers.length === 0) return 0;
    const max = Math.max(...tiers.map((t) => t.threshold));
    return Math.round(max / 2);
  }, [tiers]);

  const level = useMemo(() => {
    if (tiers.length === 0) return null;
    return getHoneyLevelFromTiers(sample, tiers);
  }, [sample, tiers]);

  const currentTier = level
    ? tiers.find((t) => t.level === level.level) ?? tiers[0]
    : tiers[0];

  return (
    <AdminPanel
      icon={Eye}
      title="ตัวอย่างที่ผู้ใช้จะเห็น"
      description={`ที่คะแนนสะสมตัวอย่าง ${sample.toLocaleString()} pt`}
      className="border-dashed"
    >
      {currentTier ? (
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <TierBadge tier={currentTier} />
            <div className="min-w-0 flex-1">
              <p className="text-h3 truncate">
                {currentTier.labels.TH || currentTier.labels.EN || "—"}
              </p>
              <p className="text-meta truncate">
                Lv.{currentTier.level}
                {currentTier.labels.EN ? ` · ${currentTier.labels.EN}` : ""}
                {currentTier.labels.JP ? ` · ${currentTier.labels.JP}` : ""}
              </p>
            </div>
          </div>
          <dl className="grid grid-cols-2 gap-2 border-t border-border/40 pt-3 text-sm">
            <div>
              <dt className="text-eyebrow">คะแนนขั้นต่ำ</dt>
              <dd className="mt-0.5 font-semibold tabular-nums">
                {currentTier.threshold.toLocaleString()} pt
              </dd>
            </div>
            <div>
              <dt className="text-eyebrow">โบนัสเลื่อน</dt>
              <dd className="mt-0.5 font-semibold tabular-nums text-warning">
                +{currentTier.levelUpBonus.toLocaleString()} 🍯
              </dd>
            </div>
            {level?.nextThreshold != null && (
              <div className="col-span-2">
                <dt className="text-eyebrow">ระดับถัดไปที่</dt>
                <dd className="mt-0.5 font-semibold tabular-nums">
                  {level.nextThreshold.toLocaleString()} pt
                </dd>
              </div>
            )}
          </dl>
        </div>
      ) : (
        <p className="text-meta">ยังไม่มีระดับ</p>
      )}
    </AdminPanel>
  );
}

function TierBadge({ tier }: { tier: RankTier }) {
  return (
    <div
      className="flex size-10 shrink-0 items-center justify-center rounded-lg ring-1 ring-border/40"
      style={{
        backgroundColor: tier.color ? `${tier.color}1a` : undefined,
        color: tier.color ?? undefined,
      }}
    >
      {tier.imageUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={tier.imageUrl}
          alt=""
          className="size-7 rounded object-contain"
        />
      ) : (
        <RankTierIcon name={tier.iconName} className="size-5" />
      )}
    </div>
  );
}

/* ── Bits ────────────────────────────────────────────────────────── */

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
