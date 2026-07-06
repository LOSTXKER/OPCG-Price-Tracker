"use client";

import { useRouter } from "next/navigation";
import { ArrowLeft, ShoppingBag } from "lucide-react";

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
import { useAdminForm } from "@/lib/admin/use-admin-form";

const ITEM_TYPES = ["TRIAL_PRO", "TRIAL_PRO_PLUS", "BADGE", "CUSTOM"] as const;

const TYPE_LABELS: Record<string, string> = {
  TRIAL_PRO: "ทดลอง Pro",
  TRIAL_PRO_PLUS: "ทดลอง Pro+",
  BADGE: "แบดจ์",
  CUSTOM: "กำหนดเอง",
};

const TYPE_OPTIONS = ITEM_TYPES.map((t) => ({ value: t, label: TYPE_LABELS[t] }));

type ShopItemInitial = {
  id: number;
  name: string;
  nameEn: string | null;
  nameTh: string | null;
  description: string | null;
  cost: number;
  type: string;
  value: Record<string, unknown> | null;
  isActive: boolean;
  stock: number | null;
};

type FormData = {
  name: string;
  nameEn: string;
  description: string;
  cost: string;
  type: string;
  imageUrl: string;
  value: string;
  isActive: boolean;
  stock: string;
};

const FORM_ID = "admin-shop-item-form";

function readImageUrl(value: ShopItemInitial["value"]): string {
  if (!value || typeof value !== "object") return "";
  const url = (value as Record<string, unknown>).imageUrl;
  return typeof url === "string" ? url : "";
}

function emptyForm(): FormData {
  return {
    name: "",
    nameEn: "",
    description: "",
    cost: "",
    type: "BADGE",
    imageUrl: "",
    value: "{}",
    isActive: true,
    stock: "",
  };
}

export function ShopItemForm({ initial }: { initial?: ShopItemInitial }) {
  const router = useRouter();

  const isEdit = initial?.id != null;
  const initialState: FormData = (() => {
    if (!initial) return emptyForm();
    const valueObj = (
      initial.value && typeof initial.value === "object" ? { ...initial.value } : {}
    ) as Record<string, unknown>;
    delete valueObj.imageUrl;
    return {
      name: initial.nameTh ?? initial.name,
      nameEn: initial.nameEn ?? "",
      description: initial.description ?? "",
      cost: String(initial.cost),
      type: initial.type,
      imageUrl: readImageUrl(initial.value),
      value: Object.keys(valueObj).length ? JSON.stringify(valueObj, null, 2) : "{}",
      isActive: initial.isActive,
      stock: initial.stock?.toString() ?? "",
    };
  })();

  const { form, setForm, error, saving, saveBarActive, handleSubmit, submitFromBar } =
    useAdminForm<FormData>({
      initialState,
      isEdit,
      formId: FORM_ID,
      validate: (f) => {
        if (!f.name) return "กรุณากรอกชื่อสินค้า";
        if (!f.cost || Number(f.cost) < 1) return "กรุณากำหนดราคา (Honey)";
        try {
          if (f.value.trim()) JSON.parse(f.value);
        } catch {
          return "รูปแบบ JSON ในช่อง value ไม่ถูกต้อง";
        }
        return null;
      },
      toBody: (f) => {
        const parsedValue: Record<string, unknown> | null = f.value.trim()
          ? JSON.parse(f.value)
          : null;
        // Merge dedicated image uploader on top of raw JSON.
        const mergedValue: Record<string, unknown> = { ...(parsedValue ?? {}) };
        if (f.imageUrl) mergedValue.imageUrl = f.imageUrl;
        else delete mergedValue.imageUrl;
        return {
          name: f.name,
          nameEn: f.nameEn || null,
          nameTh: f.name,
          description: f.description || null,
          cost: Number(f.cost),
          type: f.type,
          value: Object.keys(mergedValue).length ? mergedValue : null,
          isActive: f.isActive,
          stock: f.stock ? Number(f.stock) : null,
        };
      },
      createEndpoint: "/api/admin/honey/shop",
      editEndpoint: `/api/admin/honey/shop/${initial?.id}`,
      successMessage: { create: "สร้างสินค้าแล้ว", edit: "อัปเดตสินค้าแล้ว" },
      redirectTo: "/admin/honey/shop",
    });

  return (
    <AdminPage
      header={
        <AdminPageHeader
          title={isEdit ? `แก้ไขสินค้า: ${initial?.name ?? ""}` : "สร้างสินค้าใหม่"}
          description="ตั้งค่าราคา Honey รายละเอียด และรูปสินค้าใน Honey Shop"
          icon={ShoppingBag}
          actions={
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => router.push("/admin/honey/shop")}
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
      <form id={FORM_ID} onSubmit={handleSubmit} className="mx-auto max-w-4xl space-y-6">
        {error && (
          <div className="status-danger rounded-lg px-4 py-3 text-sm">{error}</div>
        )}

        <AdminPanel title="รูปและคำอธิบาย">
          <div className="grid gap-4 sm:grid-cols-[160px_1fr]">
            <AdminFormField label="รูปสินค้า" hint="โชว์ในการ์ดสินค้าหน้า Honey Shop">
              <ImageUploader
                value={form.imageUrl}
                onChange={(url) => setForm((f) => ({ ...f, imageUrl: url }))}
                folder="shop"
                height="h-32"
              />
            </AdminFormField>
            <AdminFormField label="คำอธิบาย">
              <Input
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              />
            </AdminFormField>
          </div>
        </AdminPanel>

        <AdminPanel title="ข้อมูลสินค้า">
          <div className="grid gap-4 sm:grid-cols-2">
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
            <AdminFormField label="ราคา (Honey)" required>
              <Input
                type="number"
                required
                value={form.cost}
                onChange={(e) => setForm((f) => ({ ...f, cost: e.target.value }))}
              />
            </AdminFormField>
            <AdminFormField label="ประเภท">
              <AdminNativeSelect
                value={form.type}
                onChange={(e) => setForm((f) => ({ ...f, type: e.target.value }))}
                options={TYPE_OPTIONS}
              />
            </AdminFormField>
            <AdminFormField label="สต็อก (เว้นว่าง = ไม่จำกัด)">
              <Input
                type="number"
                value={form.stock}
                onChange={(e) => setForm((f) => ({ ...f, stock: e.target.value }))}
                placeholder="ไม่จำกัด"
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

        <AdminPanel title="Value (JSON)" description="ข้อมูลเพิ่มเติมแบบ JSON เช่น duration, badgeId">
          <textarea
            className="w-full rounded-lg border border-input bg-transparent px-3 py-2 font-mono text-xs outline-none motion-base focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/40 dark:bg-input/30"
            rows={4}
            value={form.value}
            onChange={(e) => setForm((f) => ({ ...f, value: e.target.value }))}
          />
        </AdminPanel>
      </form>
    </AdminPage>
  );
}
