"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { ArrowLeft, Target } from "lucide-react";
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
import { ImageUploader } from "@/components/admin/image-uploader";
import { adminFetch } from "@/lib/admin/admin-fetch";

import {
  CATEGORIES,
  CATEGORY_LABELS,
  CONDITION_TYPES,
  TRACK_TYPES,
  TRACK_TYPE_LABELS,
  type Template,
} from "../types";

type FormData = {
  code: string;
  name: string;
  nameEn: string;
  description: string;
  icon: string;
  category: string;
  trackType: string;
  conditionType: string;
  conditionPaths: string;
  conditionAction: string;
  conditionPathPattern: string;
  rewardHoney: string;
  rewardTickets: string;
  rewardImageUrl: string;
  target: string;
  isActive: boolean;
  sortOrder: string;
};

const FORM_ID = "admin-mission-template-form";

const emptyForm: FormData = {
  code: "",
  name: "",
  nameEn: "",
  description: "",
  icon: "Circle",
  category: "DAILY",
  trackType: "AUTO_PATH",
  conditionType: "visit_path",
  conditionPaths: "",
  conditionAction: "share",
  conditionPathPattern: "",
  rewardHoney: "10",
  rewardTickets: "0",
  rewardImageUrl: "",
  target: "1",
  isActive: true,
  sortOrder: "0",
};

function buildConditions(form: FormData) {
  switch (form.conditionType) {
    case "visit_path":
      return {
        type: "visit_path",
        paths: form.conditionPaths
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean),
      };
    case "action_count":
      return { type: "action_count", action: form.conditionAction };
    case "visit_unique":
      return { type: "visit_unique", pathPattern: form.conditionPathPattern };
    default:
      return { type: "manual_confirm" };
  }
}

function templateToForm(t: Template, opts?: { cloneCode?: boolean }): FormData {
  const cond = t.conditions as Record<string, unknown>;
  const condType = (cond.type as string) ?? "manual_confirm";
  const rewards = t.rewards as Record<string, unknown>;
  return {
    code: opts?.cloneCode ? `${t.code}_copy` : t.code,
    name: t.nameTh ?? t.name,
    nameEn: t.nameEn ?? "",
    description: t.description ?? "",
    icon: t.icon,
    category: t.category,
    trackType: t.trackType,
    conditionType: condType,
    conditionPaths:
      condType === "visit_path"
        ? ((cond.paths as string[]) ?? []).join(", ")
        : "",
    conditionAction:
      condType === "action_count" ? ((cond.action as string) ?? "share") : "share",
    conditionPathPattern:
      condType === "visit_unique" ? ((cond.pathPattern as string) ?? "") : "",
    rewardHoney: String((rewards.honey as number | undefined) ?? 0),
    rewardTickets: String((rewards.tickets as number | undefined) ?? 0),
    rewardImageUrl: (rewards.imageUrl as string | undefined) ?? "",
    target: String(t.target),
    isActive: t.isActive,
    sortOrder: String(t.sortOrder),
  };
}

export function TemplateForm({
  initial,
  cloneFrom,
}: {
  initial?: Template;
  cloneFrom?: Template;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const initialState: FormData = initial
    ? templateToForm(initial)
    : cloneFrom
      ? templateToForm(cloneFrom, { cloneCode: true })
      : emptyForm;

  const [form, setForm] = useState<FormData>(initialState);
  const [error, setError] = useState("");

  const isEdit = initial?.id != null;
  const dirty = JSON.stringify(form) !== JSON.stringify(initialState);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!form.code || !form.name) {
      setError("กรุณากรอกโค้ดและชื่อ");
      return;
    }

    const body = {
      code: form.code,
      name: form.name,
      nameEn: form.nameEn || null,
      nameTh: form.name,
      description: form.description || null,
      icon: form.icon,
      category: form.category,
      trackType: form.trackType,
      conditions: buildConditions(form),
      rewards: {
        honey: Number(form.rewardHoney),
        tickets: Number(form.rewardTickets),
        imageUrl: form.rewardImageUrl || null,
      },
      target: Number(form.target),
      isActive: form.isActive,
      sortOrder: Number(form.sortOrder),
    };

    startTransition(async () => {
      try {
        if (isEdit) {
          await adminFetch(
            `/api/admin/honey/missions/templates/${initial!.id}`,
            { method: "PUT", body },
          );
          toast.success("อัปเดตเทมเพลตแล้ว");
        } else {
          await adminFetch("/api/admin/honey/missions/templates", {
            method: "POST",
            body,
          });
          toast.success("สร้างเทมเพลตแล้ว");
        }
        router.push("/admin/honey/missions/templates");
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
          title={
            isEdit
              ? `แก้ไขเทมเพลต: ${initial?.name ?? ""}`
              : cloneFrom
                ? `คัดลอกจาก: ${cloneFrom.name}`
                : "สร้างเทมเพลตภารกิจ"
          }
          icon={Target}
          description="เทมเพลตที่กำหนดเงื่อนไข เป้าหมาย และรางวัลของภารกิจ"
          actions={
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => router.push("/admin/honey/missions/templates")}
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
      <form id={FORM_ID} onSubmit={handleSubmit} className="mx-auto max-w-4xl space-y-6">
        {error && (
          <div className="status-danger rounded-lg px-4 py-3 text-sm">{error}</div>
        )}

        <AdminPanel title="ข้อมูลพื้นฐาน">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <AdminFormField label="โค้ด (ไม่ซ้ำ)" required>
              <Input
                required
                value={form.code}
                onChange={(e) => setForm({ ...form, code: e.target.value })}
                placeholder="check_price"
              />
            </AdminFormField>
            <AdminFormField label="ชื่อ (ไทย)" required>
              <Input
                required
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            </AdminFormField>
            <AdminFormField label="ชื่อ (EN)">
              <Input
                value={form.nameEn}
                onChange={(e) => setForm({ ...form, nameEn: e.target.value })}
              />
            </AdminFormField>
            <AdminFormField label="คำอธิบาย" className="sm:col-span-2">
              <Input
                value={form.description}
                onChange={(e) =>
                  setForm({ ...form, description: e.target.value })
                }
              />
            </AdminFormField>
            <AdminFormField label="ไอคอน (Lucide)">
              <Input
                value={form.icon}
                onChange={(e) => setForm({ ...form, icon: e.target.value })}
                placeholder="Search"
              />
            </AdminFormField>
            <AdminFormField label="หมวดหมู่">
              <AdminNativeSelect
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
              >
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {CATEGORY_LABELS[c]}
                  </option>
                ))}
              </AdminNativeSelect>
            </AdminFormField>
            <AdminFormField label="ประเภทการติดตาม">
              <AdminNativeSelect
                value={form.trackType}
                onChange={(e) => setForm({ ...form, trackType: e.target.value })}
              >
                {TRACK_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {TRACK_TYPE_LABELS[t]}
                  </option>
                ))}
              </AdminNativeSelect>
            </AdminFormField>
            <AdminFormField label="เป้าหมาย">
              <Input
                type="number"
                value={form.target}
                onChange={(e) => setForm({ ...form, target: e.target.value })}
              />
            </AdminFormField>
          </div>
        </AdminPanel>

        <AdminPanel title="เงื่อนไข">
          <div className="grid gap-4 sm:grid-cols-2">
            <AdminFormField label="ประเภทเงื่อนไข">
              <AdminNativeSelect
                value={form.conditionType}
                onChange={(e) =>
                  setForm({ ...form, conditionType: e.target.value })
                }
              >
                {CONDITION_TYPES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </AdminNativeSelect>
            </AdminFormField>
            {form.conditionType === "visit_path" && (
              <AdminFormField label="เส้นทาง (คั่นด้วยจุลภาค)">
                <Input
                  value={form.conditionPaths}
                  onChange={(e) =>
                    setForm({ ...form, conditionPaths: e.target.value })
                  }
                  placeholder="/cards/*, /trending"
                />
              </AdminFormField>
            )}
            {form.conditionType === "action_count" && (
              <AdminFormField label="แอ็กชัน">
                <AdminNativeSelect
                  value={form.conditionAction}
                  onChange={(e) =>
                    setForm({ ...form, conditionAction: e.target.value })
                  }
                >
                  {[
                    "share",
                    "list_item",
                    "add_portfolio",
                    "review",
                    "predict",
                    "checkin",
                    "trade",
                  ].map((a) => (
                    <option key={a} value={a}>
                      {a}
                    </option>
                  ))}
                </AdminNativeSelect>
              </AdminFormField>
            )}
            {form.conditionType === "visit_unique" && (
              <AdminFormField label="รูปแบบเส้นทาง">
                <Input
                  value={form.conditionPathPattern}
                  onChange={(e) =>
                    setForm({ ...form, conditionPathPattern: e.target.value })
                  }
                  placeholder="/sets/{id}"
                />
              </AdminFormField>
            )}
          </div>
        </AdminPanel>

        <AdminPanel title="รางวัล">
          <div className="grid gap-4 sm:grid-cols-[140px_1fr]">
            <AdminFormField label="รูปรางวัล (ไม่บังคับ)">
              <ImageUploader
                value={form.rewardImageUrl}
                onChange={(url) => setForm({ ...form, rewardImageUrl: url })}
                folder="missions"
                height="h-28"
              />
            </AdminFormField>
            <div className="grid gap-4 sm:grid-cols-3">
              <AdminFormField label="Honey">
                <Input
                  type="number"
                  value={form.rewardHoney}
                  onChange={(e) =>
                    setForm({ ...form, rewardHoney: e.target.value })
                  }
                />
              </AdminFormField>
              <AdminFormField label="ตั๋ว Raffle">
                <Input
                  type="number"
                  value={form.rewardTickets}
                  onChange={(e) =>
                    setForm({ ...form, rewardTickets: e.target.value })
                  }
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
          </div>
        </AdminPanel>
      </form>
    </AdminPage>
  );
}
