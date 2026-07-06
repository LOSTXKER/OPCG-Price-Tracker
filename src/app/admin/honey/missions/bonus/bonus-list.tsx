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
import { AdminDataTable, type Column } from "@/components/admin/admin-data-table";
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

  const columns: Column<BonusRule>[] = [
    {
      key: "name",
      header: "ชื่อ",
      render: (r) => r.nameTh ?? r.name,
    },
    {
      key: "category",
      header: "หมวดหมู่",
      render: (r) => <Badge variant="secondary">{r.category}</Badge>,
    },
    {
      key: "requirement",
      header: "เงื่อนไข",
      className: "text-meta",
      render: (r) => (
        <>
          {BONUS_REQ_LABELS[r.requirement] ?? r.requirement}
          {r.requirementValue ? ` (${r.requirementValue})` : ""}
        </>
      ),
    },
    {
      key: "reward",
      header: "รางวัล",
      headerClassName: "text-right",
      className: "text-right font-bold tabular-nums text-warning",
      render: (r) => `${(r.rewards as Record<string, number>).honey ?? 0} honey`,
    },
    {
      key: "status",
      header: "สถานะ",
      headerClassName: "text-center",
      className: "text-center",
      render: (r) => (
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
      ),
    },
  ];

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
        <AdminDataTable columns={columns} data={rules} rowKey={(r) => r.id} />
      )}
    </AdminPage>
  );
}
