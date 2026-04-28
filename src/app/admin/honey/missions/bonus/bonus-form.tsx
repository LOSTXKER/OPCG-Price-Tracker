"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { ArrowLeft, Gift } from "lucide-react";
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
  BONUS_REQUIREMENTS,
  BONUS_REQ_LABELS,
  CATEGORIES,
  CATEGORY_LABELS,
  type BonusRule,
} from "../types";

type FormData = {
  name: string;
  nameEn: string;
  category: string;
  requirement: string;
  requirementValue: string;
  rewardHoney: string;
  rewardTickets: string;
  sortOrder: string;
  isActive: boolean;
};

const FORM_ID = "admin-mission-bonus-form";

const emptyForm: FormData = {
  name: "",
  nameEn: "",
  category: "DAILY",
  requirement: "ALL_COMPLETE",
  requirementValue: "1",
  rewardHoney: "20",
  rewardTickets: "0",
  sortOrder: "0",
  isActive: true,
};

function ruleToForm(r: BonusRule): FormData {
  const rewards = r.rewards as Record<string, unknown>;
  return {
    name: r.nameTh ?? r.name,
    nameEn: r.nameEn ?? "",
    category: r.category,
    requirement: r.requirement,
    requirementValue: String(r.requirementValue),
    rewardHoney: String((rewards.honey as number | undefined) ?? 0),
    rewardTickets: String((rewards.tickets as number | undefined) ?? 0),
    sortOrder: String(r.sortOrder),
    isActive: r.isActive,
  };
}

export function BonusForm({ initial }: { initial?: BonusRule }) {
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

    if (!form.name) {
      setError("กรุณากรอกชื่อ");
      return;
    }

    const body = {
      name: form.name,
      nameEn: form.nameEn || null,
      nameTh: form.name,
      category: form.category,
      requirement: form.requirement,
      requirementValue: Number(form.requirementValue),
      rewards: {
        honey: Number(form.rewardHoney),
        tickets: Number(form.rewardTickets),
      },
      sortOrder: Number(form.sortOrder),
      isActive: form.isActive,
    };

    startTransition(async () => {
      try {
        if (isEdit) {
          await adminFetch(`/api/admin/honey/missions/bonus/${initial!.id}`, {
            method: "PUT",
            body,
          });
          toast.success("อัปเดตกฎโบนัสแล้ว");
        } else {
          await adminFetch("/api/admin/honey/missions/bonus", {
            method: "POST",
            body,
          });
          toast.success("สร้างกฎโบนัสแล้ว");
        }
        router.push("/admin/honey/missions/bonus");
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
          title={isEdit ? `แก้ไขกฎโบนัส: ${initial?.name ?? ""}` : "สร้างกฎโบนัส"}
          icon={Gift}
          description="โบนัสเพิ่มเติมเมื่อทำภารกิจครบเงื่อนไข"
          actions={
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => router.push("/admin/honey/missions/bonus")}
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

        <AdminPanel title="ข้อมูล">
          <div className="grid gap-4 sm:grid-cols-2">
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
          </div>
        </AdminPanel>

        <AdminPanel title="เงื่อนไข">
          <div className="grid gap-4 sm:grid-cols-2">
            <AdminFormField label="ประเภทเงื่อนไข">
              <AdminNativeSelect
                value={form.requirement}
                onChange={(e) =>
                  setForm({ ...form, requirement: e.target.value })
                }
              >
                {BONUS_REQUIREMENTS.map((r) => (
                  <option key={r} value={r}>
                    {BONUS_REQ_LABELS[r]}
                  </option>
                ))}
              </AdminNativeSelect>
            </AdminFormField>
            <AdminFormField label="ค่า">
              <Input
                type="number"
                value={form.requirementValue}
                onChange={(e) =>
                  setForm({ ...form, requirementValue: e.target.value })
                }
              />
            </AdminFormField>
          </div>
        </AdminPanel>

        <AdminPanel title="รางวัล">
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
        </AdminPanel>
      </form>
    </AdminPage>
  );
}
