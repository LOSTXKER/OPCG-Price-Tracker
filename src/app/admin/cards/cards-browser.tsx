"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
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
  ArrowUp,
  ArrowDown,
} from "lucide-react";
import { toast } from "sonner";
import { formatJpy } from "@/lib/utils/currency";
import { RARITY_MAP } from "@/lib/constants/rarities";
import type { PaginatedApiResponse } from "@/app/admin/admin-types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { AdminPagination } from "@/components/admin/admin-pagination";
import {
  AdminToolbar,
  AdminSearch,
  AdminFilterSelect,
  AdminFilterCount,
} from "@/components/admin/admin-toolbar";
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
  TooltipProvider,
} from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

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

export function CardsBrowser({
  filterOptions,
}: {
  filterOptions: FilterOptions;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [cards, setCards] = useState<CardRow[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<"table" | "grid">("table");

  const [search, setSearch] = useState(searchParams.get("q") || "");
  const [setFilter, setSetFilter] = useState(searchParams.get("set") || "");
  const [rarityFilter, setRarityFilter] = useState(
    searchParams.get("rarity") || "",
  );
  const [missingFilter, setMissingFilter] = useState(
    searchParams.get("missing") || "",
  );
  const [parallelFilter, setParallelFilter] = useState(
    searchParams.get("parallel") || "",
  );
  const [page, setPage] = useState(
    parseInt(searchParams.get("page") || "1"),
  );
  const [perPage, setPerPage] = useState(50);
  const [sort, setSort] = useState(searchParams.get("sort") || "");
  const [order, setOrder] = useState<"asc" | "desc">(
    (searchParams.get("order") as "asc" | "desc") || "asc",
  );

  const [editingId, setEditingId] = useState<number | null>(null);
  const [editData, setEditData] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  const activeFilterCount = [setFilter, rarityFilter, missingFilter, parallelFilter].filter(Boolean).length;

  const fetchCards = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    params.set("page", String(page));
    params.set("limit", String(perPage));
    if (search) params.set("q", search);
    if (setFilter) params.set("set", setFilter);
    if (rarityFilter) params.set("rarity", rarityFilter);
    if (missingFilter) params.set("missing", missingFilter);
    if (parallelFilter) params.set("parallel", parallelFilter);
    if (sort) params.set("sort", sort);
    if (sort) params.set("order", order);

    try {
      const res = await fetch(`/api/admin/cards?${params}`);
      if (!res.ok) throw new Error(`Failed to load cards: ${res.status}`);
      const data: ApiResponse = await res.json();
      setCards(data.cards);
      setTotal(data.total);
      setTotalPages(data.totalPages);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [page, perPage, search, setFilter, rarityFilter, missingFilter, parallelFilter, sort, order]);

  useEffect(() => {
    fetchCards();
  }, [fetchCards]);

  useEffect(() => {
    const params = new URLSearchParams();
    if (search) params.set("q", search);
    if (setFilter) params.set("set", setFilter);
    if (rarityFilter) params.set("rarity", rarityFilter);
    if (missingFilter) params.set("missing", missingFilter);
    if (parallelFilter) params.set("parallel", parallelFilter);
    if (sort) params.set("sort", sort);
    if (sort) params.set("order", order);
    if (page > 1) params.set("page", String(page));
    router.replace(`/admin/cards?${params}`, { scroll: false });
  }, [search, setFilter, rarityFilter, missingFilter, parallelFilter, sort, order, page, router]);

  function clearAllFilters() {
    setSetFilter("");
    setRarityFilter("");
    setMissingFilter("");
    setParallelFilter("");
    setSearch("");
    setSort("");
    setOrder("asc");
    setPage(1);
  }

  function toggleSort(field: string) {
    if (sort === field) {
      setOrder((o) => (o === "asc" ? "desc" : "asc"));
    } else {
      setSort(field);
      setOrder("asc");
    }
    setPage(1);
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
      const res = await fetch("/api/admin/cards", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, ...editData }),
      });
      if (res.ok) {
        setCards((prev) =>
          prev.map((c) =>
            c.id === id
              ? {
                  ...c,
                  nameEn: editData.nameEn || null,
                  nameTh: editData.nameTh || null,
                  imageUrl: editData.imageUrl || null,
                }
              : c,
          ),
        );
        setEditingId(null);
        toast.success("บันทึกการ์ดสำเร็จ");
      } else {
        toast.error("บันทึกการ์ดไม่สำเร็จ");
      }
    } catch {
      toast.error("เกิดข้อผิดพลาดในการเชื่อมต่อ");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="การ์ด"
        description="ค้นหา กรอง และแก้ไขข้อมูลการ์ด"
        icon={CreditCard}
        badge={
          <Badge variant="secondary">
            {total.toLocaleString()} ใบ
          </Badge>
        }
      />

      {/* Toolbar */}
      <AdminToolbar
        actions={
          <div className="flex items-center gap-1 rounded-lg border border-border/50 p-0.5">
            <button
              onClick={() => setViewMode("table")}
              className={cn(
                "rounded-md p-1.5 transition-colors",
                viewMode === "table"
                  ? "bg-muted text-foreground"
                  : "text-muted-foreground hover:text-foreground",
              )}
              aria-label="มุมมองตาราง"
            >
              <List className="size-4" />
            </button>
            <button
              onClick={() => setViewMode("grid")}
              className={cn(
                "rounded-md p-1.5 transition-colors",
                viewMode === "grid"
                  ? "bg-muted text-foreground"
                  : "text-muted-foreground hover:text-foreground",
              )}
              aria-label="มุมมองกริด"
            >
              <LayoutGrid className="size-4" />
            </button>
          </div>
        }
      >
        <AdminSearch
          value={search}
          onChange={(v) => { setSearch(v); setPage(1); }}
          placeholder="ค้นหา code หรือชื่อ..."
          className="w-52"
        />
        <AdminFilterSelect
          value={setFilter}
          onChange={(v) => { setSetFilter(v); setPage(1); }}
          placeholder="ทุกชุด"
          options={filterOptions.sets.map((s) => ({
            value: s.code,
            label: `${s.code.toUpperCase()} · ${s.label}`,
          }))}
        />
        <AdminFilterSelect
          value={rarityFilter}
          onChange={(v) => { setRarityFilter(v); setPage(1); }}
          placeholder="ทุกระดับ"
          options={filterOptions.rarities.map((r) => ({
            value: r,
            label: RARITY_MAP.get(r)?.name ? `${r} · ${RARITY_MAP.get(r)!.name}` : r,
          }))}
        />
        <AdminFilterSelect
          value={missingFilter}
          onChange={(v) => { setMissingFilter(v); setPage(1); }}
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
          onChange={(v) => { setParallelFilter(v); setPage(1); }}
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

      {/* Content */}
      {viewMode === "grid" ? (
        <CardGrid cards={cards} loading={loading} />
      ) : (
        <TooltipProvider delay={300}>
        <div className="overflow-x-auto rounded-xl border border-border/50 bg-card">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border/50 bg-muted/30">
                <th className="w-14 px-2 py-2.5 text-center text-eyebrow text-muted-foreground/70">
                  รูป
                </th>
                <SortableHeader
                  field="code"
                  currentSort={sort}
                  currentOrder={order}
                  onToggle={toggleSort}
                  className="text-left"
                >
                  Code
                </SortableHeader>
                <th className="px-4 py-2.5 text-left text-eyebrow text-muted-foreground/70">
                  ชื่อ (JP)
                </th>
                <th className="hidden px-4 py-2.5 text-left text-eyebrow text-muted-foreground/70 md:table-cell">
                  ชื่อ (EN)
                </th>
                <SortableHeader
                  field="rarity"
                  currentSort={sort}
                  currentOrder={order}
                  onToggle={toggleSort}
                  className="hidden text-center sm:table-cell"
                >
                  ระดับ
                </SortableHeader>
                <SortableHeader
                  field="price"
                  currentSort={sort}
                  currentOrder={order}
                  onToggle={toggleSort}
                  className="hidden text-right lg:table-cell"
                >
                  ราคา
                </SortableHeader>
                <th className="px-4 py-2.5 text-center text-eyebrow text-muted-foreground/70">
                  สถานะ
                </th>
                <th className="w-20 px-2 py-2.5" />
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 8 }).map((_, i) => (
                  <tr key={i} className="border-b border-border/10">
                    <td className="px-2 py-2">
                      <Skeleton className="mx-auto h-14 w-10 rounded" />
                    </td>
                    <td className="px-4 py-2">
                      <Skeleton className="h-4 w-20" />
                    </td>
                    <td className="px-4 py-2">
                      <Skeleton className="h-4 w-28" />
                    </td>
                    <td className="hidden px-4 py-2 md:table-cell">
                      <Skeleton className="h-4 w-24" />
                    </td>
                    <td className="hidden px-4 py-2 sm:table-cell">
                      <Skeleton className="mx-auto h-4 w-8" />
                    </td>
                    <td className="hidden px-4 py-2 lg:table-cell">
                      <Skeleton className="ml-auto h-4 w-16" />
                    </td>
                    <td className="px-4 py-2">
                      <Skeleton className="mx-auto h-4 w-4" />
                    </td>
                    <td className="px-2 py-2">
                      <Skeleton className="h-4 w-12" />
                    </td>
                  </tr>
                ))
              ) : cards.length === 0 ? (
                <tr>
                  <td
                    colSpan={8}
                    className="py-16 text-center text-muted-foreground"
                  >
                    ไม่พบการ์ดที่ตรงกับเงื่อนไข
                  </td>
                </tr>
              ) : (
                cards.map((card) => (
                  <CardTableRow
                    key={card.id}
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
                ))
              )}
            </tbody>
          </table>
        </div>
        </TooltipProvider>
      )}

      <AdminPagination
        page={page}
        totalPages={totalPages}
        total={total}
        perPage={perPage}
        onPerPageChange={(n) => { setPerPage(n); setPage(1); }}
        onPageChange={setPage}
      />
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
      {cards.map((card) => (
        <Link
          key={card.id}
          href={`/admin/cards/${card.id}`}
          className="group relative overflow-hidden rounded-lg border border-border/30 bg-card transition-all hover:border-primary/30 hover:shadow-md"
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
          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent px-2 pb-2 pt-6 opacity-0 transition-opacity group-hover:opacity-100">
            <p className="truncate text-xs font-bold text-white">
              {card.baseCode}
            </p>
            <p className="truncate text-overlay text-white/70">
              {card.rarity} · {card.latestPriceJpy != null ? formatJpy(card.latestPriceJpy) : "—"}
            </p>
          </div>
          {/* "!" warning is a functional admin data-quality flag (missing
              translation or image) — kept on-card so reviewers can spot
              incomplete entries at a glance. */}
          {(!card.nameEn || !card.imageUrl) && (
            <span className="absolute left-1 top-1 rounded bg-amber-500/90 px-0.5 text-overlay leading-tight text-white">
              !
            </span>
          )}
        </Link>
      ))}
    </div>
  );
}

/* ── Sortable Header ── */

function SortableHeader({
  field,
  currentSort,
  currentOrder,
  onToggle,
  children,
  className,
}: {
  field: string;
  currentSort: string;
  currentOrder: "asc" | "desc";
  onToggle: (field: string) => void;
  children: React.ReactNode;
  className?: string;
}) {
  const active = currentSort === field;
  return (
    <th
      className={cn(
        "cursor-pointer select-none px-4 py-2.5 text-eyebrow transition-colors",
        active ? "text-foreground" : "text-muted-foreground/70 hover:text-muted-foreground",
        className,
      )}
      onClick={() => onToggle(field)}
    >
      <span className="inline-flex items-center gap-1">
        {children}
        {active ? (
          currentOrder === "asc" ? (
            <ArrowUp className="size-3" />
          ) : (
            <ArrowDown className="size-3" />
          )
        ) : (
          <ArrowUpDown className="size-3 opacity-40" />
        )}
      </span>
    </th>
  );
}

/* ── Status Badges ── */

function StatusBadges({ card }: { card: CardRow }) {
  const missing: { label: string; key: string }[] = [];
  if (!card.nameEn) missing.push({ label: "EN", key: "en" });
  if (!card.imageUrl) missing.push({ label: "IMG", key: "img" });
  if (card.latestPriceJpy == null) missing.push({ label: "¥", key: "price" });

  if (missing.length === 0) {
    return <Check className="mx-auto size-4 text-green-500" />;
  }

  return (
    <div className="flex flex-wrap justify-center gap-0.5">
      {missing.map((m) => (
        <span
          key={m.key}
          className="rounded bg-amber-500/15 px-1 py-px text-overlay leading-tight text-amber-500"
        >
          {m.label}
        </span>
      ))}
    </div>
  );
}

/* ── Image Cell with Hover Preview ── */

function ImageCell({ card, size = "normal" }: { card: CardRow; size?: "normal" | "edit" }) {
  const w = size === "edit" ? 36 : 40;
  const h = size === "edit" ? 50 : 56;

  if (!card.imageUrl) {
    return (
      <div
        className="flex items-center justify-center rounded bg-muted text-meta"
        style={{ width: w, height: h }}
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
          width={w}
          height={h}
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

/* ── Table Row ── */

function CardTableRow({
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
  function handleEditKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter") {
      e.preventDefault();
      onSaveEdit();
    } else if (e.key === "Escape") {
      e.preventDefault();
      onCancelEdit();
    }
  }

  if (editing) {
    return (
      <tr className="border-b border-border/10 bg-primary/5">
        <td className="px-2 py-2">
          <ImageCell card={card} size="edit" />
        </td>
        <td className="px-4 py-2 font-mono text-xs">{card.baseCode}</td>
        <td colSpan={4} className="px-4 py-2">
          <div className="grid gap-x-3 gap-y-1 sm:grid-cols-3">
            <div>
              <span className="text-overlay text-muted-foreground">EN</span>
              <Input
                placeholder="English name"
                value={editData.nameEn || ""}
                onChange={(e) => onEditChange("nameEn", e.target.value)}
                onKeyDown={handleEditKeyDown}
                className="h-7"
                autoFocus
              />
            </div>
            <div>
              <span className="text-overlay text-muted-foreground">TH</span>
              <Input
                placeholder="ชื่อภาษาไทย"
                value={editData.nameTh || ""}
                onChange={(e) => onEditChange("nameTh", e.target.value)}
                onKeyDown={handleEditKeyDown}
                className="h-7"
              />
            </div>
            <div>
              <span className="text-overlay text-muted-foreground">Image URL</span>
              <Input
                placeholder="https://..."
                value={editData.imageUrl || ""}
                onChange={(e) => onEditChange("imageUrl", e.target.value)}
                onKeyDown={handleEditKeyDown}
                className="h-7 font-mono text-xs"
              />
            </div>
          </div>
        </td>
        <td />
        <td className="px-2 py-2">
          <div className="flex gap-1">
            <Button
              size="icon-xs"
              aria-label="บันทึก"
              onClick={onSaveEdit}
              disabled={saving}
            >
              {saving ? (
                <Loader2 className="size-3.5 animate-spin" />
              ) : (
                <Check className="size-3.5" />
              )}
            </Button>
            <Button
              variant="outline"
              size="icon-xs"
              aria-label="ยกเลิก"
              onClick={onCancelEdit}
            >
              <X className="size-3.5" />
            </Button>
          </div>
        </td>
      </tr>
    );
  }

  return (
    <tr className="border-b border-border/10 transition-colors even:bg-muted/5 hover:bg-muted/20">
      <td className="px-2 py-1.5">
        <ImageCell card={card} />
      </td>
      <td className="px-4 py-1.5">
        <Link
          href={`/admin/cards/${card.id}`}
          className="font-mono text-xs font-bold hover:text-primary"
        >
          {card.baseCode}
        </Link>
        {card.isParallel && (
          <span className="ml-1 rounded bg-amber-500/20 px-1 text-xs font-medium text-amber-600 dark:text-amber-400">
            {card.rarity.startsWith("P-") ? card.rarity : "PA"}
          </span>
        )}
        <div className="text-meta">
          {card.set.code.toUpperCase()}
        </div>
      </td>
      <td className="max-w-[140px] truncate px-4 py-1.5 text-xs">
        {card.nameJp}
      </td>
      <td className="hidden max-w-[160px] truncate px-4 py-1.5 text-xs md:table-cell">
        {card.nameEn || (
          <span className="text-muted-foreground/50">—</span>
        )}
      </td>
      <td className="hidden px-4 py-1.5 text-center text-xs sm:table-cell">
        {card.rarity}
      </td>
      <td className="hidden px-4 py-1.5 text-right text-xs tabular-nums lg:table-cell">
        {card.latestPriceJpy != null ? formatJpy(card.latestPriceJpy) : "—"}
      </td>
      <td className="px-4 py-1.5 text-center">
        <StatusBadges card={card} />
      </td>
      <td className="px-2 py-1.5">
        <div className="flex gap-1">
          <Button
            variant="ghost"
            size="icon-xs"
            onClick={onStartEdit}
            title="แก้ไขด่วน"
          >
            <Pencil className="size-3.5" />
          </Button>
          <Link
            href={`/admin/cards/${card.id}`}
            className="inline-flex size-7 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            title="แก้ไขฉบับเต็ม"
          >
            <ExternalLink className="size-3.5" />
          </Link>
        </div>
      </td>
    </tr>
  );
}
