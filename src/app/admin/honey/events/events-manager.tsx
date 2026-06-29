"use client";

import Link from "next/link";
import { useState } from "react";
import { CalendarDays, Pencil, Plus, Sparkles } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { AdminPage } from "@/components/admin/admin-page";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { AdminStatusBadge } from "@/components/admin/admin-status-badge";
import { Surface } from "@/components/ui/surface";
import { AdminEmptyState } from "@/components/admin/admin-empty-state";
import { adminFetch } from "@/lib/admin/admin-fetch";

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

  const toggleActive = async (id: number, isActive: boolean) => {
    try {
      await adminFetch("/api/admin/honey/events", {
        method: "PATCH",
        body: { id, isActive: !isActive },
      });
      setEvents((prev) =>
        prev.map((e) => (e.id === id ? { ...e, isActive: !isActive } : e)),
      );
      toast.success(isActive ? "ปิดใช้งานอีเวนต์แล้ว" : "เปิดใช้งานอีเวนต์แล้ว");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "อัปเดตไม่สำเร็จ");
    }
  };

  const now = new Date();

  return (
    <AdminPage
      header={
        <AdminPageHeader
          title="อีเวนต์ตามฤดูกาล"
          icon={CalendarDays}
          meta={<span className="text-meta">{events.length} อีเวนต์</span>}
          actions={
            <Button render={<Link href="/admin/honey/events/new" />} size="sm">
              <Plus className="h-4 w-4" /> เพิ่มอีเวนต์
            </Button>
          }
        />
      }
    >
      <div className="space-y-2">
        {events.map((ev) => {
          const start = new Date(ev.startDate);
          const end = new Date(ev.endDate);
          const isLive = ev.isActive && start <= now && end >= now;

          return (
            <Surface key={ev.id} variant="outline" className="overflow-hidden p-4">
              <div className="flex items-center gap-3">
                <div
                  className={`shrink-0 rounded-lg p-2 ${
                    isLive ? "bg-success-soft" : "bg-muted"
                  }`}
                >
                  {isLive ? (
                    <Sparkles className="h-5 w-5 text-success" />
                  ) : (
                    <CalendarDays className="h-5 w-5 text-muted-foreground" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="text-h4">{ev.nameTh ?? ev.name}</p>
                    {isLive && <AdminStatusBadge tone="success">กำลังจัด</AdminStatusBadge>}
                    {!ev.isActive && (
                      <AdminStatusBadge tone="neutral">ปิดใช้งาน</AdminStatusBadge>
                    )}
                  </div>
                  <p className="text-meta">
                    {start.toLocaleDateString()} ~ {end.toLocaleDateString()} | ตัวคูณ {ev.honeyMultiplier}x
                  </p>
                  {ev.description && <p className="mt-0.5 text-meta">{ev.description}</p>}
                </div>
                <div className="flex shrink-0 items-center gap-1">
                  <Button
                    render={<Link href={`/admin/honey/events/${ev.id}`} title="แก้ไข" />}
                    size="sm"
                    variant="ghost"
                  >
                    <Pencil className="size-3.5" />
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => toggleActive(ev.id, ev.isActive)}
                  >
                    {ev.isActive ? "ปิดใช้งาน" : "เปิดใช้งาน"}
                  </Button>
                </div>
              </div>
            </Surface>
          );
        })}
        {events.length === 0 && (
          <AdminEmptyState
            icon={CalendarDays}
            title="ยังไม่มีอีเวนต์"
            description="สร้างอีเวนต์แรกเพื่อเริ่มตั้งตัวคูณ Honey"
            action={
              <Button render={<Link href="/admin/honey/events/new" />} size="sm">
                <Plus className="size-4" /> เพิ่มอีเวนต์
              </Button>
            }
          />
        )}
      </div>
    </AdminPage>
  );
}
