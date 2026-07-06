"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  Calendar,
  Pencil,
  Plus,
  ToggleLeft,
  ToggleRight,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AdminPage } from "@/components/admin/admin-page";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { AdminEmptyState } from "@/components/admin/admin-empty-state";
import { AdminDataTable, type Column } from "@/components/admin/admin-data-table";
import { useConfirm } from "@/components/admin/confirm-dialog";
import { adminFetch } from "@/lib/admin/admin-fetch";

import { DAY_NAMES, SLOT_TYPE_LABELS, type ScheduleRule } from "../types";

export function ScheduleList({
  initialRules,
}: {
  initialRules: ScheduleRule[];
}) {
  const router = useRouter();
  const confirmDialog = useConfirm();
  const [rules, setRules] = useState(initialRules);

  const handleDelete = async (id: number) => {
    const ok = await confirmDialog({
      title: "ลบกฎตารางเวลา",
      description: "ลบกฎนี้?",
      confirmLabel: "ลบ",
      variant: "destructive",
    });
    if (!ok) return;
    try {
      await adminFetch(`/api/admin/honey/missions/schedule/${id}`, {
        method: "DELETE",
      });
      setRules((prev) => prev.filter((r) => r.id !== id));
      toast.success("ลบกฎแล้ว");
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "ลบไม่สำเร็จ");
    }
  };

  const columns: Column<ScheduleRule>[] = [
    {
      key: "template",
      header: "เทมเพลต",
      render: (r) => r.template?.name ?? `#${r.templateId}`,
    },
    {
      key: "slotType",
      header: "ประเภทช่อง",
      render: (r) => (
        <Badge variant="secondary">
          {SLOT_TYPE_LABELS[r.slotType] ?? r.slotType}
        </Badge>
      ),
    },
    {
      key: "config",
      header: "การตั้งค่า",
      className: "text-meta",
      render: (r) => (
        <>
          {r.slotType === "DAY_OF_WEEK" &&
            r.dayOfWeek != null &&
            DAY_NAMES[r.dayOfWeek]}
          {r.slotType === "FIXED_DATE" &&
            r.specificDates &&
            (r.specificDates as string[]).join(", ")}
          {r.slotType === "RANDOM_POOL" &&
            `pool: ${r.poolGroup ?? "default"} (เลือก ${r.poolPickCount ?? 1})`}
          {r.slotType === "SEQUENTIAL" &&
            `pool: ${r.poolGroup ?? "default"}`}
          {r.slotType === "CORE" && "ตลอดเวลา"}
        </>
      ),
    },
    {
      key: "dateRange",
      header: "ช่วงเวลา",
      className: "text-meta",
      render: (r) =>
        r.startDate || r.endDate
          ? `${r.startDate?.slice(0, 10) ?? "∞"} → ${r.endDate?.slice(0, 10) ?? "∞"}`
          : "ตลอดเวลา",
    },
    {
      key: "status",
      header: "สถานะ",
      headerClassName: "text-center",
      className: "text-center",
      render: (r) =>
        r.isActive ? (
          <ToggleRight className="mx-auto h-5 w-5 text-success" />
        ) : (
          <ToggleLeft className="mx-auto h-5 w-5 text-muted-foreground" />
        ),
    },
    {
      key: "actions",
      header: "จัดการ",
      headerClassName: "text-right",
      className: "text-right",
      render: (r) => (
        <div className="flex justify-end gap-1">
          <Button
            render={
              <Link href={`/admin/honey/missions/schedule/${r.id}`} />
            }
            variant="ghost"
            size="icon-xs"
          >
            <Pencil className="h-3.5 w-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="icon-xs"
            onClick={() => void handleDelete(r.id)}
            className="text-destructive hover:text-destructive"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <AdminPage
      header={
        <AdminPageHeader
          title="กฎตารางเวลา"
          icon={Calendar}
          description="กำหนดว่าวันไหนจะมีเทมเพลตใดให้ผู้เล่น"
          meta={<span className="text-meta">{rules.length} กฎ</span>}
          actions={
            <Button render={<Link href="/admin/honey/missions/schedule/new" />} size="sm">
              <Plus className="h-4 w-4" /> เพิ่มกฎ
            </Button>
          }
        />
      }
    >
      {rules.length === 0 ? (
        <AdminEmptyState
          icon={Calendar}
          title="ยังไม่มีกฎตารางเวลา"
          description="สร้างกฎตารางเวลาเพื่อจัดเทมเพลตให้กับวันที่ต้องการ"
          action={
            <Button render={<Link href="/admin/honey/missions/schedule/new" />} size="sm">
              <Plus className="h-4 w-4" /> เพิ่มกฎ
            </Button>
          }
        />
      ) : (
        <AdminDataTable columns={columns} data={rules} rowKey={(r) => r.id} />
      )}
    </AdminPage>
  );
}
