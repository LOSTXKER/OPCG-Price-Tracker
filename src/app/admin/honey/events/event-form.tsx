"use client";

import { useRouter } from "next/navigation";
import { ArrowLeft, CalendarDays } from "lucide-react";

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
import { useAdminForm } from "@/lib/admin/use-admin-form";

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

  const isEdit = initial?.id != null;
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

  const { form, setForm, error, saving, saveBarActive, handleSubmit, submitFromBar } =
    useAdminForm<EventData>({
      initialState,
      isEdit,
      formId: FORM_ID,
      validate: (f) =>
        !f.name || !f.startDate || !f.endDate
          ? "กรุณากรอกชื่อ วันเริ่ม และวันสิ้นสุด"
          : null,
      toBody: (f, edit) =>
        edit
          ? {
              id: initial!.id,
              name: f.name,
              nameEn: f.nameEn || null,
              nameTh: f.name,
              description: f.description || null,
              startDate: f.startDate,
              endDate: f.endDate,
              honeyMultiplier: f.honeyMultiplier,
              isActive: f.isActive,
            }
          : {
              name: f.name,
              nameEn: f.nameEn || undefined,
              nameTh: f.name,
              description: f.description || undefined,
              startDate: f.startDate,
              endDate: f.endDate,
              honeyMultiplier: f.honeyMultiplier,
            },
      createEndpoint: "/api/admin/honey/events",
      editEndpoint: "/api/admin/honey/events",
      successMessage: { create: "สร้างอีเวนต์แล้ว", edit: "อัปเดตอีเวนต์แล้ว" },
      redirectTo: "/admin/honey/events",
    });

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
          dirty={saveBarActive}
          saving={saving}
          onSave={submitFromBar}
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
