"use client";

import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import {
  ArrowLeftRight,
  CheckCheck,
  Loader2,
  RefreshCw,
  Search,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useConfirm } from "@/components/admin/confirm-dialog";
import { AdminPage } from "@/components/admin/admin-page";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { AdminPagination } from "@/components/admin/admin-pagination";
import {
  AdminToolbar,
  AdminSearch,
  AdminFilterSelect,
  AdminFilterCount,
} from "@/components/admin/admin-toolbar";
import { AdminEmptyState } from "@/components/admin/admin-empty-state";
import { Lightbox } from "@/components/admin/matching-ui";
import { Button } from "@/components/ui/button";
import { Surface } from "@/components/ui/surface";
import { adminFetch, buildAdminQuery } from "@/lib/admin/admin-fetch";
import { SetPicker } from "@/components/shared/set-picker";
import { useAdminList } from "@/lib/admin/use-admin-list";
import { useAdminUrlState } from "@/lib/admin/use-admin-url-state";

import { YuyuteiAiPanel } from "./yuyutei-ai-panel";
import { YuyuteiBulkBar } from "./yuyutei-bulk-bar";
import { YuyuteiMatchRow } from "./yuyutei-match-row";
import { SkeletonRows } from "./yuyutei-skeleton-rows";
import { useYuyuteiAi } from "./use-yuyutei-ai";
import type { ApiResponse, Mapping, MappingCard } from "./yuyutei-types";
import { API, METHOD_INFO, yuyuHd } from "./yuyutei-types";

/* ── Status tab config ── */

const STATUS_TABS = [
  { key: "", label: "ทั้งหมด", dotColor: "bg-foreground/40", textColor: "text-foreground", activeBg: "bg-primary/15" },
  { key: "suggested", label: "มีคำแนะนำ", dotColor: "bg-info", textColor: "text-info", activeBg: "bg-primary/15" },
  { key: "pending", label: "รอดำเนินการ", dotColor: "bg-warning", textColor: "text-warning", activeBg: "bg-primary/15" },
  { key: "matched", label: "จับคู่แล้ว", dotColor: "bg-success", textColor: "text-success", activeBg: "bg-primary/15" },
  { key: "rejected", label: "ปฏิเสธแล้ว", dotColor: "bg-danger", textColor: "text-danger", activeBg: "bg-primary/15" },
] as const;

/* ══════════ MAIN ══════════ */

export function YuyuteiMatchClient() {
  const confirmDialog = useConfirm();

  /* ── state ── */
  const { state, patch } = useAdminUrlState({
    defaults: {
      set: "",
      status: "suggested",
      q: "",
      method: "",
      confidence: "",
      noMatch: false as boolean,
      page: 1,
      perPage: 20,
    },
  });
  const {
    set: setFilter,
    status: statusFilter,
    q: search,
    method: methodFilter,
    confidence: confidenceFilter,
    noMatch: noMatchOnly,
    page,
    perPage,
  } = state;

  const [saving, setSaving] = useState<Set<number>>(new Set());
  const [bulkBusy, setBulkBusy] = useState(false);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [pickedCandidate, setPickedCandidate] = useState<Record<number, number>>({});
  const [lightbox, setLightbox] = useState<{ src: string; label: string }[] | null>(null);

  const lastClickedRef = useRef<number | null>(null);

  /* ── data fetching ── */

  const { data, loading, refetch } = useAdminList<ApiResponse, typeof state>({
    url: (p) =>
      `${API}?${buildAdminQuery({
        set: p.set || undefined,
        status: p.status || undefined,
        q: p.q || undefined,
        method: p.method || undefined,
        confidence: p.confidence || undefined,
        noMatch: p.noMatch ? "true" : undefined,
        page: p.page,
        limit: p.perPage,
      })}`,
    params: state,
  });
  const fetchData = refetch;

  const ai = useYuyuteiAi({
    mappings: data?.mappings ?? [],
    selected,
    setFilter,
    confirm: confirmDialog,
    refetch: fetchData,
  });

  /* ── effects ── */

  useEffect(() => {
    const t = setTimeout(() => setSelected(new Set()), 0);
    return () => clearTimeout(t);
  }, [data]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape" && selected.size > 0) setSelected(new Set());
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [selected.size]);

  /* ── single actions ── */

  const addSaving = (id: number) => setSaving((s) => new Set(s).add(id));
  const removeSaving = (id: number) => setSaving((s) => { const n = new Set(s); n.delete(id); return n; });

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

  const handleReject = async (mappingId: number) => {
    addSaving(mappingId);
    await adminFetch(API, { method: "DELETE", body: { id: mappingId } });
    removeSaving(mappingId);
    await fetchData();
  };

  /* ── bulk actions ── */

  const handleBulkApproveAll = async () => {
    const label = setFilter ? setFilter.toUpperCase() : "ทุกเซ็ต";
    const ok = await confirmDialog({
      title: "อนุมัติทั้งหมด",
      description: `อนุมัติทั้งหมดที่มี suggestion ใน ${label}?`,
      confirmLabel: "อนุมัติ",
    });
    if (!ok) return;
    setBulkBusy(true);
    const json = await adminFetch<{ approved: number }>(API, {
      method: "PATCH",
      body: { action: "bulk-approve", set: setFilter || undefined },
    });
    toast.success(`อนุมัติแล้ว ${json.approved} รายการ`);
    setBulkBusy(false);
    await fetchData();
  };

  const handleBulkApproveSelected = async () => {
    const ids = [...selected];
    if (ids.length === 0) return;
    const ok = await confirmDialog({
      title: "อนุมัติที่เลือก",
      description: `อนุมัติ ${ids.length} รายการที่เลือก?`,
      confirmLabel: "อนุมัติ",
    });
    if (!ok) return;
    setBulkBusy(true);
    const overrides: Record<string, number> = {};
    for (const id of ids) {
      if (pickedCandidate[id]) overrides[String(id)] = pickedCandidate[id];
    }
    await adminFetch<{ approved: number }>(API, {
      method: "PATCH",
      body: { action: "bulk-approve-ids", ids, overrides },
    });
    toast.success(`อนุมัติแล้ว ${ids.length} รายการ`);
    setBulkBusy(false);
    await fetchData();
  };

  const handleBulkRejectSelected = async () => {
    const ids = [...selected];
    if (ids.length === 0) return;
    const ok = await confirmDialog({
      title: "ปฏิเสธที่เลือก",
      description: `ปฏิเสธ ${ids.length} รายการที่เลือก?`,
      confirmLabel: "ปฏิเสธ",
      variant: "destructive",
    });
    if (!ok) return;
    setBulkBusy(true);
    await adminFetch(API, { method: "PATCH", body: { action: "bulk-reject-ids", ids } });
    toast.success(`ปฏิเสธแล้ว ${ids.length} รายการ`);
    setBulkBusy(false);
    await fetchData();
  };

  /* ── selection ── */

  const toggleOne = (id: number, shiftKey: boolean) => {
    if (shiftKey && lastClickedRef.current != null && data) {
      const ids = data.mappings.map((m) => m.id);
      const lastIdx = ids.indexOf(lastClickedRef.current);
      const curIdx = ids.indexOf(id);
      if (lastIdx !== -1 && curIdx !== -1) {
        const start = Math.min(lastIdx, curIdx);
        const end = Math.max(lastIdx, curIdx);
        const rangeIds = ids.slice(start, end + 1);
        setSelected((prev) => {
          const next = new Set(prev);
          for (const rid of rangeIds) next.add(rid);
          return next;
        });
        lastClickedRef.current = id;
        return;
      }
    }
    lastClickedRef.current = id;
    setSelected((prev) => {
      const n = new Set(prev);
      if (n.has(id)) n.delete(id); else n.add(id);
      return n;
    });
  };

  const toggleAll = () => {
    if (!data) return;
    const ids = data.mappings.map((m) => m.id);
    setSelected(ids.every((id) => selected.has(id)) ? new Set() : new Set(ids));
  };

  /* ── lightbox ── */

  const openLightbox = (m: Mapping, card?: MappingCard) => {
    const imgs: { src: string; label: string }[] = [];
    const hd = yuyuHd(m.scrapedImage);
    if (hd) imgs.push({ src: hd, label: `Yuyutei · ${m.scrapedCode}` });
    if (card?.imageUrl) imgs.push({ src: card.imageUrl, label: `ฐานข้อมูล · ${card.cardCode}` });
    if (imgs.length > 0) setLightbox(imgs);
  };

  /* ── derived ── */

  const suggestedCount = (data?.counts.suggested ?? 0) + (data?.counts.pending ?? 0);
  const showStatusCol = statusFilter === "";
  const allPageIds = data?.mappings.map((m) => m.id) ?? [];
  const allChecked = allPageIds.length > 0 && allPageIds.every((id) => selected.has(id));
  const someChecked = selected.size > 0;
  const canBulkApproveSelected = [...selected].some((id) => {
    const m = data?.mappings.find((x) => x.id === id);
    return m && (m.matchedCardId || pickedCandidate[m.id]) && m.status !== "matched";
  });
  const resolveCardId = (m: Mapping): number | null => pickedCandidate[m.id] ?? m.matchedCardId;

  const totalAll = data
    ? data.counts.suggested + data.counts.pending + data.counts.matched + data.counts.rejected
    : 0;

  const activeFilterCount = [search, methodFilter, confidenceFilter, noMatchOnly ? "1" : ""].filter(Boolean).length;
  const clearAllFilters = () => {
    patch({ q: "", method: "", confidence: "", noMatch: false, page: 1 });
  };

  const pickerSets = (data?.sets ?? []).map((s) => ({
    code: s.code,
    name: s.name,
    nameEn: s.nameEn,
    nameTh: s.nameTh ?? null,
    type: s.type ?? "OTHER",
    imageUrl: s.boxImageUrl ?? null,
    releaseDate: s.releaseDate ?? null,
  }));

  return (
    <AdminPage
      header={
        <AdminPageHeader
          title="จับคู่ราคา Yuyutei"
          description="ติ๊กเลือก → อนุมัติ/ปฏิเสธทีเดียว หรืออนุมัติทีละรายการ"
          icon={ArrowLeftRight}
          meta={
            <span className="text-meta">
              {totalAll.toLocaleString()} รายการ
            </span>
          }
          actions={
            <div className="flex items-center gap-2">
              <div className="w-56">
                <SetPicker
                  sets={pickerSets}
                  selectedCode={setFilter || null}
                  onSelect={(code) => patch({ set: code ?? "", page: 1 })}
                  variant="inline"
                  nullable
                  align="right"
                />
              </div>
              <Button
                variant="outline"
                size="icon-sm"
                onClick={fetchData}
                disabled={loading}
                aria-label="รีเฟรช"
              >
                <RefreshCw className={cn("size-4", loading && "animate-spin")} />
              </Button>
            </div>
          }
        />
      }
      bodyClassName="space-y-4"
    >
      {lightbox && <Lightbox images={lightbox} onClose={() => setLightbox(null)} />}

      {/* ── Toolbar ── */}
      <div className="sticky top-0 z-20">
      <AdminToolbar
        actions={
          <>
            <Button
              variant="default"
              size="sm"
              onClick={() => ai.handleAiSuggestBulk(false)}
              disabled={ai.aiRunning}
            >
              {ai.aiRunning ? <Loader2 className="size-3.5 animate-spin" /> : <Sparkles className="size-3.5" />}
              AI แนะนำ
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => ai.handleAiSuggestBulk(true)}
              disabled={ai.aiRunning}
            >
              {ai.aiRunning ? <Loader2 className="size-3.5 animate-spin" /> : <Sparkles className="size-3.5" />}
              AI รันใหม่
            </Button>
            <Button
              variant="default"
              size="sm"
              onClick={handleBulkApproveAll}
              disabled={bulkBusy || suggestedCount === 0}
              className="bg-success text-success-foreground hover:bg-success/90"
            >
              {bulkBusy ? <Loader2 className="size-3.5 animate-spin" /> : <CheckCheck className="size-3.5" />}
              อนุมัติทั้งหมด ({suggestedCount})
            </Button>
          </>
        }
      >
        <AdminSearch
          value={search}
          onChange={(v) => patch({ q: v, page: 1 })}
          placeholder="ค้นหารหัส / ชื่อ..."
          className="w-48"
        />
        <AdminFilterSelect
          value={methodFilter}
          onChange={(v) => patch({ method: v, page: 1 })}
          placeholder="วิธีจับคู่: ทั้งหมด"
          options={[
            { value: "none", label: "ยังไม่มีวิธี" },
            ...METHOD_INFO.map((m) => ({ value: m.key, label: m.label })),
          ]}
        />
        <AdminFilterSelect
          value={confidenceFilter}
          onChange={(v) => patch({ confidence: v, page: 1 })}
          placeholder="ความเชื่อมั่น: ทั้งหมด"
          options={[
            { value: "high", label: "สูง (≥80%)" },
            { value: "mid", label: "กลาง (50-79%)" },
            { value: "low", label: "ต่ำ (<50%)" },
          ]}
        />
        <label className="flex items-center gap-1.5 cursor-pointer text-sm select-none">
          <input
            type="checkbox"
            checked={noMatchOnly}
            onChange={(e) => patch({ noMatch: e.target.checked, page: 1 })}
            className="accent-primary size-3.5"
          />
          <span className="text-muted-foreground text-xs">ยังไม่จับคู่</span>
        </label>
        <AdminFilterCount activeCount={activeFilterCount} onClear={clearAllFilters} />
      </AdminToolbar>
      </div>

      {/* ── AI Panel ── */}
      <YuyuteiAiPanel
        log={ai.aiLog}
        progress={ai.aiProgress}
        running={ai.aiRunning}
        onCancel={ai.handleAiCancel}
        onClear={ai.clearLog}
      />

      {/* ── Table ── */}
      <Surface variant="outline" className="overflow-hidden">
        {/* Status tabs */}
        <div className="flex items-center justify-between border-b border-hair bg-muted/20 px-3 py-2">
          <div className="flex items-center gap-0.5 rounded-lg bg-muted/60 p-0.5">
            {STATUS_TABS.map((tab) => {
              const count =
                tab.key === ""
                  ? totalAll
                  : data?.counts[tab.key as keyof typeof data.counts] ?? 0;
              const isActive = statusFilter === tab.key;
              return (
                <button
                  key={tab.key}
                  onClick={() => patch({ status: tab.key, page: 1 })}
                  className={cn(
                    "flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs motion-base",
                    isActive
                      ? `${tab.activeBg} ${tab.textColor} font-semibold`
                      : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  <span className={cn("size-1.5 rounded-full", tab.dotColor)} />
                  <span>{tab.label}</span>
                  <span
                    className={cn(
                      "font-mono font-bold tabular-nums",
                      isActive ? tab.textColor : "text-muted-foreground/60",
                    )}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Set completion indicator */}
          {setFilter && data && totalAll > 0 && (
            <div className="flex items-center gap-2 text-meta">
              <div className="h-1.5 w-24 rounded-full bg-muted overflow-hidden">
                <div
                  className="h-full bg-success rounded-full motion-base"
                  style={{ width: `${Math.round((data.counts.matched / totalAll) * 100)}%` }}
                />
              </div>
              <span className="tabular-nums">
                จับคู่แล้ว {Math.round((data.counts.matched / totalAll) * 100)}%
              </span>
            </div>
          )}
        </div>

        {/* Content */}
        {loading && !data ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-hair bg-muted/40 text-meta">
                  <th className="px-3 py-2.5 w-10" />
                  {showStatusCol && <th className="px-3 py-2.5 text-left w-20">สถานะ</th>}
                  <th className="px-3 py-2.5 text-left">รายการ Yuyutei</th>
                  <th className="px-2 py-2.5 w-6" />
                  <th className="px-3 py-2.5 text-left">การ์ดในฐานข้อมูล</th>
                  <th className="px-3 py-2.5 text-right w-20">ราคา</th>
                  <th className="px-3 py-2.5 text-left w-24">วิธีจับคู่</th>
                  <th className="px-3 py-2.5 text-left w-32">อัปเดตล่าสุด</th>
                  <th className="px-3 py-2.5 text-center w-32">การจัดการ</th>
                </tr>
              </thead>
              <tbody>
                <SkeletonRows showStatus={showStatusCol} />
              </tbody>
            </table>
          </div>
        ) : data?.mappings.length === 0 ? (
          <AdminEmptyState
            icon={Search}
            title={statusFilter === "suggested" ? "ไม่มีคำแนะนำรออนุมัติ" : `ไม่มีรายการ ${statusFilter || "ทั้งหมด"}`}
            description={
              (!setFilter ? "เลือกชุดการ์ดจากเมนู " : "") +
              "ลองเปลี่ยนตัวกรองอื่น หรือรัน npx tsx scripts/pipeline-yuyutei.ts"
            }
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="sticky top-0 z-10">
                <tr className="border-b border-hair bg-muted/40 text-meta">
                  <th className="px-3 py-2.5 w-10 bg-muted/40">
                    <input
                      type="checkbox"
                      checked={allChecked}
                      onChange={toggleAll}
                      className="accent-primary size-3.5 cursor-pointer"
                    />
                  </th>
                  {showStatusCol && (
                    <th className="px-3 py-2.5 text-left w-20 bg-muted/40">สถานะ</th>
                  )}
                  <th className="px-3 py-2.5 text-left bg-muted/40">รายการ Yuyutei</th>
                  <th className="px-2 py-2.5 w-6 bg-muted/40" />
                  <th className="px-3 py-2.5 text-left bg-muted/40">การ์ดในฐานข้อมูล</th>
                  <th className="px-3 py-2.5 text-right w-20 bg-muted/40">ราคา</th>
                  <th className="px-3 py-2.5 text-left w-24 bg-muted/40">วิธีจับคู่</th>
                  <th className="px-3 py-2.5 text-left w-32 bg-muted/40">อัปเดตล่าสุด</th>
                  <th className="px-3 py-2.5 text-center w-32 bg-muted/40">การจัดการ</th>
                </tr>
              </thead>
              <tbody>
                {data?.mappings.map((m) => (
                  <YuyuteiMatchRow
                    key={m.id}
                    m={m}
                    showStatus={showStatusCol}
                    isChecked={selected.has(m.id)}
                    isSaving={saving.has(m.id)}
                    isAiProcessing={ai.aiProcessing.has(m.id)}
                    effectiveCardId={resolveCardId(m)}
                    onToggle={toggleOne}
                    onApprove={handleApprove}
                    onUnmatch={handleUnmatch}
                    onReject={handleReject}
                    onAiSuggest={ai.handleAiSuggestOne}
                    onPickCandidate={(mappingId, cardId) =>
                      setPickedCandidate((prev) => ({ ...prev, [mappingId]: cardId }))
                    }
                    onLightbox={openLightbox}
                  />
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {data && data.total > 0 && (
          <div className="border-t border-hair px-3 py-2">
            <AdminPagination
              page={page}
              totalPages={data.totalPages}
              onPageChange={(p) => patch({ page: p })}
              total={data.total}
              perPage={perPage}
              onPerPageChange={(v) => patch({ perPage: v, page: 1 })}
              perPageOptions={[20, 50, 100, 500]}
            />
          </div>
        )}
      </Surface>

      {/* ── Floating bulk bar ── */}
      {someChecked && (
        <YuyuteiBulkBar
          selectedCount={selected.size}
          aiRunning={ai.aiRunning}
          bulkBusy={bulkBusy}
          canApprove={canBulkApproveSelected}
          onAiSuggest={() => ai.handleAiSuggestBulk(false)}
          onAiRecheck={() => ai.handleAiSuggestBulk(true)}
          onApprove={handleBulkApproveSelected}
          onReject={handleBulkRejectSelected}
          onClear={() => setSelected(new Set())}
        />
      )}
    </AdminPage>
  );
}
