"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { ArrowLeft, Trophy } from "lucide-react";
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

// Keep in sync with `AchievementCriteriaSchema` in `src/lib/honey/schemas.ts`
const CRITERIA_OPTIONS: { value: string; label: string }[] = [
  { value: "portfolio_count", label: "จำนวนการ์ดในพอร์ต" },
  { value: "checkin_streak", label: "เช็คอินติดต่อกัน (วัน)" },
  { value: "first_sell", label: "ขายครั้งแรก (เป้าหมาย=1)" },
  { value: "trades_count", label: "จำนวนการขาย (มาร์เก็ตเพลส)" },
  { value: "first_review", label: "รีวิวครั้งแรก (เป้าหมาย=1)" },
  { value: "review_count", label: "จำนวนรีวิวที่เขียน" },
  { value: "correct_predictions", label: "ทายราคาถูกต้อง" },
  { value: "prediction_count", label: "จำนวนครั้งที่ทายราคา" },
  { value: "referral_count", label: "จำนวนเพื่อนที่แนะนำมา" },
  { value: "honey_lifetime", label: "Honey ที่ได้รับสะสม" },
  { value: "watchlist_count", label: "จำนวน Watchlist" },
  { value: "deck_count", label: "จำนวนเด็ค" },
  { value: "deck_share_count", label: "จำนวนเด็คที่แชร์สาธารณะ" },
  { value: "community_price_count", label: "จำนวนการส่งราคาชุมชน" },
  { value: "order_buy_count", label: "จำนวนการซื้อสำเร็จ" },
  { value: "perfect_day_count", label: "จำนวนวัน Perfect Day" },
  { value: "raffle_win_count", label: "จำนวนครั้งที่ชนะ Raffle" },
];

type AchievementInitial = {
  id: number;
  code: string;
  name: string;
  nameEn: string | null;
  nameTh: string | null;
  description: string | null;
  criteria: { type?: string; target?: number };
  honeyReward: number;
  badgeImageUrl: string | null;
  isActive: boolean;
};

type FormData = {
  code: string;
  name: string;
  nameEn: string;
  description: string;
  criteriaType: string;
  criteriaTarget: number;
  honeyReward: number;
  badgeImageUrl: string;
  isActive: boolean;
};

const FORM_ID = "admin-achievement-form";

export function AchievementForm({ initial }: { initial?: AchievementInitial }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const initialState: FormData = initial
    ? {
        code: initial.code,
        name: initial.nameTh ?? initial.name,
        nameEn: initial.nameEn ?? "",
        description: initial.description ?? "",
        criteriaType: initial.criteria.type ?? "portfolio_count",
        criteriaTarget: Number(initial.criteria.target ?? 100),
        honeyReward: initial.honeyReward,
        badgeImageUrl: initial.badgeImageUrl ?? "",
        isActive: initial.isActive,
      }
    : {
        code: "",
        name: "",
        nameEn: "",
        description: "",
        criteriaType: "portfolio_count",
        criteriaTarget: 100,
        honeyReward: 50,
        badgeImageUrl: "",
        isActive: true,
      };

  const [form, setForm] = useState<FormData>(initialState);
  const [error, setError] = useState("");

  const isEdit = initial?.id != null;
  const dirty = JSON.stringify(form) !== JSON.stringify(initialState);

  function validate(): string | null {
    if (!form.name) return "กรุณากรอกชื่อ";
    if (!isEdit && !form.code) return "กรุณากรอกโค้ด";
    return null;
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    const v = validate();
    if (v) {
      setError(v);
      return;
    }

    startTransition(async () => {
      try {
        const body = {
          code: form.code,
          name: form.name,
          nameEn: form.nameEn || null,
          nameTh: form.name,
          description: form.description || null,
          criteria: { type: form.criteriaType, target: form.criteriaTarget },
          honeyReward: form.honeyReward,
          badgeImageUrl: form.badgeImageUrl || null,
          isActive: form.isActive,
        };

        if (isEdit) {
          await adminFetch(`/api/admin/honey/achievements/${initial!.id}`, {
            method: "PATCH",
            body,
          });
          toast.success("อัปเดตความสำเร็จแล้ว");
        } else {
          await adminFetch("/api/admin/honey/achievements", {
            method: "POST",
            body,
          });
          toast.success("สร้างความสำเร็จแล้ว");
        }
        router.push("/admin/honey/achievements");
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
          title={isEdit ? `แก้ไขความสำเร็จ: ${initial?.name ?? ""}` : "สร้างความสำเร็จใหม่"}
          description="กำหนดเงื่อนไข รางวัล และรูปแบดจ์ของความสำเร็จ"
          icon={Trophy}
          actions={
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => router.push("/admin/honey/achievements")}
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

        <AdminPanel title="รูปแบดจ์">
          <AdminFormField label="รูปแบดจ์" hint="PNG/SVG วงกลม โชว์ในหน้าความสำเร็จของผู้ใช้">
            <ImageUploader
              value={form.badgeImageUrl}
              onChange={(url) => setForm((f) => ({ ...f, badgeImageUrl: url }))}
              folder="achievements"
              height="h-40"
            />
          </AdminFormField>
        </AdminPanel>

        <AdminPanel title="ข้อมูลพื้นฐาน">
          <div className="grid gap-4 sm:grid-cols-2">
            <AdminFormField label="โค้ด (ไม่ซ้ำ)" required>
              <Input
                required={!isEdit}
                value={form.code}
                onChange={(e) => setForm((f) => ({ ...f, code: e.target.value }))}
                placeholder="portfolio_100"
                disabled={isEdit}
              />
            </AdminFormField>
            <AdminFormField label="รางวัล Honey">
              <Input
                type="number"
                value={form.honeyReward}
                onChange={(e) =>
                  setForm((f) => ({ ...f, honeyReward: Number(e.target.value) }))
                }
              />
            </AdminFormField>
            <AdminFormField label="ชื่อ (ไทย)" required>
              <Input
                required
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              />
            </AdminFormField>
            <AdminFormField label="ชื่อ (EN)">
              <Input
                value={form.nameEn}
                onChange={(e) => setForm((f) => ({ ...f, nameEn: e.target.value }))}
              />
            </AdminFormField>
            <AdminFormField label="คำอธิบาย" className="sm:col-span-2">
              <Input
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              />
            </AdminFormField>
          </div>
        </AdminPanel>

        <AdminPanel title="เงื่อนไข">
          <div className="grid gap-4 sm:grid-cols-2">
            <AdminFormField label="ประเภทเงื่อนไข">
              <AdminNativeSelect
                value={form.criteriaType}
                onChange={(e) => setForm((f) => ({ ...f, criteriaType: e.target.value }))}
                options={CRITERIA_OPTIONS}
              />
            </AdminFormField>
            <AdminFormField label="เป้าหมาย">
              <Input
                type="number"
                value={form.criteriaTarget}
                onChange={(e) =>
                  setForm((f) => ({ ...f, criteriaTarget: Number(e.target.value) }))
                }
              />
            </AdminFormField>
            <AdminCheckboxField
              span={2}
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
        </AdminPanel>
      </form>
    </AdminPage>
  );
}
