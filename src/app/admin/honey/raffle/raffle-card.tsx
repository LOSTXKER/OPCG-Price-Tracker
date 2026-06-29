"use client";

import { Button } from "@/components/ui/button";
import {
  Box,
  Copy,
  Gift,
  Loader2,
  Pencil,
  Power,
  Trash2,
  Trophy,
} from "lucide-react";
import type { Raffle } from "./raffle-manager";

export type RaffleCardProps = {
  raffle: Raffle;
  drawingId: number | null;
  onEdit: () => void;
  onDuplicate: () => void;
  onToggleActive: () => void;
  onDraw: () => void;
  onDelete: () => void;
};

export function RaffleCard({
  raffle: r,
  drawingId,
  onEdit,
  onDuplicate,
  onToggleActive,
  onDraw,
  onDelete,
}: RaffleCardProps) {
  return (
    <div
      className="rounded-xl border p-4 motion-base hover:bg-muted/70"
      style={r.color ? { borderLeftWidth: 4, borderLeftColor: r.color } : undefined}
    >
      <div className="flex gap-4">
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
          <div className="flex items-start justify-between gap-2">
            <div>
              <div className="flex items-center gap-2">
                <span className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs text-muted-foreground">
                  {r.slug}
                </span>
                {r.isActive && !r.drawnAt && (
                  <span className="rounded-full bg-price-up/10 px-2 py-0.5 text-xs font-bold text-price-up">เปิดใช้งาน</span>
                )}
                {r.drawnAt && (
                  <span className="rounded-full bg-amber-500/10 px-2 py-0.5 text-xs font-bold text-amber-500">สุ่มแล้ว</span>
                )}
                {!r.isActive && !r.drawnAt && (
                  <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-bold text-muted-foreground">ปิดใช้งาน</span>
                )}
              </div>
              <h3 className="mt-1 text-sm font-semibold">{r.title}</h3>
              {r.description && <p className="text-meta">{r.description}</p>}
            </div>
            <div className="shrink-0 text-right">
              <p className="text-sm font-bold tabular-nums">{r.totalTickets}</p>
              <p className="text-meta">{r.totalParticipants} ผู้เล่น</p>
            </div>
          </div>

          <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-meta">
            <span>ราคา: <b className="text-foreground">{r.ticketCost}</b> pts</span>
            <span>สูงสุด: <b className="text-foreground">{r.maxTickets}</b>/คน</span>
            <span>ฟรีเมื่อ: สตรีค <b className="text-foreground">{r.freeThreshold}</b> วัน</span>
            <span>ลำดับ: {r.sortOrder}</span>
          </div>

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

          {r.drawnAt && r.winnerId && (
            <div className="mt-2 rounded-lg bg-amber-500/5 border border-amber-500/20 px-3 py-1.5 text-xs">
              <span className="font-medium text-amber-600">ผู้ชนะ:</span> <span className="font-mono text-xs">{r.winnerId}</span>
            </div>
          )}

          <div className="mt-3 flex flex-wrap items-center gap-1.5">
            {!r.drawnAt && (
              <>
                <Button size="sm" variant="ghost" onClick={onEdit} className="h-7 gap-1 px-2 text-xs">
                  <Pencil className="size-3" /> แก้ไข
                </Button>
                <Button size="sm" variant="ghost" onClick={onToggleActive} className="h-7 gap-1 px-2 text-xs">
                  <Power className="size-3" /> {r.isActive ? "ปิดใช้งาน" : "เปิดใช้งาน"}
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
                    สุ่มผู้ชนะ
                  </Button>
                )}
                {r.totalTickets === 0 && (
                  <Button size="sm" variant="ghost" onClick={onDelete} className="h-7 gap-1 px-2 text-xs text-destructive hover:text-destructive">
                    <Trash2 className="size-3" /> ลบ
                  </Button>
                )}
              </>
            )}
            <Button size="sm" variant="ghost" onClick={onDuplicate} className="h-7 gap-1 px-2 text-xs">
              <Copy className="size-3" /> คัดลอก
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
