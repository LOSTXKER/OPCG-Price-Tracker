"use client";

import { useMemo, useState } from "react";
import { Crown, Plus, RotateCcw } from "lucide-react";
import { toast } from "sonner";

import { adminFetch } from "@/lib/admin/admin-fetch";
import { Button } from "@/components/ui/button";
import { Surface } from "@/components/ui/surface";
import { AdminPage } from "@/components/admin/admin-page";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { AdminSaveBar } from "@/components/admin/admin-save-bar";
import { useConfirm } from "@/components/admin/confirm-dialog";
import {
  DEFAULT_RANK_TIERS,
  RankTiersSchema,
  type RankTier,
} from "@/lib/honey/rank-tiers";
import { invalidateRankTiers } from "@/hooks/use-rank-tiers";
import { TierRow } from "./_components/tier-row";
import { RankPreview } from "./_components/rank-preview";

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
        <Surface variant="outline" className="overflow-hidden">
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
        </Surface>

        <aside className="lg:sticky lg:top-4 lg:self-start">
          <RankPreview tiers={stripKeys(sortedForDisplay)} />
        </aside>
      </div>
    </AdminPage>
  );
}
