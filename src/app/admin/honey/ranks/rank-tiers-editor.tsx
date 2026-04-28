"use client";

import { useMemo, useState } from "react";
import {
  ArrowDown,
  ArrowUp,
  Crown,
  Eye,
  Plus,
  RotateCcw,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";

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
  // Roughly 2-3x the previous step so the default add lands in a
  // sensible-looking spot rather than +1.
  return Math.round(maxThreshold * 2.5);
}

const ICON_OPTIONS: RankIconName[] = [...RANK_ICON_NAMES];

export function RankTiersEditor({ initialTiers }: { initialTiers: RankTier[] }) {
  const [tiers, setTiers] = useState<DraftTier[]>(() => withKeys(initialTiers));
  const [pristineSnapshot, setPristineSnapshot] = useState<string>(() =>
    JSON.stringify(stripKeys(withKeys(initialTiers))),
  );
  const [saving, setSaving] = useState(false);
  const confirmDialog = useConfirm();
  const dirty =
    JSON.stringify(stripKeys(tiers)) !== pristineSnapshot;

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
      description: "ผู้ใช้ที่อยู่ในระดับนี้จะถูกย้ายไประดับที่ใกล้เคียงโดยอัตโนมัติเมื่อบันทึก",
      confirmLabel: "ลบ",
      variant: "destructive",
    });
    if (!ok) return;
    setTiers((prev) => prev.filter((t) => t._key !== key));
  };

  const addTier = () => {
    setTiers((prev) => {
      const draft: DraftTier = {
        _key: newKey(),
        level: nextLevel(prev),
        threshold: nextThreshold(prev),
        levelUpBonus: 100,
        iconName: "Award",
        imageUrl: null,
        color: "#a855f7",
        labels: { TH: "ระดับใหม่", EN: "New tier", JP: "新ランク" },
      };
      return [...prev, draft];
    });
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
      const next = prev.map((t) => {
        if (t._key === a._key) return { ...t, level: b.level, threshold: b.threshold };
        if (t._key === b._key) return { ...t, level: a.level, threshold: a.threshold };
        return t;
      });
      return next;
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
  };

  const handleSave = async () => {
    if (!validation.ok) {
      toast.error("ยังมีข้อผิดพลาด ตรวจสอบฟอร์มก่อนบันทึก");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/admin/honey/ranks", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(stripKeys(tiers)),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        toast.error(data?.error || `บันทึกไม่สำเร็จ (${res.status})`);
        return;
      }
      toast.success("บันทึกระดับแรงค์สำเร็จ");
      invalidateRankTiers();
      if (Array.isArray(data?.tiers)) {
        const next = withKeys(data.tiers);
        setTiers(next);
        setPristineSnapshot(JSON.stringify(stripKeys(next)));
      } else {
        setPristineSnapshot(JSON.stringify(stripKeys(tiers)));
      }
    } catch {
      toast.error("เกิดข้อผิดพลาดในการเชื่อมต่อ");
    } finally {
      setSaving(false);
    }
  };

  return (
    <AdminPage
      header={
        <AdminPageHeader
          title="ระดับแรงค์ (Rank)"
          description="ตั้งค่าระดับ ขอบเขตคะแนน ชื่อ (TH/EN/JP) ไอคอน รูป สี และโบนัสเลื่อนระดับ — มีผลทันทีทั่วทั้งระบบ"
          icon={Crown}
          meta={
            <span className="text-meta">
              ทั้งหมด {sortedForDisplay.length} ระดับ
            </span>
          }
          actions={
            <>
              <Button onClick={resetToDefaults} variant="outline" size="sm">
                <RotateCcw className="size-4" /> ค่าเริ่มต้น
              </Button>
              <Button onClick={addTier} variant="outline" size="sm">
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
              <span className="text-danger">มีข้อผิดพลาด ตรวจสอบฟอร์มก่อนบันทึก</span>
            ) : undefined
          }
        />
      }
    >
      {!validation.ok && (
        <div className="status-danger rounded-lg border border-destructive/30 p-4 text-sm">
          <p className="font-semibold">ยังมีข้อผิดพลาด:</p>
          <ul className="ml-5 mt-1 list-disc space-y-0.5 text-xs">
            {validation.issues.slice(0, 6).map((m, i) => (
              <li key={i}>{m}</li>
            ))}
            {validation.issues.length > 6 && (
              <li className="opacity-60">…และอีก {validation.issues.length - 6} ข้อ</li>
            )}
          </ul>
        </div>
      )}

      <RankPreview tiers={stripKeys(sortedForDisplay)} />

      <div className="space-y-4">
        {sortedForDisplay.map((tier, idx) => (
          <TierCard
            key={tier._key}
            tier={tier}
            position={idx}
            total={sortedForDisplay.length}
            onChange={(patch) => updateTier(tier._key, patch)}
            onLabelChange={(lang, value) => updateLabel(tier._key, lang, value)}
            onRemove={() => void removeTier(tier._key)}
            onMoveUp={() => moveTier(tier._key, -1)}
            onMoveDown={() => moveTier(tier._key, 1)}
          />
        ))}
      </div>
    </AdminPage>
  );
}

/* ── Tier card ───────────────────────────────────────────────────── */

function TierCard({
  tier,
  position,
  total,
  onChange,
  onLabelChange,
  onRemove,
  onMoveUp,
  onMoveDown,
}: {
  tier: DraftTier;
  position: number;
  total: number;
  onChange: (patch: Partial<RankTier>) => void;
  onLabelChange: (lang: "TH" | "EN" | "JP", value: string) => void;
  onRemove: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
}) {
  return (
    <AdminPanel
      title={
        <span className="flex items-center gap-3">
          <span
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
          </span>
          <span className="min-w-0 truncate">
            Lv.{tier.level} · {tier.labels.TH || tier.labels.EN}
          </span>
        </span>
      }
      description={
        <>
          เริ่มที่ {tier.threshold.toLocaleString()} pt · โบนัส +
          {tier.levelUpBonus.toLocaleString()} 🍯
        </>
      }
      actions={
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
        </div>
      }
      bodyClassName="space-y-5 p-4 sm:p-5"
    >
        <div className="grid gap-4 sm:grid-cols-3">
          <NumberField
            label="ระดับ"
            value={tier.level}
            min={0}
            onChange={(v) => onChange({ level: v })}
            help="หมายเลขลำดับ (ไม่ซ้ำกัน)"
          />
          <NumberField
            label="คะแนนสะสมที่ต้องการ (pt)"
            value={tier.threshold}
            min={0}
            onChange={(v) => onChange({ threshold: v })}
            help={position === 0 ? "ระดับแรกต้องเป็น 0" : "ต้องมากกว่าระดับก่อนหน้า"}
          />
          <NumberField
            label="โบนัสเลื่อนระดับ (🍯)"
            value={tier.levelUpBonus}
            min={0}
            onChange={(v) => onChange({ levelUpBonus: v })}
            help={position === 0 ? "โดยปกติเป็น 0 — ระดับเริ่มต้นไม่ต้องให้โบนัส" : "Honey ที่ผู้ใช้ได้เมื่อเลื่อนเข้าระดับนี้"}
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <AdminFormField label="ชื่อ (TH)">
            <Input
              value={tier.labels.TH}
              onChange={(e) => onLabelChange("TH", e.target.value)}
              placeholder="เช่น บรอนซ์"
            />
          </AdminFormField>
          <AdminFormField label="ชื่อ (EN)">
            <Input
              value={tier.labels.EN}
              onChange={(e) => onLabelChange("EN", e.target.value)}
              placeholder="e.g. Bronze"
            />
          </AdminFormField>
          <AdminFormField label="ชื่อ (JP)">
            <Input
              value={tier.labels.JP}
              onChange={(e) => onLabelChange("JP", e.target.value)}
              placeholder="例：ブロンズ"
            />
          </AdminFormField>
        </div>

        <div className="grid gap-4 sm:grid-cols-[1fr_auto]">
          <AdminFormField
            label="ไอคอน"
            hint="ใช้เมื่อไม่มีรูปภาพแบบกำหนดเอง"
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
                className="w-32 font-mono text-xs"
              />
              {tier.color && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onChange({ color: null })}
                  className="text-meta"
                >
                  ล้าง
                </Button>
              )}
            </div>
          </AdminFormField>
        </div>

        <AdminFormField
          label="รูปภาพ (ทับไอคอน, ไม่บังคับ)"
          hint="อัปโหลดรูป PNG/SVG/WebP เช่นเหรียญตราหรือเข็มกลัดเฉพาะระดับ ใช้พื้นโปร่งใสจะเข้ากับธีมสว่าง/มืดดีที่สุด เมื่อเซ็ตรูปภาพไว้ ไอคอนจะถูกซ่อน"
        >
          <div className="max-w-[200px]">
            <ImageUploader
              value={tier.imageUrl ?? ""}
              onChange={(url) => onChange({ imageUrl: url || null })}
              folder="rank-tiers"
              height="h-32"
            />
          </div>
        </AdminFormField>
    </AdminPanel>
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

  return (
    <AdminPanel
      icon={Eye}
      title="ตัวอย่างที่ผู้ใช้จะเห็น"
      description={`คะแนนสะสมตัวอย่าง: ${sample.toLocaleString()} pt`}
      className="border-dashed"
    >
      <div className="grid gap-2 sm:grid-cols-2">
        <div className="rounded-lg border p-3">
          <p className="text-eyebrow">ระดับปัจจุบัน</p>
          <div className="mt-1 flex items-center gap-2">
            {level && (
              <TierBadge tier={tiers.find((t) => t.level === level.level) ?? tiers[0]} />
            )}
            <p className="text-h3">{level?.label ?? "—"}</p>
          </div>
        </div>
        <div className="rounded-lg border p-3">
          <p className="text-eyebrow">ระดับทั้งหมด</p>
          <div className="mt-1.5 space-y-1.5">
            {tiers.map((t) => (
              <div key={t.level} className="flex items-center gap-2 text-sm">
                <TierBadge tier={t} small />
                <span className="flex-1 truncate">{t.labels.TH}</span>
                <span className="tabular-nums text-meta">
                  {t.threshold.toLocaleString()} pt
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </AdminPanel>
  );
}

function TierBadge({ tier, small }: { tier: RankTier; small?: boolean }) {
  const size = small ? "size-6" : "size-9";
  const iconSize = small ? "size-3" : "size-4";
  return (
    <div
      className={cn(
        "flex shrink-0 items-center justify-center rounded-md ring-1 ring-border/40",
        size,
      )}
      style={{
        backgroundColor: tier.color ? `${tier.color}1a` : undefined,
        color: tier.color ?? undefined,
      }}
    >
      {tier.imageUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={tier.imageUrl} alt="" className="size-full rounded object-contain" />
      ) : (
        <RankTierIcon name={tier.iconName} className={iconSize} />
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
  help,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  min?: number;
  help?: string;
}) {
  return (
    <AdminFormField label={label} hint={help}>
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
