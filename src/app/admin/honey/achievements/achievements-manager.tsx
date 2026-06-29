"use client";

import Link from "next/link";
import { useCallback, useState } from "react";
import { Pencil, Plus, Trash2, Trophy, Users } from "lucide-react";

import { Button } from "@/components/ui/button";
import { AdminPage } from "@/components/admin/admin-page";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { AdminStatusBadge } from "@/components/admin/admin-status-badge";
import { Surface } from "@/components/ui/surface";
import { AdminEmptyState } from "@/components/admin/admin-empty-state";
import { adminFetch } from "@/lib/admin/admin-fetch";
import { useAdminCrud } from "@/lib/admin/use-admin-crud";
import {
  formatAchievementCriteria,
  localizedAchievementDesc,
} from "../achievement-labels";

type Achievement = {
  id: number;
  code: string;
  name: string;
  nameEn: string | null;
  nameTh: string | null;
  description: string | null;
  criteria: Record<string, unknown>;
  honeyReward: number;
  badgeImageUrl: string | null;
  isActive: boolean;
  createdAt: string;
  _count: { users: number };
};

export function AchievementsManager({
  initialAchievements,
}: {
  initialAchievements: Achievement[];
}) {
  const [achievements, setAchievements] = useState(initialAchievements);

  const reload = useCallback(async () => {
    const data = await adminFetch<{ achievements: Achievement[] }>(
      "/api/admin/honey/achievements",
    );
    setAchievements(data.achievements);
  }, []);

  const crud = useAdminCrud<number>({
    basePath: "/api/admin/honey/achievements",
    reload,
    deleteSuccessMessage: "ลบความสำเร็จแล้ว",
    deleteConfirm: {
      title: "ลบความสำเร็จ",
      description: (id) => {
        const a = achievements.find((x) => x.id === id);
        const label = a?.nameTh ?? a?.name ?? "รายการนี้";
        return `ลบ "${label}"? ผู้ใช้ที่ปลดล็อคไว้แล้วจะถูกลบด้วย (honey ที่ได้ไปแล้วยังอยู่ครบ).`;
      },
    },
  });

  return (
    <AdminPage
      header={
        <AdminPageHeader
          title="ความสำเร็จ"
          icon={Trophy}
          description="จัดการความสำเร็จพร้อมรูปแบดจ์ที่จะโชว์ให้ผู้ใช้"
          meta={<span className="text-meta">{achievements.length} รายการ</span>}
          actions={
            <Button render={<Link href="/admin/honey/achievements/new" />} size="sm">
              <Plus className="h-4 w-4" /> เพิ่มความสำเร็จ
            </Button>
          }
        />
      }
    >
      <div className="space-y-2">
        {achievements.map((ach) => (
          <Surface key={ach.id} variant="outline" className="overflow-hidden p-4">
            <div className="flex items-center gap-3">
              {ach.badgeImageUrl ? (
                <img
                  src={ach.badgeImageUrl}
                  alt=""
                  className="size-12 shrink-0 rounded-lg object-cover"
                />
              ) : (
                <div className="flex size-12 shrink-0 items-center justify-center rounded-lg bg-warning-soft">
                  <Trophy className="h-5 w-5 text-warning" />
                </div>
              )}
              <div className="min-w-0 flex-1">
                <p className="text-h4">
                  {ach.nameTh ?? ach.name}
                  {!ach.isActive && (
                    <AdminStatusBadge tone="neutral" className="ml-2">
                      ปิดใช้งาน
                    </AdminStatusBadge>
                  )}
                </p>
                <p className="text-meta">
                  {localizedAchievementDesc(ach.criteria, ach.description)}
                </p>
                <p className="mt-1 text-meta">
                  เป้าหมาย: {formatAchievementCriteria(ach.criteria)} | รางวัล:{" "}
                  <span className="font-bold text-warning">{ach.honeyReward} แต้ม</span>
                </p>
              </div>
              <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                <Users className="h-4 w-4" />
                {ach._count.users}
              </div>
              <div className="flex shrink-0 gap-1">
                <Button
                  render={<Link href={`/admin/honey/achievements/${ach.id}`} />}
                  variant="ghost"
                  size="icon-xs"
                  title="แก้ไข"
                >
                  <Pencil className="h-3.5 w-3.5" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon-xs"
                  onClick={() => void crud.remove(ach.id)}
                  disabled={crud.deleting === ach.id}
                  className="text-destructive hover:text-destructive"
                  title="ลบ"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          </Surface>
        ))}
        {achievements.length === 0 && (
          <AdminEmptyState
            icon={Trophy}
            title="ยังไม่มีความสำเร็จ"
            action={
              <Button render={<Link href="/admin/honey/achievements/new" />} size="sm">
                <Plus className="h-4 w-4" /> เพิ่มความสำเร็จ
              </Button>
            }
          />
        )}
      </div>
    </AdminPage>
  );
}
