"use client";

import { useState, useMemo } from "react";
import {
  RefreshCw,
  ChevronDown,
  Pencil,
  Check,
  X,
  Loader2,
  Library,
  Package,
  Globe,
  ImageOff,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AdminPage } from "@/components/admin/admin-page";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import {
  AdminSearch,
  AdminToolbar,
  AdminFilterSelect,
} from "@/components/admin/admin-toolbar";
import { AdminStatusBadge } from "@/components/admin/admin-status-badge";
import { AdminFormField } from "@/components/admin/admin-form-field";
import { Badge } from "@/components/ui/badge";
import { KumaEmptyState } from "@/components/kuma/kuma-empty-state";
import { Surface } from "@/components/ui/surface";
import { adminFetch } from "@/lib/admin/admin-fetch";
import { cn } from "@/lib/utils";

const SET_TYPE_LABELS: Record<string, string> = {
  BOOSTER: "บูสเตอร์แพ็ค",
  EXTRA_BOOSTER: "เอ็กซ์ตร้าบูสเตอร์",
  STARTER: "สตาร์ทเตอร์เด็ค",
  PROMO: "โปรโม",
  OTHER: "อื่น ๆ",
};

interface SetRow {
  id: number;
  code: string;
  name: string;
  nameEn: string | null;
  nameTh: string | null;
  type: string;
  releaseDate: string | null;
  cardCount: number;
  packsPerBox: number | null;
  cardsPerPack: number | null;
  actualCardCount: number;
  productCardCount: number;
  missingEn: number;
  missingImage: number;
  completeness: number;
}

export function SetsManager({ initialSets }: { initialSets: SetRow[] }) {
  const [sets, setSets] = useState(initialSets);
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editData, setEditData] = useState<Partial<SetRow>>({});
  const [loading, setLoading] = useState<Record<string, boolean>>({});
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("");

  const filteredSets = useMemo(() => {
    let result = sets;
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(
        (s) =>
          s.code.toLowerCase().includes(q) ||
          s.name.toLowerCase().includes(q) ||
          s.nameEn?.toLowerCase().includes(q),
      );
    }
    if (typeFilter) {
      result = result.filter((s) => s.type === typeFilter);
    }
    return result;
  }, [sets, search, typeFilter]);

  const setTypes = useMemo(
    () => [...new Set(sets.map((s) => s.type))].sort(),
    [sets],
  );

  function toggleExpand(id: number) {
    setExpandedId((prev) => (prev === id ? null : id));
  }

  function startEdit(set: SetRow) {
    setEditingId(set.id);
    setEditData({
      nameEn: set.nameEn,
      nameTh: set.nameTh,
      packsPerBox: set.packsPerBox,
      cardsPerPack: set.cardsPerPack,
    });
  }

  async function saveEdit(id: number) {
    setLoading((p) => ({ ...p, [`edit-${id}`]: true }));
    try {
      await adminFetch("/api/admin/sets", {
        method: "PATCH",
        body: { id, ...editData },
      });
      setSets((prev) =>
        prev.map((s) => (s.id === id ? { ...s, ...editData } : s)),
      );
      setEditingId(null);
      toast.success("บันทึกสำเร็จ");
    } catch (e) {
      toast.error(
        e instanceof Error ? e.message : "เกิดข้อผิดพลาดในการเชื่อมต่อ",
      );
    } finally {
      setLoading((p) => ({ ...p, [`edit-${id}`]: false }));
    }
  }

  async function scrapePrices(setCode: string, setId: number) {
    const key = `scrape-${setId}`;
    setLoading((p) => ({ ...p, [key]: true }));
    const toastId = toast.loading(`กำลังดึงราคา ${setCode.toUpperCase()}...`);
    try {
      const data = await adminFetch<{ upserted: number; newCards: number }>(
        "/api/admin/sets/scrape-prices",
        {
          method: "POST",
          body: { setCode },
        },
      );
      toast.success(
        `ดึงราคาสำเร็จ: ${data.upserted} ใบ, ใหม่ ${data.newCards} ใบ`,
        { id: toastId },
      );
    } catch (e) {
      toast.error(
        e instanceof Error ? e.message : "เกิดข้อผิดพลาด",
        { id: toastId },
      );
    } finally {
      setLoading((p) => ({ ...p, [key]: false }));
    }
  }

  return (
    <AdminPage
      header={
        <AdminPageHeader
          title="จัดการชุดการ์ด"
          description="ดูชุดการ์ด แก้ไขข้อมูล และดึงราคาจากแหล่งข้อมูล"
          icon={Library}
          meta={<Badge variant="secondary">{sets.length} ชุด</Badge>}
        />
      }
    >
      <div className="sticky top-0 z-20 -mx-1 bg-background/85 px-1 py-2 backdrop-blur supports-backdrop-filter:bg-background/70">
        <AdminToolbar>
          <AdminSearch
            value={search}
            onChange={setSearch}
            placeholder="ค้นหา code หรือชื่อ..."
            className="w-full sm:w-56"
          />
          <AdminFilterSelect
            value={typeFilter}
            onChange={setTypeFilter}
            placeholder="ทุกประเภท"
            options={setTypes.map((t) => ({ value: t, label: SET_TYPE_LABELS[t] ?? t }))}
          />
          {(search || typeFilter) && (
            <span className="text-meta">
              แสดง {filteredSets.length} จาก {sets.length}
            </span>
          )}
        </AdminToolbar>
      </div>

      <div className="space-y-1.5">
        {filteredSets.map((set) => {
          const expanded = expandedId === set.id;
          const editing = editingId === set.id;
          return (
            <SetCard
              key={set.id}
              set={set}
              expanded={expanded}
              editing={editing}
              editData={editData}
              loading={loading}
              onToggle={() => toggleExpand(set.id)}
              onStartEdit={() => startEdit(set)}
              onCancelEdit={() => setEditingId(null)}
              onSaveEdit={() => saveEdit(set.id)}
              onEditChange={(field, value) =>
                setEditData((p) => ({ ...p, [field]: value }))
              }
              onScrape={() => scrapePrices(set.code, set.id)}
            />
          );
        })}
        {filteredSets.length === 0 && (
          <KumaEmptyState
            variant="admin"
            icon={Package}
            title="ไม่พบชุดการ์ดที่ตรงกับเงื่อนไข"
          />
        )}
      </div>
    </AdminPage>
  );
}

function SetCard({
  set,
  expanded,
  editing,
  editData,
  loading,
  onToggle,
  onStartEdit,
  onCancelEdit,
  onSaveEdit,
  onEditChange,
  onScrape,
}: {
  set: SetRow;
  expanded: boolean;
  editing: boolean;
  editData: Partial<SetRow>;
  loading: Record<string, boolean>;
  onToggle: () => void;
  onStartEdit: () => void;
  onCancelEdit: () => void;
  onSaveEdit: () => void;
  onEditChange: (field: string, value: unknown) => void;
  onScrape: () => void;
}) {
  const scrapeLoading = loading[`scrape-${set.id}`];
  const editLoading = loading[`edit-${set.id}`];

  return (
    <Surface
      variant="outline"
      className={cn(
        "overflow-hidden transition-all",
        expanded && "border-[var(--p-hair)] shadow-sm",
      )}
    >
      {/* Main row */}
      <div
        role="button"
        tabIndex={0}
        onClick={onToggle}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            onToggle();
          }
        }}
        className="flex w-full cursor-pointer items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-muted/30"
      >
        {/* Code badge */}
        <span className="inline-flex min-w-[4rem] items-center justify-center rounded-md bg-primary/8 px-2 py-0.5 font-mono text-eyebrow text-primary">
          {set.code}
        </span>

        {/* Name */}
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium">
            {set.nameEn || set.name}
          </p>
          {set.nameEn && set.name !== set.nameEn && (
            <p className="truncate text-meta">{set.name}</p>
          )}
        </div>

        {/* Card count */}
        <div className="hidden items-center gap-1.5 sm:flex">
          <span className="tabular-nums text-sm font-semibold">
            {set.actualCardCount}
          </span>
          <span className="text-meta">ใบ</span>
        </div>

        {/* Completeness bar */}
        <div className="hidden w-24 items-center gap-2 md:flex">
          <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted/60">
            <div
              className={cn(
                "h-full rounded-full transition-all",
                set.completeness >= 90
                  ? "bg-success/70"
                  : set.completeness >= 50
                    ? "bg-warning/70"
                    : "bg-danger/70",
              )}
              style={{ width: `${Math.min(set.completeness, 100)}%` }}
            />
          </div>
          <span
            className={cn(
              "tabular-nums text-xs font-semibold",
              set.completeness >= 90
                ? "text-success"
                : set.completeness >= 50
                  ? "text-warning"
                  : "text-danger",
            )}
          >
            {set.completeness}%
          </span>
        </div>

        {/* Scrape button — stop propagation so it doesn't toggle */}
        <div
          onClick={(e) => e.stopPropagation()}
          className="hidden sm:block"
        >
          <Button
            variant="outline"
            size="xs"
            onClick={onScrape}
            disabled={scrapeLoading}
            className="border-[var(--p-hair)]"
          >
            {scrapeLoading ? (
              <Loader2 className="size-3 animate-spin" />
            ) : (
              <RefreshCw className="size-3" />
            )}
            ดึงราคา
          </Button>
        </div>

        {/* Expand indicator */}
        <ChevronDown
          className={cn(
            "size-4 shrink-0 text-muted-foreground/50 transition-transform duration-200",
            expanded && "rotate-180",
          )}
        />
      </div>

      {/* Expanded content */}
      {expanded && (
        <div className="border-t border-[var(--p-hair)] bg-muted/5 px-4 py-4">
          {editing ? (
            <div className="space-y-4">
              <div className="grid gap-3 sm:grid-cols-2">
                <EditField
                  label="ชื่อภาษาอังกฤษ"
                  value={(editData.nameEn as string) ?? ""}
                  onChange={(v) => onEditChange("nameEn", v)}
                />
                <EditField
                  label="ชื่อภาษาไทย"
                  value={(editData.nameTh as string) ?? ""}
                  onChange={(v) => onEditChange("nameTh", v)}
                />
                <EditField
                  label="ซอง/กล่อง"
                  type="number"
                  value={editData.packsPerBox ?? ""}
                  onChange={(v) =>
                    onEditChange("packsPerBox", v ? parseInt(v) : null)
                  }
                />
                <EditField
                  label="ใบ/ซอง"
                  type="number"
                  value={editData.cardsPerPack ?? ""}
                  onChange={(v) =>
                    onEditChange("cardsPerPack", v ? parseInt(v) : null)
                  }
                />
              </div>
              <div className="flex gap-2">
                <Button size="sm" onClick={onSaveEdit} disabled={editLoading}>
                  {editLoading ? (
                    <Loader2 className="size-3.5 animate-spin" />
                  ) : (
                    <Check className="size-3.5" />
                  )}
                  บันทึก
                </Button>
                <Button variant="outline" size="sm" onClick={onCancelEdit}>
                  <X className="size-3.5" />
                  ยกเลิก
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Detail grid */}
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <InfoTile label="ประเภท" value={SET_TYPE_LABELS[set.type] ?? set.type} />
                <InfoTile
                  label="การ์ดในชุด"
                  value={`${set.actualCardCount} ใบ`}
                />
                <InfoTile
                  label="ซอง/กล่อง"
                  value={set.packsPerBox?.toString()}
                />
                <InfoTile
                  label="ใบ/ซอง"
                  value={set.cardsPerPack?.toString()}
                />
              </div>

              {/* Quality status */}
              <div className="flex flex-wrap gap-2">
                <QualityPill
                  icon={Globe}
                  label="ชื่อ EN"
                  missing={set.missingEn}
                  total={set.actualCardCount}
                />
                <QualityPill
                  icon={ImageOff}
                  label="รูปภาพ"
                  missing={set.missingImage}
                  total={set.actualCardCount}
                />
              </div>

              {/* Actions */}
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={onStartEdit}>
                  <Pencil className="size-3.5" />
                  แก้ไขข้อมูล
                </Button>
                <div className="sm:hidden">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={onScrape}
                    disabled={scrapeLoading}
                  >
                    {scrapeLoading ? (
                      <Loader2 className="size-3.5 animate-spin" />
                    ) : (
                      <RefreshCw className="size-3.5" />
                    )}
                    ดึงราคา
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </Surface>
  );
}

function EditField({
  label,
  value,
  onChange,
  type = "text",
}: {
  label: string;
  value: string | number;
  onChange: (v: string) => void;
  type?: string;
}) {
  return (
    <AdminFormField label={label}>
      <Input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </AdminFormField>
  );
}

function InfoTile({
  label,
  value,
}: {
  label: string;
  value: string | null | undefined;
}) {
  return (
    <div className="rounded-lg bg-muted/30 px-3 py-2">
      <p className="text-meta text-muted-foreground/60">
        {label}
      </p>
      <p className="mt-0.5 text-sm font-medium">
        {value || <span className="text-muted-foreground/30">—</span>}
      </p>
    </div>
  );
}

function QualityPill({
  icon: Icon,
  label,
  missing,
  total,
}: {
  icon: React.ElementType;
  label: string;
  missing: number;
  total: number;
}) {
  const isGood = missing === 0;
  return (
    <AdminStatusBadge
      tone={isGood ? "success" : "warning"}
      icon={<Icon className="size-3" />}
    >
      {label}: {isGood ? "ครบ" : `ขาด ${missing}/${total}`}
    </AdminStatusBadge>
  );
}
