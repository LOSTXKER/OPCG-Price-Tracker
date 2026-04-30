"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { ArrowLeft, Calendar } from "lucide-react";
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
import { AdminNativeSelect } from "@/components/admin/admin-native-select";
import { adminFetch } from "@/lib/admin/admin-fetch";

import {
  DAY_NAMES,
  SLOT_TYPES,
  SLOT_TYPE_LABELS,
  type ScheduleRule,
  type Template,
} from "../types";

type FormData = {
  templateId: string;
  slotType: string;
  dayOfWeek: string;
  specificDates: string;
  poolGroup: string;
  poolPickCount: string;
  startDate: string;
  endDate: string;
  sortOrder: string;
  isActive: boolean;
};

const FORM_ID = "admin-mission-schedule-form";

const emptyForm: FormData = {
  templateId: "",
  slotType: "CORE",
  dayOfWeek: "0",
  specificDates: "",
  poolGroup: "",
  poolPickCount: "1",
  startDate: "",
  endDate: "",
  sortOrder: "0",
  isActive: true,
};

function ruleToForm(r: ScheduleRule): FormData {
  return {
    templateId: String(r.templateId),
    slotType: r.slotType,
    dayOfWeek: String(r.dayOfWeek ?? 0),
    specificDates: (r.specificDates ?? []).join(", "),
    poolGroup: r.poolGroup ?? "",
    poolPickCount: String(r.poolPickCount ?? 1),
    startDate: r.startDate?.slice(0, 10) ?? "",
    endDate: r.endDate?.slice(0, 10) ?? "",
    sortOrder: String(r.sortOrder),
    isActive: r.isActive,
  };
}

export function ScheduleForm({
  initial,
  templates,
}: {
  initial?: ScheduleRule;
  templates: Template[];
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const initialState: FormData = initial ? ruleToForm(initial) : emptyForm;

  const [form, setForm] = useState<FormData>(initialState);
  const [error, setError] = useState("");

  const isEdit = initial?.id != null;
  const dirty = JSON.stringify(form) !== JSON.stringify(initialState);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!form.templateId) {
      setError("กรุณาเลือกเทมเพลต");
      return;
    }

    const body = {
      templateId: Number(form.templateId),
      slotType: form.slotType,
      dayOfWeek:
        form.slotType === "DAY_OF_WEEK" ? Number(form.dayOfWeek) : null,
      specificDates:
        form.slotType === "FIXED_DATE"
          ? form.specificDates
              .split(",")
              .map((s) => s.trim())
              .filter(Boolean)
          : null,
      poolGroup: ["RANDOM_POOL", "SEQUENTIAL"].includes(form.slotType)
        ? form.poolGroup || null
        : null,
      poolPickCount:
        form.slotType === "RANDOM_POOL" ? Number(form.poolPickCount) : null,
      startDate: form.startDate || null,
      endDate: form.endDate || null,
      sortOrder: Number(form.sortOrder),
      isActive: form.isActive,
    };

    startTransition(async () => {
      try {
        if (isEdit) {
          await adminFetch(
            `/api/admin/honey/missions/schedule/${initial!.id}`,
            { method: "PUT", body },
          );
          toast.success("อัปเดตกฎแล้ว");
        } else {
          await adminFetch("/api/admin/honey/missions/schedule", {
            method: "POST",
            body,
          });
          toast.success("สร้างกฎแล้ว");
        }
        router.push("/admin/honey/missions/schedule");
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
          title={isEdit ? "แก้ไขกฎตารางเวลา" : "สร้างกฎตารางเวลา"}
          icon={Calendar}
          description="กำหนดว่าวันไหนจะใช้เทมเพลตใด"
          actions={
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => router.push("/admin/honey/missions/schedule")}
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

        <AdminPanel title="ข้อมูลกฎ">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <AdminFormField label="เทมเพลต" required className="sm:col-span-2">
              <AdminNativeSelect
                value={form.templateId}
                onChange={(e) =>
                  setForm({ ...form, templateId: e.target.value })
                }
              >
                <option value="">-- เลือก --</option>
                {templates
                  .filter((t) => t.isActive)
                  .map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.nameTh ?? t.name}
                    </option>
                  ))}
              </AdminNativeSelect>
            </AdminFormField>
            <AdminFormField label="ประเภทช่อง">
              <AdminNativeSelect
                value={form.slotType}
                onChange={(e) => setForm({ ...form, slotType: e.target.value })}
              >
                {SLOT_TYPES.map((s) => (
                  <option key={s} value={s}>
                    {SLOT_TYPE_LABELS[s]}
                  </option>
                ))}
              </AdminNativeSelect>
            </AdminFormField>

            {form.slotType === "DAY_OF_WEEK" && (
              <AdminFormField label="วันในสัปดาห์">
                <AdminNativeSelect
                  value={form.dayOfWeek}
                  onChange={(e) =>
                    setForm({ ...form, dayOfWeek: e.target.value })
                  }
                >
                  {DAY_NAMES.map((d, i) => (
                    <option key={i} value={i}>
                      {d}
                    </option>
                  ))}
                </AdminNativeSelect>
              </AdminFormField>
            )}
            {form.slotType === "FIXED_DATE" && (
              <AdminFormField label="วันที่ (คั่นด้วยจุลภาค)" className="sm:col-span-2">
                <Input
                  value={form.specificDates}
                  onChange={(e) =>
                    setForm({ ...form, specificDates: e.target.value })
                  }
                  placeholder="2026-04-26, 2026-05-01"
                />
              </AdminFormField>
            )}
            {["RANDOM_POOL", "SEQUENTIAL"].includes(form.slotType) && (
              <AdminFormField label="กลุ่ม Pool">
                <Input
                  value={form.poolGroup}
                  onChange={(e) =>
                    setForm({ ...form, poolGroup: e.target.value })
                  }
                  placeholder="bonus_pool"
                />
              </AdminFormField>
            )}
            {form.slotType === "RANDOM_POOL" && (
              <AdminFormField label="จำนวนที่เลือก">
                <Input
                  type="number"
                  value={form.poolPickCount}
                  onChange={(e) =>
                    setForm({ ...form, poolPickCount: e.target.value })
                  }
                />
              </AdminFormField>
            )}

            <AdminFormField label="วันเริ่ม">
              <Input
                type="date"
                value={form.startDate}
                onChange={(e) =>
                  setForm({ ...form, startDate: e.target.value })
                }
              />
            </AdminFormField>
            <AdminFormField label="วันสิ้นสุด">
              <Input
                type="date"
                value={form.endDate}
                onChange={(e) => setForm({ ...form, endDate: e.target.value })}
              />
            </AdminFormField>
            <AdminFormField label="ลำดับ">
              <Input
                type="number"
                value={form.sortOrder}
                onChange={(e) =>
                  setForm({ ...form, sortOrder: e.target.value })
                }
              />
            </AdminFormField>
            <AdminCheckboxField
              span={3}
              label="เปิดใช้งาน"
              checked={form.isActive}
              onChange={(e) =>
                setForm({
                  ...form,
                  isActive: (e.target as HTMLInputElement).checked,
                })
              }
            />
          </div>
        </AdminPanel>
      </form>
    </AdminPage>
  );
}
