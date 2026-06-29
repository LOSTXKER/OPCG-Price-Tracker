import { ArrowDown, ArrowUp, ArrowUpDown } from "lucide-react";

import { cn } from "@/lib/utils";
import {
  AdminStatusBadge,
  type AdminStatusTone,
} from "@/components/admin/admin-status-badge";
import type { Mapping, SortKey } from "./types";

const STATUS_TONE: Record<string, AdminStatusTone> = {
  matched: "success",
  suggested: "info",
  pending: "warning",
  rejected: "danger",
};

export function StatusBadge({ status }: { status: string }) {
  return (
    <AdminStatusBadge tone={STATUS_TONE[status] ?? "neutral"}>
      {status}
    </AdminStatusBadge>
  );
}

export function PriceTag({
  label,
  value,
  highlight,
}: {
  label: string;
  value: number | null;
  highlight?: boolean;
}) {
  return (
    <div className="flex items-baseline gap-1">
      <span className="text-meta">{label}</span>
      {value != null ? (
        <span
          className={cn(
            "font-price text-xs font-semibold tabular-nums",
            highlight && "text-success"
          )}
        >
          ${value}
        </span>
      ) : (
        <span className="text-meta text-muted-foreground/40">—</span>
      )}
    </div>
  );
}

export function CompactPrices({ m }: { m: Mapping }) {
  const hasAny = m.minPriceUsd != null || m.usedMinPriceUsd != null || m.lastSoldPsa10Usd != null;
  if (!hasAny) {
    return <span className="text-meta text-muted-foreground/50">ไม่มีราคา</span>;
  }
  return (
    <div className="flex flex-col gap-0.5">
      <PriceTag label="ต่ำสุด" value={m.minPriceUsd} />
      <PriceTag label="มือสอง" value={m.usedMinPriceUsd} />
      <PriceTag label="PSA10" value={m.lastSoldPsa10Usd} highlight />
    </div>
  );
}

export function SortableHeader({
  label,
  ascKey,
  descKey,
  currentSort,
  onSort,
  className,
}: {
  label: string;
  sortKey?: string;
  ascKey: SortKey;
  descKey: SortKey;
  currentSort: SortKey;
  onSort: (s: SortKey) => void;
  className?: string;
}) {
  const isAsc = currentSort === ascKey;
  const isDesc = currentSort === descKey;
  const Icon = isAsc ? ArrowUp : isDesc ? ArrowDown : ArrowUpDown;

  return (
    <button
      onClick={() => {
        if (isAsc) onSort(descKey);
        else if (isDesc) onSort("");
        else onSort(ascKey);
      }}
      className={cn(
        "inline-flex items-center gap-1 font-medium hover:text-foreground motion-base",
        (isAsc || isDesc) && "text-foreground",
        className
      )}
    >
      {label}
      <Icon className="size-3" />
    </button>
  );
}

const STATUS_META: { key: string; label: string; color: string }[] = [
  { key: "pending", label: "รอดำเนินการ", color: "bg-warning-soft text-warning hover:bg-warning/20" },
  { key: "matched", label: "จับคู่แล้ว", color: "bg-success-soft text-success hover:bg-success/20" },
  { key: "rejected", label: "ปฏิเสธแล้ว", color: "bg-danger-soft text-danger hover:bg-danger/20" },
];

export function StatsBar({
  counts,
  activeFilter,
  onFilter,
}: {
  counts: Record<string, number>;
  activeFilter: string;
  onFilter: (s: string) => void;
}) {
  const totalAll = Object.values(counts).reduce((a, b) => a + b, 0);
  return (
    <div className="flex flex-wrap items-center gap-2">
      <button
        onClick={() => onFilter("")}
        className={cn(
          "rounded-full px-3 py-1 text-xs font-medium motion-base",
          activeFilter === ""
            ? "bg-primary text-primary-foreground"
            : "bg-muted text-muted-foreground hover:bg-muted/70"
        )}
      >
        ทั้งหมด {totalAll}
      </button>
      {STATUS_META.map((s) => (
        <button
          key={s.key}
          onClick={() => onFilter(activeFilter === s.key ? "" : s.key)}
          className={cn(
            "rounded-full px-3 py-1 text-xs font-medium motion-base",
            activeFilter === s.key
              ? "ring-2 ring-offset-1 ring-offset-background ring-current"
              : "",
            s.color
          )}
        >
          {s.label} {counts[s.key] ?? 0}
        </button>
      ))}
    </div>
  );
}

export function ShortcutLegend({ visible }: { visible: boolean }) {
  if (!visible) return null;
  const keys = [
    { key: "j / k", desc: "เลื่อนแถว" },
    { key: "x", desc: "ปฏิเสธ" },
    { key: "a", desc: "อนุมัติ" },
    { key: "Esc", desc: "ล้างที่เลือก" },
  ];
  return (
    <div className="flex items-center gap-4 rounded-lg border border-border bg-muted/40 px-3 py-1.5">
      {keys.map((k) => (
        <span key={k.key} className="inline-flex items-center gap-1.5 text-meta">
          <kbd className="rounded border border-border bg-background px-1.5 py-0.5 font-mono text-overlay text-foreground shadow-sm">
            {k.key}
          </kbd>
          {k.desc}
        </span>
      ))}
    </div>
  );
}
