"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  Gift,
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

import { BONUS_REQ_LABELS, type BonusRule } from "../types";

export function BonusList({ initialRules }: { initialRules: BonusRule[] }) {
  const router = useRouter();
  const confirmDialog = useConfirm();
  const [rules, setRules] = useState(initialRules);

  const toggleActive = async (r: BonusRule) => {
    try {
      await adminFetch(`/api/admin/honey/missions/bonus/${r.id}`, {
        method: "PUT",
        body: { isActive: !r.isActive },
      });
      setRules((prev) =>
        prev.map((x) => (x.id === r.id ? { ...x, isActive: !x.isActive } : x)),
      );
      toast.success(r.isActive ? "ปิดใช้งานแล้ว" : "เปิดใช้งานแล้ว");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "อัปเดตไม่สำเร็จ");
    }
  };

  const handleDelete = async (id: number) => {
    const ok = await confirmDialog({
      title: "ลบกฎโบนัส",
      description: "ลบกฎนี้?",
      confirmLabel: "ลบ",
      variant: "destructive",
    });
    if (!ok) return;
    try {
      await adminFetch(`/api/admin/honey/missions/bonus/${id}`, {
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
          title="กฎโบนัส"
          icon={Gift}
          description="โบนัสเพิ่มเติมเมื่อทำภารกิจครบเงื่อนไข"
          meta={<span className="text-meta">{rules.length} กฎ</span>}
          actions={
            <Button render={<Link href="/admin/honey/missions/bonus/new" />} size="sm">
              <Plus className="h-4 w-4" /> เพิ่มกฎ
            </Button>
          }
        />
      }
    >
      {rules.length === 0 ? (
        <AdminEmptyState
          icon={Gift}
          title="ยังไม่มีกฎโบนัส"
          description="สร้างกฎโบนัสแรกเพื่อรางวัลพิเศษ"
          action={
            <Button render={<Link href="/admin/honey/missions/bonus/new" />} size="sm">
              <Plus className="h-4 w-4" /> เพิ่มกฎ
            </Button>
          }
        />
      ) : (
        <div className="overflow-x-auto rounded-xl border border-[var(--p-hair)]">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[var(--p-hair)] bg-muted/30">
                <th className="px-4 py-2.5 text-left text-eyebrow">ชื่อ</th>
                <th className="px-4 py-2.5 text-left text-eyebrow">หมวดหมู่</th>
                <th className="px-4 py-2.5 text-left text-eyebrow">เงื่อนไข</th>
                <th className="px-4 py-2.5 text-right text-eyebrow">รางวัล</th>
                <th className="px-4 py-2.5 text-center text-eyebrow">สถานะ</th>
                <th className="px-4 py-2.5 text-right text-eyebrow">จัดการ</th>
              </tr>
            </thead>
            <tbody>
              {rules.map((r) => (
                <tr
                  key={r.id}
                  className="border-b border-[var(--p-hair)] motion-base hover:bg-muted/70"
                >
                  <td className="px-4 py-3">{r.nameTh ?? r.name}</td>
                  <td className="px-4 py-3">
                    <Badge variant="secondary">{r.category}</Badge>
                  </td>
                  <td className="px-4 py-3 text-meta">
                    {BONUS_REQ_LABELS[r.requirement] ?? r.requirement}
                    {r.requirementValue ? ` (${r.requirementValue})` : ""}
                  </td>
                  <td className="px-4 py-3 text-right font-bold tabular-nums text-warning">
                    {(r.rewards as Record<string, number>).honey ?? 0} honey
                  </td>
                  <td className="px-4 py-3 text-center">
                    <button
                      onClick={() => toggleActive(r)}
                      title={r.isActive ? "เปิดใช้งาน" : "ปิดใช้งาน"}
                    >
                      {r.isActive ? (
                        <ToggleRight className="mx-auto h-5 w-5 text-success" />
                      ) : (
                        <ToggleLeft className="mx-auto h-5 w-5 text-muted-foreground" />
                      )}
                    </button>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex justify-end gap-1">
                      <Button
                        render={<Link href={`/admin/honey/missions/bonus/${r.id}`} />}
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
