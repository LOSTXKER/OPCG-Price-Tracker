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
        <div className="overflow-x-auto rounded-xl border border-border/50">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border/50 bg-muted/30">
                <th className="px-4 py-2.5 text-left text-xs font-medium text-muted-foreground">เทมเพลต</th>
                <th className="px-4 py-2.5 text-left text-xs font-medium text-muted-foreground">ประเภทช่อง</th>
                <th className="px-4 py-2.5 text-left text-xs font-medium text-muted-foreground">การตั้งค่า</th>
                <th className="px-4 py-2.5 text-left text-xs font-medium text-muted-foreground">ช่วงเวลา</th>
                <th className="px-4 py-2.5 text-center text-xs font-medium text-muted-foreground">สถานะ</th>
                <th className="px-4 py-2.5 text-right text-xs font-medium text-muted-foreground">จัดการ</th>
              </tr>
            </thead>
            <tbody>
              {rules.map((r) => (
                <tr
                  key={r.id}
                  className="border-b border-border/20 transition-colors hover:bg-muted/20"
                >
                  <td className="px-4 py-3">
                    {r.template?.name ?? `#${r.templateId}`}
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant="secondary">
                      {SLOT_TYPE_LABELS[r.slotType] ?? r.slotType}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-meta">
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
                  </td>
                  <td className="px-4 py-3 text-meta">
                    {r.startDate || r.endDate
                      ? `${r.startDate?.slice(0, 10) ?? "∞"} → ${r.endDate?.slice(0, 10) ?? "∞"}`
                      : "ตลอดเวลา"}
                  </td>
                  <td className="px-4 py-3 text-center">
                    {r.isActive ? (
                      <ToggleRight className="mx-auto h-5 w-5 text-success" />
                    ) : (
                      <ToggleLeft className="mx-auto h-5 w-5 text-muted-foreground" />
                    )}
                  </td>
                  <td className="px-4 py-3 text-right">
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
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </AdminPage>
  );
}
