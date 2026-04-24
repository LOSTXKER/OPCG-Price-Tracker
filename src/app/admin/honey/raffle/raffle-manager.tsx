"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ImageUploader } from "@/components/admin/image-uploader";
import {
  Box,
  Calendar,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  Copy,
  Gift,
  Loader2,
  Pencil,
  Plus,
  Power,
  Settings,
  Ticket,
  Trash2,
  Trophy,
} from "lucide-react";
import { cn } from "@/lib/utils";

type Prize = { rank: number; name: string; imageUrl?: string; honeyBonus?: number };

type Raffle = {
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
  isActive: boolean;
  drawnAt: string | null;
  winnerId: string | null;
  totalTickets: number;
  totalParticipants: number;
  createdAt: string;
};

type FormState = {
  month: string;
  slug: string;
  title: string;
  titleEn: string;
  titleTh: string;
  description: string;
  imageUrl: string;
  color: string;
  ticketCost: number;
  maxTickets: number;
  freeThreshold: number;
  sortOrder: number;
  prizes: Prize[];
};

function currentMonth() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function slugify(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/-+$/, "").replace(/^-+/, "");
}

const PRESET_COLORS = [
  "#FFD700", "#C0C0C0", "#CD7F32", "#6366f1", "#ec4899",
  "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#06b6d4",
];

const DEFAULT_FORM: FormState = {
  month: currentMonth(),
  slug: "",
  title: "",
  titleEn: "",
  titleTh: "",
  description: "",
  imageUrl: "",
  color: "#FFD700",
  ticketCost: 50,
  maxTickets: 5,
  freeThreshold: 7,
  sortOrder: 0,
  prizes: [
    { rank: 1, name: "", imageUrl: "", honeyBonus: 0 },
  ],
};

const RANK_LABELS = ["1st Prize", "2nd Prize", "3rd Prize", "4th Prize", "5th Prize"];
const RANK_COLORS = [
  "border-amber-500/40 bg-amber-500/5",
  "border-slate-400/40 bg-slate-400/5",
  "border-orange-400/40 bg-orange-400/5",
  "border-border bg-card",
  "border-border bg-card",
];

export function RaffleManager({ initialRaffles }: { initialRaffles: Raffle[] }) {
  const [raffles, setRaffles] = useState(initialRaffles);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [drawingId, setDrawingId] = useState<number | null>(null);
  const [expandedMonth, setExpandedMonth] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(DEFAULT_FORM);

  const months = [...new Set(raffles.map((r) => r.month))].sort().reverse();
  const hasCurrentMonth = raffles.some((r) => r.month === currentMonth());

  const openCreateForm = () => {
    setForm({ ...DEFAULT_FORM, month: currentMonth() });
    setEditingId(null);
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const openEditForm = (r: Raffle) => {
    setForm({
      month: r.month,
      slug: r.slug,
      title: r.title,
      titleEn: r.titleEn ?? "",
      titleTh: r.titleTh ?? "",
      description: r.description ?? "",
      imageUrl: r.imageUrl ?? "",
      color: r.color ?? "#FFD700",
      ticketCost: r.ticketCost,
      maxTickets: r.maxTickets,
      freeThreshold: r.freeThreshold,
      sortOrder: r.sortOrder,
      prizes: r.prizes.length > 0
        ? r.prizes.map((p) => ({ ...p, imageUrl: p.imageUrl ?? "" }))
        : DEFAULT_FORM.prizes,
    });
    setEditingId(r.id);
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleDuplicate = (r: Raffle) => {
    setForm({
      month: currentMonth(),
      slug: "",
      title: r.title,
      titleEn: r.titleEn ?? "",
      titleTh: r.titleTh ?? "",
      description: r.description ?? "",
      imageUrl: r.imageUrl ?? "",
      color: r.color ?? "#FFD700",
      ticketCost: r.ticketCost,
      maxTickets: r.maxTickets,
      freeThreshold: r.freeThreshold,
      sortOrder: r.sortOrder,
      prizes: r.prizes.map((p) => ({ ...p, imageUrl: p.imageUrl ?? "" })),
    });
    setEditingId(null);
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleSave = async () => {
    if (!form.month || !form.title || !form.prizes[0]?.name) return;
    setLoading(true);
    try {
      const prizes = form.prizes
        .filter((p) => p.name.trim())
        .map((p) => ({
          rank: p.rank,
          name: p.name,
          imageUrl: p.imageUrl || undefined,
          honeyBonus: p.honeyBonus || undefined,
        }));

      if (editingId) {
        const res = await fetch("/api/admin/honey/raffle", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id: editingId,
            title: form.title,
            titleEn: form.titleEn || undefined,
            titleTh: form.titleTh || undefined,
            description: form.description || undefined,
            imageUrl: form.imageUrl || null,
            color: form.color || null,
            prizes,
            ticketCost: form.ticketCost,
            maxTickets: form.maxTickets,
            freeThreshold: form.freeThreshold,
            sortOrder: form.sortOrder,
          }),
        });
        if (res.ok) {
          const data = await res.json();
          setRaffles((prev) =>
            prev.map((r) =>
              r.id === editingId
                ? { ...r, ...data.raffle, totalTickets: r.totalTickets, totalParticipants: r.totalParticipants }
                : r,
            ),
          );
          setShowForm(false);
        }
      } else {
        const slug = form.slug || slugify(form.title) || "default";
        const res = await fetch("/api/admin/honey/raffle", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            month: form.month,
            slug,
            title: form.title,
            titleEn: form.titleEn || undefined,
            titleTh: form.titleTh || undefined,
            description: form.description || undefined,
            imageUrl: form.imageUrl || undefined,
            color: form.color || undefined,
            prizes,
            ticketCost: form.ticketCost,
            maxTickets: form.maxTickets,
            freeThreshold: form.freeThreshold,
            sortOrder: form.sortOrder,
          }),
        });
        if (res.ok) {
          const data = await res.json();
          setRaffles((prev) => [
            { ...data.raffle, totalTickets: 0, totalParticipants: 0, createdAt: new Date().toISOString() },
            ...prev,
          ]);
          setShowForm(false);
        }
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDraw = async (raffleId: number) => {
    if (!confirm("Draw winner for this machine? This cannot be undone.")) return;
    setDrawingId(raffleId);
    try {
      const res = await fetch("/api/admin/honey/raffle", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "draw", raffleId }),
      });
      if (res.ok) {
        const data = await res.json();
        setRaffles((prev) =>
          prev.map((r) =>
            r.id === raffleId
              ? { ...r, drawnAt: new Date().toISOString(), winnerId: data.winnerId, isActive: false }
              : r,
          ),
        );
      }
    } finally {
      setDrawingId(null);
    }
  };

  const handleToggleActive = async (r: Raffle) => {
    const res = await fetch("/api/admin/honey/raffle", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: r.id, isActive: !r.isActive }),
    });
    if (res.ok) {
      setRaffles((prev) => prev.map((x) => (x.id === r.id ? { ...x, isActive: !x.isActive } : x)));
    }
  };

  const handleDelete = async (raffleId: number) => {
    if (!confirm("Delete this machine? All tickets will also be deleted.")) return;
    const res = await fetch(`/api/admin/honey/raffle?id=${raffleId}`, { method: "DELETE" });
    if (res.ok) {
      setRaffles((prev) => prev.filter((r) => r.id !== raffleId));
    }
  };

  const updatePrize = (index: number, field: keyof Prize, value: string | number) => {
    setForm((prev) => ({
      ...prev,
      prizes: prev.prizes.map((p, i) => (i === index ? { ...p, [field]: value } : p)),
    }));
  };

  const addPrize = () => {
    setForm((prev) => ({
      ...prev,
      prizes: [...prev.prizes, { rank: prev.prizes.length + 1, name: "", imageUrl: "", honeyBonus: 0 }],
    }));
  };

  const removePrize = (index: number) => {
    setForm((prev) => ({
      ...prev,
      prizes: prev.prizes.filter((_, i) => i !== index).map((p, i) => ({ ...p, rank: i + 1 })),
    }));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">Gacha Machine Management</h1>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Current month: <span className="font-mono font-semibold text-foreground">{currentMonth()}</span>
          </p>
        </div>
        <Button size="sm" onClick={openCreateForm}>
          <Plus className="mr-1.5 size-4" /> New Machine
        </Button>
      </div>

      {/* Quick alert if no machine for current month */}
      {!hasCurrentMonth && !showForm && (
        <div className="flex items-center gap-3 rounded-xl border border-amber-500/30 bg-amber-500/5 px-4 py-3">
          <Calendar className="size-5 text-amber-500" />
          <div className="flex-1">
            <p className="text-sm font-medium">No machine for {currentMonth()}</p>
            <p className="text-xs text-muted-foreground">Users won't see any raffle this month.</p>
          </div>
          <Button size="sm" variant="outline" onClick={openCreateForm} className="shrink-0 gap-1.5 border-amber-500/30 text-amber-600 hover:bg-amber-500/10">
            <Plus className="size-3.5" /> Create Now
          </Button>
        </div>
      )}

      {/* ─── Create / Edit Form ─── */}
      {showForm && (
        <div className="rounded-xl border bg-card shadow-sm">
          <div className="flex items-center justify-between border-b px-5 py-3">
            <h2 className="text-lg font-semibold">
              {editingId ? "Edit Machine" : "Create New Machine"}
            </h2>
            <Button size="sm" variant="ghost" onClick={() => setShowForm(false)} className="text-xs">Cancel</Button>
          </div>

          <div className="space-y-6 p-5">
            {/* Section: Basic Info */}
            <Section icon={Box} title="Basic Info">
              <div className="grid gap-3 sm:grid-cols-3">
                <Field label="Month">
                  <MonthPicker
                    value={form.month}
                    onChange={(m) => setForm({ ...form, month: m })}
                    disabled={!!editingId}
                  />
                </Field>
                <Field label="Slug" hint="Auto-generated from title if empty">
                  <input
                    value={form.slug}
                    onChange={(e) => setForm({ ...form, slug: e.target.value })}
                    placeholder={slugify(form.title) || "gold, silver..."}
                    disabled={!!editingId}
                    className="mt-1 w-full rounded-lg border bg-background px-3 py-2 text-sm"
                  />
                </Field>
                <Field label="Sort Order" hint="Lower = first">
                  <input
                    type="number"
                    value={form.sortOrder}
                    onChange={(e) => setForm({ ...form, sortOrder: +e.target.value })}
                    className="mt-1 w-full rounded-lg border bg-background px-3 py-2 text-sm"
                  />
                </Field>
              </div>
              <div className="grid gap-3 sm:grid-cols-3">
                <Field label="Title (JP)">
                  <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="ゴールドボックス" className="mt-1 w-full rounded-lg border bg-background px-3 py-2 text-sm" />
                </Field>
                <Field label="Title (EN)">
                  <input value={form.titleEn} onChange={(e) => setForm({ ...form, titleEn: e.target.value })} placeholder="Gold Box" className="mt-1 w-full rounded-lg border bg-background px-3 py-2 text-sm" />
                </Field>
                <Field label="Title (TH)">
                  <input value={form.titleTh} onChange={(e) => setForm({ ...form, titleTh: e.target.value })} placeholder="ตู้ทอง" className="mt-1 w-full rounded-lg border bg-background px-3 py-2 text-sm" />
                </Field>
              </div>
              <Field label="Description">
                <input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Win a booster box!" className="mt-1 w-full rounded-lg border bg-background px-3 py-2 text-sm" />
              </Field>
            </Section>

            {/* Section: Appearance */}
            <Section icon={Settings} title="Appearance">
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Machine Image">
                  <ImageUploader
                    value={form.imageUrl}
                    onChange={(url) => setForm({ ...form, imageUrl: url })}
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
                        onClick={() => setForm({ ...form, color: c })}
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
            </Section>

            {/* Section: Ticket Settings */}
            <Section icon={Ticket} title="Ticket Settings">
              <div className="grid gap-3 sm:grid-cols-3">
                <Field label="Ticket Cost" hint="Honey points per ticket">
                  <input type="number" value={form.ticketCost} onChange={(e) => setForm({ ...form, ticketCost: +e.target.value })} className="mt-1 w-full rounded-lg border bg-background px-3 py-2 text-sm" />
                </Field>
                <Field label="Max Tickets / User">
                  <input type="number" value={form.maxTickets} onChange={(e) => setForm({ ...form, maxTickets: +e.target.value })} className="mt-1 w-full rounded-lg border bg-background px-3 py-2 text-sm" />
                </Field>
                <Field label="Free Ticket Streak" hint="Days for free ticket">
                  <input type="number" value={form.freeThreshold} onChange={(e) => setForm({ ...form, freeThreshold: +e.target.value })} className="mt-1 w-full rounded-lg border bg-background px-3 py-2 text-sm" />
                </Field>
              </div>
            </Section>

            {/* Section: Prizes */}
            <Section icon={Trophy} title="Prizes">
              <div className="space-y-3">
                {form.prizes.map((prize, i) => (
                  <div
                    key={i}
                    className={cn("rounded-xl border p-3", RANK_COLORS[i] ?? "border-border bg-card")}
                  >
                    <div className="mb-2 flex items-center justify-between">
                      <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                        {RANK_LABELS[i] ?? `#${prize.rank} Prize`}
                      </span>
                      {form.prizes.length > 1 && (
                        <Button size="sm" variant="ghost" onClick={() => removePrize(i)} className="h-6 w-6 p-0 text-destructive hover:text-destructive">
                          <Trash2 className="size-3" />
                        </Button>
                      )}
                    </div>
                    <div className="grid gap-3 sm:grid-cols-[1fr_120px_auto]">
                      <div className="space-y-2">
                        <input
                          value={prize.name}
                          onChange={(e) => updatePrize(i, "name", e.target.value)}
                          placeholder="Prize name (e.g. OPCG Booster Box)"
                          className="mt-1 w-full rounded-lg border bg-background px-3 py-2 text-sm"
                        />
                        <div className="flex items-center gap-2">
                          <span className="shrink-0 text-xs text-muted-foreground">+ Honey Bonus</span>
                          <input
                            type="number"
                            value={prize.honeyBonus ?? 0}
                            onChange={(e) => updatePrize(i, "honeyBonus", +e.target.value)}
                            className="mt-1 w-24 rounded-lg border bg-background px-3 py-2 text-sm"
                          />
                        </div>
                      </div>
                      <ImageUploader
                        value={prize.imageUrl ?? ""}
                        onChange={(url) => updatePrize(i, "imageUrl", url)}
                        folder="prizes"
                        height="h-20"
                      />
                    </div>
                  </div>
                ))}
              </div>
              <Button size="sm" variant="outline" onClick={addPrize} className="mt-2 w-full gap-1.5 border-dashed">
                <Plus className="size-3.5" /> Add Another Prize
              </Button>
            </Section>

            {/* Save */}
            <div className="flex items-center gap-3 border-t pt-4">
              <Button
                onClick={handleSave}
                disabled={loading || !form.month || !form.title || !form.prizes[0]?.name}
                className="gap-1.5"
              >
                {loading ? <Loader2 className="size-4 animate-spin" /> : null}
                {editingId ? "Save Changes" : "Create Machine"}
              </Button>
              <Button variant="ghost" onClick={() => setShowForm(false)}>Cancel</Button>
            </div>
          </div>
        </div>
      )}

      {/* ─── Machine List ─── */}
      {raffles.length === 0 && !showForm ? (
        <div className="flex flex-col items-center gap-3 rounded-xl border py-16 text-center">
          <div className="flex size-14 items-center justify-center rounded-2xl bg-muted">
            <Ticket className="size-7 text-muted-foreground/30" />
          </div>
          <p className="text-sm font-medium text-muted-foreground">No machines yet</p>
          <p className="text-xs text-muted-foreground/60">Create your first gacha machine to get started</p>
        </div>
      ) : (
        <div className="space-y-3">
          {months.map((month) => {
            const monthRaffles = raffles.filter((r) => r.month === month).sort((a, b) => a.sortOrder - b.sortOrder);
            const isExpanded = expandedMonth === month || expandedMonth === null;
            const isCurrent = month === currentMonth();

            return (
              <div key={month} className={cn("rounded-xl border bg-card", isCurrent && "border-primary/30")}>
                <button
                  onClick={() => setExpandedMonth(isExpanded && expandedMonth !== null ? null : month)}
                  className="flex w-full items-center justify-between px-4 py-3 text-left"
                >
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-sm font-semibold">{month}</span>
                    {isCurrent && (
                      <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-bold text-primary">
                        CURRENT
                      </span>
                    )}
                    <span className="rounded-full bg-muted px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
                      {monthRaffles.length} machine{monthRaffles.length !== 1 ? "s" : ""}
                    </span>
                  </div>
                  {isExpanded ? <ChevronUp className="size-4 text-muted-foreground" /> : <ChevronDown className="size-4 text-muted-foreground" />}
                </button>

                {isExpanded && (
                  <div className="space-y-2 px-4 pb-4">
                    {monthRaffles.map((r) => (
                      <MachineCard
                        key={r.id}
                        raffle={r}
                        drawingId={drawingId}
                        onEdit={() => openEditForm(r)}
                        onDuplicate={() => handleDuplicate(r)}
                        onToggleActive={() => handleToggleActive(r)}
                        onDraw={() => handleDraw(r.id)}
                        onDelete={() => handleDelete(r.id)}
                      />
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* ─── Machine Card in List ─── */

function MachineCard({
  raffle: r,
  drawingId,
  onEdit,
  onDuplicate,
  onToggleActive,
  onDraw,
  onDelete,
}: {
  raffle: Raffle;
  drawingId: number | null;
  onEdit: () => void;
  onDuplicate: () => void;
  onToggleActive: () => void;
  onDraw: () => void;
  onDelete: () => void;
}) {
  return (
    <div
      className="rounded-xl border p-4 transition-colors hover:bg-muted/20"
      style={r.color ? { borderLeftWidth: 4, borderLeftColor: r.color } : undefined}
    >
      <div className="flex gap-4">
        {/* Image */}
        {r.imageUrl ? (
          <img src={r.imageUrl} alt={r.title} className="size-16 shrink-0 rounded-xl object-contain" />
        ) : (
          <div
            className="flex size-16 shrink-0 items-center justify-center rounded-xl"
            style={{ backgroundColor: `${r.color ?? "#666"}15` }}
          >
            <Box className="size-7 opacity-30" style={{ color: r.color ?? undefined }} />
          </div>
        )}

        <div className="min-w-0 flex-1">
          {/* Header row */}
          <div className="flex items-start justify-between gap-2">
            <div>
              <div className="flex items-center gap-2">
                <span className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs text-muted-foreground">
                  {r.slug}
                </span>
                {r.isActive && !r.drawnAt && (
                  <span className="rounded-full bg-price-up/10 px-2 py-0.5 text-xs font-bold text-price-up">ACTIVE</span>
                )}
                {r.drawnAt && (
                  <span className="rounded-full bg-amber-500/10 px-2 py-0.5 text-xs font-bold text-amber-500">DRAWN</span>
                )}
                {!r.isActive && !r.drawnAt && (
                  <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-bold text-muted-foreground">INACTIVE</span>
                )}
              </div>
              <h3 className="mt-1 text-sm font-semibold">{r.title}</h3>
              {r.description && <p className="text-xs text-muted-foreground">{r.description}</p>}
            </div>
            <div className="shrink-0 text-right">
              <p className="text-sm font-bold tabular-nums">{r.totalTickets}</p>
              <p className="text-xs text-muted-foreground">{r.totalParticipants} players</p>
            </div>
          </div>

          {/* Stats */}
          <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
            <span>Cost: <b className="text-foreground">{r.ticketCost}</b> pts</span>
            <span>Max: <b className="text-foreground">{r.maxTickets}</b>/user</span>
            <span>Free at: <b className="text-foreground">{r.freeThreshold}</b>d streak</span>
            <span>Order: {r.sortOrder}</span>
          </div>

          {/* Prizes */}
          {r.prizes.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-2">
              {r.prizes.map((p) => (
                <div key={p.rank} className="flex items-center gap-1.5 rounded-lg bg-muted/50 px-2 py-1">
                  {p.imageUrl ? (
                    <img src={p.imageUrl} alt={p.name} className="size-5 rounded object-contain" />
                  ) : (
                    <Gift className="size-3.5 text-amber-500" />
                  )}
                  <span className="text-xs font-medium">#{p.rank} {p.name}</span>
                  {p.honeyBonus ? <span className="text-xs text-amber-500">+{p.honeyBonus}</span> : null}
                </div>
              ))}
            </div>
          )}

          {/* Winner */}
          {r.drawnAt && r.winnerId && (
            <div className="mt-2 rounded-lg bg-amber-500/5 border border-amber-500/20 px-3 py-1.5 text-xs">
              <span className="font-medium text-amber-600">Winner:</span> <span className="font-mono text-xs">{r.winnerId}</span>
            </div>
          )}

          {/* Actions */}
          <div className="mt-3 flex flex-wrap items-center gap-1.5">
            {!r.drawnAt && (
              <>
                <Button size="sm" variant="ghost" onClick={onEdit} className="h-7 gap-1 px-2 text-xs">
                  <Pencil className="size-3" /> Edit
                </Button>
                <Button size="sm" variant="ghost" onClick={onToggleActive} className="h-7 gap-1 px-2 text-xs">
                  <Power className="size-3" /> {r.isActive ? "Deactivate" : "Activate"}
                </Button>
                {r.isActive && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={onDraw}
                    disabled={drawingId === r.id || r.totalTickets === 0}
                    className="h-7 gap-1 px-2 text-xs"
                  >
                    {drawingId === r.id ? <Loader2 className="size-3 animate-spin" /> : <Trophy className="size-3" />}
                    Draw Winner
                  </Button>
                )}
                {r.totalTickets === 0 && (
                  <Button size="sm" variant="ghost" onClick={onDelete} className="h-7 gap-1 px-2 text-xs text-destructive hover:text-destructive">
                    <Trash2 className="size-3" /> Delete
                  </Button>
                )}
              </>
            )}
            <Button size="sm" variant="ghost" onClick={onDuplicate} className="h-7 gap-1 px-2 text-xs">
              <Copy className="size-3" /> Duplicate
            </Button>
          </div>
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
            {/* Year nav */}
            <div className="mb-2 flex items-center justify-between">
              <button type="button" onClick={() => setViewYear((y) => y - 1)} className="rounded-lg p-1 hover:bg-muted">
                <ChevronLeft className="size-4" />
              </button>
              <span className="text-sm font-bold">{viewYear}</span>
              <button type="button" onClick={() => setViewYear((y) => y + 1)} className="rounded-lg p-1 hover:bg-muted">
                <ChevronRight className="size-4" />
              </button>
            </div>

            {/* Month grid */}
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
