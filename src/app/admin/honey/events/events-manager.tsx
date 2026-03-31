"use client";

import { useState } from "react";
import { CalendarDays, Plus, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

type SeasonalEvent = {
  id: number;
  name: string;
  nameEn: string | null;
  nameTh: string | null;
  description: string | null;
  startDate: string;
  endDate: string;
  honeyMultiplier: number;
  isActive: boolean;
  createdAt: string;
};

export function EventsManager({ initialEvents }: { initialEvents: SeasonalEvent[] }) {
  const [events, setEvents] = useState(initialEvents);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    name: "",
    nameEn: "",
    nameTh: "",
    description: "",
    startDate: "",
    endDate: "",
    honeyMultiplier: 2,
  });

  const handleCreate = async () => {
    const res = await fetch("/api/admin/honey/events", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: form.name,
        nameEn: form.nameEn || undefined,
        nameTh: form.nameTh || undefined,
        description: form.description || undefined,
        startDate: form.startDate,
        endDate: form.endDate,
        honeyMultiplier: form.honeyMultiplier,
      }),
    });
    if (res.ok) {
      const data = await res.json();
      setEvents((prev) => [{
        ...data.event,
        startDate: data.event.startDate,
        endDate: data.event.endDate,
        createdAt: data.event.createdAt,
      }, ...prev]);
      setShowForm(false);
      setForm({ name: "", nameEn: "", nameTh: "", description: "", startDate: "", endDate: "", honeyMultiplier: 2 });
    }
  };

  const toggleActive = async (id: number, isActive: boolean) => {
    const res = await fetch("/api/admin/honey/events", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, isActive: !isActive }),
    });
    if (res.ok) {
      setEvents((prev) => prev.map((e) => (e.id === id ? { ...e, isActive: !isActive } : e)));
    }
  };

  const now = new Date();

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Seasonal Events</h1>
        <Button size="sm" onClick={() => setShowForm(!showForm)} className="gap-1.5">
          <Plus className="h-4 w-4" /> New Event
        </Button>
      </div>

      {showForm && (
        <div className="panel space-y-3 p-4">
          <h2 className="font-semibold">Create Seasonal Event</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            <input placeholder="Name (JP)" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} className="rounded-lg border bg-background px-3 py-2 text-sm" />
            <input placeholder="Name (EN)" value={form.nameEn} onChange={(e) => setForm((f) => ({ ...f, nameEn: e.target.value }))} className="rounded-lg border bg-background px-3 py-2 text-sm" />
            <input placeholder="Name (TH)" value={form.nameTh} onChange={(e) => setForm((f) => ({ ...f, nameTh: e.target.value }))} className="rounded-lg border bg-background px-3 py-2 text-sm" />
            <input placeholder="Description" value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} className="rounded-lg border bg-background px-3 py-2 text-sm" />
            <div>
              <label className="mb-1 block text-xs text-muted-foreground">Start Date</label>
              <input type="datetime-local" value={form.startDate} onChange={(e) => setForm((f) => ({ ...f, startDate: e.target.value }))} className="w-full rounded-lg border bg-background px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="mb-1 block text-xs text-muted-foreground">End Date</label>
              <input type="datetime-local" value={form.endDate} onChange={(e) => setForm((f) => ({ ...f, endDate: e.target.value }))} className="w-full rounded-lg border bg-background px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="mb-1 block text-xs text-muted-foreground">Honey Multiplier</label>
              <input type="number" step="0.1" min="1" value={form.honeyMultiplier} onChange={(e) => setForm((f) => ({ ...f, honeyMultiplier: Number(e.target.value) }))} className="w-full rounded-lg border bg-background px-3 py-2 text-sm" />
            </div>
          </div>
          <div className="flex gap-2">
            <Button size="sm" onClick={handleCreate}>Create</Button>
            <Button size="sm" variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
          </div>
        </div>
      )}

      <div className="space-y-2">
        {events.map((ev) => {
          const start = new Date(ev.startDate);
          const end = new Date(ev.endDate);
          const isLive = ev.isActive && start <= now && end >= now;

          return (
            <div key={ev.id} className="panel flex items-center gap-3 p-4">
              <div className={`rounded-lg p-2 ${isLive ? "bg-green-500/10" : "bg-muted"}`}>
                {isLive ? <Sparkles className="h-5 w-5 text-green-500" /> : <CalendarDays className="h-5 w-5 text-muted-foreground" />}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <p className="font-semibold">{ev.nameEn ?? ev.name}</p>
                  {isLive && <span className="rounded-full bg-green-500/10 px-2 py-0.5 text-[10px] font-bold text-green-500">LIVE</span>}
                  {!ev.isActive && <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-bold text-muted-foreground">DISABLED</span>}
                </div>
                <p className="text-xs text-muted-foreground">
                  {start.toLocaleDateString()} ~ {end.toLocaleDateString()} | {ev.honeyMultiplier}x multiplier
                </p>
                {ev.description && <p className="mt-0.5 text-xs text-muted-foreground">{ev.description}</p>}
              </div>
              <Button size="sm" variant="outline" onClick={() => toggleActive(ev.id, ev.isActive)}>
                {ev.isActive ? "Disable" : "Enable"}
              </Button>
            </div>
          );
        })}
        {events.length === 0 && (
          <p className="py-8 text-center text-sm text-muted-foreground">No events yet</p>
        )}
      </div>
    </div>
  );
}
