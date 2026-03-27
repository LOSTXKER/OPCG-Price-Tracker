"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import {
  Check,
  ChevronLeft,
  ChevronRight,
  Clock,
  Loader2,
  RefreshCw,
  Sparkles,
  Square,
  Undo2,
  X,
  Zap,
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
  geminiScore: number | null;
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
  counts: { matched: number; pending: number; rejected: number };
}

interface VerifyResponse {
  success: boolean;
  setCode: string;
  stats: {
    total: number;
    cached: number;
    exact: number;
    aiMatched: number;
    pending: number;
  };
  error?: string;
}

interface VerifyAllProgress {
  current: string;
  index: number;
  total: number;
  skipped: number;
  results: VerifyResponse[];
  totals: { cached: number; exact: number; aiMatched: number; pending: number };
  done: boolean;
}

function ConfidenceBadge({ score }: { score: number | null }) {
  if (score == null) return null;
  const pct = Math.round(score * 100);
  const color =
    pct >= 80
      ? "bg-green-500/15 text-green-600"
      : pct >= 50
        ? "bg-amber-500/15 text-amber-600"
        : "bg-red-500/15 text-red-600";
  return (
    <span className={cn("rounded-full px-2 py-0.5 text-[11px] font-mono font-semibold", color)}>
      {pct}%
    </span>
  );
}

function MethodBadge({ method }: { method: string | null }) {
  if (!method) return null;
  const styles: Record<string, string> = {
    cached: "bg-blue-500/15 text-blue-600",
    exact: "bg-neutral-500/15 text-neutral-500",
    gemini: "bg-purple-500/15 text-purple-600",
    admin: "bg-green-500/15 text-green-600",
  };
  const icons: Record<string, React.ReactNode> = {
    gemini: <Sparkles className="mr-1 inline size-3" />,
    admin: <Check className="mr-1 inline size-3" />,
  };
  return (
    <span className={cn("rounded-full px-2 py-0.5 text-[11px] font-medium", styles[method] ?? styles.exact)}>
      {icons[method]}
      {method}
    </span>
  );
}

export function YuyuteiMatchClient() {
  const [data, setData] = useState<ApiResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [setFilter, setSetFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("pending");
  const [sortBy, setSortBy] = useState<"default" | "recent">("default");
  const [page, setPage] = useState(1);
  const [saving, setSaving] = useState<number | null>(null);
  const [verifying, setVerifying] = useState(false);
  const [verifyResult, setVerifyResult] = useState<VerifyResponse | null>(null);
  const [verifyAllProgress, setVerifyAllProgress] = useState<VerifyAllProgress | null>(null);
  const cancelRef = useRef(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (setFilter) params.set("set", setFilter);
    if (statusFilter) params.set("status", statusFilter);
    if (sortBy === "recent") params.set("sort", "recent");
    params.set("page", String(page));
    const res = await fetch(`/api/admin/yuyutei-matching?${params}`);
    if (res.ok) {
      setData(await res.json());
    }
    setLoading(false);
  }, [setFilter, statusFilter, sortBy, page]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleVerify = async () => {
    if (!setFilter) return;
    setVerifying(true);
    setVerifyResult(null);
    try {
      const res = await fetch("/api/admin/sets/verify-yuyutei", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ setCode: setFilter }),
      });
      const json = await res.json();
      setVerifyResult(json);
      await fetchData();
    } catch {
      setVerifyResult({ success: false, setCode: setFilter, stats: { total: 0, cached: 0, exact: 0, aiMatched: 0, pending: 0 }, error: "Request failed" });
    }
    setVerifying(false);
  };

  const handleVerifyAll = async () => {
    setVerifying(true);
    setVerifyResult(null);
    cancelRef.current = false;

    try {
      const summaryRes = await fetch("/api/admin/yuyutei-matching?summary=true");
      if (!summaryRes.ok) throw new Error("Failed to fetch summary");
      const { sets: allSets, setCompletion } = (await summaryRes.json()) as {
        sets: SetInfo[];
        setCompletion: Record<string, { total: number; pending: number }>;
      };

      const toVerify = allSets.filter((s) => {
        const c = setCompletion[s.code];
        return !c || c.pending > 0 || c.total === 0;
      });

      const progress: VerifyAllProgress = {
        current: "",
        index: 0,
        total: toVerify.length,
        skipped: allSets.length - toVerify.length,
        results: [],
        totals: { cached: 0, exact: 0, aiMatched: 0, pending: 0 },
        done: false,
      };
      setVerifyAllProgress({ ...progress });

      for (let i = 0; i < toVerify.length; i++) {
        if (cancelRef.current) break;

        const s = toVerify[i];
        progress.current = s.code;
        progress.index = i + 1;
        setVerifyAllProgress({ ...progress });

        try {
          const res = await fetch("/api/admin/sets/verify-yuyutei", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ setCode: s.code }),
          });
          const json: VerifyResponse = await res.json();
          progress.results.push(json);

          if (json.success && json.stats) {
            progress.totals.cached += json.stats.cached;
            progress.totals.exact += json.stats.exact;
            progress.totals.aiMatched += json.stats.aiMatched;
            progress.totals.pending += json.stats.pending;
          }
          setVerifyAllProgress({ ...progress });
        } catch {
          progress.results.push({
            success: false,
            setCode: s.code,
            stats: { total: 0, cached: 0, exact: 0, aiMatched: 0, pending: 0 },
            error: "Request failed",
          });
          setVerifyAllProgress({ ...progress });
        }

        if (i < toVerify.length - 1 && !cancelRef.current) {
          await new Promise((r) => setTimeout(r, 1000));
        }
      }

      progress.done = true;
      setVerifyAllProgress({ ...progress });
      await fetchData();
    } catch {
      setVerifyAllProgress(null);
    }

    setVerifying(false);
  };

  const handleCancelVerifyAll = () => {
    cancelRef.current = true;
  };

  const handleApprove = async (mappingId: number, cardId: number, cardCode: string) => {
    if (!confirm(`จับคู่กับ ${cardCode} ?`)) return;
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
    if (!confirm("ยกเลิกการจับคู่นี้? (กลับเป็น pending)")) return;
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

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-sans text-xl font-bold">Yuyutei Matching</h2>
        <p className="text-muted-foreground text-sm mt-1">
          จับคู่การ์ดจาก Yuyutei กับ DB ด้วย Gemini AI — verify set แล้ว
          review/approve ผลลัพธ์
        </p>
      </div>

      {/* Filters + Verify */}
      <div className="flex flex-wrap items-center gap-3">
        <select
          value={setFilter}
          onChange={(e) => {
            setSetFilter(e.target.value);
            setPage(1);
          }}
          className="rounded-lg border border-border bg-transparent px-3 py-2 text-sm"
        >
          <option value="">All Sets</option>
          {data?.sets.map((s) => (
            <option key={s.code} value={s.code}>
              {s.code} · {s.nameEn ?? s.name}
            </option>
          ))}
        </select>
        <select
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value);
            setPage(1);
          }}
          className="rounded-lg border border-border bg-transparent px-3 py-2 text-sm"
        >
          <option value="">All Status</option>
          <option value="pending">Pending</option>
          <option value="matched">Matched</option>
          <option value="rejected">Rejected</option>
        </select>
        <button
          onClick={() => {
            setSortBy((s) => (s === "recent" ? "default" : "recent"));
            setStatusFilter("");
            setPage(1);
          }}
          className={cn(
            "flex items-center gap-1.5 rounded-lg border px-3 py-2 text-sm font-medium transition-colors",
            sortBy === "recent"
              ? "border-primary bg-primary/10 text-primary"
              : "border-border/40 hover:bg-muted"
          )}
          title="เรียงตามเวลาล่าสุด"
        >
          <Clock className="size-4" />
          Recent
        </button>
        <button
          onClick={fetchData}
          disabled={loading}
          className="rounded-lg border border-border/40 px-3 py-2 text-sm font-medium hover:bg-muted transition-colors"
        >
          <RefreshCw className={cn("size-4", loading && "animate-spin")} />
        </button>
        {verifying && verifyAllProgress ? (
          <button
            onClick={handleCancelVerifyAll}
            className="ml-auto flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 transition-colors"
          >
            <Square className="size-4" />
            Cancel
          </button>
        ) : (
          <button
            onClick={setFilter ? handleVerify : handleVerifyAll}
            disabled={verifying}
            className="ml-auto flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-40 transition-colors"
          >
            {verifying ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Zap className="size-4" />
            )}
            {verifying
              ? "Verifying..."
              : setFilter
                ? "Verify Set"
                : "Verify All"}
          </button>
        )}
      </div>

      {/* Verify result banner */}
      {verifyResult && (
        <div
          className={cn(
            "rounded-lg border p-4 text-sm",
            verifyResult.success
              ? "border-green-500/30 bg-green-500/5"
              : "border-red-500/30 bg-red-500/5"
          )}
        >
          {verifyResult.success ? (
            <div className="flex flex-wrap gap-4">
              <span className="font-semibold">{verifyResult.setCode}</span>
              <span>Total: {verifyResult.stats.total}</span>
              <span className="text-blue-500">
                Cached: {verifyResult.stats.cached}
              </span>
              <span className="text-neutral-500">
                Exact: {verifyResult.stats.exact}
              </span>
              <span className="text-purple-500">
                AI: {verifyResult.stats.aiMatched}
              </span>
              <span className="text-amber-500">
                Pending: {verifyResult.stats.pending}
              </span>
            </div>
          ) : (
            <span className="text-red-500">{verifyResult.error}</span>
          )}
        </div>
      )}

      {/* Verify All progress banner */}
      {verifyAllProgress && (
        <div className="rounded-lg border border-primary/30 bg-primary/5 p-4 text-sm space-y-3">
          <div className="flex items-center gap-3">
            {!verifyAllProgress.done && (
              <Loader2 className="size-4 animate-spin text-primary shrink-0" />
            )}
            <span className="font-semibold">
              {verifyAllProgress.done
                ? cancelRef.current
                  ? "Cancelled"
                  : "All sets verified"
                : `Verifying ${verifyAllProgress.current}...`}
            </span>
            <span className="text-muted-foreground font-mono text-xs">
              {verifyAllProgress.index}/{verifyAllProgress.total} sets
              {verifyAllProgress.skipped > 0 && (
                <span className="text-green-500 ml-1">
                  ({verifyAllProgress.skipped} skipped)
                </span>
              )}
            </span>
          </div>

          <div className="h-2 rounded-full bg-muted overflow-hidden">
            <div
              className="h-full rounded-full bg-primary transition-all duration-500"
              style={{
                width: `${verifyAllProgress.total > 0 ? (verifyAllProgress.index / verifyAllProgress.total) * 100 : 0}%`,
              }}
            />
          </div>

          <div className="flex flex-wrap gap-4 text-xs">
            <span className="text-blue-500">
              Cached: {verifyAllProgress.totals.cached}
            </span>
            <span className="text-neutral-500">
              Exact: {verifyAllProgress.totals.exact}
            </span>
            <span className="text-purple-500">
              AI: {verifyAllProgress.totals.aiMatched}
            </span>
            <span className="text-amber-500">
              Pending: {verifyAllProgress.totals.pending}
            </span>
          </div>

          {verifyAllProgress.results.length > 0 && (
            <div className="max-h-40 overflow-y-auto space-y-1 text-xs font-mono">
              {verifyAllProgress.results.map((r, i) => (
                <div key={i} className="flex gap-3">
                  <span className="w-12 shrink-0 font-semibold">{r.setCode}</span>
                  {r.success ? (
                    <span className="text-muted-foreground">
                      {r.stats.total} total / {r.stats.cached} cached / {r.stats.exact} exact / {r.stats.aiMatched} AI / {r.stats.pending} pending
                    </span>
                  ) : (
                    <span className="text-red-500">{r.error}</span>
                  )}
                </div>
              ))}
            </div>
          )}

          {verifyAllProgress.done && (
            <button
              onClick={() => setVerifyAllProgress(null)}
              className="text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              Dismiss
            </button>
          )}
        </div>
      )}

      {/* Counts */}
      {data && (
        <div className="flex gap-4 text-sm">
          <span className="text-muted-foreground">
            Total: <strong>{data.total}</strong>
          </span>
          <span className="text-green-500">
            Matched: <strong>{data.counts.matched}</strong>
          </span>
          <span className="text-amber-500">
            Pending: <strong>{data.counts.pending}</strong>
          </span>
          <span className="text-red-500">
            Rejected: <strong>{data.counts.rejected}</strong>
          </span>
        </div>
      )}

      {/* Mappings list */}
      {loading && !data ? (
        <div className="rounded-lg border border-border/30 p-8 text-center text-muted-foreground">
          Loading...
        </div>
      ) : data?.mappings.length === 0 ? (
        <div className="rounded-lg border border-border/30 p-8 text-center text-muted-foreground space-y-2">
          <p className="font-medium">
            {setFilter
              ? `ไม่มี ${statusFilter || "mapping"} สำหรับ ${setFilter}`
              : "เลือก set จาก dropdown ด้านบน"}
          </p>
          <p className="text-xs">
            {setFilter
              ? "ลองกด Verify Set เพื่อ scrape + AI match"
              : "แล้วกด Verify Set เพื่อเริ่มจับคู่ด้วย Gemini AI"}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {data?.mappings.map((m) => (
            <div
              key={m.id}
              className={cn(
                "rounded-lg border p-4 transition-colors",
                m.status === "pending"
                  ? "border-amber-500/30 bg-amber-500/5"
                  : m.status === "rejected"
                    ? "border-red-500/20 bg-red-500/5 opacity-60"
                    : "border-border/30"
              )}
            >
              {/* Header */}
              <div className="flex items-center gap-3 mb-3">
                <span className="font-mono text-sm font-semibold text-primary">
                  {m.scrapedCode}
                </span>
                <span className="text-sm text-muted-foreground truncate max-w-[200px]">
                  {m.scrapedName}
                </span>
                {m.scrapedRarity && (
                  <RarityBadge rarity={m.scrapedRarity} size="sm" />
                )}
                <span className="font-mono text-xs">
                  ¥{m.priceJpy.toLocaleString()}
                </span>
                <MethodBadge method={m.matchMethod} />
                <ConfidenceBadge score={m.geminiScore} />
                <span className="text-xs text-muted-foreground ml-auto flex items-center gap-2">
                  <span>{m.setCode}</span>
                  <span className="font-mono text-[10px] opacity-60">
                    {new Date(m.updatedAt).toLocaleString("th-TH", {
                      day: "2-digit",
                      month: "short",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </span>
              </div>

              {/* Images row */}
              <div className="flex items-start gap-4">
                {/* Yuyutei image */}
                <div className="space-y-1.5 shrink-0">
                  <p className="text-[11px] text-muted-foreground font-medium">
                    Yuyutei
                  </p>
                  <div className="relative aspect-[63/88] w-20 overflow-hidden rounded-lg border border-border/50 bg-muted/30">
                    {m.scrapedImage ? (
                      <Image
                        src={m.scrapedImage}
                        alt="Yuyutei"
                        fill
                        className="object-contain"
                        sizes="80px"
                        unoptimized
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center text-[10px] text-muted-foreground">
                        N/A
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center pt-8 text-muted-foreground">
                  →
                </div>

                {/* Matched card or candidates */}
                {m.status === "matched" && m.matchedCard ? (
                  <div className="flex items-start gap-3">
                    <div className="space-y-1.5 shrink-0">
                      <p className="text-[11px] text-muted-foreground font-medium">
                        {m.matchedCard.cardCode}
                      </p>
                      <div className="relative aspect-[63/88] w-20 overflow-hidden rounded-lg border-2 border-green-500/50 bg-muted/30">
                        {m.matchedCard.imageUrl ? (
                          <Image
                            src={m.matchedCard.imageUrl}
                            alt="Match"
                            fill
                            className="object-contain"
                            sizes="80px"
                            unoptimized
                          />
                        ) : (
                          <div className="flex h-full items-center justify-center text-[10px] text-muted-foreground">
                            N/A
                          </div>
                        )}
                      </div>
                    </div>
                    <button
                      onClick={() => handleUnmatch(m.id)}
                      disabled={saving === m.id}
                      className="mt-5 rounded-lg border border-amber-500/30 p-1.5 text-amber-500 hover:bg-amber-500/10 transition-colors"
                      title="Unmatch (กลับเป็น pending)"
                    >
                      <Undo2 className="size-3.5" />
                    </button>
                  </div>
                ) : m.candidates.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {m.candidates.map((c) => {
                      const isSelected = m.matchedCardId === c.id;
                      return (
                        <button
                          key={c.id}
                          onClick={() => handleApprove(m.id, c.id, c.cardCode)}
                          disabled={saving === m.id}
                          className={cn(
                            "space-y-1.5 rounded-lg p-1.5 transition-all",
                            isSelected
                              ? "bg-primary/10 ring-2 ring-primary"
                              : "hover:bg-muted/50 ring-1 ring-border/30"
                          )}
                        >
                          <p className="text-[11px] text-center font-mono font-medium">
                            _p{c.parallelIndex}
                            {isSelected && (
                              <Check className="inline ml-1 size-3 text-primary" />
                            )}
                          </p>
                          <div className="relative aspect-[63/88] w-16 overflow-hidden rounded bg-muted/30">
                            {c.imageUrl ? (
                              <Image
                                src={c.imageUrl}
                                alt={c.cardCode}
                                fill
                                className="object-contain"
                                sizes="64px"
                                unoptimized
                              />
                            ) : (
                              <div className="flex h-full items-center justify-center text-[10px] text-muted-foreground">
                                N/A
                              </div>
                            )}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  <div className="flex items-center text-xs text-muted-foreground pt-8">
                    ไม่พบ candidate
                  </div>
                )}

                {/* Reject button for pending */}
                {m.status === "pending" && (
                  <button
                    onClick={() => handleReject(m.id)}
                    disabled={saving === m.id}
                    className="ml-auto self-start rounded-lg border border-red-500/30 p-2 text-red-500 hover:bg-red-500/10 transition-colors"
                    title="Reject"
                  >
                    <X className="size-4" />
                  </button>
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
          <span className="text-sm font-mono">
            {page} / {data.totalPages}
          </span>
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
