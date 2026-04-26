"use client";

import { useCallback, useEffect, useRef, useState } from "react";
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
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { adminJsonFetch } from "@/lib/api/admin-client";

import { YuyuteiAiPanel } from "./yuyutei-ai-panel";
import { YuyuteiBulkBar } from "./yuyutei-bulk-bar";
import { YuyuteiMatchRow } from "./yuyutei-match-row";
import type { ApiResponse, AiLogEntry, Mapping, MappingCard } from "./yuyutei-types";
import { API, METHOD_INFO, yuyuHd } from "./yuyutei-types";

/* ── Status tab config ── */

const STATUS_TABS = [
  { key: "", label: "All", dotColor: "bg-foreground/40", textColor: "text-foreground", activeBg: "bg-background shadow-sm" },
  { key: "suggested", label: "Suggested", dotColor: "bg-blue-500", textColor: "text-blue-600", activeBg: "bg-background shadow-sm" },
  { key: "pending", label: "Pending", dotColor: "bg-amber-500", textColor: "text-amber-600", activeBg: "bg-background shadow-sm" },
  { key: "matched", label: "Matched", dotColor: "bg-green-500", textColor: "text-green-600", activeBg: "bg-background shadow-sm" },
  { key: "rejected", label: "Rejected", dotColor: "bg-red-500", textColor: "text-red-500", activeBg: "bg-background shadow-sm" },
] as const;

/* ── Skeleton rows ── */

function SkeletonRows({ count = 5, showStatus = true }: { count?: number; showStatus?: boolean }) {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <tr key={i} className="border-b border-border/10">
          <td className="px-3 py-4"><Skeleton className="size-3.5 rounded" /></td>
          {showStatus && <td className="px-3 py-4"><Skeleton className="h-5 w-16 rounded-full" /></td>}
          <td className="px-3 py-4">
            <div className="flex items-center gap-3">
              <Skeleton className="w-16 aspect-[63/88] rounded shrink-0" />
              <div className="space-y-1.5">
                <Skeleton className="h-3.5 w-24" />
                <Skeleton className="h-3 w-32" />
                <Skeleton className="h-3 w-20" />
              </div>
            </div>
          </td>
          <td className="px-1 py-4" />
          <td className="px-3 py-4">
            <div className="flex items-center gap-3">
              <Skeleton className="w-16 aspect-[63/88] rounded shrink-0" />
              <div className="space-y-1.5">
                <Skeleton className="h-3.5 w-20" />
                <Skeleton className="h-3 w-12" />
                <Skeleton className="h-3 w-24" />
              </div>
            </div>
          </td>
          <td className="px-3 py-4"><Skeleton className="ml-auto h-4 w-14" /></td>
          <td className="px-3 py-4"><Skeleton className="h-5 w-16" /></td>
          <td className="px-3 py-4">
            <div className="space-y-1">
              <Skeleton className="h-3.5 w-16" />
              <Skeleton className="h-3 w-12" />
            </div>
          </td>
          <td className="px-3 py-4"><Skeleton className="mx-auto h-6 w-20" /></td>
        </tr>
      ))}
    </>
  );
}

/* ══════════ MAIN ══════════ */

export function YuyuteiMatchClient() {
  const confirmDialog = useConfirm();

  /* ── state ── */
  const [data, setData] = useState<ApiResponse | null>(null);
  const [loading, setLoading] = useState(true);

  const [setFilter, setSetFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("suggested");
  const [search, setSearch] = useState("");
  const [methodFilter, setMethodFilter] = useState("");
  const [confidenceFilter, setConfidenceFilter] = useState("");
  const [noMatchOnly, setNoMatchOnly] = useState(false);

  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(20);

  const [saving, setSaving] = useState<Set<number>>(new Set());
  const [bulkBusy, setBulkBusy] = useState(false);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [pickedCandidate, setPickedCandidate] = useState<Record<number, number>>({});
  const [lightbox, setLightbox] = useState<{ src: string; label: string }[] | null>(null);

  const [aiProcessing, setAiProcessing] = useState<Set<number>>(new Set());
  const [aiRunning, setAiRunning] = useState(false);
  const aiCancelRef = useRef(false);
  const aiAbortRef = useRef<AbortController | null>(null);
  const [aiLog, setAiLog] = useState<AiLogEntry[]>([]);
  const [aiProgress, setAiProgress] = useState<{ current: number; total: number } | null>(null);

  const lastClickedRef = useRef<number | null>(null);

  /* ── effects ── */

  useEffect(() => { setSelected(new Set()); }, [data]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape" && selected.size > 0) setSelected(new Set());
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [selected.size]);

  /* ── data fetching ── */

  const fetchData = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (setFilter) params.set("set", setFilter);
    if (statusFilter) params.set("status", statusFilter);
    if (search) params.set("q", search);
    if (methodFilter) params.set("method", methodFilter);
    if (confidenceFilter) params.set("confidence", confidenceFilter);
    if (noMatchOnly) params.set("noMatch", "true");
    params.set("page", String(page));
    params.set("limit", String(perPage));
    const res = await fetch(`${API}?${params}`);
    if (res.ok) setData(await res.json());
    setLoading(false);
  }, [setFilter, statusFilter, search, methodFilter, confidenceFilter, noMatchOnly, page, perPage]);

  useEffect(() => { fetchData(); }, [fetchData]);

  /* ── single actions ── */

  const addSaving = (id: number) => setSaving((s) => new Set(s).add(id));
  const removeSaving = (id: number) => setSaving((s) => { const n = new Set(s); n.delete(id); return n; });

  const handleApprove = async (mappingId: number, cardId: number) => {
    addSaving(mappingId);
    await adminJsonFetch(API, { method: "PATCH", body: { id: mappingId, matchedCardId: cardId } });
    removeSaving(mappingId);
    await fetchData();
  };

  const handleUnmatch = async (mappingId: number) => {
    addSaving(mappingId);
    await adminJsonFetch(API, { method: "PATCH", body: { id: mappingId, action: "unmatch" } });
    removeSaving(mappingId);
    await fetchData();
  };

  const handleReject = async (mappingId: number) => {
    addSaving(mappingId);
    await adminJsonFetch(API, { method: "DELETE", body: { id: mappingId } });
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
    const json = await adminJsonFetch<{ approved: number }>(API, {
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
    await adminJsonFetch<{ approved: number }>(API, {
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
    await adminJsonFetch(API, { method: "PATCH", body: { action: "bulk-reject-ids", ids } });
    toast.success(`ปฏิเสธแล้ว ${ids.length} รายการ`);
    setBulkBusy(false);
    await fetchData();
  };

  /* ── AI suggest ── */

  const callAiSuggest = async (
    mappingId: number,
    signal?: AbortSignal,
    force?: boolean,
  ): Promise<{ code: string; result: "ok" | "fail" | "skip"; msg: string }> => {
    try {
      const res = await fetch(`${API}/ai-suggest`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: mappingId, ...(force && { force: true }) }),
        signal,
      });
      const json = await res.json();
      if (json.success) {
        return {
          code: json.matchedCardCode ?? "?",
          result: "ok",
          msg: `→ ${json.matchedCardCode} (${Math.round((json.confidence ?? 0) * 100)}%)`,
        };
      }
      if (json.skipped) return { code: "", result: "skip", msg: json.error ?? "Skipped" };
      return { code: "", result: "fail", msg: json.error ?? "Failed" };
    } catch (e) {
      if (e instanceof DOMException && e.name === "AbortError") {
        return { code: "", result: "skip", msg: "ยกเลิกแล้ว" };
      }
      return { code: "", result: "fail", msg: e instanceof Error ? e.message : "Network error" };
    }
  };

  const handleAiSuggestOne = async (mappingId: number) => {
    setAiProcessing((s) => new Set(s).add(mappingId));
    const entry = data?.mappings.find((m) => m.id === mappingId);
    setAiLog([{ code: entry?.scrapedCode ?? String(mappingId), result: "processing", msg: "กำลังวิเคราะห์..." }]);
    const ac = new AbortController();
    aiAbortRef.current = ac;
    const logResult = await callAiSuggest(mappingId, ac.signal);
    aiAbortRef.current = null;
    setAiLog([{ ...logResult, code: entry?.scrapedCode ?? logResult.code }]);
    setAiProcessing((s) => { const n = new Set(s); n.delete(mappingId); return n; });
    await fetchData();
  };

  const handleAiSuggestBulk = async (force = false) => {
    const hasSelected = selected.size > 0;
    let ids: number[];

    if (hasSelected) {
      ids = [...selected];
    } else {
      const params = new URLSearchParams({ "ai-candidates": "true", mode: force ? "all" : "new" });
      if (setFilter) params.set("set", setFilter);
      const res = await fetch(`${API}?${params}`);
      if (!res.ok) return;
      const json = await res.json();
      ids = (json.items as { id: number; scrapedCode: string }[]).map((i) => i.id);
    }

    if (ids.length === 0) {
      toast.info("ไม่มีรายการที่ต้องจับคู่");
      return;
    }

    const modeLabel = force ? "Re-check ทั้งหมด" : "เฉพาะที่ยังไม่ผ่าน AI";
    const label = hasSelected ? `${ids.length} รายการที่เลือก` : setFilter ? setFilter.toUpperCase() : "ทุก set";
    const ok = await confirmDialog({
      title: `AI ${modeLabel}`,
      description: `${ids.length} รายการ (${label}) — ประมาณ ${ids.length * 2} วินาที`,
      confirmLabel: "เริ่ม",
    });
    if (!ok) return;

    aiCancelRef.current = false;
    const ac = new AbortController();
    aiAbortRef.current = ac;
    setAiRunning(true);
    setAiLog([]);
    setAiProgress({ current: 0, total: ids.length });

    let okCount = 0;
    let failCount = 0;
    let skipCount = 0;

    for (let i = 0; i < ids.length; i++) {
      if (aiCancelRef.current) {
        setAiLog((prev) => [...prev, { code: "—", result: "skip", msg: `ยกเลิกแล้ว (เหลืออีก ${ids.length - i} รายการ)` }]);
        break;
      }

      const mappingId = ids[i];
      const entry = data?.mappings.find((m) => m.id === mappingId);
      const code = entry?.scrapedCode ?? String(mappingId);

      setAiLog((prev) => [...prev, { code, result: "processing", msg: "กำลังวิเคราะห์..." }]);
      setAiProgress({ current: i + 1, total: ids.length });

      const logResult = await callAiSuggest(mappingId, ac.signal, force);

      if (aiCancelRef.current) {
        setAiLog((prev) => [...prev, { code: "—", result: "skip", msg: `ยกเลิกแล้ว (เหลืออีก ${ids.length - i - 1} รายการ)` }]);
        break;
      }

      if (logResult.result === "ok") okCount++;
      else if (logResult.result === "skip") skipCount++;
      else failCount++;

      setAiLog((prev) => {
        const updated = [...prev];
        updated[updated.length - 1] = { ...logResult, code };
        return updated;
      });

      if (logResult.result !== "skip" && i < ids.length - 1 && !aiCancelRef.current) {
        await new Promise((r) => setTimeout(r, 1500));
      }
    }

    aiAbortRef.current = null;
    setAiLog((prev) => [
      ...prev,
      { code: "สรุป", result: "ok", msg: `สำเร็จ ${okCount} / ข้าม ${skipCount} / ไม่สำเร็จ ${failCount} จากทั้งหมด ${ids.length}` },
    ]);
    setAiRunning(false);
    setAiProgress(null);
    await fetchData();
  };

  const handleAiCancel = () => {
    aiCancelRef.current = true;
    aiAbortRef.current?.abort();
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
    if (card?.imageUrl) imgs.push({ src: card.imageUrl, label: `DB · ${card.cardCode}` });
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
    setSearch("");
    setMethodFilter("");
    setConfidenceFilter("");
    setNoMatchOnly(false);
    setPage(1);
  };

  const setOptions = (data?.sets ?? []).map((s) => ({
    value: s.code,
    label: `${s.code.toUpperCase()} · ${s.nameEn ?? s.name}`,
  }));

  return (
    <div className="space-y-4">
      {lightbox && <Lightbox images={lightbox} onClose={() => setLightbox(null)} />}

      {/* ── Header ── */}
      <AdminPageHeader
        title="Yuyutei Price Matching"
        description="ติ๊กเลือก → Approve/Reject ทีเดียว หรือ Approve ทีละรายการ"
        icon={ArrowLeftRight}
        actions={
          <div className="flex items-center gap-2">
            <AdminFilterSelect
              value={setFilter}
              onChange={(v) => { setSetFilter(v); setPage(1); }}
              placeholder="All Sets"
              options={setOptions}
            />
            <Button
              variant="outline"
              size="icon-sm"
              onClick={fetchData}
              disabled={loading}
              aria-label="Refresh"
            >
              <RefreshCw className={cn("size-4", loading && "animate-spin")} />
            </Button>
          </div>
        }
      />

      {/* ── Toolbar ── */}
      <AdminToolbar
        actions={
          <>
            <button
              onClick={() => handleAiSuggestBulk(false)}
              disabled={aiRunning}
              className="flex items-center gap-1.5 rounded-lg bg-violet-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-violet-700 disabled:opacity-30 transition-colors"
            >
              {aiRunning ? <Loader2 className="size-3.5 animate-spin" /> : <Sparkles className="size-3.5" />}
              AI Suggest
            </button>
            <button
              onClick={() => handleAiSuggestBulk(true)}
              disabled={aiRunning}
              className="flex items-center gap-1.5 rounded-lg border border-violet-500/40 px-3 py-1.5 text-xs font-semibold text-violet-600 hover:bg-violet-500/10 disabled:opacity-30 transition-colors"
            >
              {aiRunning ? <Loader2 className="size-3.5 animate-spin" /> : <Sparkles className="size-3.5" />}
              AI Re-check
            </button>
            <button
              onClick={handleBulkApproveAll}
              disabled={bulkBusy || suggestedCount === 0}
              className="flex items-center gap-1.5 rounded-lg bg-green-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-green-700 disabled:opacity-30 transition-colors"
            >
              {bulkBusy ? <Loader2 className="size-3.5 animate-spin" /> : <CheckCheck className="size-3.5" />}
              Approve All ({suggestedCount})
            </button>
          </>
        }
      >
        <AdminSearch
          value={search}
          onChange={(v) => { setSearch(v); setPage(1); }}
          placeholder="ค้นหา code / ชื่อ..."
          className="w-48"
        />
        <AdminFilterSelect
          value={methodFilter}
          onChange={(v) => { setMethodFilter(v); setPage(1); }}
          placeholder="Method: All"
          options={[
            { value: "none", label: "ยังไม่มี method" },
            ...METHOD_INFO.map((m) => ({ value: m.key, label: m.label })),
          ]}
        />
        <AdminFilterSelect
          value={confidenceFilter}
          onChange={(v) => { setConfidenceFilter(v); setPage(1); }}
          placeholder="Confidence: All"
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
            onChange={(e) => { setNoMatchOnly(e.target.checked); setPage(1); }}
            className="accent-primary size-3.5"
          />
          <span className="text-muted-foreground text-xs">ยังไม่มี match</span>
        </label>
        <AdminFilterCount activeCount={activeFilterCount} onClear={clearAllFilters} />
      </AdminToolbar>

      {/* ── AI Panel ── */}
      <YuyuteiAiPanel
        log={aiLog}
        progress={aiProgress}
        running={aiRunning}
        onCancel={handleAiCancel}
        onClear={() => setAiLog([])}
      />

      {/* ── Table ── */}
      <div className="rounded-xl border border-border/50 overflow-hidden bg-card">
        {/* Status tabs */}
        <div className="flex items-center justify-between border-b border-border/30 bg-muted/20 px-3 py-2">
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
                  onClick={() => { setStatusFilter(tab.key); setPage(1); }}
                  className={cn(
                    "flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs transition-all",
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
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <div className="h-1.5 w-24 rounded-full bg-muted overflow-hidden">
                <div
                  className="h-full bg-green-500 rounded-full transition-all"
                  style={{ width: `${Math.round((data.counts.matched / totalAll) * 100)}%` }}
                />
              </div>
              <span className="tabular-nums">
                {Math.round((data.counts.matched / totalAll) * 100)}% matched
              </span>
            </div>
          )}
        </div>

        {/* Content */}
        {loading && !data ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border/30 bg-muted/40 text-xs text-muted-foreground">
                  <th className="px-3 py-2.5 w-10" />
                  {showStatusCol && <th className="px-3 py-2.5 text-left w-20">Status</th>}
                  <th className="px-3 py-2.5 text-left">Yuyutei Listing</th>
                  <th className="px-2 py-2.5 w-6" />
                  <th className="px-3 py-2.5 text-left">DB Card Match</th>
                  <th className="px-3 py-2.5 text-right w-20">Price</th>
                  <th className="px-3 py-2.5 text-left w-24">Method</th>
                  <th className="px-3 py-2.5 text-left w-32">Updated</th>
                  <th className="px-3 py-2.5 text-center w-32">Actions</th>
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
            title={statusFilter === "suggested" ? "ไม่มี suggestion รออนุมัติ" : `ไม่มีรายการ ${statusFilter || "ทั้งหมด"}`}
            description={
              (!setFilter ? "เลือก set จาก dropdown " : "") +
              "ลอง filter อื่น หรือรัน npx tsx scripts/pipeline-yuyutei.ts"
            }
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="sticky top-0 z-10">
                <tr className="border-b border-border/30 bg-muted/40 text-xs text-muted-foreground">
                  <th className="px-3 py-2.5 w-10 bg-muted/40">
                    <input
                      type="checkbox"
                      checked={allChecked}
                      onChange={toggleAll}
                      className="accent-primary size-3.5 cursor-pointer"
                    />
                  </th>
                  {showStatusCol && (
                    <th className="px-3 py-2.5 text-left w-20 bg-muted/40">Status</th>
                  )}
                  <th className="px-3 py-2.5 text-left bg-muted/40">Yuyutei Listing</th>
                  <th className="px-2 py-2.5 w-6 bg-muted/40" />
                  <th className="px-3 py-2.5 text-left bg-muted/40">DB Card Match</th>
                  <th className="px-3 py-2.5 text-right w-20 bg-muted/40">Price</th>
                  <th className="px-3 py-2.5 text-left w-24 bg-muted/40">Method</th>
                  <th className="px-3 py-2.5 text-left w-32 bg-muted/40">Updated</th>
                  <th className="px-3 py-2.5 text-center w-32 bg-muted/40">Actions</th>
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
                    isAiProcessing={aiProcessing.has(m.id)}
                    effectiveCardId={resolveCardId(m)}
                    onToggle={toggleOne}
                    onApprove={handleApprove}
                    onUnmatch={handleUnmatch}
                    onReject={handleReject}
                    onAiSuggest={handleAiSuggestOne}
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
          <div className="border-t border-border/30 px-3 py-2">
            <AdminPagination
              page={page}
              totalPages={data.totalPages}
              onPageChange={setPage}
              total={data.total}
              perPage={perPage}
              onPerPageChange={(v) => { setPerPage(v); setPage(1); }}
              perPageOptions={[20, 50, 100, 500]}
            />
          </div>
        )}
      </div>

      {/* ── Floating bulk bar ── */}
      {someChecked && (
        <YuyuteiBulkBar
          selectedCount={selected.size}
          aiRunning={aiRunning}
          bulkBusy={bulkBusy}
          canApprove={canBulkApproveSelected}
          onAiSuggest={() => handleAiSuggestBulk(false)}
          onAiRecheck={() => handleAiSuggestBulk(true)}
          onApprove={handleBulkApproveSelected}
          onReject={handleBulkRejectSelected}
          onClear={() => setSelected(new Set())}
        />
      )}
    </div>
  );
}
