"use client";

import { useState } from "react";
import { Eye } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AdminPage } from "@/components/admin/admin-page";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { AdminPanel } from "@/components/admin/admin-panel";
import { AdminEmptyState } from "@/components/admin/admin-empty-state";
import { AdminFormField } from "@/components/admin/admin-form-field";
import { adminFetch, buildAdminQuery } from "@/lib/admin/admin-fetch";

import type { PreviewMission } from "../types";

export function PreviewClient() {
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [missions, setMissions] = useState<PreviewMission[]>([]);
  const [loading, setLoading] = useState(false);
  const [loaded, setLoaded] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const data = await adminFetch<{ missions: PreviewMission[] }>(
        `/api/admin/honey/missions/preview?${buildAdminQuery({ date })}`,
      );
      setMissions(data.missions);
      setLoaded(true);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "โหลดไม่สำเร็จ");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AdminPage
      header={
        <AdminPageHeader
          title="ดูตัวอย่างภารกิจ"
          icon={Eye}
          description="จำลองว่าวันที่เลือกจะมีภารกิจใดบ้าง ตามกฎตารางเวลาที่ตั้งไว้"
        />
      }
    >
      <AdminPanel title="เลือกวันที่">
        <div className="flex flex-wrap items-end gap-3">
          <AdminFormField label="วันที่">
            <Input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </AdminFormField>
          <Button onClick={() => void load()} disabled={loading} size="sm">
            <Eye className="h-4 w-4" />
            {loading ? "กำลังโหลด..." : "ดูตัวอย่าง"}
          </Button>
        </div>
      </AdminPanel>

      {missions.length > 0 ? (
        <div className="overflow-x-auto rounded-xl border border-[var(--p-hair)]">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[var(--p-hair)] bg-muted/30">
                <th className="px-4 py-2.5 text-left text-xs font-medium text-muted-foreground">#</th>
                <th className="px-4 py-2.5 text-left text-xs font-medium text-muted-foreground">ชื่อ</th>
                <th className="px-4 py-2.5 text-right text-xs font-medium text-muted-foreground">เป้าหมาย</th>
                <th className="px-4 py-2.5 text-right text-xs font-medium text-muted-foreground">รางวัล</th>
              </tr>
            </thead>
            <tbody>
              {missions.map((m, i) => (
                <tr
                  key={m.code}
                  className="border-b border-[var(--p-hair)] transition-colors hover:bg-muted/20"
                >
                  <td className="px-4 py-3 text-muted-foreground">{i + 1}</td>
                  <td className="px-4 py-3">{m.name}</td>
                  <td className="px-4 py-3 text-right tabular-nums">{m.target}</td>
                  <td className="px-4 py-3 text-right font-bold tabular-nums text-warning">
                    {m.rewards?.honey ?? 0}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : loaded && !loading ? (
        <AdminEmptyState
          icon={Eye}
          title="ไม่มีภารกิจในวันที่เลือก"
          description="ตรวจสอบกฎตารางเวลาว่าครอบคลุมวันที่นี้หรือไม่"
        />
      ) : null}
    </AdminPage>
  );
}
