"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Ticket, Trophy, Plus, Loader2 } from "lucide-react";

type Prize = { rank: number; name: string; honeyBonus?: number };

type Raffle = {
  id: number;
  month: string;
  title: string;
  titleEn: string | null;
  titleTh: string | null;
  description: string | null;
  prizes: Prize[];
  ticketCost: number;
  maxTickets: number;
  freeThreshold: number;
  isActive: boolean;
  drawnAt: string | null;
  winnerId: string | null;
  totalTickets: number;
  totalParticipants: number;
  createdAt: string;
};

export function RaffleManager({ initialRaffles }: { initialRaffles: Raffle[] }) {
  const [raffles, setRaffles] = useState(initialRaffles);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [drawingId, setDrawingId] = useState<number | null>(null);

  const [form, setForm] = useState({
    month: "",
    title: "",
    titleEn: "",
    titleTh: "",
    description: "",
    ticketCost: 50,
    maxTickets: 5,
    freeThreshold: 7,
    prize1Name: "OPCG Booster Box",
    prize1Bonus: 0,
    prize2Name: "OPCG Booster Packs x5",
    prize2Bonus: 0,
    prize3Name: "OPCG Starter Deck",
    prize3Bonus: 0,
  });

  const handleCreate = async () => {
    if (!form.month || !form.title || !form.prize1Name) return;
    setLoading(true);
    try {
      const prizes: Prize[] = [
        { rank: 1, name: form.prize1Name, honeyBonus: form.prize1Bonus || undefined },
      ];
      if (form.prize2Name) prizes.push({ rank: 2, name: form.prize2Name, honeyBonus: form.prize2Bonus || undefined });
      if (form.prize3Name) prizes.push({ rank: 3, name: form.prize3Name, honeyBonus: form.prize3Bonus || undefined });

      const res = await fetch("/api/admin/honey/raffle", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          month: form.month,
          title: form.title,
          titleEn: form.titleEn || undefined,
          titleTh: form.titleTh || undefined,
          description: form.description || undefined,
          ticketCost: form.ticketCost,
          maxTickets: form.maxTickets,
          freeThreshold: form.freeThreshold,
          prizes,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setRaffles((prev) => [
          { ...data.raffle, totalTickets: 0, totalParticipants: 0, createdAt: new Date().toISOString() },
          ...prev,
        ]);
        setShowForm(false);
        setForm({ month: "", title: "", titleEn: "", titleTh: "", description: "", ticketCost: 50, maxTickets: 5, freeThreshold: 7, prize1Name: "OPCG Booster Box", prize1Bonus: 0, prize2Name: "OPCG Booster Packs x5", prize2Bonus: 0, prize3Name: "OPCG Starter Deck", prize3Bonus: 0 });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDraw = async (raffleId: number) => {
    if (!confirm("Draw winner? This cannot be undone.")) return;
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
              : r
          )
        );
      }
    } finally {
      setDrawingId(null);
    }
  };

  const nextMonth = () => {
    const d = new Date();
    d.setMonth(d.getMonth() + 1);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">Monthly Raffle Management</h1>
        <Button size="sm" onClick={() => { setForm((f) => ({ ...f, month: f.month || nextMonth() })); setShowForm(!showForm); }}>
          <Plus className="mr-1 size-4" /> New Raffle
        </Button>
      </div>

      {showForm && (
        <div className="rounded-xl border bg-card p-5 space-y-3">
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="text-xs font-medium text-muted-foreground">Month (YYYY-MM)</label>
              <input value={form.month} onChange={(e) => setForm({ ...form, month: e.target.value })} placeholder="2026-05" className="mt-1 w-full rounded-lg border bg-background px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground">Title</label>
              <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="May 2026 Raffle" className="mt-1 w-full rounded-lg border bg-background px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground">Title (EN)</label>
              <input value={form.titleEn} onChange={(e) => setForm({ ...form, titleEn: e.target.value })} className="mt-1 w-full rounded-lg border bg-background px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground">Title (TH)</label>
              <input value={form.titleTh} onChange={(e) => setForm({ ...form, titleTh: e.target.value })} className="mt-1 w-full rounded-lg border bg-background px-3 py-2 text-sm" />
            </div>
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground">Description</label>
            <input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="mt-1 w-full rounded-lg border bg-background px-3 py-2 text-sm" />
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            <div>
              <label className="text-xs font-medium text-muted-foreground">Ticket Cost (pts)</label>
              <input type="number" value={form.ticketCost} onChange={(e) => setForm({ ...form, ticketCost: +e.target.value })} className="mt-1 w-full rounded-lg border bg-background px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground">Max Tickets / User</label>
              <input type="number" value={form.maxTickets} onChange={(e) => setForm({ ...form, maxTickets: +e.target.value })} className="mt-1 w-full rounded-lg border bg-background px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground">Free Ticket Streak</label>
              <input type="number" value={form.freeThreshold} onChange={(e) => setForm({ ...form, freeThreshold: +e.target.value })} className="mt-1 w-full rounded-lg border bg-background px-3 py-2 text-sm" />
            </div>
          </div>
          <p className="text-xs font-medium text-muted-foreground">Prizes (physical OPCG items)</p>
          {([1, 2, 3] as const).map((n) => {
            const nameKey = `prize${n}Name` as const;
            const bonusKey = `prize${n}Bonus` as const;
            const labels = ["1st Prize", "2nd Prize", "3rd Prize"];
            return (
              <div key={n} className="grid gap-3 sm:grid-cols-3">
                <div className="sm:col-span-2">
                  <label className="text-xs font-medium text-muted-foreground">{labels[n - 1]} Name</label>
                  <input value={(form as Record<string, string | number>)[nameKey] as string} onChange={(e) => setForm({ ...form, [nameKey]: e.target.value })} placeholder={n === 1 ? "OPCG Booster Box" : n === 2 ? "OPCG Booster Packs x5" : "OPCG Starter Deck"} className="mt-1 w-full rounded-lg border bg-background px-3 py-2 text-sm" />
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground">+ Honey Bonus</label>
                  <input type="number" value={(form as Record<string, string | number>)[bonusKey] as number} onChange={(e) => setForm({ ...form, [bonusKey]: +e.target.value })} className="mt-1 w-full rounded-lg border bg-background px-3 py-2 text-sm" />
                </div>
              </div>
            );
          })}
          <div className="flex gap-2">
            <Button size="sm" onClick={handleCreate} disabled={loading || !form.month || !form.title || !form.prize1Name}>
              {loading ? <Loader2 className="size-4 animate-spin" /> : "Create Raffle"}
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setShowForm(false)}>Cancel</Button>
          </div>
        </div>
      )}

      <div className="space-y-3">
        {raffles.length === 0 ? (
          <div className="flex flex-col items-center gap-2 rounded-xl border py-14 text-center">
            <Ticket className="size-8 text-muted-foreground/20" />
            <p className="text-sm text-muted-foreground">No raffles yet</p>
          </div>
        ) : (
          raffles.map((r) => (
            <div key={r.id} className="rounded-xl border bg-card p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono text-muted-foreground">{r.month}</span>
                    {r.isActive && !r.drawnAt && (
                      <span className="rounded-full bg-price-up/10 px-2 py-0.5 text-[10px] font-bold text-price-up">ACTIVE</span>
                    )}
                    {r.drawnAt && (
                      <span className="rounded-full bg-amber-100 dark:bg-amber-500/10 px-2 py-0.5 text-[10px] font-bold text-amber-600 dark:text-amber-400">DRAWN</span>
                    )}
                  </div>
                  <h3 className="mt-1 text-sm font-semibold">{r.title}</h3>
                  {r.description && <p className="text-xs text-muted-foreground">{r.description}</p>}
                </div>
                <div className="text-right text-xs text-muted-foreground">
                  <p>{r.totalTickets} tickets</p>
                  <p>{r.totalParticipants} participants</p>
                </div>
              </div>

              <div className="mt-3 flex items-center gap-4 text-xs text-muted-foreground">
                <span>Cost: {r.ticketCost} pts</span>
                <span>Max: {r.maxTickets}/user</span>
                <span>Free at: {r.freeThreshold}-day streak</span>
              </div>

              {r.prizes.length > 0 && (
                <div className="mt-2 space-y-1">
                  {r.prizes.map((p) => (
                    <div key={p.rank} className="flex items-center gap-2 text-xs">
                      <Trophy className="size-3 text-amber-600 dark:text-amber-400" />
                      <span className="text-muted-foreground">#{p.rank}</span>
                      <span className="font-medium">{p.name}</span>
                      {p.honeyBonus ? (
                        <span className="text-amber-600 dark:text-amber-400">+{p.honeyBonus} pts</span>
                      ) : null}
                    </div>
                  ))}
                </div>
              )}

              {r.drawnAt && r.winnerId && (
                <div className="mt-2 rounded-lg bg-amber-50 dark:bg-amber-900/20 p-2 text-xs">
                  <span className="font-medium text-amber-600">Winner:</span> {r.winnerId}
                </div>
              )}

              {r.isActive && !r.drawnAt && (
                <div className="mt-3">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleDraw(r.id)}
                    disabled={drawingId === r.id || r.totalTickets === 0}
                    className="gap-1.5"
                  >
                    {drawingId === r.id ? <Loader2 className="size-3.5 animate-spin" /> : <Trophy className="size-3.5" />}
                    Draw Winner
                  </Button>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
