"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import {
  ArrowLeft,
  Box,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Gift,
  Settings,
  Ticket,
  Trophy,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { ImageUploader } from "@/components/admin/image-uploader";
import { AdminPage } from "@/components/admin/admin-page";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { AdminPanel } from "@/components/admin/admin-panel";
import { AdminSaveBar } from "@/components/admin/admin-save-bar";
import { adminFetch } from "@/lib/admin/admin-fetch";
import { cn } from "@/lib/utils";

import { PrizeEditor } from "./prize-editor";

export type Prize = {
  rank: number;
  name: string;
  imageUrl?: string;
  honeyBonus?: number;
};

export type RaffleInitial = {
  id: number;
  month: string;
  slug: string;
  title: string;
  titleEn: string | null;
  titleTh: string | null;
  description: string | null;
  imageUrl: string | null;
  color: string | null;
  prizes: Prize[];
  ticketCost: number;
  maxTickets: number;
  freeThreshold: number;
  sortOrder: number;
};

type FormState = {
  month: string;
  slug: string;
  title: string;
  titleEn: string;
  description: string;
  imageUrl: string;
  color: string;
  ticketCost: number;
  maxTickets: number;
  freeThreshold: number;
  sortOrder: number;
  prizes: Prize[];
};

const FORM_ID = "admin-raffle-form";

const PRESET_COLORS = [
  "#FFD700",
  "#C0C0C0",
  "#CD7F32",
  "#6366f1",
  "#ec4899",
  "#10b981",
  "#f59e0b",
  "#ef4444",
  "#8b5cf6",
  "#06b6d4",
];

function currentMonth() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

export function slugify(s: string) {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/-+$/, "")
    .replace(/^-+/, "");
}

export function RaffleForm({
  initial,
  cloneFrom,
}: {
  initial?: RaffleInitial;
  /** When set, prefill from this raffle (used for "duplicate" via ?clone=ID). */
  cloneFrom?: RaffleInitial;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const seed = initial ?? cloneFrom;

  const initialState: FormState = seed
    ? {
        month: initial ? seed.month : currentMonth(),
        slug: initial ? seed.slug : "",
        title: seed.titleTh ?? seed.title,
        titleEn: seed.titleEn ?? "",
        description: seed.description ?? "",
        imageUrl: seed.imageUrl ?? "",
        color: seed.color ?? "#FFD700",
        ticketCost: seed.ticketCost,
        maxTickets: seed.maxTickets,
        freeThreshold: seed.freeThreshold,
        sortOrder: seed.sortOrder,
        prizes: seed.prizes.length
          ? seed.prizes.map((p) => ({ ...p, imageUrl: p.imageUrl ?? "" }))
          : [{ rank: 1, name: "", imageUrl: "", honeyBonus: 0 }],
      }
    : {
        month: currentMonth(),
        slug: "",
        title: "",
        titleEn: "",
        description: "",
        imageUrl: "",
        color: "#FFD700",
        ticketCost: 50,
        maxTickets: 5,
        freeThreshold: 7,
        sortOrder: 0,
        prizes: [{ rank: 1, name: "", imageUrl: "", honeyBonus: 0 }],
      };

  const [form, setForm] = useState<FormState>(initialState);
  const [error, setError] = useState("");

  const isEdit = initial?.id != null;
  const dirty = JSON.stringify(form) !== JSON.stringify(initialState);

  const updatePrize = (index: number, field: keyof Prize, value: string | number) => {
    setForm((prev) => ({
      ...prev,
      prizes: prev.prizes.map((p, i) =>
        i === index ? { ...p, [field]: value } : p,
      ),
    }));
  };

  const addPrize = () => {
    setForm((prev) => ({
      ...prev,
      prizes: [
        ...prev.prizes,
        { rank: prev.prizes.length + 1, name: "", imageUrl: "", honeyBonus: 0 },
      ],
    }));
  };

  const removePrize = (index: number) => {
    setForm((prev) => ({
      ...prev,
      prizes: prev.prizes
        .filter((_, i) => i !== index)
        .map((p, i) => ({ ...p, rank: i + 1 })),
    }));
  };

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!form.month || !form.title || !form.prizes[0]?.name) {
      setError("กรุณากรอกเดือน ชื่อตู้ และรางวัลที่ 1 อย่างน้อย");
      return;
    }

    const prizes = form.prizes
      .filter((p) => p.name.trim())
      .map((p) => ({
        rank: p.rank,
        name: p.name,
        imageUrl: p.imageUrl || undefined,
        honeyBonus: p.honeyBonus || undefined,
      }));

    startTransition(async () => {
      try {
        if (isEdit && initial) {
          await adminFetch("/api/admin/honey/raffle", {
            method: "PUT",
            body: {
              id: initial.id,
              title: form.title,
              titleEn: form.titleEn || undefined,
              titleTh: form.title,
              description: form.description || undefined,
              imageUrl: form.imageUrl || null,
              color: form.color || null,
              prizes,
              ticketCost: form.ticketCost,
              maxTickets: form.maxTickets,
              freeThreshold: form.freeThreshold,
              sortOrder: form.sortOrder,
            },
          });
          toast.success("อัปเดตตู้แล้ว");
        } else {
          const slug = form.slug || slugify(form.title) || "default";
          await adminFetch("/api/admin/honey/raffle", {
            method: "POST",
            body: {
              month: form.month,
              slug,
              title: form.title,
              titleEn: form.titleEn || undefined,
              titleTh: form.title,
              description: form.description || undefined,
              imageUrl: form.imageUrl || undefined,
              color: form.color || undefined,
              prizes,
              ticketCost: form.ticketCost,
              maxTickets: form.maxTickets,
              freeThreshold: form.freeThreshold,
              sortOrder: form.sortOrder,
            },
          });
          toast.success("สร้างตู้แล้ว");
        }
        router.push("/admin/honey/raffle");
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
              ? `แก้ไขตู้: ${initial?.title ?? ""}`
              : cloneFrom
                ? `คัดลอกจาก: ${cloneFrom.title}`
                : "สร้างตู้ Raffle ใหม่"
          }
          description="ตั้งค่ารายละเอียด รูปแบบ และรางวัลของตู้ Raffle"
          icon={Gift}
          actions={
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => router.push("/admin/honey/raffle")}
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

        <AdminPanel title="ข้อมูลพื้นฐาน" icon={Box}>
          <div className="space-y-3">
            <div className="grid gap-3 sm:grid-cols-3">
              <Field label="เดือน">
                <MonthPicker
                  value={form.month}
                  onChange={(m) => setForm({ ...form, month: m })}
                  disabled={isEdit}
                />
              </Field>
              <Field label="Slug" hint="สร้างอัตโนมัติจากชื่อหากเว้นว่าง">
                <input
                  value={form.slug}
                  onChange={(e) => setForm({ ...form, slug: e.target.value })}
                  placeholder={slugify(form.title) || "gold, silver..."}
                  disabled={isEdit}
                  className="mt-1 w-full rounded-lg border bg-background px-3 py-2 text-sm"
                />
              </Field>
              <Field label="ลำดับ" hint="น้อย = อยู่ก่อน">
                <input
                  type="number"
                  value={form.sortOrder}
                  onChange={(e) => setForm({ ...form, sortOrder: +e.target.value })}
                  className="mt-1 w-full rounded-lg border bg-background px-3 py-2 text-sm"
                />
              </Field>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="ชื่อ (ไทย)">
                <input
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  placeholder="ตู้ทอง"
                  className="mt-1 w-full rounded-lg border bg-background px-3 py-2 text-sm"
                />
              </Field>
              <Field label="ชื่อ (EN)">
                <input
                  value={form.titleEn}
                  onChange={(e) => setForm({ ...form, titleEn: e.target.value })}
                  placeholder="Gold Box"
                  className="mt-1 w-full rounded-lg border bg-background px-3 py-2 text-sm"
                />
              </Field>
            </div>
            <Field label="คำอธิบาย">
              <input
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="ลุ้นรับ Booster Box!"
                className="mt-1 w-full rounded-lg border bg-background px-3 py-2 text-sm"
              />
            </Field>
          </div>
        </AdminPanel>

        <AdminPanel title="หน้าตา" icon={Settings}>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="รูปตู้">
              <ImageUploader
                value={form.imageUrl}
                onChange={(url) => setForm({ ...form, imageUrl: url })}
                folder="machines"
                height="h-36"
              />
            </Field>
            <Field label="สีเน้น">
              <div className="flex flex-wrap gap-1.5">
                {PRESET_COLORS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setForm({ ...form, color: c })}
                    className={cn(
                      "size-7 rounded-lg border-2 motion-base",
                      form.color === c
                        ? "scale-110 border-primary"
                        : "border-transparent",
                    )}
                    style={{ backgroundColor: c }}
                  />
                ))}
              </div>
              <div className="mt-2 flex items-center gap-2">
                <input
                  type="color"
                  value={form.color}
                  onChange={(e) => setForm({ ...form, color: e.target.value })}
                  className="size-8 cursor-pointer rounded border bg-transparent"
                />
                <input
                  value={form.color}
                  onChange={(e) => setForm({ ...form, color: e.target.value })}
                  className="mt-1 flex-1 rounded-lg border bg-background px-3 py-2 text-sm"
                  placeholder="#FFD700"
                />
              </div>
            </Field>
          </div>
        </AdminPanel>

        <AdminPanel title="ตั้งค่าตั๋ว" icon={Ticket}>
          <div className="grid gap-3 sm:grid-cols-3">
            <Field label="ราคาตั๋ว" hint="Honey ต่อหนึ่งตั๋ว">
              <input
                type="number"
                value={form.ticketCost}
                onChange={(e) => setForm({ ...form, ticketCost: +e.target.value })}
                className="mt-1 w-full rounded-lg border bg-background px-3 py-2 text-sm"
              />
            </Field>
            <Field label="ตั๋วสูงสุด/ผู้ใช้">
              <input
                type="number"
                value={form.maxTickets}
                onChange={(e) => setForm({ ...form, maxTickets: +e.target.value })}
                className="mt-1 w-full rounded-lg border bg-background px-3 py-2 text-sm"
              />
            </Field>
            <Field label="สตรีคที่ได้ตั๋วฟรี" hint="จำนวนวันสำหรับตั๋วฟรี">
              <input
                type="number"
                value={form.freeThreshold}
                onChange={(e) => setForm({ ...form, freeThreshold: +e.target.value })}
                className="mt-1 w-full rounded-lg border bg-background px-3 py-2 text-sm"
              />
            </Field>
          </div>
        </AdminPanel>

        <AdminPanel title="รางวัล" icon={Trophy}>
          <PrizeEditor
            prizes={form.prizes}
            onUpdate={updatePrize}
            onAdd={addPrize}
            onRemove={removePrize}
          />
        </AdminPanel>
      </form>
    </AdminPage>
  );
}

/* ─── Helpers ─── */

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="text-xs font-medium text-muted-foreground">{label}</label>
      {hint && <span className="ml-1.5 text-meta text-muted-foreground/60">({hint})</span>}
      {children}
    </div>
  );
}

const MONTH_NAMES = [
  "ม.ค.",
  "ก.พ.",
  "มี.ค.",
  "เม.ย.",
  "พ.ค.",
  "มิ.ย.",
  "ก.ค.",
  "ส.ค.",
  "ก.ย.",
  "ต.ค.",
  "พ.ย.",
  "ธ.ค.",
];

function MonthPicker({
  value,
  onChange,
  disabled,
}: {
  value: string;
  onChange: (month: string) => void;
  disabled?: boolean;
}) {
  const [open, setOpen] = useState(false);

  const parsed = value.match(/^(\d{4})-(\d{2})$/);
  const selectedYear = parsed ? parseInt(parsed[1]) : new Date().getFullYear();
  const selectedMonthIdx = parsed ? parseInt(parsed[2]) - 1 : new Date().getMonth();

  const [viewYear, setViewYear] = useState(selectedYear);

  const now = new Date();
  const curYear = now.getFullYear();
  const curMonthIdx = now.getMonth();

  const handleSelect = (monthIdx: number) => {
    const m = `${viewYear}-${String(monthIdx + 1).padStart(2, "0")}`;
    onChange(m);
    setOpen(false);
  };

  const display = parsed ? `${MONTH_NAMES[selectedMonthIdx]} ${selectedYear}` : "เลือกเดือน";

  if (disabled) {
    return (
      <div className="mt-1 flex w-full items-center gap-2 rounded-lg border bg-muted/50 px-3 py-2 text-sm text-muted-foreground">
        <Calendar className="size-4" />
        {display}
      </div>
    );
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => {
          setOpen(!open);
          setViewYear(selectedYear);
        }}
        className="mt-1 flex w-full items-center gap-2 rounded-lg border bg-background px-3 py-2 text-sm motion-base hover:bg-muted/70"
      >
        <Calendar className="size-4 text-muted-foreground" />
        <span className={parsed ? "font-medium" : "text-muted-foreground"}>{display}</span>
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute left-0 top-full z-50 mt-1 w-64 rounded-xl border bg-card p-3 shadow-lg">
            <div className="mb-2 flex items-center justify-between">
              <button
                type="button"
                onClick={() => setViewYear((y) => y - 1)}
                className="rounded-lg p-1 hover:bg-muted"
              >
                <ChevronLeft className="size-4" />
              </button>
              <span className="text-sm font-bold">{viewYear}</span>
              <button
                type="button"
                onClick={() => setViewYear((y) => y + 1)}
                className="rounded-lg p-1 hover:bg-muted"
              >
                <ChevronRight className="size-4" />
              </button>
            </div>

            <div className="grid grid-cols-3 gap-1">
              {MONTH_NAMES.map((name, idx) => {
                const isSelected = viewYear === selectedYear && idx === selectedMonthIdx;
                const isCurrent = viewYear === curYear && idx === curMonthIdx;

                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleSelect(idx)}
                    className={cn(
                      "rounded-lg px-2 py-1.5 text-xs font-medium motion-base",
                      isSelected
                        ? "bg-primary text-primary-foreground"
                        : isCurrent
                          ? "bg-primary/15 text-primary hover:bg-primary/20"
                          : "hover:bg-muted",
                    )}
                  >
                    {name}
                  </button>
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
