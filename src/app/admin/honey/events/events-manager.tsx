"use client";

import { useState } from "react";
import { CalendarDays, Plus, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AdminEmptyState } from "@/components/admin/admin-empty-state";

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
      toast.success("Event created");
    } else {
      toast.error("Failed to create event");
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
      toast.success(isActive ? "Event disabled" : "Event enabled");
    }
  };

  const now = new Date();

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Seasonal Events"
        icon={CalendarDays}
        badge={<Badge variant="secondary">{events.length} events</Badge>}
        actions={
          <Button size="sm" onClick={() => setShowForm(!showForm)}>
            <Plus className="h-4 w-4" /> New Event
          </Button>
        }
      />

      {showForm && (
        <Card>
          <CardContent>
            <h2 className="mb-3 font-semibold">Create Seasonal Event</h2>
            <div className="grid gap-3 sm:grid-cols-2">
              <Input placeholder="Name (JP)" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
              <Input placeholder="Name (EN)" value={form.nameEn} onChange={(e) => setForm((f) => ({ ...f, nameEn: e.target.value }))} />
              <Input placeholder="Name (TH)" value={form.nameTh} onChange={(e) => setForm((f) => ({ ...f, nameTh: e.target.value }))} />
              <Input placeholder="Description" value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} />
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">Start Date</label>
                <Input type="datetime-local" value={form.startDate} onChange={(e) => setForm((f) => ({ ...f, startDate: e.target.value }))} />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">End Date</label>
                <Input type="datetime-local" value={form.endDate} onChange={(e) => setForm((f) => ({ ...f, endDate: e.target.value }))} />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">Honey Multiplier</label>
                <Input type="number" step="0.1" min="1" value={form.honeyMultiplier} onChange={(e) => setForm((f) => ({ ...f, honeyMultiplier: Number(e.target.value) }))} />
              </div>
            </div>
            <div className="mt-4 flex gap-2">
              <Button size="sm" onClick={handleCreate}>Create</Button>
              <Button size="sm" variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="space-y-2">
        {events.map((ev) => {
          const start = new Date(ev.startDate);
          const end = new Date(ev.endDate);
          const isLive = ev.isActive && start <= now && end >= now;

          return (
            <Card key={ev.id} size="sm">
              <CardContent className="flex items-center gap-3">
                <div className={`shrink-0 rounded-lg p-2 ${isLive ? "bg-green-500/10" : "bg-muted"}`}>
                  {isLive ? <Sparkles className="h-5 w-5 text-green-500" /> : <CalendarDays className="h-5 w-5 text-muted-foreground" />}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="font-semibold">{ev.nameEn ?? ev.name}</p>
                    {isLive && <Badge className="bg-green-500/10 text-[10px] text-green-500">LIVE</Badge>}
                    {!ev.isActive && <Badge variant="secondary" className="text-[10px]">DISABLED</Badge>}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {start.toLocaleDateString()} ~ {end.toLocaleDateString()} | {ev.honeyMultiplier}x multiplier
                  </p>
                  {ev.description && <p className="mt-0.5 text-xs text-muted-foreground">{ev.description}</p>}
                </div>
                <Button size="sm" variant="outline" onClick={() => toggleActive(ev.id, ev.isActive)}>
                  {ev.isActive ? "Disable" : "Enable"}
                </Button>
              </CardContent>
            </Card>
          );
        })}
        {events.length === 0 && (
          <AdminEmptyState icon={CalendarDays} title="No events yet" />
        )}
      </div>
    </div>
  );
}
