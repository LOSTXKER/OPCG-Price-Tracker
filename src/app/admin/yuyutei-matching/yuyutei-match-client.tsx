"use client";

import { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import {
  Check,
  CheckCheck,
  ChevronLeft,
  ChevronRight,
  Clock,
  Loader2,
  RefreshCw,
  Undo2,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { RarityBadge } from "@/components/shared/rarity-badge";

interface MappingCard {
  id: number;
  cardCode: string;
  imageUrl: string | null;
  parallelIndex: number | null;
  rarity: string;
  nameJp: string;
  nameEn: string | null;
  isParallel: boolean;
}

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
  status: string;
  updatedAt: string;
  candidates: MappingCard[];
}

interface SetInfo {
  code: string;
  name: string;
  nameEn: string | null;
}

interface LogEntry {
  id: number;
  scrapedCode: string;
  scrapedName: string;
  priceJpy: number;
  matchMethod: string | null;
  matchedCard: { cardCode: string; rarity: string } | null;
  status: string;
  setCode: string;
  updatedAt: string;
}

interface ApiResponse {
  mappings: Mapping[];
  total: number;
  page: number;
  totalPages: number;
  sets: SetInfo[];
  counts: { matched: number; pending: number; suggested: number; rejected: number };
  recentLog?: LogEntry[];
}

function StatusDot({ status }: { status: string }) {
  const color: Record<string, string> = {
    matched: "bg-green-500",
    suggested: "bg-blue-500",
    pending: "bg-amber-500",
    rejected: "bg-red-500",
  };
  return <span className={cn("inline-block size-2 rounded-full", color[status] ?? "bg-muted")} />;
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    matched: "bg-green-500/15 text-green-600",
    suggested: "bg-blue-500/15 text-blue-600",
    pending: "bg-amber-500/15 text-amber-600",
    rejected: "bg-red-500/15 text-red-500",
  };
  return (
    <span className={cn("rounded-full px-2 py-0.5 text-[11px] font-medium", styles[status])}>
      {status}
    </span>
  );
}

function CardImage({ src, size = "md" }: { src: string | null; size?: "sm" | "md" | "lg" }) {
  const w = size === "lg" ? "w-36" : size === "md" ? "w-24" : "w-14";
  return (
    <div className={cn("relative aspect-[63/88] overflow-hidden rounded-lg border border-border/50 bg-muted/30", w)}>
      {src ? (
        <Image src={src} alt="" fill className="object-contain" sizes={size === "lg" ? "144px" : size === "md" ? "96px" : "56px"} unoptimized />
      ) : (
        <div className="flex h-full items-center justify-center text-xs text-muted-foreground">N/A</div>
      )}
    </div>
  );
}

export function YuyuteiMatchClient() {
  const [data, setData] = useState<ApiResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [setFilter, setSetFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("suggested");
  const [page, setPage] = useState(1);
  const [saving, setSaving] = useState<number | null>(null);
  const [bulkApproving, setBulkApproving] = useState(false);
  const [showLog, setShowLog] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (setFilter) params.set("set", setFilter);
    if (statusFilter) params.set("status", statusFilter);
    params.set("page", String(page));
    params.set("withLog", "true");
    const res = await fetch(`/api/admin/yuyutei-matching?${params}`);
    if (res.ok) setData(await res.json());
    setLoading(false);
  }, [setFilter, statusFilter, page]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleApprove = async (mappingId: number, cardId: number) => {
    setSaving(mappingId);
    await fetch("/api/admin/yuyutei-matching", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: mappingId, matchedCardId: cardId }),
    });
    await fetchData();
    setSaving(null);
  };

  const handleUnmatch = async (mappingId: number) => {
    setSaving(mappingId);
    await fetch("/api/admin/yuyutei-matching", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: mappingId, action: "unmatch" }),
    });
    await fetchData();
    setSaving(null);
  };

  const handleReject = async (mappingId: number) => {
    setSaving(mappingId);
    await fetch("/api/admin/yuyutei-matching", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: mappingId }),
    });
    await fetchData();
    setSaving(null);
  };

  const handleBulkApprove = async () => {
    const label = setFilter ? setFilter.toUpperCase() : "ทุกเซ็ต";
    if (!confirm(`อนุมัติทั้งหมดที่มี suggestion ใน ${label}?`)) return;
    setBulkApproving(true);
    const res = await fetch("/api/admin/yuyutei-matching", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "bulk-approve", set: setFilter || undefined }),
    });
    const json = await res.json();
    alert(`อนุมัติแล้ว ${json.approved} รายการ`);
    await fetchData();
    setBulkApproving(false);
  };

  const suggestedCount = (data?.counts.suggested ?? 0) + (data?.counts.pending ?? 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold">Yuyutei Price Matching</h2>
        <p className="text-muted-foreground text-sm mt-1">
          จับคู่ Yuyutei listing → การ์ดใน DB — เลือก set แล้ว approve ทีละใบหรือกด Approve All
        </p>
      </div>

      {/* Stats bar */}
      {data && (
        <div className="grid grid-cols-4 gap-3">
          {[
            { label: "Suggested", count: data.counts.suggested, color: "text-blue-500", bg: "bg-blue-500/10" },
            { label: "Pending", count: data.counts.pending, color: "text-amber-500", bg: "bg-amber-500/10" },
            { label: "Matched", count: data.counts.matched, color: "text-green-500", bg: "bg-green-500/10" },
            { label: "Rejected", count: data.counts.rejected, color: "text-red-500", bg: "bg-red-500/10" },
          ].map((s) => (
            <button
              key={s.label}
              onClick={() => { setStatusFilter(s.label.toLowerCase()); setPage(1); }}
              className={cn(
                "rounded-lg border p-3 text-center transition-colors hover:border-primary/30",
                statusFilter === s.label.toLowerCase() ? "border-primary/50 bg-primary/5" : "border-border/30"
              )}
            >
              <p className={cn("text-2xl font-bold font-mono", s.color)}>{s.count}</p>
              <p className="text-xs text-muted-foreground">{s.label}</p>
            </button>
          ))}
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <select
          value={setFilter}
          onChange={(e) => { setSetFilter(e.target.value); setPage(1); }}
          className="rounded-lg border border-border bg-transparent px-3 py-2 text-sm"
        >
          <option value="">All Sets</option>
          {data?.sets.map((s) => (
            <option key={s.code} value={s.code}>
              {s.code.toUpperCase()} · {s.nameEn ?? s.name}
            </option>
          ))}
        </select>

        <button
          onClick={fetchData}
          disabled={loading}
          className="rounded-lg border border-border/40 px-3 py-2 text-sm hover:bg-muted transition-colors"
          title="Refresh"
        >
          <RefreshCw className={cn("size-4", loading && "animate-spin")} />
        </button>

        <button
          onClick={() => setShowLog(!showLog)}
          className={cn(
            "flex items-center gap-1.5 rounded-lg border px-3 py-2 text-sm transition-colors",
            showLog ? "border-primary bg-primary/10 text-primary" : "border-border/40 hover:bg-muted"
          )}
        >
          <Clock className="size-4" />
          Log
        </button>

        <button
          onClick={handleBulkApprove}
          disabled={bulkApproving || suggestedCount === 0}
          className="ml-auto flex items-center gap-2 rounded-lg bg-green-600 px-4 py-2 text-sm font-semibold text-white hover:bg-green-700 disabled:opacity-40 transition-colors"
        >
          {bulkApproving ? <Loader2 className="size-4 animate-spin" /> : <CheckCheck className="size-4" />}
          Approve All ({suggestedCount})
        </button>
      </div>

      {/* Activity Log */}
      {showLog && data?.recentLog && (
        <div className="rounded-lg border border-border/30 bg-muted/20 p-4 space-y-2">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Recent Activity</p>
          {data.recentLog.length === 0 ? (
            <p className="text-sm text-muted-foreground">ยังไม่มีประวัติ</p>
          ) : (
            <div className="max-h-60 overflow-y-auto space-y-1.5">
              {data.recentLog.map((log) => (
                <div key={log.id} className="flex items-center gap-2 text-xs">
                  <StatusDot status={log.status} />
                  <span className="font-mono font-semibold w-16 shrink-0">{log.setCode}</span>
                  <span className="font-mono w-24 shrink-0">{log.scrapedCode}</span>
                  <span className="text-muted-foreground">→</span>
                  <span className="font-mono font-semibold">
                    {log.matchedCard?.cardCode ?? "—"}
                  </span>
                  {log.matchedCard && <RarityBadge rarity={log.matchedCard.rarity} size="sm" />}
                  <span className="font-mono text-primary">¥{log.priceJpy.toLocaleString()}</span>
                  <span className="text-muted-foreground/60 ml-auto">
                    {log.matchMethod ?? "—"} · {new Date(log.updatedAt).toLocaleString("th-TH", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Mappings list */}
      {loading && !data ? (
        <div className="rounded-lg border border-border/30 p-12 text-center text-muted-foreground">
          <Loader2 className="size-6 animate-spin mx-auto mb-2" />
          Loading...
        </div>
      ) : data?.mappings.length === 0 ? (
        <div className="rounded-lg border border-border/30 p-12 text-center text-muted-foreground space-y-2">
          <p className="text-lg font-medium">
            {statusFilter === "suggested" ? "ไม่มี suggestion รออนุมัติ" : `ไม่มี ${statusFilter} mapping`}
          </p>
          <p className="text-sm">
            {!setFilter ? "เลือก set จาก dropdown หรือ " : ""}
            ลอง filter อื่น หรือรัน <code className="bg-muted px-1.5 py-0.5 rounded text-xs">npx tsx scripts/pipeline-yuyutei.ts</code>
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {data?.mappings.map((m) => (
            <div
              key={m.id}
              className={cn(
                "rounded-xl border p-4 transition-colors",
                m.status === "suggested" && "border-blue-500/30 bg-blue-500/5",
                m.status === "pending" && "border-amber-500/30 bg-amber-500/5",
                m.status === "matched" && "border-green-500/20 bg-green-500/5",
                m.status === "rejected" && "border-border/20 opacity-40",
              )}
            >
              {/* Top row: info */}
              <div className="flex items-center gap-2 mb-3">
                <StatusBadge status={m.status} />
                <span className="font-mono text-sm font-bold">{m.scrapedCode}</span>
                {m.scrapedRarity && <RarityBadge rarity={m.scrapedRarity} size="sm" />}
                <span className="font-mono text-sm font-bold text-primary">¥{m.priceJpy.toLocaleString()}</span>
                <span className="text-xs text-muted-foreground truncate max-w-[300px]">{m.scrapedName}</span>
                <span className="text-xs text-muted-foreground ml-auto">{m.setCode.toUpperCase()}</span>
              </div>

              {/* Images row: side-by-side comparison */}
              <div className="flex items-start gap-4">
                {/* Yuyutei side */}
                <div className="space-y-1.5 shrink-0">
                  <p className="text-[11px] font-semibold text-muted-foreground">Yuyutei</p>
                  <CardImage src={m.scrapedImage} size="lg" />
                </div>

                {/* Arrow */}
                <div className="flex items-center pt-12 text-muted-foreground text-2xl">→</div>

                {/* Match / Candidates */}
                {m.status === "matched" && m.matchedCard ? (
                  <div className="flex items-start gap-3">
                    <div className="space-y-1.5 shrink-0">
                      <p className="text-[11px] font-semibold text-green-600">{m.matchedCard.cardCode}</p>
                      <div className="ring-2 ring-green-500/50 rounded-lg">
                        <CardImage src={m.matchedCard.imageUrl} size="lg" />
                      </div>
                      <div className="text-center">
                        <RarityBadge rarity={m.matchedCard.rarity} size="sm" />
                        <p className="text-[10px] text-muted-foreground mt-0.5 truncate max-w-[140px]">
                          {m.matchedCard.nameEn ?? m.matchedCard.nameJp}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => handleUnmatch(m.id)}
                      disabled={saving === m.id}
                      className="mt-12 rounded-lg border border-amber-500/30 p-2 text-amber-500 hover:bg-amber-500/10 transition-colors"
                      title="ยกเลิกการจับคู่"
                    >
                      <Undo2 className="size-4" />
                    </button>
                  </div>
                ) : (
                  <div className="flex flex-wrap items-start gap-2">
                    {m.candidates.length > 0 ? (
                      m.candidates.map((c) => {
                        const isSuggested = m.matchedCardId === c.id;
                        return (
                          <button
                            key={c.id}
                            onClick={() => handleApprove(m.id, c.id)}
                            disabled={saving === m.id}
                            className={cn(
                              "flex flex-col items-center gap-1.5 rounded-xl p-2 transition-all",
                              isSuggested
                                ? "ring-2 ring-blue-500 bg-blue-500/10"
                                : "ring-1 ring-border/30 hover:ring-primary/50 hover:bg-muted/50"
                            )}
                            title={`เลือก ${c.cardCode}`}
                          >
                            <div className="relative">
                              <CardImage src={c.imageUrl} size="md" />
                              {isSuggested && (
                                <div className="absolute -top-1 -right-1 rounded-full bg-blue-500 p-0.5">
                                  <Check className="size-3 text-white" />
                                </div>
                              )}
                            </div>
                            <div className="text-center">
                              <p className="text-[11px] font-mono font-semibold">{c.cardCode}</p>
                              <RarityBadge rarity={c.rarity} size="sm" />
                              <p className="text-[10px] text-muted-foreground truncate max-w-[90px]">
                                {c.nameEn ?? c.nameJp}
                              </p>
                            </div>
                          </button>
                        );
                      })
                    ) : (
                      <div className="flex items-center pt-8 text-sm text-muted-foreground">
                        ไม่พบ candidate — ต้องเพิ่มการ์ดใน DB ก่อน
                      </div>
                    )}
                  </div>
                )}

                {/* Action buttons */}
                {m.status !== "matched" && (
                  <div className="ml-auto flex flex-col gap-2 shrink-0 pt-8">
                    {m.status === "suggested" && m.matchedCardId && (
                      <button
                        onClick={() => handleApprove(m.id, m.matchedCardId!)}
                        disabled={saving === m.id}
                        className="flex items-center gap-1.5 rounded-lg bg-green-600 px-3 py-2 text-sm font-semibold text-white hover:bg-green-700 transition-colors"
                        title="อนุมัติ suggestion"
                      >
                        {saving === m.id ? <Loader2 className="size-4 animate-spin" /> : <Check className="size-4" />}
                        Approve
                      </button>
                    )}
                    <button
                      onClick={() => handleReject(m.id)}
                      disabled={saving === m.id}
                      className="flex items-center gap-1.5 rounded-lg border border-red-500/30 px-3 py-2 text-sm text-red-500 hover:bg-red-500/10 transition-colors"
                      title="ปฏิเสธ"
                    >
                      <X className="size-4" />
                      Reject
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {data && data.totalPages > 1 && (
        <div className="flex items-center justify-center gap-3">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="rounded-lg border border-border/40 p-2 hover:bg-muted disabled:opacity-30"
          >
            <ChevronLeft className="size-4" />
          </button>
          <span className="text-sm font-mono">{page} / {data.totalPages}</span>
          <button
            onClick={() => setPage((p) => Math.min(data.totalPages, p + 1))}
            disabled={page === data.totalPages}
            className="rounded-lg border border-border/40 p-2 hover:bg-muted disabled:opacity-30"
          >
            <ChevronRight className="size-4" />
          </button>
        </div>
      )}
    </div>
  );
}
