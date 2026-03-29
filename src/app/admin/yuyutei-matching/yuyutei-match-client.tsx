"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  Check,
  CheckCheck,
  ChevronLeft,
  ChevronRight,
  Loader2,
  RefreshCw,
  Search,
  Sparkles,
  Square,
  Undo2,
  X,
  XCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { formatJpy } from "@/lib/utils/currency";
import { RarityBadge } from "@/components/shared/rarity-badge";
import {
  relativeTime,
  StatusBadge,
  CardThumb,
  Lightbox,
  CandidatePicker,
  type MatchingCard,
} from "@/components/admin/matching-ui";
import { adminJsonFetch } from "@/lib/api/admin-client";
import type { PaginatedApiResponse } from "@/app/admin/admin-types";

/* ── Types ── */

type MappingCard = MatchingCard;

interface Mapping {
  id: number;
  setCode: string;
  yuyuteiId: string;
  scrapedCode: string;
  scrapedRarity: string | null;
  scrapedName: string;
  scrapedImage: string | null;
  priceJpy: number;
  matchedCardId: number | null;
  matchedCard: MappingCard | null;
  matchMethod: string | null;
  geminiScore: number | null;
  status: string;
  updatedAt: string;
  actionAt: string | null;
  actionByUser: { displayName: string | null; email: string } | null;
  candidates: MappingCard[];
}

interface SetInfo { code: string; name: string; nameEn: string | null }

interface ApiResponse extends PaginatedApiResponse {
  mappings: Mapping[];
  sets: SetInfo[];
  counts: { matched: number; pending: number; suggested: number; rejected: number };
}

/* ── Helpers ── */

function yuyuHd(url: string | null): string | null {
  if (!url) return null;
  return url.replace(/\/\d+_\d+\//, "/front/");
}

const METHOD_INFO: { key: string; label: string; desc: string }[] = [
  { key: "exact", label: "exact", desc: "รหัสตรง cardCode เป๊ะ" },
  { key: "auto-parallel", label: "auto-parallel", desc: "จับคู่ parallel จาก rarity" },
  { key: "auto-parallel-any", label: "auto-parallel-any", desc: "parallel ที่ใกล้เคียงที่สุด" },
  { key: "auto-basecode", label: "auto-basecode", desc: "จาก baseCode + rarity ในเซ็ตเดียวกัน" },
  { key: "admin", label: "admin", desc: "แอดมินเลือกจับคู่เอง" },
  { key: "admin-bulk", label: "admin-bulk", desc: "แอดมิน approve ยกชุด" },
  { key: "gemini", label: "gemini", desc: "AI เปรียบเทียบรูปภาพจาก Gemini Vision" },
  { key: "cached", label: "cached", desc: "เคยจับคู่ไว้แล้ว (yuyuteiId ตรง)" },
];

function Tooltip({ children, content }: { children: React.ReactNode; content: React.ReactNode }) {
  return (
    <span className="relative group/tip inline-flex">
      {children}
      <span className="pointer-events-none absolute bottom-full left-1/2 z-50 mb-2 -translate-x-1/2 whitespace-nowrap rounded-lg bg-popover px-3 py-2 text-xs text-popover-foreground shadow-lg border border-border opacity-0 transition-opacity group-hover/tip:opacity-100">
        {content}
      </span>
    </span>
  );
}

/* ══════════ MAIN ══════════ */

const API = "/api/admin/yuyutei-matching";

export function YuyuteiMatchClient() {
  const [data, setData] = useState<ApiResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [setFilter, setSetFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("suggested");
  const [searchInput, setSearchInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [methodFilter, setMethodFilter] = useState("");
  const [confidenceFilter, setConfidenceFilter] = useState("");
  const [noMatchOnly, setNoMatchOnly] = useState(false);
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(20);
  const [saving, setSaving] = useState<Set<number>>(new Set());
  const [bulkBusy, setBulkBusy] = useState(false);
  const [lightbox, setLightbox] = useState<{ src: string; label: string }[] | null>(null);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [pickedCandidate, setPickedCandidate] = useState<Record<number, number>>({});
  const [aiProcessing, setAiProcessing] = useState<Set<number>>(new Set());
  const [aiRunning, setAiRunning] = useState(false);
  const aiCancelRef = useRef(false);
  const aiAbortRef = useRef<AbortController | null>(null);
  const [aiLog, setAiLog] = useState<{ code: string; result: "ok" | "fail" | "skip" | "processing"; msg: string }[]>([]);
  const [aiProgress, setAiProgress] = useState<{ current: number; total: number } | null>(null);

  useEffect(() => { setSelected(new Set()); }, [data]);
  useEffect(() => {
    const t = setTimeout(() => { setSearchQuery(searchInput); setPage(1); }, 400);
    return () => clearTimeout(t);
  }, [searchInput]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (setFilter) params.set("set", setFilter);
    if (statusFilter) params.set("status", statusFilter);
    if (searchQuery) params.set("q", searchQuery);
    if (methodFilter) params.set("method", methodFilter);
    if (confidenceFilter) params.set("confidence", confidenceFilter);
    if (noMatchOnly) params.set("noMatch", "true");
    params.set("page", String(page));
    params.set("limit", String(perPage));
    const res = await fetch(`/api/admin/yuyutei-matching?${params}`);
    if (res.ok) setData(await res.json());
    setLoading(false);
  }, [setFilter, statusFilter, searchQuery, methodFilter, confidenceFilter, noMatchOnly, page, perPage]);

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
    if (!confirm(`อนุมัติทั้งหมดที่มี suggestion ใน ${label}?`)) return;
    setBulkBusy(true);
    const json = await adminJsonFetch<{ approved: number }>(API, { method: "PATCH", body: { action: "bulk-approve", set: setFilter || undefined } });
    alert(`อนุมัติแล้ว ${json.approved} รายการ`);
    setBulkBusy(false);
    await fetchData();
  };

  const handleBulkApproveSelected = async () => {
    const ids = [...selected];
    if (ids.length === 0) return;
    if (!confirm(`Approve ${ids.length} รายการที่เลือก?`)) return;
    setBulkBusy(true);
    const overrides: Record<string, number> = {};
    for (const id of ids) { if (pickedCandidate[id]) overrides[String(id)] = pickedCandidate[id]; }
    const json = await adminJsonFetch<{ approved: number }>(API, { method: "PATCH", body: { action: "bulk-approve-ids", ids, overrides } });
    alert(`อนุมัติแล้ว ${json.approved} รายการ`);
    setBulkBusy(false);
    await fetchData();
  };

  const handleBulkRejectSelected = async () => {
    const ids = [...selected];
    if (ids.length === 0) return;
    if (!confirm(`Reject ${ids.length} รายการที่เลือก?`)) return;
    setBulkBusy(true);
    await adminJsonFetch(API, { method: "PATCH", body: { action: "bulk-reject-ids", ids } });
    setBulkBusy(false);
    await fetchData();
  };

  /* ── AI suggest ── */

  const callAiSuggest = async (mappingId: number, signal?: AbortSignal, force?: boolean): Promise<{ code: string; result: "ok" | "fail" | "skip"; msg: string }> => {
    try {
      const res = await fetch("/api/admin/yuyutei-matching/ai-suggest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: mappingId, ...(force && { force: true }) }),
        signal,
      });
      const json = await res.json();
      if (json.success) {
        return { code: json.matchedCardCode ?? "?", result: "ok", msg: `→ ${json.matchedCardCode} (${Math.round((json.confidence ?? 0) * 100)}%)` };
      }
      if (json.skipped) {
        return { code: "", result: "skip", msg: json.error ?? "Skipped" };
      }
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
      const res = await fetch(`/api/admin/yuyutei-matching?${params}`);
      if (!res.ok) return;
      const json = await res.json();
      ids = (json.items as { id: number; scrapedCode: string }[]).map((i) => i.id);
    }

    if (ids.length === 0) {
      setAiLog([{ code: "", result: "skip", msg: "ไม่มีรายการที่ต้องจับคู่" }]);
      return;
    }

    const modeLabel = force ? "Re-check ทั้งหมด" : "เฉพาะที่ยังไม่ผ่าน AI";
    const label = hasSelected ? `${ids.length} รายการที่เลือก` : setFilter ? setFilter.toUpperCase() : "ทุก set";
    if (!confirm(`AI ${modeLabel}: ${ids.length} รายการ (${label})?\n\nประมาณ ${ids.length * 2} วินาที`)) return;

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
    setAiLog((prev) => [...prev, { code: "สรุป", result: "ok", msg: `สำเร็จ ${okCount} / ข้าม ${skipCount} / ไม่สำเร็จ ${failCount} จากทั้งหมด ${ids.length}` }]);
    setAiRunning(false);
    setAiProgress(null);
    await fetchData();
  };

  const handleAiCancel = () => {
    aiCancelRef.current = true;
    aiAbortRef.current?.abort();
  };

  /* ── selection ── */

  const toggleOne = (id: number) => setSelected((prev) => { const n = new Set(prev); if (n.has(id)) n.delete(id); else n.add(id); return n; });
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
  const openCardZoom = (m: Mapping, card: MappingCard) => {
    const imgs: { src: string; label: string }[] = [];
    const hd = yuyuHd(m.scrapedImage);
    if (hd) imgs.push({ src: hd, label: `Yuyutei · ${m.scrapedCode}` });
    if (card.imageUrl) imgs.push({ src: card.imageUrl, label: `${card.cardCode} · ${card.rarity}` });
    if (imgs.length > 0) setLightbox(imgs);
  };

  /* ── derived ── */

  const suggestedCount = (data?.counts.suggested ?? 0) + (data?.counts.pending ?? 0);
  const allPageIds = data?.mappings.map((m) => m.id) ?? [];
  const allChecked = allPageIds.length > 0 && allPageIds.every((id) => selected.has(id));
  const someChecked = selected.size > 0;
  const canBulkApproveSelected = [...selected].some((id) => {
    const m = data?.mappings.find((x) => x.id === id);
    return m && (m.matchedCardId || pickedCandidate[m.id]) && m.status !== "matched";
  });
  const resolveCardId = (m: Mapping): number | null => pickedCandidate[m.id] ?? m.matchedCardId;

  return (
    <div className="space-y-4">
      {lightbox && <Lightbox images={lightbox} onClose={() => setLightbox(null)} />}

      {/* Header */}
      <div className="flex items-end justify-between">
        <div>
          <h2 className="text-xl font-bold">Yuyutei Price Matching</h2>
          <p className="text-muted-foreground text-sm mt-0.5">ติ๊กเลือก → Approve/Reject ทีเดียว หรือ Approve ทีละรายการ</p>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={setFilter}
            onChange={(e) => { setSetFilter(e.target.value); setPage(1); }}
            className="rounded-lg border border-border bg-transparent px-3 py-1.5 text-sm"
          >
            <option value="">All Sets</option>
            {data?.sets.map((s) => (
              <option key={s.code} value={s.code}>{s.code.toUpperCase()} · {s.nameEn ?? s.name}</option>
            ))}
          </select>
          <button onClick={fetchData} disabled={loading} className="rounded-lg border border-border/40 p-1.5 hover:bg-muted" title="Refresh">
            <RefreshCw className={cn("size-4", loading && "animate-spin")} />
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-wrap items-center gap-2">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground pointer-events-none" />
          <input
            type="text"
            placeholder="ค้นหา code / ชื่อ..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="rounded-lg border border-border bg-transparent pl-8 pr-3 py-1.5 text-sm w-48 placeholder:text-muted-foreground/50"
          />
        </div>

        {/* Method */}
        <select
          value={methodFilter}
          onChange={(e) => { setMethodFilter(e.target.value); setPage(1); }}
          className="rounded-lg border border-border bg-transparent px-3 py-1.5 text-sm"
        >
          <option value="">Method: All</option>
          <option value="none">ยังไม่มี method</option>
          {METHOD_INFO.map((m) => (
            <option key={m.key} value={m.key}>{m.label}</option>
          ))}
        </select>

        {/* Confidence */}
        <select
          value={confidenceFilter}
          onChange={(e) => { setConfidenceFilter(e.target.value); setPage(1); }}
          className="rounded-lg border border-border bg-transparent px-3 py-1.5 text-sm"
        >
          <option value="">Confidence: All</option>
          <option value="high">สูง (&ge;80%)</option>
          <option value="mid">กลาง (50-79%)</option>
          <option value="low">ต่ำ (&lt;50%)</option>
        </select>

        {/* No match only */}
        <label className="flex items-center gap-1.5 cursor-pointer text-sm">
          <input
            type="checkbox"
            checked={noMatchOnly}
            onChange={(e) => { setNoMatchOnly(e.target.checked); setPage(1); }}
            className="accent-primary size-3.5"
          />
          <span className="text-muted-foreground">ยังไม่มี match</span>
        </label>

        {/* Clear filters */}
        {(searchInput || methodFilter || confidenceFilter || noMatchOnly) && (
          <button
            onClick={() => { setSearchInput(""); setSearchQuery(""); setMethodFilter(""); setConfidenceFilter(""); setNoMatchOnly(false); setPage(1); }}
            className="text-xs text-muted-foreground hover:text-foreground transition-colors underline"
          >
            ล้าง filter
          </button>
        )}
      </div>

      {/* AI Log Panel */}
      {aiLog.length > 0 && (
        <div className="rounded-lg border border-violet-500/30 bg-violet-500/5 overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-2 border-b border-violet-500/20 bg-violet-500/10">
            <div className="flex items-center gap-2">
              <Sparkles className="size-4 text-violet-600" />
              <span className="text-sm font-semibold text-violet-700 dark:text-violet-300">AI Matching Log</span>
              {aiProgress && (
                <span className="text-xs text-violet-600/70 font-mono">
                  [{aiProgress.current}/{aiProgress.total}]
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              {aiRunning ? (
                <button onClick={handleAiCancel} className="flex items-center gap-1 rounded-md bg-red-600 px-2.5 py-1 text-xs font-semibold text-white hover:bg-red-700 transition-colors">
                  <Square className="size-3" /> Cancel
                </button>
              ) : (
                <button onClick={() => setAiLog([])} className="text-xs text-violet-600/50 hover:text-violet-600 transition-colors">
                  Clear
                </button>
              )}
            </div>
          </div>

          {/* Progress bar */}
          {aiProgress && (
            <div className="h-1 bg-violet-500/10">
              <div
                className="h-full bg-violet-500 transition-all duration-300"
                style={{ width: `${(aiProgress.current / aiProgress.total) * 100}%` }}
              />
            </div>
          )}

          {/* Log entries */}
          <div className="max-h-48 overflow-y-auto px-4 py-2 font-mono text-xs space-y-0.5">
            {aiLog.map((entry, i) => (
              <div key={i} className="flex items-center gap-2">
                {entry.result === "processing" ? (
                  <Loader2 className="size-3 animate-spin text-violet-500 shrink-0" />
                ) : entry.result === "ok" ? (
                  <span className="text-green-500 shrink-0">&#10003;</span>
                ) : entry.result === "skip" ? (
                  <span className="text-muted-foreground shrink-0">&#8212;</span>
                ) : (
                  <span className="text-red-500 shrink-0">&#10007;</span>
                )}
                <span className={cn(
                  "font-bold min-w-[80px]",
                  entry.result === "ok" ? "text-green-600" :
                  entry.result === "fail" ? "text-red-500" :
                  entry.result === "processing" ? "text-violet-600" :
                  "text-muted-foreground"
                )}>
                  {entry.code}
                </span>
                <span className="text-muted-foreground">{entry.msg}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ═══ Table ═══ */}
      <div className="rounded-lg border border-border/30 overflow-hidden">

        {/* Status tabs + Bulk bar */}
        <div className="flex items-center justify-between border-b border-border/20 bg-muted/20 px-3 py-2">
          <div className="flex items-center gap-1">
            {data && ([
              ["suggested", data.counts.suggested, "bg-blue-500", "text-blue-600", "bg-blue-500/15"],
              ["pending", data.counts.pending, "bg-amber-500", "text-amber-600", "bg-amber-500/15"],
              ["matched", data.counts.matched, "bg-green-500", "text-green-600", "bg-green-500/15"],
              ["rejected", data.counts.rejected, "bg-red-500", "text-red-500", "bg-red-500/15"],
            ] as const).map(([label, count, dotColor, textColor, activeBg]) => (
              <button
                key={label}
                onClick={() => { setStatusFilter(label); setPage(1); }}
                className={cn(
                  "flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs transition-colors",
                  statusFilter === label ? `${activeBg} ${textColor} font-semibold` : "text-muted-foreground hover:bg-muted/50"
                )}
              >
                <span className={cn("size-2 rounded-full", dotColor)} />
                <span className="capitalize">{label}</span>
                <span className={cn("font-mono font-bold", statusFilter === label ? textColor : "text-muted-foreground/70")}>{count}</span>
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            {someChecked ? (
              <>
                <span className="text-xs text-muted-foreground">{selected.size} เลือก</span>
                <button onClick={() => handleAiSuggestBulk(false)} disabled={aiRunning} className="flex items-center gap-1 rounded-md bg-violet-600 px-2.5 py-1 text-xs font-semibold text-white hover:bg-violet-700 disabled:opacity-30 transition-colors">
                  {aiRunning ? <Loader2 className="size-3 animate-spin" /> : <Sparkles className="size-3" />}
                  AI Suggest
                </button>
                <button onClick={() => handleAiSuggestBulk(true)} disabled={aiRunning} className="flex items-center gap-1 rounded-md border border-violet-500/40 px-2.5 py-1 text-xs font-semibold text-violet-600 hover:bg-violet-500/10 disabled:opacity-30 transition-colors">
                  <Sparkles className="size-3" /> Re-check
                </button>
                <button onClick={handleBulkApproveSelected} disabled={bulkBusy || !canBulkApproveSelected} className="flex items-center gap-1 rounded-md bg-green-600 px-2.5 py-1 text-xs font-semibold text-white hover:bg-green-700 disabled:opacity-30 transition-colors">
                  <Check className="size-3" /> Approve
                </button>
                <button onClick={handleBulkRejectSelected} disabled={bulkBusy} className="flex items-center gap-1 rounded-md border border-red-500/30 px-2.5 py-1 text-xs font-semibold text-red-500 hover:bg-red-500/10 disabled:opacity-30 transition-colors">
                  <XCircle className="size-3" /> Reject
                </button>
                <button onClick={() => setSelected(new Set())} className="text-xs text-muted-foreground hover:text-foreground transition-colors">ยกเลิก</button>
              </>
            ) : (
              <>
                <button onClick={() => handleAiSuggestBulk(false)} disabled={aiRunning} className="flex items-center gap-1 rounded-md bg-violet-600 px-2.5 py-1 text-xs font-semibold text-white hover:bg-violet-700 disabled:opacity-30 transition-colors">
                  {aiRunning ? <Loader2 className="size-3 animate-spin" /> : <Sparkles className="size-3" />}
                  AI Suggest
                </button>
                <button onClick={() => handleAiSuggestBulk(true)} disabled={aiRunning} className="flex items-center gap-1 rounded-md border border-violet-500/40 px-2.5 py-1 text-xs font-semibold text-violet-600 hover:bg-violet-500/10 disabled:opacity-30 transition-colors">
                  {aiRunning ? <Loader2 className="size-3 animate-spin" /> : <Sparkles className="size-3" />}
                  AI Re-check
                </button>
                <button onClick={handleBulkApproveAll} disabled={bulkBusy || suggestedCount === 0} className="flex items-center gap-1 rounded-md bg-green-600 px-2.5 py-1 text-xs font-semibold text-white hover:bg-green-700 disabled:opacity-30 transition-colors">
                  {bulkBusy ? <Loader2 className="size-3 animate-spin" /> : <CheckCheck className="size-3" />}
                  Approve All ({suggestedCount})
                </button>
              </>
            )}
          </div>
        </div>

        {/* Content */}
        {loading && !data ? (
          <div className="p-12 text-center text-muted-foreground"><Loader2 className="size-6 animate-spin mx-auto mb-2" />Loading...</div>
        ) : data?.mappings.length === 0 ? (
          <div className="p-12 text-center text-muted-foreground space-y-2">
            <Search className="size-8 mx-auto mb-2 opacity-30" />
            <p className="text-base font-medium">{statusFilter === "suggested" ? "ไม่มี suggestion รออนุมัติ" : `ไม่มีรายการ ${statusFilter}`}</p>
            <p className="text-sm">{!setFilter ? "เลือก set จาก dropdown " : ""}ลอง filter อื่น หรือรัน <code className="bg-muted px-1 py-0.5 rounded text-xs">npx tsx scripts/pipeline-yuyutei.ts</code></p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border/30 bg-muted/40 text-xs text-muted-foreground">
                  <th className="px-3 py-2 w-10">
                    <input type="checkbox" checked={allChecked} onChange={toggleAll} className="accent-primary size-3.5 cursor-pointer" />
                  </th>
                  <th className="px-3 py-2 text-left w-20">Status</th>
                  <th className="px-3 py-2 text-left">Yuyutei Listing</th>
                  <th className="px-2 py-2 w-6"></th>
                  <th className="px-3 py-2 text-left">DB Card Match</th>
                  <th className="px-3 py-2 text-right w-20">Price</th>
                  <th className="px-3 py-2 text-left w-20">Method</th>
                  <th className="px-3 py-2 text-left w-36">Updated</th>
                  <th className="px-3 py-2 text-center w-28">Actions</th>
                </tr>
              </thead>
              <tbody>
                {data?.mappings.map((m) => {
                  const isMatched = m.status === "matched" && m.matchedCard;
                  const isSuggested = m.status === "suggested" && m.matchedCardId;
                  const suggestedCard = isSuggested ? m.candidates.find((c) => c.id === m.matchedCardId) ?? m.matchedCard : null;
                  const effectiveCardId = resolveCardId(m);
                  const isSaving = saving.has(m.id);
                  const isChecked = selected.has(m.id);

                  return (
                    <tr
                      key={m.id}
                      className={cn(
                        "border-b border-border/10 transition-colors group",
                        isChecked && "bg-primary/[0.04]",
                        !isChecked && m.status === "suggested" && "bg-blue-500/[0.02]",
                        !isChecked && m.status === "pending" && "bg-amber-500/[0.02]",
                        !isChecked && m.status === "matched" && "bg-green-500/[0.02]",
                        m.status === "rejected" && "opacity-40",
                      )}
                    >
                      {/* Checkbox */}
                      <td className="px-3 py-3 text-center">
                        <input type="checkbox" checked={isChecked} onChange={() => toggleOne(m.id)} className="accent-primary size-3.5 cursor-pointer" />
                      </td>

                      {/* Status */}
                      <td className="px-3 py-3"><StatusBadge status={m.status} /></td>

                      {/* Yuyutei */}
                      <td className="px-3 py-3">
                        <div className="flex items-center gap-3">
                          <div
                            role="button" tabIndex={0}
                            onClick={() => openLightbox(m, isMatched ? m.matchedCard! : suggestedCard ?? undefined)}
                            onKeyDown={(e) => { if (e.key === "Enter") openLightbox(m, isMatched ? m.matchedCard! : suggestedCard ?? undefined); }}
                            className="cursor-zoom-in hover:opacity-80 transition-opacity" title="คลิกเพื่อขยายรูป"
                          >
                            <CardThumb src={yuyuHd(m.scrapedImage)} size="md" />
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5">
                              <span className="font-mono text-xs font-bold">{m.scrapedCode}</span>
                              {m.scrapedRarity && <RarityBadge rarity={m.scrapedRarity} size="sm" />}
                            </div>
                            <p className="text-[11px] text-muted-foreground truncate max-w-[180px]" title={m.scrapedName}>{m.scrapedName}</p>
                            <p className="text-[10px] text-muted-foreground/50 font-mono">{m.setCode.toUpperCase()} · {m.yuyuteiId}</p>
                          </div>
                        </div>
                      </td>

                      <td className="px-1 py-3 text-center text-muted-foreground/40 text-lg">→</td>

                      {/* Match */}
                      <td className="px-3 py-3">
                        {isMatched ? (
                          <div className="flex items-center gap-3">
                            <div
                              role="button" tabIndex={0}
                              onClick={() => openLightbox(m, m.matchedCard!)}
                              onKeyDown={(e) => { if (e.key === "Enter") openLightbox(m, m.matchedCard!); }}
                              className="cursor-zoom-in hover:opacity-80 ring-2 ring-green-500/50 rounded transition-opacity" title="คลิกเพื่อขยายรูป"
                            >
                              <CardThumb src={m.matchedCard!.imageUrl} size="md" />
                            </div>
                            <div className="min-w-0">
                              <p className="font-mono text-xs font-bold text-green-600">{m.matchedCard!.cardCode}</p>
                              <RarityBadge rarity={m.matchedCard!.rarity} size="sm" />
                              <p className="text-[10px] text-muted-foreground truncate max-w-[120px]">{m.matchedCard!.nameEn ?? m.matchedCard!.nameJp}</p>
                            </div>
                          </div>
                        ) : (
                          <CandidatePicker
                            candidates={m.candidates}
                            currentId={effectiveCardId}
                            onPick={(cardId) => setPickedCandidate((prev) => ({ ...prev, [m.id]: cardId }))}
                            onZoom={(card) => openCardZoom(m, card)}
                          />
                        )}
                      </td>

                      {/* Price */}
                      <td className="px-3 py-3 text-right font-mono text-xs font-bold text-primary whitespace-nowrap">
                        {formatJpy(m.priceJpy)}
                      </td>

                      {/* Method */}
                      <td className="px-3 py-3">
                        {m.matchMethod ? (
                          <div className="flex flex-col gap-0.5">
                            <Tooltip content={METHOD_INFO.find((x) => x.key === m.matchMethod)?.desc ?? m.matchMethod}>
                              <span className="inline-block cursor-help rounded bg-muted px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground">
                                {m.matchMethod}
                              </span>
                            </Tooltip>
                            {m.geminiScore != null && (
                              <span className={cn(
                                "inline-block rounded px-1.5 py-0.5 text-[10px] font-bold w-fit",
                                m.geminiScore >= 0.8 ? "bg-green-500/15 text-green-600" :
                                m.geminiScore >= 0.5 ? "bg-amber-500/15 text-amber-600" :
                                "bg-red-500/15 text-red-500"
                              )}>
                                {Math.round(m.geminiScore * 100)}%
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="text-[11px] text-muted-foreground/50">—</span>
                        )}
                      </td>

                      {/* Updated (who + when) */}
                      <td className="px-3 py-3">
                        {m.actionByUser ? (
                          <div className="min-w-0">
                            <p className="text-[11px] font-medium truncate max-w-[120px]" title={m.actionByUser.email}>
                              {m.actionByUser.displayName || m.actionByUser.email.split("@")[0]}
                            </p>
                            <p className="text-[10px] text-muted-foreground" title={m.actionAt ? new Date(m.actionAt).toLocaleString("th-TH") : ""}>
                              {relativeTime(m.actionAt)}
                            </p>
                          </div>
                        ) : (
                          <span className="text-[11px] text-muted-foreground/50">—</span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="px-3 py-3">
                        <div className="flex items-center justify-center gap-1.5">
                          {isSaving || aiProcessing.has(m.id) ? (
                            <Loader2 className="size-4 animate-spin text-muted-foreground" />
                          ) : isMatched ? (
                            <button onClick={() => handleUnmatch(m.id)} className="flex items-center gap-1 rounded-lg border border-amber-500/30 px-2 py-1 text-xs text-amber-600 hover:bg-amber-500/10 transition-colors" title="ยกเลิกการจับคู่">
                              <Undo2 className="size-3" /> Unmatch
                            </button>
                          ) : (
                            <>
                              {m.scrapedImage && m.candidates.length > 0 && (
                                <button
                                  onClick={() => handleAiSuggestOne(m.id)}
                                  disabled={aiProcessing.has(m.id)}
                                  className="flex items-center gap-1 rounded-lg bg-violet-600 px-2 py-1 text-xs font-semibold text-white hover:bg-violet-700 disabled:opacity-30 transition-colors"
                                  title="ให้ AI ช่วยจับคู่"
                                >
                                  <Sparkles className="size-3" /> AI
                                </button>
                              )}
                              <button
                                onClick={() => { const c = resolveCardId(m); if (c) handleApprove(m.id, c); }}
                                disabled={!effectiveCardId}
                                className="flex items-center gap-1 rounded-lg bg-green-600 px-2 py-1 text-xs font-semibold text-white hover:bg-green-700 disabled:opacity-30 transition-colors"
                                title="อนุมัติการจับคู่"
                              >
                                <Check className="size-3" /> Approve
                              </button>
                              <button onClick={() => handleReject(m.id)} className="flex items-center gap-1 rounded-lg border border-red-500/30 px-2 py-1 text-xs text-red-500 hover:bg-red-500/10 transition-colors" title="ปฏิเสธ">
                                <X className="size-3" /> Reject
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {data && (
          <div className="flex items-center justify-between border-t border-border/20 px-3 py-2">
            <div className="flex items-center gap-3">
              <p className="text-xs text-muted-foreground">
                {data.total > 0 ? `${(data.page - 1) * perPage + 1}–${Math.min(data.page * perPage, data.total)} จาก ${data.total}` : `0 รายการ`}
              </p>
              <select
                value={perPage}
                onChange={(e) => { setPerPage(Number(e.target.value)); setPage(1); }}
                className="rounded border border-border/40 bg-transparent px-2 py-1 text-xs"
              >
                {[20, 50, 100, 500, 1000].map((n) => (
                  <option key={n} value={n}>{n} / หน้า</option>
                ))}
              </select>
            </div>
            {data.totalPages > 1 && (
              <div className="flex items-center gap-2">
                <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} className="rounded border border-border/40 p-1.5 hover:bg-muted disabled:opacity-30"><ChevronLeft className="size-4" /></button>
                <span className="text-sm font-mono">{page}/{data.totalPages}</span>
                <button onClick={() => setPage((p) => Math.min(data.totalPages, p + 1))} disabled={page === data.totalPages} className="rounded border border-border/40 p-1.5 hover:bg-muted disabled:opacity-30"><ChevronRight className="size-4" /></button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
