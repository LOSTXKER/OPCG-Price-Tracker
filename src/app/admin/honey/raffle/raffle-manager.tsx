"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import {
  Calendar,
  ChevronDown,
  ChevronUp,
  Gift,
  Plus,
  Ticket,
} from "lucide-react";

import { useConfirm } from "@/components/admin/confirm-dialog";
import { Button } from "@/components/ui/button";
import { AdminPage } from "@/components/admin/admin-page";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { AdminEmptyState } from "@/components/admin/admin-empty-state";
import { adminFetch } from "@/lib/admin/admin-fetch";
import { cn } from "@/lib/utils";

import { RaffleCard } from "./raffle-card";
import type { Prize } from "./raffle-form";

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

function currentMonth() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

export function RaffleManager({ initialRaffles }: { initialRaffles: Raffle[] }) {
  const router = useRouter();
  const confirmDialog = useConfirm();
  const [raffles, setRaffles] = useState(initialRaffles);
  const [drawingId, setDrawingId] = useState<number | null>(null);
  const [expandedMonth, setExpandedMonth] = useState<string | null>(null);

  const months = [...new Set(raffles.map((r) => r.month))].sort().reverse();
  const hasCurrentMonth = raffles.some((r) => r.month === currentMonth());

  const handleDraw = async (raffleId: number) => {
    const ok = await confirmDialog({
      title: "สุ่มผู้โชคดี",
      description: "ต้องการสุ่มผู้โชคดีหรือไม่? ไม่สามารถย้อนกลับได้",
      confirmLabel: "สุ่มเลย",
      variant: "destructive",
    });
    if (!ok) return;
    setDrawingId(raffleId);
    try {
      const data = await adminFetch<{ winnerId: string }>("/api/admin/honey/raffle", {
        method: "POST",
        body: { action: "draw", raffleId },
      });
      setRaffles((prev) =>
        prev.map((r) =>
          r.id === raffleId
            ? {
                ...r,
                drawnAt: new Date().toISOString(),
                winnerId: data.winnerId,
                isActive: false,
              }
            : r,
        ),
      );
      toast.success("สุ่มผู้โชคดีแล้ว");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "สุ่มไม่สำเร็จ");
    } finally {
      setDrawingId(null);
    }
  };

  const handleToggleActive = async (r: Raffle) => {
    try {
      await adminFetch("/api/admin/honey/raffle", {
        method: "PUT",
        body: { id: r.id, isActive: !r.isActive },
      });
      setRaffles((prev) =>
        prev.map((x) => (x.id === r.id ? { ...x, isActive: !x.isActive } : x)),
      );
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "อัปเดตไม่สำเร็จ");
    }
  };

  const handleDelete = async (raffleId: number) => {
    const okDel = await confirmDialog({
      title: "ลบตู้กาชาปอง",
      description: "ลบตู้นี้หรือไม่? ตั๋วทั้งหมดจะถูกลบด้วย",
      confirmLabel: "ลบ",
      variant: "destructive",
    });
    if (!okDel) return;
    try {
      await adminFetch(`/api/admin/honey/raffle?id=${raffleId}`, { method: "DELETE" });
      setRaffles((prev) => prev.filter((r) => r.id !== raffleId));
      toast.success("ลบตู้แล้ว");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "ลบไม่สำเร็จ");
    }
  };

  return (
    <AdminPage
      header={
        <AdminPageHeader
          title="จัดการตู้ Raffle"
          icon={Gift}
          description={
            <>
              เดือนปัจจุบัน:{" "}
              <span className="font-mono font-semibold text-foreground">
                {currentMonth()}
              </span>
            </>
          }
          meta={<span className="text-meta">{raffles.length} ตู้</span>}
          actions={
            <Button render={<Link href="/admin/honey/raffle/new" />} size="sm">
              <Plus className="mr-1.5 size-4" /> เพิ่มตู้ใหม่
            </Button>
          }
        />
      }
    >
      {!hasCurrentMonth && (
        <div className="flex items-center gap-3 rounded-xl border border-warning/30 bg-warning-soft px-4 py-3">
          <Calendar className="size-5 text-warning" />
          <div className="flex-1">
            <p className="text-sm font-medium">ยังไม่มีตู้สำหรับ {currentMonth()}</p>
            <p className="text-meta">ผู้ใช้จะไม่เห็น Raffle ในเดือนนี้</p>
          </div>
          <Button
            render={<Link href="/admin/honey/raffle/new" />}
            size="sm"
            variant="outline"
            className="shrink-0 gap-1.5 border-warning/30 text-warning hover:bg-warning-soft"
          >
            <Plus className="size-3.5" /> สร้างตอนนี้
          </Button>
        </div>
      )}

      {raffles.length === 0 ? (
        <AdminEmptyState
          icon={Ticket}
          title="ยังไม่มีตู้"
          description="สร้างตู้ Raffle แรกเพื่อเริ่มต้น"
          action={
            <Button render={<Link href="/admin/honey/raffle/new" />} size="sm">
              <Plus className="size-4" /> เพิ่มตู้ใหม่
            </Button>
          }
        />
      ) : (
        <div className="space-y-3">
          {months.map((month) => {
            const monthRaffles = raffles
              .filter((r) => r.month === month)
              .sort((a, b) => a.sortOrder - b.sortOrder);
            const isExpanded = expandedMonth === month || expandedMonth === null;
            const isCurrent = month === currentMonth();

            return (
              <div
                key={month}
                className={cn(
                  "rounded-xl border bg-card",
                  isCurrent && "border-primary/30",
                )}
              >
                <button
                  onClick={() =>
                    setExpandedMonth(
                      isExpanded && expandedMonth !== null ? null : month,
                    )
                  }
                  className="flex w-full items-center justify-between px-4 py-3 text-left"
                >
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-sm font-semibold">{month}</span>
                    {isCurrent && (
                      <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-bold text-primary">
                        ปัจจุบัน
                      </span>
                    )}
                    <span className="rounded-full bg-muted px-2 py-0.5 text-micro text-muted-foreground">
                      {monthRaffles.length} ตู้
                    </span>
                  </div>
                  {isExpanded ? (
                    <ChevronUp className="size-4 text-muted-foreground" />
                  ) : (
                    <ChevronDown className="size-4 text-muted-foreground" />
                  )}
                </button>

                {isExpanded && (
                  <div className="space-y-2 px-4 pb-4">
                    {monthRaffles.map((r) => (
                      <RaffleCard
                        key={r.id}
                        raffle={r}
                        drawingId={drawingId}
                        onEdit={() => router.push(`/admin/honey/raffle/${r.id}`)}
                        onDuplicate={() =>
                          router.push(`/admin/honey/raffle/new?clone=${r.id}`)
                        }
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
    </AdminPage>
  );
}
