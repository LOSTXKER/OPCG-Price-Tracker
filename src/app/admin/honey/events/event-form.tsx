"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { ArrowLeft, CalendarDays } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AdminPage } from "@/components/admin/admin-page";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { AdminPanel } from "@/components/admin/admin-panel";
import { AdminSaveBar } from "@/components/admin/admin-save-bar";
import {
  AdminCheckboxField,
  AdminFormField,
} from "@/components/admin/admin-form-field";
import { adminFetch } from "@/lib/admin/admin-fetch";

type EventData = {
  id?: number;
  name: string;
  nameEn: string;
  description: string;
  startDate: string;
  endDate: string;
  honeyMultiplier: number;
  isActive: boolean;
};

const FORM_ID = "admin-event-form";

function toLocalInput(iso: string | undefined): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function EventForm({
  initial,
}: {
  initial?: {
    id: number;
    name: string;
    nameEn: string | null;
    nameTh: string | null;
    description: string | null;
    startDate: string;
    endDate: string;
    honeyMultiplier: number;
    isActive: boolean;
  };
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const initialState: EventData = initial
    ? {
        id: initial.id,
        name: initial.nameTh ?? initial.name,
        nameEn: initial.nameEn ?? "",
        description: initial.description ?? "",
        startDate: toLocalInput(initial.startDate),
        endDate: toLocalInput(initial.endDate),
        honeyMultiplier: initial.honeyMultiplier,
        isActive: initial.isActive,
      }
    : {
        name: "",
        nameEn: "",
        description: "",
        startDate: "",
        endDate: "",
        honeyMultiplier: 2,
        isActive: true,
      };

  const [form, setForm] = useState<EventData>(initialState);
  const [error, setError] = useState("");

  const isEdit = initial?.id != null;
  const dirty = JSON.stringify(form) !== JSON.stringify(initialState);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!form.name || !form.startDate || !form.endDate) {
      setError("กรุณากรอกชื่อ วันเริ่ม และวันสิ้นสุด");
      return;
    }

    startTransition(async () => {
      try {
        if (isEdit) {
          await adminFetch("/api/admin/honey/events", {
            method: "PATCH",
            body: {
              id: initial!.id,
              name: form.name,
              nameEn: form.nameEn || null,
              nameTh: form.name,
              description: form.description || null,
              startDate: form.startDate,
              endDate: form.endDate,
              honeyMultiplier: form.honeyMultiplier,
              isActive: form.isActive,
            },
          });
          toast.success("อัปเดตอีเวนต์แล้ว");
        } else {
          await adminFetch("/api/admin/honey/events", {
            method: "POST",
            body: {
              name: form.name,
              nameEn: form.nameEn || undefined,
              nameTh: form.name,
              description: form.description || undefined,
              startDate: form.startDate,
              endDate: form.endDate,
              honeyMultiplier: form.honeyMultiplier,
            },
          });
          toast.success("สร้างอีเวนต์แล้ว");
        }
        router.push("/admin/honey/events");
        router.refresh();
      } catch (err) {
        const message = err instanceof Error ? err.message : "บันทึกไม่สำเร็จ";
        setError(message);
        toast.error(message);
      }
    });
  }

  return (
    <AdminPage
      header={
        <AdminPageHeader
          title={isEdit ? `แก้ไขอีเวนต์: ${initial?.name ?? ""}` : "สร้างอีเวนต์ใหม่"}
          description="ตั้งค่าระยะเวลาและตัวคูณ Honey ในช่วงอีเวนต์"
          icon={CalendarDays}
          actions={
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => router.push("/admin/honey/events")}
            >
              <ArrowLeft className="size-4" /> กลับ
            </Button>
          }
        />
      }
      footer={
        <AdminSaveBar
          dirty={dirty || !isEdit}
          saving={isPending}
          onSave={() => {
            const formEl = document.getElementById(FORM_ID) as HTMLFormElement | null;
            formEl?.requestSubmit();
          }}
          saveLabel={isEdit ? "อัปเดต" : "สร้าง"}
          description={error ? <span className="text-danger">{error}</span> : undefined}
        />
      }
    >
      <form id={FORM_ID} onSubmit={handleSubmit} className="mx-auto max-w-3xl space-y-6">
        {error && (
          <div className="status-danger rounded-lg px-4 py-3 text-sm">{error}</div>
        )}

        <AdminPanel title="ข้อมูลพื้นฐาน">
          <div className="grid gap-4 sm:grid-cols-2">
            <AdminFormField label="ชื่อ (ไทย)" required className="sm:col-span-2">
              <Input
                required
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                placeholder="โกลเด้นวีค"
              />
            </AdminFormField>
            <AdminFormField label="ชื่อ (EN)" className="sm:col-span-2">
              <Input
                value={form.nameEn}
                onChange={(e) => setForm((f) => ({ ...f, nameEn: e.target.value }))}
                placeholder="Golden Week"
              />
            </AdminFormField>
            <AdminFormField label="คำอธิบาย" className="sm:col-span-2">
              <Input
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                placeholder="ตัวคูณ Honey x2 ตลอดสัปดาห์"
              />
            </AdminFormField>
          </div>
        </AdminPanel>

        <AdminPanel title="ระยะเวลาและตัวคูณ">
          <div className="grid gap-4 sm:grid-cols-3">
            <AdminFormField label="วันเริ่ม" required>
              <Input
                type="datetime-local"
                required
                value={form.startDate}
                onChange={(e) => setForm((f) => ({ ...f, startDate: e.target.value }))}
              />
            </AdminFormField>
            <AdminFormField label="วันสิ้นสุด" required>
              <Input
                type="datetime-local"
                required
                value={form.endDate}
                onChange={(e) => setForm((f) => ({ ...f, endDate: e.target.value }))}
              />
            </AdminFormField>
            <AdminFormField label="ตัวคูณ Honey">
              <Input
                type="number"
                step="0.1"
                min="1"
                value={form.honeyMultiplier}
                onChange={(e) =>
                  setForm((f) => ({ ...f, honeyMultiplier: Number(e.target.value) }))
                }
              />
            </AdminFormField>
          </div>
          {isEdit && (
            <div className="mt-4">
              <AdminCheckboxField
                label="เปิดใช้งาน"
                checked={form.isActive}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    isActive: (e.target as HTMLInputElement).checked,
                  }))
                }
              />
            </div>
          )}
        </AdminPanel>
      </form>
    </AdminPage>
  );
}
