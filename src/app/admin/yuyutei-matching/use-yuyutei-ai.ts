"use client";

import { useRef, useState } from "react";
import { toast } from "sonner";

import { adminFetch, buildAdminQuery } from "@/lib/admin/admin-fetch";
import type { useConfirm } from "@/components/admin/confirm-dialog";
import { API } from "./yuyutei-types";
import type { AiLogEntry, Mapping } from "./yuyutei-types";

type ConfirmFn = ReturnType<typeof useConfirm>;

/**
 * Owns the Gemini "AI suggest" workflow for the Yuyutei matcher: the per-row
 * and bulk suggestion runs (with sequential pacing, progress, an abortable
 * cancel, and a running log). Kept apart from the page because it is a
 * self-contained async state machine.
 */
export function useYuyuteiAi({
  mappings,
  selected,
  setFilter,
  confirm,
  refetch,
}: {
  mappings: Mapping[];
  selected: Set<number>;
  setFilter: string;
  confirm: ConfirmFn;
  refetch: () => Promise<void> | void;
}) {
  const [aiProcessing, setAiProcessing] = useState<Set<number>>(new Set());
  const [aiRunning, setAiRunning] = useState(false);
  const aiCancelRef = useRef(false);
  const aiAbortRef = useRef<AbortController | null>(null);
  const [aiLog, setAiLog] = useState<AiLogEntry[]>([]);
  const [aiProgress, setAiProgress] = useState<{ current: number; total: number } | null>(null);

  const callAiSuggest = async (
    mappingId: number,
    signal?: AbortSignal,
    force?: boolean,
  ): Promise<{ code: string; result: "ok" | "fail" | "skip"; msg: string }> => {
    try {
      const json = await adminFetch<{
        success?: boolean;
        matchedCardCode?: string;
        confidence?: number;
        skipped?: boolean;
        error?: string;
      }>(`${API}/ai-suggest`, {
        method: "POST",
        body: { id: mappingId, ...(force && { force: true }) },
        signal,
      });
      if (json.success) {
        return {
          code: json.matchedCardCode ?? "?",
          result: "ok",
          msg: `→ ${json.matchedCardCode} (${Math.round((json.confidence ?? 0) * 100)}%)`,
        };
      }
      if (json.skipped) return { code: "", result: "skip", msg: json.error ?? "ข้ามแล้ว" };
      return { code: "", result: "fail", msg: json.error ?? "ไม่สำเร็จ" };
    } catch (e) {
      if (e instanceof DOMException && e.name === "AbortError") {
        return { code: "", result: "skip", msg: "ยกเลิกแล้ว" };
      }
      return { code: "", result: "fail", msg: e instanceof Error ? e.message : "เครือข่ายผิดพลาด" };
    }
  };

  const handleAiSuggestOne = async (mappingId: number) => {
    setAiProcessing((s) => new Set(s).add(mappingId));
    const entry = mappings.find((m) => m.id === mappingId);
    setAiLog([{ code: entry?.scrapedCode ?? String(mappingId), result: "processing", msg: "กำลังวิเคราะห์..." }]);
    const ac = new AbortController();
    aiAbortRef.current = ac;
    const logResult = await callAiSuggest(mappingId, ac.signal);
    aiAbortRef.current = null;
    setAiLog([{ ...logResult, code: entry?.scrapedCode ?? logResult.code }]);
    setAiProcessing((s) => { const n = new Set(s); n.delete(mappingId); return n; });
    await refetch();
  };

  const handleAiSuggestBulk = async (force = false) => {
    const hasSelected = selected.size > 0;
    let ids: number[];

    if (hasSelected) {
      ids = [...selected];
    } else {
      const query = buildAdminQuery({
        "ai-candidates": "true",
        mode: force ? "all" : "new",
        set: setFilter || undefined,
      });
      let json: { items: { id: number; scrapedCode: string }[] };
      try {
        json = await adminFetch<{ items: { id: number; scrapedCode: string }[] }>(`${API}?${query}`);
      } catch {
        return;
      }
      ids = json.items.map((i) => i.id);
    }

    if (ids.length === 0) {
      toast.info("ไม่มีรายการที่ต้องจับคู่");
      return;
    }

    const modeLabel = force ? "รันใหม่ทั้งหมด" : "เฉพาะที่ยังไม่ผ่าน AI";
    const label = hasSelected ? `${ids.length} รายการที่เลือก` : setFilter ? setFilter.toUpperCase() : "ทุกชุดการ์ด";
    const ok = await confirm({
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
      const entry = mappings.find((m) => m.id === mappingId);
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
      { code: "สรุป", result: "ok", msg: `สำเร็จ ${okCount} / ข้าม ${skipCount} / ไม่สำเร็จ ${failCount} จากทั้งหมด ${ids.length} รายการ` },
    ]);
    setAiRunning(false);
    setAiProgress(null);
    await refetch();
  };

  const handleAiCancel = () => {
    aiCancelRef.current = true;
    aiAbortRef.current?.abort();
  };

  const clearLog = () => setAiLog([]);

  return {
    aiProcessing,
    aiRunning,
    aiLog,
    aiProgress,
    handleAiSuggestOne,
    handleAiSuggestBulk,
    handleAiCancel,
    clearLog,
  };
}
