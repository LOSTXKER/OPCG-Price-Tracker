"use client";

import { useState } from "react";
import Link from "next/link";
import {
  CreditCard,
  ExternalLink,
  Pencil,
} from "lucide-react";
import { toast } from "sonner";

import { formatJpy } from "@/lib/utils/currency";
import { RARITY_MAP } from "@/lib/constants/rarities";
import { Button } from "@/components/ui/button";
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
import { TooltipProvider } from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";
import { ViewModeControl } from "@/components/ui/view-mode-control";
import { useAdminList } from "@/lib/admin/use-admin-list";
import { useAdminUrlState } from "@/lib/admin/use-admin-url-state";
import { adminFetch, buildAdminQuery } from "@/lib/admin/admin-fetch";
import { SetPicker } from "@/components/shared/set-picker";
import type { ApiResponse, CardRow, FilterOptions } from "./_components/types";
import { ImageCell, StatusBadges } from "./_components/card-cells";
import { CardEditForm } from "./_components/card-edit-form";
import { CardMobileRow } from "./_components/card-mobile-row";
import { CardGrid } from "./_components/card-grid";

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
      perPage: 20,
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
            <span className="ml-1 rounded-sm bg-warning-soft px-1 text-xs font-medium text-warning">
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
            className="inline-flex size-7 items-center justify-center rounded-md text-muted-foreground motion-base hover:bg-muted hover:text-foreground"
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
            <ViewModeControl
              modes={["table", "grid"]}
              value={viewMode}
              onChange={setViewMode}
            />
          }
        />
      }
    >
      {/* Sticky toolbar — stays visible while the long table scrolls. Sits
          just below the admin top bar. */}
      <div className="sticky top-0 z-20 -mx-1 bg-background px-1 py-2">
        <AdminToolbar>
          <AdminSearch
            value={search}
            onChange={(v) => patch({ q: v, page: 1 })}
            placeholder="ค้นหา code หรือชื่อ..."
            className="w-full sm:w-52"
          />
          <div className="w-full sm:w-56">
            <SetPicker
              sets={filterOptions.sets}
              selectedCode={setFilter || null}
              onSelect={(code) => patch({ set: code ?? "", page: 1 })}
              variant="inline"
              nullable
              triggerClassName="tap-safe h-10 sm:h-9"
            />
          </div>
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
