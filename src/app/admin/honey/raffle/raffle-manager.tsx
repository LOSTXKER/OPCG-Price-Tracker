"use client";

import { useState } from "react";
import { useConfirm } from "@/components/admin/confirm-dialog";
import { Button } from "@/components/ui/button";
import {
  Calendar,
  ChevronDown,
  ChevronUp,
  Plus,
  Ticket,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { RaffleForm } from "./raffle-form";
import { RaffleCard } from "./raffle-card";

export type Prize = { rank: number; name: string; imageUrl?: string; honeyBonus?: number };

export type Raffle = {
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

export type FormState = {
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

export function slugify(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/-+$/, "").replace(/^-+/, "");
}

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

export function RaffleManager({ initialRaffles }: { initialRaffles: Raffle[] }) {
  const confirmDialog = useConfirm();
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
    const ok = await confirmDialog({ title: "สุ่มผู้โชคดี", description: "ต้องการสุ่มผู้โชคดีหรือไม่? ไม่สามารถย้อนกลับได้", confirmLabel: "สุ่มเลย", variant: "destructive" });
    if (!ok) return;
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
    const okDel = await confirmDialog({ title: "ลบตู้กาชาปอง", description: "ลบตู้นี้หรือไม่? ตั๋วทั้งหมดจะถูกลบด้วย", confirmLabel: "ลบ", variant: "destructive" });
    if (!okDel) return;
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

      {!hasCurrentMonth && !showForm && (
        <div className="flex items-center gap-3 rounded-xl border border-amber-500/30 bg-amber-500/5 px-4 py-3">
          <Calendar className="size-5 text-amber-500" />
          <div className="flex-1">
            <p className="text-sm font-medium">No machine for {currentMonth()}</p>
            <p className="text-xs text-muted-foreground">Users won&apos;t see any raffle this month.</p>
          </div>
          <Button size="sm" variant="outline" onClick={openCreateForm} className="shrink-0 gap-1.5 border-amber-500/30 text-amber-600 hover:bg-amber-500/10">
            <Plus className="size-3.5" /> Create Now
          </Button>
        </div>
      )}

      {showForm && (
        <RaffleForm
          form={form}
          editingId={editingId}
          loading={loading}
          onFormChange={setForm}
          onSave={handleSave}
          onCancel={() => setShowForm(false)}
          onUpdatePrize={updatePrize}
          onAddPrize={addPrize}
          onRemovePrize={removePrize}
        />
      )}

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
                      <RaffleCard
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
