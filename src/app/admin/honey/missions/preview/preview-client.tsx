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
import { AdminDataTable, type Column } from "@/components/admin/admin-data-table";
import { adminFetch, buildAdminQuery } from "@/lib/admin/admin-fetch";

import type { PreviewMission } from "../types";

type PreviewRow = PreviewMission & { _index: number };

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

  const rows: PreviewRow[] = missions.map((m, i) => ({ ...m, _index: i + 1 }));

  const columns: Column<PreviewRow>[] = [
    {
      key: "index",
      header: "#",
      className: "text-muted-foreground",
      render: (m) => m._index,
    },
    {
      key: "name",
      header: "ชื่อ",
      render: (m) => m.name,
    },
    {
      key: "target",
      header: "เป้าหมาย",
      headerClassName: "text-right",
      className: "text-right tabular-nums",
      render: (m) => m.target,
    },
    {
      key: "reward",
      header: "รางวัล",
      headerClassName: "text-right",
      className: "text-right font-bold tabular-nums text-warning",
      render: (m) => m.rewards?.honey ?? 0,
    },
  ];

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
        <AdminDataTable columns={columns} data={rows} rowKey={(m) => m.code} />
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
