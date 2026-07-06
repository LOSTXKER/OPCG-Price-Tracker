import { useMemo } from "react";
import { Eye } from "lucide-react";

import { AdminPanel } from "@/components/admin/admin-panel";
import { getHoneyLevelFromTiers, type RankTier } from "@/lib/honey/rank-tiers";
import { TierBadge } from "./tier-badge";

/** Live "what the user sees" preview for a sample score midway up the ladder. */
export function RankPreview({ tiers }: { tiers: RankTier[] }) {
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
          <dl className="grid grid-cols-2 gap-2 border-t border-hair pt-3 text-sm">
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
