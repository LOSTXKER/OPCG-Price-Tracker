"use client";

import { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import {
  Check,
  ChevronLeft,
  ChevronRight,
  CheckCheck,
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

interface ApiResponse {
  mappings: Mapping[];
  total: number;
  page: number;
  totalPages: number;
  sets: SetInfo[];
  counts: { matched: number; pending: number; suggested: number; rejected: number };
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    matched: "bg-green-500/15 text-green-600",
    suggested: "bg-blue-500/15 text-blue-600",
    pending: "bg-amber-500/15 text-amber-600",
    rejected: "bg-red-500/15 text-red-500",
  };
  return (
    <span className={cn("rounded-full px-2 py-0.5 text-[11px] font-medium", styles[status] ?? "bg-muted text-muted-foreground")}>
      {status}
    </span>
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

  const fetchData = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (setFilter) params.set("set", setFilter);
    if (statusFilter) params.set("status", statusFilter);
    params.set("page", String(page));
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
    if (!confirm(setFilter
      ? `อนุมัติทั้งหมดที่มี suggestion ใน ${setFilter}?`
      : "อนุมัติทั้งหมดที่มี suggestion ทุกเซ็ต?"
    )) return;
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
      <div>
        <h2 className="font-sans text-xl font-bold">Yuyutei Price Matching</h2>
        <p className="text-muted-foreground text-sm mt-1">
          จับคู่ Yuyutei listing กับการ์ดใน DB — อนุมัติทีละใบหรือกด Approve All
        </p>
      </div>

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

        <select
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
          className="rounded-lg border border-border bg-transparent px-3 py-2 text-sm"
        >
          <option value="">All Status</option>
          <option value="suggested">Suggested</option>
          <option value="pending">Pending (no match)</option>
          <option value="matched">Matched</option>
          <option value="rejected">Rejected</option>
        </select>

        <button
          onClick={fetchData}
          disabled={loading}
          className="rounded-lg border border-border/40 px-3 py-2 text-sm hover:bg-muted transition-colors"
        >
          <RefreshCw className={cn("size-4", loading && "animate-spin")} />
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

      {/* Counts */}
      {data && (
        <div className="flex gap-4 text-sm">
          <span className="text-blue-500">Suggested: <strong>{data.counts.suggested}</strong></span>
          <span className="text-amber-500">Pending: <strong>{data.counts.pending}</strong></span>
          <span className="text-green-500">Matched: <strong>{data.counts.matched}</strong></span>
          <span className="text-red-500">Rejected: <strong>{data.counts.rejected}</strong></span>
          <span className="text-muted-foreground ml-auto">Total: <strong>{data.total}</strong></span>
        </div>
      )}

      {/* Mappings */}
      {loading && !data ? (
        <div className="rounded-lg border border-border/30 p-8 text-center text-muted-foreground">Loading...</div>
      ) : data?.mappings.length === 0 ? (
        <div className="rounded-lg border border-border/30 p-8 text-center text-muted-foreground">
          <p>{setFilter ? `ไม่มี ${statusFilter || "mapping"} สำหรับ ${setFilter}` : "เลือก set ด้านบน หรือรัน pipeline-yuyutei.ts ก่อน"}</p>
        </div>
      ) : (
        <div className="space-y-2">
          {data?.mappings.map((m) => (
            <div
              key={m.id}
              className={cn(
                "rounded-lg border p-3 flex items-center gap-3 transition-colors",
                m.status === "suggested" && "border-blue-500/30 bg-blue-500/5",
                m.status === "pending" && "border-amber-500/30 bg-amber-500/5",
                m.status === "matched" && "border-green-500/20 bg-green-500/5",
                m.status === "rejected" && "border-border/20 opacity-50",
              )}
            >
              {/* Yuyutei image */}
              <div className="relative aspect-[63/88] w-14 shrink-0 overflow-hidden rounded border border-border/50 bg-muted/30">
                {m.scrapedImage ? (
                  <Image src={m.scrapedImage} alt="" fill className="object-contain" sizes="56px" unoptimized />
                ) : (
                  <div className="flex h-full items-center justify-center text-[9px] text-muted-foreground">N/A</div>
                )}
              </div>

              {/* Yuyutei info */}
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-sm font-semibold">{m.scrapedCode}</span>
                  {m.scrapedRarity && <RarityBadge rarity={m.scrapedRarity} size="sm" />}
                  <span className="font-mono text-sm font-bold text-primary">¥{m.priceJpy.toLocaleString()}</span>
                  <StatusBadge status={m.status} />
                </div>
                <p className="text-xs text-muted-foreground truncate mt-0.5">{m.scrapedName}</p>
              </div>

              {/* Arrow */}
              <span className="text-muted-foreground shrink-0">→</span>

              {/* Match area */}
              {m.status === "matched" && m.matchedCard ? (
                <div className="flex items-center gap-2 shrink-0">
                  <div className="relative aspect-[63/88] w-14 overflow-hidden rounded border-2 border-green-500/50 bg-muted/30">
                    {m.matchedCard.imageUrl ? (
                      <Image src={m.matchedCard.imageUrl} alt="" fill className="object-contain" sizes="56px" unoptimized />
                    ) : (
                      <div className="flex h-full items-center justify-center text-[9px] text-muted-foreground">N/A</div>
                    )}
                  </div>
                  <div className="text-xs">
                    <p className="font-mono font-semibold">{m.matchedCard.cardCode}</p>
                    <RarityBadge rarity={m.matchedCard.rarity} size="sm" />
                  </div>
                  <button
                    onClick={() => handleUnmatch(m.id)}
                    disabled={saving === m.id}
                    className="rounded border border-amber-500/30 p-1.5 text-amber-500 hover:bg-amber-500/10"
                    title="Unmatch"
                  >
                    <Undo2 className="size-3.5" />
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-1.5 shrink-0">
                  {m.candidates.length > 0 ? (
                    m.candidates.map((c) => {
                      const isSuggested = m.matchedCardId === c.id;
                      return (
                        <button
                          key={c.id}
                          onClick={() => handleApprove(m.id, c.id)}
                          disabled={saving === m.id}
                          className={cn(
                            "relative flex flex-col items-center gap-1 rounded-lg p-1 transition-all",
                            isSuggested
                              ? "ring-2 ring-blue-500 bg-blue-500/10"
                              : "ring-1 ring-border/30 hover:ring-primary/50 hover:bg-muted/50"
                          )}
                          title={`${c.cardCode} (${c.rarity})`}
                        >
                          <div className="relative aspect-[63/88] w-12 overflow-hidden rounded bg-muted/30">
                            {c.imageUrl ? (
                              <Image src={c.imageUrl} alt="" fill className="object-contain" sizes="48px" unoptimized />
                            ) : (
                              <div className="flex h-full items-center justify-center text-[8px] text-muted-foreground">N/A</div>
                            )}
                            {isSuggested && (
                              <div className="absolute top-0 right-0 rounded-bl bg-blue-500 p-0.5">
                                <Check className="size-2.5 text-white" />
                              </div>
                            )}
                          </div>
                          <span className="text-[10px] font-mono leading-none">{c.rarity}</span>
                        </button>
                      );
                    })
                  ) : (
                    <span className="text-xs text-muted-foreground">ไม่พบ candidate</span>
                  )}

                  {/* Quick approve suggested */}
                  {m.status === "suggested" && m.matchedCardId && (
                    <button
                      onClick={() => handleApprove(m.id, m.matchedCardId!)}
                      disabled={saving === m.id}
                      className="rounded-lg bg-green-600 p-2 text-white hover:bg-green-700 transition-colors"
                      title="Approve suggestion"
                    >
                      {saving === m.id ? <Loader2 className="size-4 animate-spin" /> : <Check className="size-4" />}
                    </button>
                  )}

                  {/* Reject */}
                  <button
                    onClick={() => handleReject(m.id)}
                    disabled={saving === m.id}
                    className="rounded border border-red-500/30 p-1.5 text-red-500 hover:bg-red-500/10"
                    title="Reject"
                  >
                    <X className="size-3.5" />
                  </button>
                </div>
              )}
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
