"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ImageUploader } from "@/components/admin/image-uploader";
import {
  Box,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Settings,
  Ticket,
  Trophy,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { PrizeEditor } from "./prize-editor";
import type { FormState, Prize } from "./raffle-manager";
import { slugify } from "./raffle-manager";

const PRESET_COLORS = [
  "#FFD700", "#C0C0C0", "#CD7F32", "#6366f1", "#ec4899",
  "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#06b6d4",
];

export type RaffleFormProps = {
  form: FormState;
  editingId: number | null;
  loading: boolean;
  onFormChange: (form: FormState) => void;
  onSave: () => void;
  onCancel: () => void;
  onUpdatePrize: (index: number, field: keyof Prize, value: string | number) => void;
  onAddPrize: () => void;
  onRemovePrize: (index: number) => void;
};

export function RaffleForm({
  form,
  editingId,
  loading,
  onFormChange,
  onSave,
  onCancel,
  onUpdatePrize,
  onAddPrize,
  onRemovePrize,
}: RaffleFormProps) {
  return (
    <div className="rounded-xl border bg-card shadow-sm">
      <div className="flex items-center justify-between border-b px-5 py-3">
        <h2 className="text-lg font-semibold">
          {editingId ? "Edit Machine" : "Create New Machine"}
        </h2>
        <Button size="sm" variant="ghost" onClick={onCancel} className="text-xs">Cancel</Button>
      </div>

      <div className="space-y-6 p-5">
        {/* Basic Info */}
        <Section icon={Box} title="Basic Info">
          <div className="grid gap-3 sm:grid-cols-3">
            <Field label="Month">
              <MonthPicker
                value={form.month}
                onChange={(m) => onFormChange({ ...form, month: m })}
                disabled={!!editingId}
              />
            </Field>
            <Field label="Slug" hint="Auto-generated from title if empty">
              <input
                value={form.slug}
                onChange={(e) => onFormChange({ ...form, slug: e.target.value })}
                placeholder={slugify(form.title) || "gold, silver..."}
                disabled={!!editingId}
                className="mt-1 w-full rounded-lg border bg-background px-3 py-2 text-sm"
              />
            </Field>
            <Field label="Sort Order" hint="Lower = first">
              <input
                type="number"
                value={form.sortOrder}
                onChange={(e) => onFormChange({ ...form, sortOrder: +e.target.value })}
                className="mt-1 w-full rounded-lg border bg-background px-3 py-2 text-sm"
              />
            </Field>
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            <Field label="Title (JP)">
              <input value={form.title} onChange={(e) => onFormChange({ ...form, title: e.target.value })} placeholder="ゴールドボックス" className="mt-1 w-full rounded-lg border bg-background px-3 py-2 text-sm" />
            </Field>
            <Field label="Title (EN)">
              <input value={form.titleEn} onChange={(e) => onFormChange({ ...form, titleEn: e.target.value })} placeholder="Gold Box" className="mt-1 w-full rounded-lg border bg-background px-3 py-2 text-sm" />
            </Field>
            <Field label="Title (TH)">
              <input value={form.titleTh} onChange={(e) => onFormChange({ ...form, titleTh: e.target.value })} placeholder="ตู้ทอง" className="mt-1 w-full rounded-lg border bg-background px-3 py-2 text-sm" />
            </Field>
          </div>
          <Field label="Description">
            <input value={form.description} onChange={(e) => onFormChange({ ...form, description: e.target.value })} placeholder="Win a booster box!" className="mt-1 w-full rounded-lg border bg-background px-3 py-2 text-sm" />
          </Field>
        </Section>

        {/* Appearance */}
        <Section icon={Settings} title="Appearance">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Machine Image">
              <ImageUploader
                value={form.imageUrl}
                onChange={(url) => onFormChange({ ...form, imageUrl: url })}
                folder="machines"
                height="h-36"
              />
            </Field>
            <Field label="Accent Color">
              <div className="flex flex-wrap gap-1.5">
                {PRESET_COLORS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => onFormChange({ ...form, color: c })}
                    className={cn(
                      "size-7 rounded-lg border-2 transition-all",
                      form.color === c ? "scale-110 border-foreground shadow-sm" : "border-transparent",
                    )}
                    style={{ backgroundColor: c }}
                  />
                ))}
              </div>
              <div className="mt-2 flex items-center gap-2">
                <input
                  type="color"
                  value={form.color}
                  onChange={(e) => onFormChange({ ...form, color: e.target.value })}
                  className="size-8 cursor-pointer rounded border bg-transparent"
                />
                <input
                  value={form.color}
                  onChange={(e) => onFormChange({ ...form, color: e.target.value })}
                  className="mt-1 flex-1 rounded-lg border bg-background px-3 py-2 text-sm"
                  placeholder="#FFD700"
                />
              </div>
            </Field>
          </div>
        </Section>

        {/* Ticket Settings */}
        <Section icon={Ticket} title="Ticket Settings">
          <div className="grid gap-3 sm:grid-cols-3">
            <Field label="Ticket Cost" hint="Honey points per ticket">
              <input type="number" value={form.ticketCost} onChange={(e) => onFormChange({ ...form, ticketCost: +e.target.value })} className="mt-1 w-full rounded-lg border bg-background px-3 py-2 text-sm" />
            </Field>
            <Field label="Max Tickets / User">
              <input type="number" value={form.maxTickets} onChange={(e) => onFormChange({ ...form, maxTickets: +e.target.value })} className="mt-1 w-full rounded-lg border bg-background px-3 py-2 text-sm" />
            </Field>
            <Field label="Free Ticket Streak" hint="Days for free ticket">
              <input type="number" value={form.freeThreshold} onChange={(e) => onFormChange({ ...form, freeThreshold: +e.target.value })} className="mt-1 w-full rounded-lg border bg-background px-3 py-2 text-sm" />
            </Field>
          </div>
        </Section>

        {/* Prizes */}
        <Section icon={Trophy} title="Prizes">
          <PrizeEditor
            prizes={form.prizes}
            onUpdate={onUpdatePrize}
            onAdd={onAddPrize}
            onRemove={onRemovePrize}
          />
        </Section>

        {/* Save */}
        <div className="flex items-center gap-3 border-t pt-4">
          <Button
            onClick={onSave}
            disabled={loading || !form.month || !form.title || !form.prizes[0]?.name}
            className="gap-1.5"
          >
            {loading ? <Loader2 className="size-4 animate-spin" /> : null}
            {editingId ? "Save Changes" : "Create Machine"}
          </Button>
          <Button variant="ghost" onClick={onCancel}>Cancel</Button>
        </div>
      </div>
    </div>
  );
}

/* ─── Helpers ─── */

function Section({ icon: Icon, title, children }: { icon: typeof Box; title: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="mb-3 flex items-center gap-2">
        <Icon className="size-4 text-muted-foreground" />
        <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{title}</h3>
      </div>
      <div className="space-y-3">{children}</div>
    </div>
  );
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="text-xs font-medium text-muted-foreground">{label}</label>
      {hint && <span className="ml-1.5 text-xs text-muted-foreground/60">({hint})</span>}
      {children}
    </div>
  );
}

const MONTH_NAMES = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

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

  const display = parsed
    ? `${MONTH_NAMES[selectedMonthIdx]} ${selectedYear}`
    : "Select month";

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
        onClick={() => { setOpen(!open); setViewYear(selectedYear); }}
        className="mt-1 flex w-full items-center gap-2 rounded-lg border bg-background px-3 py-2 text-sm transition-colors hover:bg-muted/30"
      >
        <Calendar className="size-4 text-muted-foreground" />
        <span className={parsed ? "font-medium" : "text-muted-foreground"}>{display}</span>
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute left-0 top-full z-50 mt-1 w-64 rounded-xl border bg-card p-3 shadow-lg">
            <div className="mb-2 flex items-center justify-between">
              <button type="button" onClick={() => setViewYear((y) => y - 1)} className="rounded-lg p-1 hover:bg-muted">
                <ChevronLeft className="size-4" />
              </button>
              <span className="text-sm font-bold">{viewYear}</span>
              <button type="button" onClick={() => setViewYear((y) => y + 1)} className="rounded-lg p-1 hover:bg-muted">
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
                      "rounded-lg px-2 py-1.5 text-xs font-medium transition-colors",
                      isSelected
                        ? "bg-primary text-primary-foreground"
                        : isCurrent
                          ? "bg-primary/10 text-primary hover:bg-primary/20"
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
