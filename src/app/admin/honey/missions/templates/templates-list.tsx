"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  Copy,
  Pencil,
  Plus,
  Target,
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

import { TRACK_TYPE_LABELS, type Template } from "../types";

export function TemplatesList({ initialTemplates }: { initialTemplates: Template[] }) {
  const router = useRouter();
  const confirmDialog = useConfirm();
  const [templates, setTemplates] = useState(initialTemplates);

  const toggleActive = async (t: Template) => {
    try {
      await adminFetch(`/api/admin/honey/missions/templates/${t.id}`, {
        method: "PUT",
        body: { isActive: !t.isActive },
      });
      setTemplates((prev) =>
        prev.map((x) => (x.id === t.id ? { ...x, isActive: !x.isActive } : x)),
      );
      toast.success(t.isActive ? "ปิดใช้งานแล้ว" : "เปิดใช้งานแล้ว");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "อัปเดตไม่สำเร็จ");
    }
  };

  const handleDelete = async (t: Template) => {
    const ok = await confirmDialog({
      title: "ลบเทมเพลต",
      description: "ลบเทมเพลตนี้และกฎตารางเวลาที่เกี่ยวข้องทั้งหมด?",
      confirmLabel: "ลบ",
      variant: "destructive",
    });
    if (!ok) return;
    try {
      await adminFetch(`/api/admin/honey/missions/templates/${t.id}`, {
        method: "DELETE",
      });
      setTemplates((prev) => prev.filter((x) => x.id !== t.id));
      toast.success("ลบเทมเพลตแล้ว");
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "ลบไม่สำเร็จ");
    }
  };

  const columns: Column<Template>[] = [
    {
      key: "name",
      header: "ชื่อ",
      render: (t) => t.nameTh ?? t.name,
    },
    {
      key: "category",
      header: "หมวดหมู่",
      render: (t) => <Badge variant="secondary">{t.category}</Badge>,
    },
    {
      key: "trackType",
      header: "ประเภท",
      className: "text-meta",
      render: (t) => TRACK_TYPE_LABELS[t.trackType],
    },
    {
      key: "reward",
      header: "รางวัล",
      headerClassName: "text-right",
      render: (t) => {
        const imageUrl = (t.rewards as Record<string, unknown>).imageUrl as
          | string
          | undefined;
        const honey = (t.rewards as Record<string, number>).honey ?? 0;
        return (
          <div className="flex items-center justify-end gap-2">
            {imageUrl && (
              <img
                src={imageUrl}
                alt=""
                className="size-7 rounded object-cover"
              />
            )}
            <span className="font-bold tabular-nums text-warning">{honey}</span>
          </div>
        );
      },
    },
    {
      key: "rules",
      header: "กฎ",
      headerClassName: "text-center",
      className: "text-center text-muted-foreground",
      render: (t) => t.scheduleRules.length,
    },
    {
      key: "status",
      header: "สถานะ",
      headerClassName: "text-center",
      className: "text-center",
      render: (t) => (
        <button
          onClick={() => toggleActive(t)}
          title={t.isActive ? "เปิดใช้งาน" : "ปิดใช้งาน"}
        >
          {t.isActive ? (
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
      render: (t) => (
        <div className="flex justify-end gap-1">
          <Button
            render={
              <Link href={`/admin/honey/missions/templates/new?clone=${t.id}`} />
            }
            variant="ghost"
            size="icon-xs"
            title="คัดลอก"
          >
            <Copy className="h-3.5 w-3.5" />
          </Button>
          <Button
            render={<Link href={`/admin/honey/missions/templates/${t.id}`} />}
            variant="ghost"
            size="icon-xs"
          >
            <Pencil className="h-3.5 w-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="icon-xs"
            onClick={() => void handleDelete(t)}
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
          title="เทมเพลตภารกิจ"
          icon={Target}
          description="เทมเพลตที่ใช้สร้างภารกิจรายวัน/รายเดือน — กฎตารางเวลาเลือกใช้เทมเพลตเหล่านี้"
          meta={<span className="text-meta">{templates.length} เทมเพลต</span>}
          actions={
            <Button render={<Link href="/admin/honey/missions/templates/new" />} size="sm">
              <Plus className="h-4 w-4" /> เพิ่มเทมเพลต
            </Button>
          }
        />
      }
    >
      {templates.length === 0 ? (
        <AdminEmptyState
          icon={Target}
          title="ยังไม่มีเทมเพลตภารกิจ"
          description="สร้างเทมเพลตภารกิจแรกของคุณ"
          action={
            <Button render={<Link href="/admin/honey/missions/templates/new" />} size="sm">
              <Plus className="h-4 w-4" /> เพิ่มเทมเพลต
            </Button>
          }
        />
      ) : (
        <AdminDataTable columns={columns} data={templates} rowKey={(t) => t.id} />
      )}
    </AdminPage>
  );
}
