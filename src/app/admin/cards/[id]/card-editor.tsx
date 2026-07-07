"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowLeft,
  ImageIcon,
  History,
} from "lucide-react";
import { toast } from "sonner";
import { adminFetch } from "@/lib/admin/admin-fetch";
import { formatJpy } from "@/lib/utils/currency";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AdminPage } from "@/components/admin/admin-page";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { AdminPanel } from "@/components/admin/admin-panel";
import { AdminSaveBar } from "@/components/admin/admin-save-bar";
import { AdminFormField } from "@/components/admin/admin-form-field";
import { AdminStatusBadge } from "@/components/admin/admin-status-badge";
import { cn } from "@/lib/utils";

interface Price {
  id: number;
  source: string;
  type: string;
  priceJpy: number | null;
  scrapedAt: string;
}

interface CardData {
  id: number;
  cardCode: string;
  baseCode: string | null;
  parallelIndex: number | null;
  yuyuteiId: string | null;
  yuyuteiUrl: string | null;
  nameJp: string;
  nameEn: string | null;
  nameTh: string | null;
  rarity: string;
  cardType: string;
  color: string;
  colorEn: string | null;
  cost: number | null;
  power: number | null;
  counter: number | null;
  life: number | null;
  attribute: string | null;
  trait: string | null;
  artist: string | null;
  effectJp: string | null;
  effectEn: string | null;
  effectTh: string | null;
  triggerJp: string | null;
  triggerEn: string | null;
  imageUrl: string | null;
  isParallel: boolean;
  latestPriceJpy: number | null;
  set: { code: string; name: string; nameEn: string | null };
  prices: Price[];
  candidates: { pIndex: number; url: string }[];
}

const IDENTITY_FIELDS: {
  key: string;
  label: string;
  type?: string;
  official?: boolean;
}[] = [
  { key: "nameJp", label: "ชื่อ (JP)", official: true },
  { key: "nameEn", label: "ชื่อ (EN)", official: true },
  { key: "nameTh", label: "ชื่อ (TH)" },
  { key: "rarity", label: "ระดับ", official: true },
  { key: "cardType", label: "ประเภทการ์ด", official: true },
  { key: "color", label: "สี (JP)", official: true },
  { key: "colorEn", label: "สี (EN)", official: true },
];

const STATS_FIELDS: {
  key: string;
  label: string;
  type?: string;
  official?: boolean;
}[] = [
  { key: "cost", label: "ค่าใช้จ่าย", type: "number", official: true },
  { key: "power", label: "พลัง", type: "number", official: true },
  { key: "counter", label: "Counter", type: "number", official: true },
  { key: "life", label: "Life", type: "number", official: true },
  { key: "attribute", label: "Attribute", official: true },
  { key: "trait", label: "Trait", official: true },
  { key: "artist", label: "ศิลปิน" },
  { key: "imageUrl", label: "URL รูปภาพ" },
];

const TEXT_FIELDS = [...IDENTITY_FIELDS, ...STATS_FIELDS];

const TEXTAREA_FIELDS = [
  { key: "effectJp", label: "ความสามารถ (JP)" },
  { key: "effectEn", label: "ความสามารถ (EN)" },
  { key: "effectTh", label: "ความสามารถ (TH)" },
  { key: "triggerJp", label: "ทริกเกอร์ (JP)" },
  { key: "triggerEn", label: "ทริกเกอร์ (EN)" },
];

export function CardEditor({ card }: { card: CardData }) {
  const [form, setForm] = useState<Record<string, unknown>>(() => {
    const init: Record<string, unknown> = {};
    for (const f of [...TEXT_FIELDS, ...TEXTAREA_FIELDS]) {
      init[f.key] = (card as unknown as Record<string, unknown>)[f.key] ?? "";
    }
    return init;
  });

  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  function handleChange(key: string, value: string, type?: string) {
    let parsed: unknown = value;
    if (type === "number") {
      parsed = value === "" ? null : parseInt(value);
    }
    setForm((p) => ({ ...p, [key]: parsed }));
    setSaved(false);
    setHasChanges(true);
  }

  async function handleSave() {
    setSaving(true);
    try {
      const payload: Record<string, unknown> = {};
      for (const f of [...TEXT_FIELDS, ...TEXTAREA_FIELDS]) {
        const val = form[f.key];
        if (
          val !==
          ((card as unknown as Record<string, unknown>)[f.key] ?? "")
        ) {
          payload[f.key] = val === "" ? null : val;
        }
      }
      if (Object.keys(payload).length === 0) {
        setSaved(true);
        setHasChanges(false);
        toast.info("ไม่มีการเปลี่ยนแปลง");
        return;
      }
      await adminFetch(`/api/admin/cards/${card.id}`, {
        method: "PATCH",
        body: payload,
      });
      setSaved(true);
      setHasChanges(false);
      toast.success("บันทึกการ์ดสำเร็จ");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "บันทึกไม่สำเร็จ");
    } finally {
      setSaving(false);
    }
  }

  async function selectCandidate(pIndex: number, url: string) {
    setSaving(true);
    try {
      await adminFetch(`/api/admin/cards/${card.id}`, {
        method: "PATCH",
        body: { imageUrl: url, parallelIndex: pIndex },
      });
      setForm((p) => ({ ...p, imageUrl: url }));
      setSaved(true);
      toast.success("อัปเดตรูปภาพสำเร็จ");
    } catch (e) {
      toast.error(
        e instanceof Error ? e.message : "อัปเดตรูปภาพไม่สำเร็จ",
      );
    } finally {
      setSaving(false);
    }
  }

  const currentImage = (form.imageUrl as string) || card.imageUrl;

  return (
    <AdminPage
      header={
        <AdminPageHeader
          title={
            <span className="flex items-center gap-2">
              {card.baseCode}
              {card.isParallel && (
                <AdminStatusBadge tone="warning">พาราเลล</AdminStatusBadge>
              )}
              {saved && !hasChanges && (
                <AdminStatusBadge tone="success">บันทึกแล้ว</AdminStatusBadge>
              )}
            </span>
          }
          description={`${card.set.code.toUpperCase()} · ${card.cardCode}`}
          actions={
            <Button
              variant="ghost"
              size="sm"
              render={<Link href="/admin/cards" />}
            >
              <ArrowLeft className="size-4" />
              กลับ
            </Button>
          }
        />
      }
      footer={
        <AdminSaveBar
          dirty={hasChanges}
          saving={saving}
          onSave={() => void handleSave()}
        />
      }
    >
      <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
        {/* Image Preview */}
        <div className="space-y-4">
          <div className="overflow-hidden rounded-xl border border-transparent dark:border-hair bg-muted/20">
            {currentImage ? (
              <Image
                src={currentImage}
                alt={card.nameEn || card.nameJp}
                width={280}
                height={392}
                className="w-full object-contain"
                unoptimized
              />
            ) : (
              <div className="flex aspect-[5/7] w-full items-center justify-center text-muted-foreground">
                <ImageIcon className="size-12" />
              </div>
            )}
          </div>

          {card.isParallel && card.candidates.length > 0 && (
            <div>
              <h3 className="mb-2 text-h5">รูปพาราเลล</h3>
              <div className="grid grid-cols-4 gap-1">
                {card.candidates.map((c) => (
                  <button
                    key={c.pIndex}
                    onClick={() => selectCandidate(c.pIndex, c.url)}
                    className={cn(
                      "overflow-hidden rounded border motion-base",
                      currentImage === c.url
                        ? "border-primary ring-2 ring-primary/30"
                        : "border-hair hover:border-primary/50",
                    )}
                    title={`_p${c.pIndex}`}
                  >
                    <Image
                      src={c.url}
                      alt={`p${c.pIndex}`}
                      width={60}
                      height={84}
                      className="w-full object-contain"
                      unoptimized
                    />
                    <div className="bg-muted/50 py-0.5 text-center text-xs">
                      _p{c.pIndex}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="space-y-1 text-meta">
            <p>Yuyutei ID: {card.yuyuteiId || "—"}</p>
            <p>ลำดับพาราเลล: {card.parallelIndex ?? "—"}</p>
            <p>
              ราคา:{" "}
              {card.latestPriceJpy != null
                ? formatJpy(card.latestPriceJpy)
                : "—"}
            </p>
          </div>
        </div>

        {/* Form Fields */}
        <div className="space-y-6">
          <AdminPanel title="ข้อมูลการ์ด">
            <div className="grid gap-4 sm:grid-cols-2">
              {IDENTITY_FIELDS.map((f) => (
                <FieldInput
                  key={f.key}
                  field={f}
                  value={form[f.key]}
                  onChange={handleChange}
                />
              ))}
            </div>
          </AdminPanel>

          <AdminPanel title="สถิติและรายละเอียด">
            <div className="grid gap-4 sm:grid-cols-2">
              {STATS_FIELDS.map((f) => (
                <FieldInput
                  key={f.key}
                  field={f}
                  value={form[f.key]}
                  onChange={handleChange}
                />
              ))}
            </div>
          </AdminPanel>

          <AdminPanel title="ข้อความ">
            <div className="grid gap-4 sm:grid-cols-2">
              {TEXTAREA_FIELDS.map((f) => (
                <AdminFormField key={f.key} label={f.label}>
                  <textarea
                    rows={3}
                    value={String(form[f.key] ?? "")}
                    onChange={(e) => handleChange(f.key, e.target.value)}
                    className="w-full rounded-lg border border-input bg-transparent px-3 py-2 text-sm outline-none motion-base focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/40 dark:bg-input/30"
                  />
                </AdminFormField>
              ))}
            </div>
          </AdminPanel>

          {card.prices.length > 0 && (
            <AdminPanel
              title={`ประวัติราคา (${card.prices.length} รายการ)`}
              icon={History}
            >
              <div className="max-h-60 overflow-y-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b text-muted-foreground">
                      <th className="pb-1 text-left">วันที่</th>
                      <th className="pb-1 text-left">แหล่งข้อมูล</th>
                      <th className="pb-1 text-right">ราคา</th>
                    </tr>
                  </thead>
                  <tbody>
                    {card.prices.map((p) => (
                      <tr
                        key={p.id}
                        className="border-b border-hair"
                      >
                        <td className="py-1">
                          {new Date(p.scrapedAt).toLocaleDateString(
                            "th-TH",
                          )}
                        </td>
                        <td className="py-1">{p.source}</td>
                        <td className="py-1 text-right tabular-nums">
                          {p.priceJpy != null
                            ? formatJpy(p.priceJpy)
                            : "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </AdminPanel>
          )}
        </div>
      </div>
    </AdminPage>
  );
}

function FieldInput({
  field,
  value,
  onChange,
}: {
  field: { key: string; label: string; type?: string; official?: boolean };
  value: unknown;
  onChange: (key: string, value: string, type?: string) => void;
}) {
  return (
    <AdminFormField
      label={
        <span className="flex items-center gap-1.5">
          {field.label}
          {field.official && (
            <AdminStatusBadge tone="success">ทางการ</AdminStatusBadge>
          )}
        </span>
      }
    >
      <Input
        type={field.type === "number" ? "number" : "text"}
        value={String(value ?? "")}
        onChange={(e) => onChange(field.key, e.target.value, field.type)}
        className={cn(field.official && "border-success/30")}
      />
    </AdminFormField>
  );
}
