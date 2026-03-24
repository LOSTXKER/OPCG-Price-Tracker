"use client";

import { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import { Check, ChevronLeft, ChevronRight, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";
import { RarityBadge } from "@/components/shared/rarity-badge";

interface CardEntry {
  id: number;
  cardCode: string;
  baseCode: string | null;
  parallelIndex: number | null;
  imageUrl: string | null;
  nameJp: string;
  nameEn: string | null;
  yuyuteiId: string | null;
  latestPriceJpy: number | null;
  rarity: string;
  set: { code: string };
  bandaiBaseUrl: string | null;
  candidates: { pIndex: number; url: string }[];
}

interface ApiResponse {
  cards: CardEntry[];
  total: number;
  page: number;
  totalPages: number;
  sets: { code: string; name: string; nameEn: string | null }[];
}

export function ImageMatchClient() {
  const [data, setData] = useState<ApiResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [setFilter, setSetFilter] = useState("");
  const [page, setPage] = useState(1);
  const [saving, setSaving] = useState<number | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (setFilter) params.set("set", setFilter);
    params.set("page", String(page));
    const res = await fetch(`/api/admin/image-matching?${params}`);
    if (res.ok) {
      setData(await res.json());
    }
    setLoading(false);
  }, [setFilter, page]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleReassign = async (cardId: number, newPIndex: number) => {
    setSaving(cardId);
    const res = await fetch("/api/admin/image-matching", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ cardId, parallelIndex: newPIndex }),
    });
    if (res.ok) {
      await fetchData();
    }
    setSaving(null);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-sans text-xl font-bold">Image Matching</h2>
        <p className="text-muted-foreground text-sm mt-1">
          เปรียบเทียบ Bandai CDN images กับ parallel variants — เลือก _pN ที่ถูกต้องสำหรับแต่ละใบ
        </p>
      </div>

      {/* Filters */}
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
        <button
          onClick={fetchData}
          disabled={loading}
          className="rounded-lg border border-border/40 px-3 py-2 text-sm font-medium hover:bg-muted transition-colors"
        >
          <RefreshCw className={cn("size-4", loading && "animate-spin")} />
        </button>
        {data && (
          <span className="text-muted-foreground text-sm ml-auto">
            {data.total} parallel cards
          </span>
        )}
      </div>

      {/* Cards Grid */}
      {loading && !data ? (
        <div className="rounded-lg border border-border/30 p-8 text-center text-muted-foreground">
          Loading...
        </div>
      ) : data?.cards.length === 0 ? (
        <div className="rounded-lg border border-border/30 p-8 text-center text-muted-foreground">
          No parallel cards found
        </div>
      ) : (
        <div className="space-y-4">
          {data?.cards.map((card) => (
            <div key={card.id} className="rounded-lg border border-border/30 p-4 space-y-3">
              <div className="flex items-center gap-3">
                <span className="font-mono text-sm font-semibold text-primary">
                  {card.baseCode}
                </span>
                <span className="text-sm text-muted-foreground truncate">
                  {card.nameEn ?? card.nameJp}
                </span>
                <RarityBadge rarity={card.rarity} size="sm" />
                <span className="text-xs text-muted-foreground">
                  {card.set.code}
                </span>
                {card.latestPriceJpy != null && (
                  <span className="text-xs font-mono text-foreground ml-auto">
                    ¥{card.latestPriceJpy.toLocaleString()}
                  </span>
                )}
              </div>

              <div className="flex items-start gap-4">
                {/* Current image */}
                <div className="space-y-1.5 shrink-0">
                  <p className="text-[11px] text-muted-foreground font-medium">
                    Current (p{card.parallelIndex ?? "?"})
                  </p>
                  <div className="relative aspect-[63/88] w-24 overflow-hidden rounded-lg border-2 border-primary/50 bg-muted/30">
                    {card.imageUrl ? (
                      <Image
                        src={card.imageUrl}
                        alt="Current"
                        fill
                        className="object-contain"
                        sizes="96px"
                        unoptimized
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center text-xs text-muted-foreground">
                        N/A
                      </div>
                    )}
                  </div>
                </div>

                {/* Arrow */}
                <div className="flex items-center pt-8 text-muted-foreground">→</div>

                {/* Candidates */}
                <div className="flex flex-wrap gap-2">
                  {card.candidates.map((c) => {
                    const isActive = card.parallelIndex === c.pIndex;
                    return (
                      <button
                        key={c.pIndex}
                        onClick={() => handleReassign(card.id, c.pIndex)}
                        disabled={saving === card.id}
                        className={cn(
                          "space-y-1.5 rounded-lg p-1.5 transition-all",
                          isActive
                            ? "bg-primary/10 ring-2 ring-primary"
                            : "hover:bg-muted/50 ring-1 ring-border/30"
                        )}
                      >
                        <p className="text-[11px] text-center font-mono font-medium">
                          _p{c.pIndex}
                          {isActive && (
                            <Check className="inline ml-1 size-3 text-primary" />
                          )}
                        </p>
                        <div className="relative aspect-[63/88] w-20 overflow-hidden rounded bg-muted/30">
                          <Image
                            src={c.url}
                            alt={`p${c.pIndex}`}
                            fill
                            className="object-contain"
                            sizes="80px"
                            unoptimized
                          />
                        </div>
                      </button>
                    );
                  })}
                </div>
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
