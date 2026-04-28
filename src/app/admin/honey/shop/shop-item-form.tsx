"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { ArrowLeft, ShoppingBag } from "lucide-react";
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
  const [isPending, startTransition] = useTransition();

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

  const [form, setForm] = useState<FormData>(initialState);
  const [error, setError] = useState("");

  const isEdit = initial?.id != null;
  const dirty = JSON.stringify(form) !== JSON.stringify(initialState);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!form.name) {
      setError("กรุณากรอกชื่อสินค้า");
      return;
    }
    if (!form.cost || Number(form.cost) < 1) {
      setError("กรุณากำหนดราคา (Honey)");
      return;
    }

    let parsedValue: Record<string, unknown> | null;
    try {
      parsedValue = form.value.trim() ? JSON.parse(form.value) : null;
    } catch {
      setError("รูปแบบ JSON ในช่อง value ไม่ถูกต้อง");
      return;
    }

    // Merge dedicated image uploader on top of raw JSON.
    const mergedValue: Record<string, unknown> = { ...(parsedValue ?? {}) };
    if (form.imageUrl) mergedValue.imageUrl = form.imageUrl;
    else delete mergedValue.imageUrl;

    const body = {
      name: form.name,
      nameEn: form.nameEn || null,
      nameTh: form.name,
      description: form.description || null,
      cost: Number(form.cost),
      type: form.type,
      value: Object.keys(mergedValue).length ? mergedValue : null,
      isActive: form.isActive,
      stock: form.stock ? Number(form.stock) : null,
    };

    startTransition(async () => {
      try {
        if (isEdit) {
          await adminFetch(`/api/admin/honey/shop/${initial!.id}`, {
            method: "PATCH",
            body,
          });
          toast.success("อัปเดตสินค้าแล้ว");
        } else {
          await adminFetch("/api/admin/honey/shop", { method: "POST", body });
          toast.success("สร้างสินค้าแล้ว");
        }
        router.push("/admin/honey/shop");
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
            className="w-full rounded-lg border border-input bg-transparent px-3 py-2 font-mono text-xs outline-none transition-colors focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/40 dark:bg-input/30"
            rows={4}
            value={form.value}
            onChange={(e) => setForm((f) => ({ ...f, value: e.target.value }))}
          />
        </AdminPanel>
      </form>
    </AdminPage>
  );
}
