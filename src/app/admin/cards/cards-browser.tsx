"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Pencil,
  Check,
  X,
  Loader2,
  ExternalLink,
  CreditCard,
  LayoutGrid,
  List,
  ArrowUpDown,
} from "lucide-react";
import { toast } from "sonner";
import { formatJpy } from "@/lib/utils/currency";
import { RARITY_MAP } from "@/lib/constants/rarities";
import type { PaginatedApiResponse } from "@/app/admin/admin-types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AdminPage } from "@/components/admin/admin-page";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { AdminPagination } from "@/components/admin/admin-pagination";
import {
  AdminToolbar,
  AdminSearch,
  AdminFilterSelect,
  AdminFilterCount,
} from "@/components/admin/admin-toolbar";
import {
  AdminDataTable,
  type Column,
  type SortState,
} from "@/components/admin/admin-data-table";
import { AdminStatusBadge } from "@/components/admin/admin-status-badge";
import { AdminFormField } from "@/components/admin/admin-form-field";
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
  TooltipProvider,
} from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { useAdminList } from "@/lib/admin/use-admin-list";
import { useAdminUrlState } from "@/lib/admin/use-admin-url-state";
import { adminFetch, buildAdminQuery } from "@/lib/admin/admin-fetch";

interface CardRow {
  id: number;
  cardCode: string;
  baseCode: string | null;
  nameJp: string;
  nameEn: string | null;
  nameTh: string | null;
  rarity: string;
  cardType: string;
  color: string;
  colorEn: string | null;
  imageUrl: string | null;
  isParallel: boolean;
  parallelIndex: number | null;
  latestPriceJpy: number | null;
  set: { code: string; name: string };
}

interface FilterOptions {
  sets: { code: string; label: string }[];
  rarities: string[];
}

interface ApiResponse extends PaginatedApiResponse {
  cards: CardRow[];
  limit: number;
}

const SORT_FIELD_MAP: Record<string, string> = {
  baseCode: "code",
  rarity: "rarity",
  latestPriceJpy: "price",
};

export function CardsBrowser({
  filterOptions,
}: {
  filterOptions: FilterOptions;
}) {
  const [viewMode, setViewMode] = useState<"table" | "grid">("table");

  const { state, patch, reset } = useAdminUrlState({
    defaults: {
      q: "",
      set: "",
      rarity: "",
      missing: "",
      parallel: "",
      sort: "",
      order: "asc" as "asc" | "desc",
      page: 1,
      perPage: 50,
    },
  });
  const {
    q: search,
    set: setFilter,
    rarity: rarityFilter,
    missing: missingFilter,
    parallel: parallelFilter,
    sort,
    order,
    page,
    perPage,
  } = state;

  const [editingId, setEditingId] = useState<number | null>(null);
  const [editData, setEditData] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  const activeFilterCount = [setFilter, rarityFilter, missingFilter, parallelFilter].filter(Boolean).length;

  const { data, loading, setData } = useAdminList<ApiResponse, typeof state>({
    url: (p) =>
      `/api/admin/cards?${buildAdminQuery({
        page: p.page,
        limit: p.perPage,
        q: p.q || undefined,
        set: p.set || undefined,
        rarity: p.rarity || undefined,
        missing: p.missing || undefined,
        parallel: p.parallel || undefined,
        sort: p.sort || undefined,
        order: p.sort ? p.order : undefined,
      })}`,
    params: state,
  });
  const cards = data?.cards ?? [];
  const total = data?.total ?? 0;
  const totalPages = data?.totalPages ?? 0;

  const sortKeyForColumn = (field: string): string => {
    const entry = Object.entries(SORT_FIELD_MAP).find(([, v]) => v === field);
    return entry?.[0] ?? field;
  };

  const tableSortState: SortState = sort
    ? { key: sortKeyForColumn(sort), direction: order }
    : { key: "", direction: null };

  function handleSortChange(next: SortState) {
    if (!next.key || !next.direction) {
      patch({ sort: "", order: "asc", page: 1 });
      return;
    }
    const apiField = SORT_FIELD_MAP[next.key] ?? next.key;
    patch({ sort: apiField, order: next.direction, page: 1 });
  }

  function clearAllFilters() {
    reset();
  }

  function startEdit(card: CardRow) {
    setEditingId(card.id);
    setEditData({
      nameEn: card.nameEn || "",
      nameTh: card.nameTh || "",
      imageUrl: card.imageUrl || "",
    });
  }

  async function saveEdit(id: number) {
    setSaving(true);
    try {
      await adminFetch("/api/admin/cards", {
        method: "PATCH",
        body: { id, ...editData },
      });
      setData((prev) =>
        prev
          ? {
              ...prev,
              cards: prev.cards.map((c) =>
                c.id === id
                  ? {
                      ...c,
                      nameEn: editData.nameEn || null,
                      nameTh: editData.nameTh || null,
                      imageUrl: editData.imageUrl || null,
                    }
                  : c,
              ),
            }
          : prev,
      );
      setEditingId(null);
      toast.success("บันทึกการ์ดสำเร็จ");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "บันทึกการ์ดไม่สำเร็จ");
    } finally {
      setSaving(false);
    }
  }

  const columns: Column<CardRow>[] = [
    {
      key: "image",
      header: "รูป",
      headerClassName: "w-14 text-center",
      className: "w-14 text-center",
      render: (card) => <ImageCell card={card} />,
    },
    {
      key: "baseCode",
      header: "โค้ด",
      sortable: true,
      sortFn: () => 0,
      render: (card) => (
        <div>
          <Link
            href={`/admin/cards/${card.id}`}
            className="font-mono text-xs font-bold hover:text-primary"
          >
            {card.baseCode}
          </Link>
          {card.isParallel && (
            <span className="ml-1 rounded bg-warning-soft px-1 text-xs font-medium text-warning">
              {card.rarity.startsWith("P-") ? card.rarity : "PA"}
            </span>
          )}
          <div className="text-meta">{card.set.code.toUpperCase()}</div>
        </div>
      ),
    },
    {
      key: "nameJp",
      header: "ชื่อ (JP)",
      className: "max-w-[180px] truncate text-xs",
      render: (card) => <span className="truncate">{card.nameJp}</span>,
    },
    {
      key: "nameEn",
      header: "ชื่อ (EN)",
      className: "hidden max-w-[180px] truncate text-xs md:table-cell",
      headerClassName: "hidden md:table-cell",
      render: (card) =>
        card.nameEn || <span className="text-muted-foreground/50">—</span>,
    },
    {
      key: "rarity",
      header: "ระดับ",
      sortable: true,
      sortFn: () => 0,
      className: "hidden text-center text-xs sm:table-cell",
      headerClassName: "hidden sm:table-cell text-center",
      render: (card) => card.rarity,
    },
    {
      key: "latestPriceJpy",
      header: "ราคา",
      sortable: true,
      sortFn: () => 0,
      className: "hidden text-right text-xs tabular-nums lg:table-cell",
      headerClassName: "hidden lg:table-cell text-right",
      render: (card) =>
        card.latestPriceJpy != null ? formatJpy(card.latestPriceJpy) : "—",
    },
    {
      key: "status",
      header: "สถานะ",
      className: "text-center",
      headerClassName: "text-center",
      render: (card) => <StatusBadges card={card} />,
    },
    {
      key: "actions",
      header: "",
      className: "w-20",
      headerClassName: "w-20",
      render: (card) => (
        <div className="flex justify-end gap-1">
          <Button
            variant="ghost"
            size="icon-xs"
            onClick={(e) => {
              e.stopPropagation();
              if (editingId === card.id) {
                setEditingId(null);
              } else {
                startEdit(card);
              }
            }}
            title="แก้ไขด่วน"
            aria-label="แก้ไขด่วน"
          >
            <Pencil className="size-3.5" />
          </Button>
          <Link
            href={`/admin/cards/${card.id}`}
            onClick={(e) => e.stopPropagation()}
            className="inline-flex size-7 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            title="แก้ไขฉบับเต็ม"
          >
            <ExternalLink className="size-3.5" />
          </Link>
        </div>
      ),
    },
  ];

  return (
    <AdminPage
      header={
        <AdminPageHeader
          title="การ์ด"
          description="ค้นหา กรอง และแก้ไขข้อมูลการ์ด"
          icon={CreditCard}
          meta={
            <Badge variant="secondary">
              {total.toLocaleString()} ใบ
            </Badge>
          }
          actions={
            <div className="flex items-center gap-1 rounded-lg border border-border/50 p-0.5">
              <button
                type="button"
                onClick={() => setViewMode("table")}
                className={cn(
                  "rounded-md p-1.5 transition-colors",
                  viewMode === "table"
                    ? "bg-muted text-foreground"
                    : "text-muted-foreground hover:text-foreground",
                )}
                aria-label="มุมมองตาราง"
                aria-pressed={viewMode === "table"}
              >
                <List className="size-4" />
              </button>
              <button
                type="button"
                onClick={() => setViewMode("grid")}
                className={cn(
                  "rounded-md p-1.5 transition-colors",
                  viewMode === "grid"
                    ? "bg-muted text-foreground"
                    : "text-muted-foreground hover:text-foreground",
                )}
                aria-label="มุมมองกริด"
                aria-pressed={viewMode === "grid"}
              >
                <LayoutGrid className="size-4" />
              </button>
            </div>
          }
        />
      }
    >
      {/* Sticky toolbar — stays visible while the long table scrolls. Sits
          just below the admin top bar. */}
      <div className="sticky top-0 z-20 -mx-1 bg-background/85 px-1 py-2 backdrop-blur supports-backdrop-filter:bg-background/70">
        <AdminToolbar>
          <AdminSearch
            value={search}
            onChange={(v) => patch({ q: v, page: 1 })}
            placeholder="ค้นหา code หรือชื่อ..."
            className="w-full sm:w-52"
          />
          <AdminFilterSelect
            value={setFilter}
            onChange={(v) => patch({ set: v, page: 1 })}
            placeholder="ทุกชุด"
            options={filterOptions.sets.map((s) => ({
              value: s.code,
              label: `${s.code.toUpperCase()} · ${s.label}`,
            }))}
          />
          <AdminFilterSelect
            value={rarityFilter}
            onChange={(v) => patch({ rarity: v, page: 1 })}
            placeholder="ทุกระดับ"
            options={filterOptions.rarities.map((r) => ({
              value: r,
              label: RARITY_MAP.get(r)?.name ? `${r} · ${RARITY_MAP.get(r)!.name}` : r,
            }))}
          />
          <AdminFilterSelect
            value={missingFilter}
            onChange={(v) => patch({ missing: v, page: 1 })}
            placeholder="ข้อมูลขาด"
            options={[
              { value: "price", label: "ขาดราคา" },
              { value: "en", label: "ขาดชื่อ EN" },
              { value: "th", label: "ขาดชื่อ TH" },
              { value: "image", label: "ขาดรูปภาพ" },
            ]}
          />
          <AdminFilterSelect
            value={parallelFilter}
            onChange={(v) => patch({ parallel: v, page: 1 })}
            placeholder="ปกติ/พาราเลล"
            options={[
              { value: "false", label: "ปกติเท่านั้น" },
              { value: "true", label: "พาราเลลเท่านั้น" },
            ]}
          />
          <AdminFilterCount
            activeCount={activeFilterCount}
            onClear={clearAllFilters}
          />
        </AdminToolbar>
      </div>

      {/* Content */}
      {viewMode === "grid" ? (
        <CardGrid cards={cards} loading={loading} />
      ) : (
        <TooltipProvider delay={300}>
          <AdminDataTable
            columns={columns}
            data={cards}
            rowKey={(c) => c.id}
            loading={loading}
            loadingRows={8}
            sortState={tableSortState}
            onSortChange={handleSortChange}
            emptyMessage="ไม่พบการ์ดที่ตรงกับเงื่อนไข"
            emptyDescription="ลองปรับตัวกรองหรือล้างค่าค้นหา"
            isRowExpanded={(c) => c.id === editingId}
            renderExpandedRow={(c) => (
              <CardEditForm
                card={c}
                editData={editData}
                saving={saving}
                onChange={(field, value) =>
                  setEditData((p) => ({ ...p, [field]: value }))
                }
                onSave={() => saveEdit(c.id)}
                onCancel={() => setEditingId(null)}
              />
            )}
            renderMobileRow={(card) => (
              <CardMobileRow
                card={card}
                editing={editingId === card.id}
                editData={editData}
                saving={saving}
                onStartEdit={() => startEdit(card)}
                onCancelEdit={() => setEditingId(null)}
                onSaveEdit={() => saveEdit(card.id)}
                onEditChange={(field, value) =>
                  setEditData((p) => ({ ...p, [field]: value }))
                }
              />
            )}
          />
        </TooltipProvider>
      )}

      <AdminPagination
        page={page}
        totalPages={totalPages}
        total={total}
        perPage={perPage}
        onPerPageChange={(n) => patch({ perPage: n, page: 1 })}
        onPageChange={(p) => patch({ page: p })}
      />
    </AdminPage>
  );
}

/* ── Edit Form (used in expanded row + mobile) ── */

function CardEditForm({
  card,
  editData,
  saving,
  onChange,
  onSave,
  onCancel,
}: {
  card: CardRow;
  editData: Record<string, string>;
  saving: boolean;
  onChange: (field: string, value: string) => void;
  onSave: () => void;
  onCancel: () => void;
}) {
  function handleKey(e: React.KeyboardEvent) {
    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      onSave();
    } else if (e.key === "Escape") {
      e.preventDefault();
      onCancel();
    }
  }

  return (
    <div className="space-y-3">
      <p className="text-meta">
        แก้ไขการ์ด <span className="font-mono">{card.baseCode}</span> ·{" "}
        <span>{card.nameJp}</span>
      </p>
      <div
        className="grid gap-3 sm:grid-cols-3"
        onKeyDown={handleKey}
      >
        <AdminFormField label="ชื่อ EN">
          <Input
            placeholder="ชื่อภาษาอังกฤษ"
            value={editData.nameEn || ""}
            onChange={(e) => onChange("nameEn", e.target.value)}
            autoFocus
          />
        </AdminFormField>
        <AdminFormField label="ชื่อ TH">
          <Input
            placeholder="ชื่อภาษาไทย"
            value={editData.nameTh || ""}
            onChange={(e) => onChange("nameTh", e.target.value)}
          />
        </AdminFormField>
        <AdminFormField label="URL รูปภาพ">
          <Input
            placeholder="https://..."
            value={editData.imageUrl || ""}
            onChange={(e) => onChange("imageUrl", e.target.value)}
            className="font-mono text-xs"
          />
        </AdminFormField>
      </div>
      <div className="flex justify-end gap-2">
        <Button variant="outline" size="sm" onClick={onCancel} disabled={saving}>
          <X className="size-3.5" />
          ยกเลิก
        </Button>
        <Button size="sm" onClick={onSave} disabled={saving}>
          {saving ? (
            <Loader2 className="size-3.5 animate-spin" />
          ) : (
            <Check className="size-3.5" />
          )}
          บันทึก
        </Button>
      </div>
    </div>
  );
}

/* ── Mobile row ── */

function CardMobileRow({
  card,
  editing,
  editData,
  saving,
  onStartEdit,
  onCancelEdit,
  onSaveEdit,
  onEditChange,
}: {
  card: CardRow;
  editing: boolean;
  editData: Record<string, string>;
  saving: boolean;
  onStartEdit: () => void;
  onCancelEdit: () => void;
  onSaveEdit: () => void;
  onEditChange: (field: string, value: string) => void;
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-start gap-3">
        <div className="shrink-0">
          <ImageCell card={card} />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <Link
              href={`/admin/cards/${card.id}`}
              className="font-mono text-xs font-bold hover:text-primary"
            >
              {card.baseCode}
            </Link>
            {card.isParallel && (
              <span className="rounded bg-warning-soft px-1 text-xs font-medium text-warning">
                {card.rarity.startsWith("P-") ? card.rarity : "PA"}
              </span>
            )}
            <span className="text-meta">{card.set.code.toUpperCase()}</span>
          </div>
          <p className="mt-1 truncate text-xs">{card.nameJp}</p>
          {card.nameEn && (
            <p className="truncate text-meta">{card.nameEn}</p>
          )}
          <div className="mt-1.5 flex items-center gap-2 text-meta">
            <span>{card.rarity}</span>
            <span>·</span>
            <span className="font-price">
              {card.latestPriceJpy != null ? formatJpy(card.latestPriceJpy) : "—"}
            </span>
            <StatusBadges card={card} />
          </div>
        </div>
        <div className="flex shrink-0 flex-col gap-1">
          <Button
            variant="ghost"
            size="icon-xs"
            onClick={editing ? onCancelEdit : onStartEdit}
            aria-label={editing ? "ยกเลิก" : "แก้ไข"}
          >
            {editing ? <X className="size-3.5" /> : <Pencil className="size-3.5" />}
          </Button>
          <Link
            href={`/admin/cards/${card.id}`}
            className="inline-flex size-7 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            title="แก้ไขฉบับเต็ม"
          >
            <ExternalLink className="size-3.5" />
          </Link>
        </div>
      </div>
      {editing && (
        <div className="rounded-lg border border-border/50 bg-muted/20 p-3">
          <CardEditForm
            card={card}
            editData={editData}
            saving={saving}
            onChange={onEditChange}
            onSave={onSaveEdit}
            onCancel={onCancelEdit}
          />
        </div>
      )}
    </div>
  );
}

/* ── Grid View ── */

function CardGrid({ cards, loading }: { cards: CardRow[]; loading: boolean }) {
  if (loading) {
    return (
      <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8">
        {Array.from({ length: 16 }).map((_, i) => (
          <Skeleton key={i} className="aspect-[63/88] rounded-lg" />
        ))}
      </div>
    );
  }

  if (cards.length === 0) {
    return (
      <div className="py-16 text-center text-sm text-muted-foreground">
        ไม่พบการ์ดที่ตรงกับเงื่อนไข
      </div>
    );
  }

  return (
    <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8">
      {cards.map((card) => {
        const flagged = !card.nameEn || !card.imageUrl;
        return (
          <Link
            key={card.id}
            href={`/admin/cards/${card.id}`}
            className="group flex flex-col overflow-hidden rounded-lg border border-border/30 bg-card transition-all hover:border-primary/30 hover:shadow-md"
          >
            {card.imageUrl ? (
              <Image
                src={card.imageUrl}
                alt={card.nameEn ?? card.nameJp}
                width={150}
                height={210}
                className="w-full object-contain"
                unoptimized
              />
            ) : (
              <div className="flex aspect-[63/88] w-full items-center justify-center bg-muted/30 text-meta">
                ไม่มีรูป
              </div>
            )}
            {/* Always-visible info row — admins should see code/rarity/price
                without hovering. Data-quality flag rides alongside the meta. */}
            <div className="flex flex-col gap-0.5 border-t border-border/30 px-2 py-1.5">
              <div className="flex items-center gap-1">
                <p className="truncate text-xs font-bold">{card.baseCode}</p>
                {flagged && (
                  <span
                    title="Missing translation or image"
                    className="ml-auto inline-flex size-4 items-center justify-center rounded bg-warning text-overlay leading-none text-warning-foreground"
                  >
                    !
                  </span>
                )}
              </div>
              <p className="truncate text-overlay text-muted-foreground">
                {card.rarity} · {card.latestPriceJpy != null ? formatJpy(card.latestPriceJpy) : "—"}
              </p>
            </div>
          </Link>
        );
      })}
    </div>
  );
}

/* ── Status Badges ── */

function StatusBadges({ card }: { card: CardRow }) {
  const missing: { label: string; key: string }[] = [];
  if (!card.nameEn) missing.push({ label: "EN", key: "en" });
  if (!card.imageUrl) missing.push({ label: "IMG", key: "img" });
  if (card.latestPriceJpy == null) missing.push({ label: "¥", key: "price" });

  if (missing.length === 0) {
    return (
      <AdminStatusBadge tone="success" dot>
        ครบ
      </AdminStatusBadge>
    );
  }

  return (
    <div className="inline-flex flex-wrap items-center justify-center gap-1">
      {missing.map((m) => (
        <span
          key={m.key}
          className="status-warning rounded px-1 py-px text-overlay leading-tight"
        >
          {m.label}
        </span>
      ))}
    </div>
  );
}

/* ── Image Cell with Hover Preview ── */

function ImageCell({ card }: { card: CardRow }) {
  if (!card.imageUrl) {
    return (
      <div
        className="flex items-center justify-center rounded bg-muted text-meta"
        style={{ width: 40, height: 56 }}
      >
        ?
      </div>
    );
  }

  return (
    <Tooltip>
      <TooltipTrigger render={<span className="inline-block cursor-default" />}>
        <Image
          src={card.imageUrl}
          alt={card.nameEn ?? card.nameJp}
          width={40}
          height={56}
          className="rounded"
          unoptimized
        />
      </TooltipTrigger>
      <TooltipContent
        side="right"
        sideOffset={8}
        className="overflow-hidden rounded-lg border-0 bg-transparent p-0 shadow-2xl"
      >
        <Image
          src={card.imageUrl}
          alt={card.nameEn ?? card.nameJp}
          width={200}
          height={280}
          className="rounded-lg"
          unoptimized
        />
      </TooltipContent>
    </Tooltip>
  );
}
