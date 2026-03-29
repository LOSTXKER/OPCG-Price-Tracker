"use client";

import { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import {
  Check,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Globe,
  Loader2,
  Plus,
  RefreshCw,
  Search,
  Sparkles,
  Undo2,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { RarityBadge } from "@/components/shared/rarity-badge";

/* ── Types ── */

interface MappingCard {
  id: number;
  cardCode: string;
  nameJp: string;
  nameEn: string | null;
  rarity: string;
  imageUrl: string | null;
  isParallel: boolean;
}

interface Mapping {
  id: number;
  snkrdunkId: number;
  productNumber: string;
  scrapedName: string;
  thumbnailUrl: string | null;
  minPriceUsd: number | null;
  usedMinPriceUsd: number | null;
  lastSoldPsa10Usd: number | null;
  matchedCardId: number | null;
  matchedCard: MappingCard | null;
  matchMethod: string | null;
  status: string;
  updatedAt: string;
  actionAt: string | null;
  actionByUser: { displayName: string | null; email: string } | null;
  candidates: MappingCard[];
}

interface ApiResponse {
  mappings: Mapping[];
  total: number;
  page: number;
  totalPages: number;
}

/* ── Helpers ── */

function relativeTime(dateStr: string | null): string {
  if (!dateStr) return "—";
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "เมื่อกี้";
  if (mins < 60) return `${mins} นาที`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs} ชม.`;
  const days = Math.floor(hrs / 24);
  return `${days} วัน`;
}

function StatusBadge({ status }: { status: string }) {
  const s: Record<string, string> = {
    matched: "bg-green-500/15 text-green-600",
    pending: "bg-amber-500/15 text-amber-600",
    rejected: "bg-red-500/15 text-red-500",
  };
  return (
    <span
      className={cn(
        "inline-block rounded-full px-2 py-0.5 text-[11px] font-medium leading-none whitespace-nowrap",
        s[status]
      )}
    >
      {status}
    </span>
  );
}

function PriceTag({
  label,
  value,
  highlight,
}: {
  label: string;
  value: number | null;
  highlight?: boolean;
}) {
  return (
    <div className="flex items-baseline gap-1">
      <span className="text-[10px] text-muted-foreground">{label}</span>
      {value != null ? (
        <span
          className={cn(
            "font-price text-xs font-semibold tabular-nums",
            highlight && "text-green-600"
          )}
        >
          ${value}
        </span>
      ) : (
        <span className="text-[10px] text-muted-foreground/40">—</span>
      )}
    </div>
  );
}

function CardThumb({
  src,
  size = "sm",
  className: cls,
}: {
  src: string | null;
  size?: "sm" | "md";
  className?: string;
}) {
  const w = size === "md" ? "w-16" : "w-12";
  return (
    <div
      className={cn(
        "relative aspect-[63/88] overflow-hidden rounded border border-border/40 bg-muted/30 shrink-0",
        w,
        cls
      )}
    >
      {src ? (
        <Image
          src={src}
          alt=""
          fill
          className="object-contain"
          sizes={size === "md" ? "64px" : "48px"}
          unoptimized
        />
      ) : (
        <span className="flex h-full items-center justify-center text-[8px] text-muted-foreground">
          N/A
        </span>
      )}
    </div>
  );
}

/* ── Add card dialog ── */

function AddCardDialog({
  open,
  onClose,
  onAdded,
}: {
  open: boolean;
  onClose: () => void;
  onAdded: () => void;
}) {
  const [idInput, setIdInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [preview, setPreview] = useState<{
    name: string;
    productNumber: string;
    psa10MinPriceUsd: number | null;
    psa10LastSoldUsd: number | null;
    lastSoldUsd: number | null;
    thumbnailUrl: string | null;
  } | null>(null);

  const handleLookup = async () => {
    const id = parseInt(idInput.trim(), 10);
    if (!id) return;
    setBusy(true);
    setError("");
    setPreview(null);
    try {
      const res = await fetch(
        `/api/admin/snkrdunk-matching?lookup=${id}`
      );
      const json = await res.json();
      if (!res.ok) {
        setError(json.error || "Failed");
      } else {
        setPreview({
          name: json.data.summary.name,
          productNumber: json.data.summary.productNumber,
          psa10MinPriceUsd: json.data.psa10MinPriceUsd,
          psa10LastSoldUsd: json.data.psa10LastSoldUsd,
          lastSoldUsd: json.data.lastSoldUsd,
          thumbnailUrl: json.data.summary.thumbnailUrl,
        });
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unknown error");
    }
    setBusy(false);
  };

  const handleAdd = async () => {
    const id = parseInt(idInput.trim(), 10);
    if (!id) return;
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/admin/snkrdunk-matching", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ snkrdunkId: id }),
      });
      const json = await res.json();
      if (!res.ok && res.status !== 409) {
        setError(json.error || "Failed");
      } else {
        onAdded();
        onClose();
        setIdInput("");
        setPreview(null);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unknown error");
    }
    setBusy(false);
  };

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-2xl border border-border bg-background p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-semibold">
            เพิ่มการ์ดจาก SNKRDUNK
          </h3>
          <button onClick={onClose} className="rounded-full p-1 hover:bg-muted">
            <X className="size-5" />
          </button>
        </div>

        <p className="mb-3 text-xs text-muted-foreground">
          ใส่ SNKRDUNK ID (เลขตอนท้าย URL เช่น{" "}
          <code className="rounded bg-muted px-1">94915</code> จาก{" "}
          <code className="rounded bg-muted px-1">
            snkrdunk.com/en/trading-cards/94915
          </code>
          )
        </p>

        <div className="flex gap-2">
          <input
            type="text"
            value={idInput}
            onChange={(e) => setIdInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleLookup()}
            placeholder="SNKRDUNK ID เช่น 94915"
            className="flex-1 rounded-lg border border-border bg-muted/30 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/30"
          />
          <button
            onClick={handleLookup}
            disabled={busy || !idInput.trim()}
            className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
          >
            {busy ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Search className="size-4" />
            )}
          </button>
        </div>

        {error && (
          <p className="mt-2 text-xs text-red-500">{error}</p>
        )}

        {preview && (
          <div className="mt-4 rounded-xl border border-border/50 bg-muted/20 p-4">
            <div className="flex gap-3">
              <CardThumb src={preview.thumbnailUrl} size="md" />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold leading-tight">
                  {preview.name}
                </p>
                <p className="mt-1 font-mono text-xs text-muted-foreground">
                  {preview.productNumber}
                </p>
                <div className="mt-2 flex flex-wrap gap-3">
                  <PriceTag
                    label="PSA10 ask"
                    value={preview.psa10MinPriceUsd}
                    highlight
                  />
                  <PriceTag
                    label="PSA10 sold"
                    value={preview.psa10LastSoldUsd}
                  />
                  <PriceTag
                    label="Last sold"
                    value={preview.lastSoldUsd}
                  />
                </div>
              </div>
            </div>

            <button
              onClick={handleAdd}
              disabled={busy}
              className="mt-4 w-full rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50"
            >
              {busy ? (
                <Loader2 className="mx-auto size-4 animate-spin" />
              ) : (
                "เพิ่มเข้า Mapping"
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

/* ── Candidate picker ── */

function CandidatePicker({
  candidates,
  currentId,
  onPick,
}: {
  candidates: MappingCard[];
  currentId: number | null;
  onPick: (cardId: number) => void;
}) {
  if (candidates.length === 0)
    return (
      <span className="text-xs text-muted-foreground">
        ไม่พบ candidate
      </span>
    );

  return (
    <div className="flex flex-col gap-1">
      {candidates.map((c) => (
        <label
          key={c.id}
          className={cn(
            "flex items-center gap-2 rounded-lg px-2 py-1 cursor-pointer transition-colors",
            c.id === currentId
              ? "bg-blue-500/10 ring-1 ring-blue-500/40"
              : "hover:bg-muted/50"
          )}
        >
          <input
            type="radio"
            name="candidate"
            checked={c.id === currentId}
            onChange={() => onPick(c.id)}
            className="accent-blue-500"
          />
          <CardThumb src={c.imageUrl} />
          <div className="min-w-0">
            <p className="font-mono text-xs font-bold">{c.cardCode}</p>
            <p className="text-[10px] text-muted-foreground truncate">
              {c.nameJp}
            </p>
            <RarityBadge rarity={c.rarity} size="sm" />
          </div>
        </label>
      ))}
    </div>
  );
}

/* ══════════ MAIN ══════════ */

export function SnkrdunkMatchClient() {
  const [data, setData] = useState<ApiResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("pending");
  const [searchInput, setSearchInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(1);
  const [saving, setSaving] = useState<Set<number>>(new Set());
  const [pickedCandidate, setPickedCandidate] = useState<
    Record<number, number>
  >({});
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [autoMatchBusy, setAutoMatchBusy] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => {
      setSearchQuery(searchInput);
      setPage(1);
    }, 400);
    return () => clearTimeout(t);
  }, [searchInput]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (statusFilter) params.set("status", statusFilter);
    if (searchQuery) params.set("q", searchQuery);
    params.set("page", String(page));
    params.set("limit", "20");
    const res = await fetch(
      `/api/admin/snkrdunk-matching?${params}`
    );
    if (res.ok) setData(await res.json());
    setLoading(false);
  }, [statusFilter, searchQuery, page]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  /* ── Actions ── */

  const addSaving = (id: number) =>
    setSaving((s) => new Set(s).add(id));
  const removeSaving = (id: number) =>
    setSaving((s) => {
      const n = new Set(s);
      n.delete(id);
      return n;
    });

  const handleApprove = async (
    mappingId: number,
    cardId: number
  ) => {
    addSaving(mappingId);
    await fetch("/api/admin/snkrdunk-matching", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: mappingId, matchedCardId: cardId }),
    });
    removeSaving(mappingId);
    await fetchData();
  };

  const handleUnmatch = async (mappingId: number) => {
    addSaving(mappingId);
    await fetch("/api/admin/snkrdunk-matching", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: mappingId, action: "unmatch" }),
    });
    removeSaving(mappingId);
    await fetchData();
  };

  const handleRefresh = async (mappingId: number) => {
    addSaving(mappingId);
    await fetch("/api/admin/snkrdunk-matching", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: mappingId, action: "refresh" }),
    });
    removeSaving(mappingId);
    await fetchData();
  };

  const handleReject = async (mappingId: number) => {
    addSaving(mappingId);
    await fetch("/api/admin/snkrdunk-matching", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: mappingId }),
    });
    removeSaving(mappingId);
    await fetchData();
  };

  const handleAutoMatch = async () => {
    setAutoMatchBusy(true);
    const res = await fetch("/api/admin/snkrdunk-matching", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "auto-match" }),
    });
    const json = await res.json();
    alert(`Auto-matched: ${json.autoMatched} cards`);
    setAutoMatchBusy(false);
    await fetchData();
  };

  /* ── Render ── */

  const mappings = data?.mappings ?? [];
  const total = data?.total ?? 0;
  const totalPages = data?.totalPages ?? 1;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Globe className="size-6 text-primary" />
          <div>
            <h1 className="text-xl font-bold">SNKRDUNK Matching</h1>
            <p className="text-xs text-muted-foreground">
              จับคู่การ์ดจาก SNKRDUNK เพื่อดึงราคา PSA10 / Last Sold
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleAutoMatch}
            disabled={autoMatchBusy}
            className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-background px-3 py-1.5 text-xs font-medium hover:bg-muted disabled:opacity-50"
          >
            {autoMatchBusy ? (
              <Loader2 className="size-3.5 animate-spin" />
            ) : (
              <Sparkles className="size-3.5" />
            )}
            Auto-match
          </button>
          <button
            onClick={() => setAddDialogOpen(true)}
            className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90"
          >
            <Plus className="size-3.5" />
            เพิ่มการ์ด
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="ค้นหา card code หรือชื่อ…"
            className="h-8 w-56 rounded-lg border border-border bg-muted/30 pl-8 pr-3 text-xs outline-none focus:ring-2 focus:ring-primary/30"
          />
        </div>

        <select
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value);
            setPage(1);
          }}
          className="h-8 rounded-lg border border-border bg-muted/30 px-2 text-xs"
        >
          <option value="">ทุก status</option>
          <option value="pending">pending</option>
          <option value="matched">matched</option>
          <option value="rejected">rejected</option>
        </select>

        <button
          onClick={() => fetchData()}
          className="inline-flex items-center gap-1 rounded-lg border border-border bg-background p-1.5 text-xs hover:bg-muted"
        >
          <RefreshCw className={cn("size-3.5", loading && "animate-spin")} />
        </button>

        <span className="ml-auto text-xs text-muted-foreground">
          {total} รายการ
        </span>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-xl border border-border">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/30 text-xs text-muted-foreground">
              <th className="py-2.5 pl-4 pr-2 text-left font-medium">
                SNKRDUNK
              </th>
              <th className="px-2 py-2.5 text-left font-medium">
                ราคา USD
              </th>
              <th className="px-2 py-2.5 text-left font-medium">
                Match
              </th>
              <th className="px-2 py-2.5 text-center font-medium">
                Status
              </th>
              <th className="px-2 py-2.5 pr-4 text-right font-medium">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/30">
            {loading && mappings.length === 0 ? (
              <tr>
                <td colSpan={5} className="py-12 text-center">
                  <Loader2 className="mx-auto size-6 animate-spin text-muted-foreground" />
                </td>
              </tr>
            ) : mappings.length === 0 ? (
              <tr>
                <td
                  colSpan={5}
                  className="py-12 text-center text-xs text-muted-foreground"
                >
                  ไม่พบรายการ
                </td>
              </tr>
            ) : (
              mappings.map((m) => {
                const isSaving = saving.has(m.id);
                const candidateId =
                  pickedCandidate[m.id] ?? m.matchedCardId;

                return (
                  <tr
                    key={m.id}
                    className={cn(
                      "transition-colors hover:bg-muted/20",
                      isSaving && "opacity-50"
                    )}
                  >
                    {/* SNKRDUNK card info */}
                    <td className="py-3 pl-4 pr-2">
                      <div className="flex items-start gap-2.5">
                        <CardThumb src={m.thumbnailUrl} />
                        <div className="min-w-0">
                          <p className="font-mono text-xs font-bold">
                            {m.productNumber}
                          </p>
                          <p className="mt-0.5 text-[11px] leading-tight text-muted-foreground line-clamp-2">
                            {m.scrapedName}
                          </p>
                          <a
                            href={`https://snkrdunk.com/en/trading-cards/${m.snkrdunkId}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="mt-1 inline-flex items-center gap-1 text-[10px] text-blue-500 hover:underline"
                          >
                            <ExternalLink className="size-2.5" />
                            {m.snkrdunkId}
                          </a>
                        </div>
                      </div>
                    </td>

                    {/* Prices */}
                    <td className="px-2 py-3">
                      <div className="flex flex-col gap-0.5">
                        <PriceTag
                          label="Min"
                          value={m.minPriceUsd}
                        />
                        <PriceTag
                          label="Used"
                          value={m.usedMinPriceUsd}
                        />
                        <PriceTag
                          label="PSA10"
                          value={m.lastSoldPsa10Usd}
                          highlight
                        />
                      </div>
                    </td>

                    {/* Match */}
                    <td className="px-2 py-3">
                      {m.status === "matched" && m.matchedCard ? (
                        <div className="flex items-center gap-2">
                          <CardThumb src={m.matchedCard.imageUrl} />
                          <div className="min-w-0">
                            <p className="font-mono text-xs font-bold">
                              {m.matchedCard.cardCode}
                            </p>
                            <p className="text-[10px] text-muted-foreground truncate">
                              {m.matchedCard.nameJp}
                            </p>
                            {m.matchMethod && (
                              <span className="text-[9px] text-muted-foreground/60">
                                via {m.matchMethod}
                              </span>
                            )}
                          </div>
                        </div>
                      ) : (
                        <CandidatePicker
                          candidates={m.candidates}
                          currentId={candidateId}
                          onPick={(cid) =>
                            setPickedCandidate((p) => ({
                              ...p,
                              [m.id]: cid,
                            }))
                          }
                        />
                      )}
                    </td>

                    {/* Status */}
                    <td className="px-2 py-3 text-center">
                      <StatusBadge status={m.status} />
                      <p className="mt-1 text-[9px] text-muted-foreground">
                        {relativeTime(m.updatedAt)}
                      </p>
                    </td>

                    {/* Actions */}
                    <td className="px-2 py-3 pr-4">
                      <div className="flex items-center justify-end gap-1">
                        {m.status === "matched" ? (
                          <>
                            <button
                              onClick={() => handleRefresh(m.id)}
                              disabled={isSaving}
                              className="rounded-lg p-1.5 text-blue-500 hover:bg-blue-500/10"
                              title="รีเฟรชราคา"
                            >
                              <RefreshCw className="size-3.5" />
                            </button>
                            <button
                              onClick={() => handleUnmatch(m.id)}
                              disabled={isSaving}
                              className="rounded-lg p-1.5 text-amber-500 hover:bg-amber-500/10"
                              title="ยกเลิกจับคู่"
                            >
                              <Undo2 className="size-3.5" />
                            </button>
                          </>
                        ) : (
                          <>
                            {candidateId && (
                              <button
                                onClick={() =>
                                  handleApprove(m.id, candidateId)
                                }
                                disabled={isSaving}
                                className="rounded-lg p-1.5 text-green-500 hover:bg-green-500/10"
                                title="อนุมัติ"
                              >
                                <Check className="size-3.5" />
                              </button>
                            )}
                            <button
                              onClick={() => handleReject(m.id)}
                              disabled={isSaving}
                              className="rounded-lg p-1.5 text-red-500 hover:bg-red-500/10"
                              title="ปฏิเสธ"
                            >
                              <X className="size-3.5" />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page <= 1}
            className="rounded-lg border border-border p-1.5 text-xs disabled:opacity-30"
          >
            <ChevronLeft className="size-4" />
          </button>
          <span className="text-xs text-muted-foreground">
            {page} / {totalPages}
          </span>
          <button
            onClick={() =>
              setPage((p) => Math.min(totalPages, p + 1))
            }
            disabled={page >= totalPages}
            className="rounded-lg border border-border p-1.5 text-xs disabled:opacity-30"
          >
            <ChevronRight className="size-4" />
          </button>
        </div>
      )}

      {/* Add dialog */}
      <AddCardDialog
        open={addDialogOpen}
        onClose={() => setAddDialogOpen(false)}
        onAdded={fetchData}
      />
    </div>
  );
}
