"use client";

import { useEffect, useRef, useState } from "react";
import {
  Globe,
  Keyboard,
  Loader2,
  Plus,
  RefreshCw,
  Search,
  Sparkles,
  X,
} from "lucide-react";
import { toast } from "sonner";

import { cn } from "@/lib/utils";
import {
  AdminBulkBar,
  AdminBulkAction,
} from "@/components/admin/admin-bulk-bar";
import { AdminPage } from "@/components/admin/admin-page";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { AdminPagination } from "@/components/admin/admin-pagination";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { adminFetch, buildAdminQuery } from "@/lib/admin/admin-fetch";
import { useAdminList } from "@/lib/admin/use-admin-list";
import { useAdminUrlState } from "@/lib/admin/use-admin-url-state";
import type { ApiResponse, SortKey } from "./_components/types";
import { ShortcutLegend, SortableHeader, StatsBar } from "./_components/match-ui";
import { AddCardDialog } from "./_components/add-card-dialog";
import { MappingRow } from "./_components/mapping-row";

const API = "/api/admin/snkrdunk-matching";

export function SnkrdunkMatchClient() {
  const { state, patch } = useAdminUrlState({
    defaults: {
      status: "pending",
      q: "",
      sort: "" as SortKey,
      page: 1,
    },
  });
  const { status: statusFilter, q: searchQuery, sort, page } = state;

  const [searchInput, setSearchInput] = useState(searchQuery);
  const [saving, setSaving] = useState<Set<number>>(new Set());
  const [pickedCandidate, setPickedCandidate] = useState<
    Record<number, number>
  >({});
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [autoMatchBusy, setAutoMatchBusy] = useState(false);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [focusedIdx, setFocusedIdx] = useState<number>(-1);
  const [showShortcuts, setShowShortcuts] = useState(false);
  const tableRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (searchInput === searchQuery) return;
    const t = setTimeout(() => {
      patch({ q: searchInput, page: 1 });
    }, 400);
    return () => clearTimeout(t);
  }, [searchInput, searchQuery, patch]);

  const { data, loading, refetch } = useAdminList<ApiResponse, typeof state>({
    url: (p) =>
      `/api/admin/snkrdunk-matching?${buildAdminQuery({
        status: p.status || undefined,
        q: p.q || undefined,
        sort: p.sort || undefined,
        page: p.page,
        limit: 20,
      })}`,
    params: state,
  });
  const fetchData = refetch;

  useEffect(() => {
    setSelected(new Set());
    setFocusedIdx(-1);
  }, [statusFilter, searchQuery, page, sort]);

  /* ── Actions ── */

  const addSaving = (id: number) =>
    setSaving((s) => new Set(s).add(id));
  const removeSaving = (id: number) =>
    setSaving((s) => {
      const n = new Set(s);
      n.delete(id);
      return n;
    });

  const handleApprove = async (mappingId: number, cardId: number) => {
    addSaving(mappingId);
    await adminFetch(API, { method: "PATCH", body: { id: mappingId, matchedCardId: cardId } });
    removeSaving(mappingId);
    await fetchData();
  };

  const handleUnmatch = async (mappingId: number) => {
    addSaving(mappingId);
    await adminFetch(API, { method: "PATCH", body: { id: mappingId, action: "unmatch" } });
    removeSaving(mappingId);
    await fetchData();
  };

  const handleRefresh = async (mappingId: number) => {
    addSaving(mappingId);
    await adminFetch(API, { method: "PATCH", body: { id: mappingId, action: "refresh" } });
    removeSaving(mappingId);
    await fetchData();
  };

  const handleReject = async (mappingId: number) => {
    addSaving(mappingId);
    await adminFetch(API, { method: "DELETE", body: { id: mappingId } });
    removeSaving(mappingId);
    await fetchData();
  };

  const handleAutoMatch = async () => {
    setAutoMatchBusy(true);
    const json = await adminFetch<{ autoMatched: number }>(API, { method: "PATCH", body: { action: "auto-match" } });
    toast.success(`จับคู่อัตโนมัติแล้ว ${json.autoMatched} การ์ด`);
    setAutoMatchBusy(false);
    await fetchData();
  };

  const handleBulkReject = async () => {
    const ids = [...selected];
    if (ids.length === 0) return;
    setSaving(new Set(ids));
    await adminFetch(API, { method: "DELETE", body: { ids } });
    toast.success(`ปฏิเสธแล้ว ${ids.length} รายการ`);
    setSelected(new Set());
    setSaving(new Set());
    await fetchData();
  };

  /* ── Selection helpers ── */

  const toggleSelect = (id: number) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (!mappings.length) return;
    const allIds = mappings.map((m) => m.id);
    const allSelected = allIds.every((id) => selected.has(id));
    if (allSelected) {
      setSelected(new Set());
    } else {
      setSelected(new Set(allIds));
    }
  };

  /* ── Render data ── */

  const mappings = data?.mappings ?? [];
  const total = data?.total ?? 0;
  const totalPages = data?.totalPages ?? 1;
  const counts = data?.counts ?? {};

  const allOnPageSelected = mappings.length > 0 && mappings.every((m) => selected.has(m.id));

  /* ── Keyboard shortcuts ── */

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement).tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;
      if (addDialogOpen) return;

      const len = mappings.length;
      if (!len) return;

      if (e.key === "j") {
        e.preventDefault();
        setFocusedIdx((i) => Math.min(i + 1, len - 1));
      } else if (e.key === "k") {
        e.preventDefault();
        setFocusedIdx((i) => Math.max(i - 1, 0));
      } else if (e.key === "x" && focusedIdx >= 0 && focusedIdx < len) {
        e.preventDefault();
        const m = mappings[focusedIdx];
        if (m && !saving.has(m.id)) handleReject(m.id);
      } else if (e.key === "a" && focusedIdx >= 0 && focusedIdx < len) {
        e.preventDefault();
        const m = mappings[focusedIdx];
        const cid = pickedCandidate[m.id] ?? m.matchedCardId;
        if (m && cid && !saving.has(m.id) && m.status !== "matched") {
          handleApprove(m.id, cid);
        }
      } else if (e.key === " " && focusedIdx >= 0 && focusedIdx < len) {
        e.preventDefault();
        toggleSelect(mappings[focusedIdx].id);
      } else if (e.key === "Escape") {
        setSelected(new Set());
        setFocusedIdx(-1);
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mappings, focusedIdx, pickedCandidate, saving, addDialogOpen]);

  // Scroll focused row into view
  useEffect(() => {
    if (focusedIdx < 0) return;
    const row = tableRef.current?.querySelector(`[data-row-idx="${focusedIdx}"]`);
    row?.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }, [focusedIdx]);

  const handleStatusFilter = (s: string) => {
    patch({ status: s, page: 1 });
  };

  const setSort = (s: SortKey) => patch({ sort: s, page: 1 });
  const setPage = (next: number | ((prev: number) => number)) => {
    const value = typeof next === "function" ? next(page) : next;
    patch({ page: value });
  };

  return (
    <AdminPage
      header={
        <AdminPageHeader
          title="จับคู่ SNKRDUNK"
          description="จับคู่การ์ดจาก SNKRDUNK เพื่อดึงราคา PSA10 / ขายล่าสุด"
          icon={Globe}
          meta={<span className="text-meta">{total.toLocaleString()} รายการ</span>}
          actions={
            <>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setShowShortcuts((v) => !v)}
                className={cn(showShortcuts && "bg-muted")}
                title="ปุ่มลัดคีย์บอร์ด"
                aria-label="ปุ่มลัดคีย์บอร์ด"
              >
                <Keyboard className="size-3.5" />
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleAutoMatch}
                disabled={autoMatchBusy}
              >
                {autoMatchBusy ? (
                  <Loader2 className="size-3.5 animate-spin" />
                ) : (
                  <Sparkles className="size-3.5" />
                )}
                จับคู่อัตโนมัติ
              </Button>
              <Button
                type="button"
                size="sm"
                onClick={() => setAddDialogOpen(true)}
              >
                <Plus className="size-3.5" />
                เพิ่มการ์ด
              </Button>
            </>
          }
        />
      }
      bodyClassName="space-y-4"
    >
      {/* Stats bar */}
      <StatsBar counts={counts} activeFilter={statusFilter} onFilter={handleStatusFilter} />

      {/* Keyboard legend */}
      <ShortcutLegend visible={showShortcuts} />

      {/* Filters */}
      <div className="sticky top-0 z-20 -mx-1 flex flex-wrap items-center gap-2 bg-background/85 px-1 py-2 backdrop-blur supports-backdrop-filter:bg-background/70">
        <div className="relative w-full sm:w-56">
          <Search className="absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="text"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="ค้นหารหัสการ์ดหรือชื่อ…"
            className="h-9 pl-8"
          />
        </div>

        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => fetchData()}
          aria-label="รีเฟรช"
        >
          <RefreshCw className={cn("size-3.5", loading && "animate-spin")} />
        </Button>
      </div>

      {/* Bulk action bar */}
      <AdminBulkBar
        selectedCount={selected.size}
        onClear={() => {
          setSelected(new Set());
          setFocusedIdx(-1);
        }}
        label={(n) => `เลือก ${n} รายการ`}
      >
        <AdminBulkAction
          variant="danger"
          onClick={handleBulkReject}
          icon={<X className="size-3.5" />}
        >
          ปฏิเสธ {selected.size} รายการ
        </AdminBulkAction>
      </AdminBulkBar>

      {/* Table */}
      <div ref={tableRef} className="overflow-hidden rounded-xl border border-border">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/30 text-meta">
              <th className="w-10 py-2.5 pl-3 pr-1">
                <input
                  type="checkbox"
                  checked={allOnPageSelected}
                  onChange={toggleSelectAll}
                  className="accent-primary"
                  aria-label="เลือกทั้งหมด"
                />
              </th>
              <th className="py-2.5 pl-1 pr-2 text-left">
                <SortableHeader
                  label="SNKRDUNK"
                  sortKey="product"
                  ascKey="product-asc"
                  descKey="product-desc"
                  currentSort={sort}
                  onSort={(s) => { setSort(s); setPage(1); }}
                />
              </th>
              <th className="px-2 py-2.5 text-left">
                <SortableHeader
                  label="ราคา USD"
                  sortKey="price"
                  ascKey="price-desc"
                  descKey="price-asc"
                  currentSort={sort}
                  onSort={(s) => { setSort(s); setPage(1); }}
                />
              </th>
              <th className="px-2 py-2.5 text-left font-medium">
                จับคู่
              </th>
              <th className="px-2 py-2.5 text-center">
                <SortableHeader
                  label="สถานะ"
                  sortKey="date"
                  ascKey="date-desc"
                  descKey="date-asc"
                  currentSort={sort}
                  onSort={(s) => { setSort(s); setPage(1); }}
                  className="justify-center"
                />
              </th>
              <th className="px-2 py-2.5 pr-4 text-right font-medium">
                การจัดการ
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--p-hair)]">
            {loading && mappings.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-12 text-center">
                  <Loader2 className="mx-auto size-6 animate-spin text-muted-foreground" />
                </td>
              </tr>
            ) : mappings.length === 0 ? (
              <tr>
                <td
                  colSpan={6}
                  className="py-12 text-center text-meta"
                >
                  ไม่พบรายการ
                </td>
              </tr>
            ) : (
              mappings.map((m, idx) => {
                const candidateId = pickedCandidate[m.id] ?? m.matchedCardId;
                return (
                  <MappingRow
                    key={m.id}
                    m={m}
                    idx={idx}
                    isSaving={saving.has(m.id)}
                    candidateId={candidateId}
                    isFocused={focusedIdx === idx}
                    isSelected={selected.has(m.id)}
                    onFocus={() => setFocusedIdx(idx)}
                    onToggleSelect={() => toggleSelect(m.id)}
                    onPickCandidate={(cid) =>
                      setPickedCandidate((p) => ({ ...p, [m.id]: cid }))
                    }
                    onApprove={() => {
                      if (candidateId) handleApprove(m.id, candidateId);
                    }}
                    onReject={() => handleReject(m.id)}
                    onRefresh={() => handleRefresh(m.id)}
                    onUnmatch={() => handleUnmatch(m.id)}
                  />
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <AdminPagination
        page={page}
        totalPages={totalPages}
        total={total}
        perPage={20}
        onPageChange={(p) => setPage(p)}
      />

      {/* Add dialog */}
      <AddCardDialog
        open={addDialogOpen}
        onClose={() => setAddDialogOpen(false)}
        onAdded={fetchData}
      />
    </AdminPage>
  );
}
