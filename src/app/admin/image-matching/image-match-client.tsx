"use client";

import { useState } from "react";
import { adminFetch, buildAdminQuery } from "@/lib/admin/admin-fetch";
import { useAdminList } from "@/lib/admin/use-admin-list";
import { useAdminUrlState } from "@/lib/admin/use-admin-url-state";
import type { PaginatedApiResponse } from "@/app/admin/admin-types";
import Image from "next/image";
import { Check, ImageIcon, RefreshCw, Search, ZoomIn } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatJpy } from "@/lib/utils/currency";
import { RarityBadge } from "@/components/shared/rarity-badge";
import { AdminPage } from "@/components/admin/admin-page";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { AdminPagination } from "@/components/admin/admin-pagination";
import {
  AdminToolbar,
  AdminFilterSelect,
} from "@/components/admin/admin-toolbar";
import { AdminEmptyState } from "@/components/admin/admin-empty-state";
import { Lightbox } from "@/components/admin/matching-ui";
import { Button } from "@/components/ui/button";
import { Surface } from "@/components/ui/surface";
import { toast } from "sonner";

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

interface ApiResponse extends PaginatedApiResponse {
  cards: CardEntry[];
  sets: { code: string; name: string; nameEn: string | null }[];
  matchedCount: number;
  totalAll: number;
}

export function ImageMatchClient() {
  const { state, patch } = useAdminUrlState({
    defaults: { set: "", matched: "", page: 1 },
  });
  const { set: setFilter, matched: matchedFilter, page } = state;

  const { data, loading, error: fetchError, refetch } = useAdminList<ApiResponse, typeof state>({
    url: (p) =>
      `/api/admin/image-matching?${buildAdminQuery({
        set: p.set || undefined,
        matched: p.matched || undefined,
        page: p.page,
      })}`,
    params: state,
  });

  const [saving, setSaving] = useState<number | null>(null);
  const [failedImages, setFailedImages] = useState<Set<string>>(new Set());
  const [lightbox, setLightbox] = useState<
    { src: string; label: string }[] | null
  >(null);

  const handleReassign = async (cardId: number, newPIndex: number) => {
    setSaving(cardId);
    try {
      await adminFetch("/api/admin/image-matching", {
        method: "PATCH",
        body: { cardId, parallelIndex: newPIndex },
      });
      toast.success("บันทึกแล้ว", {
        description: `เปลี่ยนเป็น _p${newPIndex}`,
      });
      await refetch();
    } catch (err) {
      toast.error("บันทึกไม่สำเร็จ", {
        description: err instanceof Error ? err.message : "เกิดข้อผิดพลาดที่ไม่ทราบสาเหตุ",
      });
    } finally {
      setSaving(null);
    }
  };

  const handleImageError = (url: string) => {
    setFailedImages((prev) => {
      const next = new Set(prev);
      next.add(url);
      return next;
    });
  };

  const openLightbox = (
    card: CardEntry,
    candidate: { pIndex: number; url: string },
  ) => {
    const images: { src: string; label: string }[] = [];
    if (card.imageUrl) {
      images.push({
        src: card.imageUrl,
        label: `ปัจจุบัน (p${card.parallelIndex ?? "?"})`,
      });
    }
    images.push({ src: candidate.url, label: `_p${candidate.pIndex}` });
    setLightbox(images);
  };

  const matchedPercent =
    data && data.totalAll > 0
      ? Math.round((data.matchedCount / data.totalAll) * 100)
      : 0;

  const setOptions = (data?.sets ?? []).map((s) => ({
    value: s.code,
    label: `${s.code} · ${s.nameEn ?? s.name}`,
  }));

  const matchedOptions = [
    { value: "false", label: "ยังไม่จับคู่" },
    { value: "true", label: "จับคู่แล้ว" },
  ];

  return (
    <AdminPage
      header={
        <AdminPageHeader
          icon={ImageIcon}
          title="จับคู่รูปภาพ"
          description="เปรียบเทียบรูปภาพจาก Bandai CDN กับ parallel variants — เลือก _pN ที่ถูกต้องสำหรับแต่ละใบ"
          meta={
            data && (
              <>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary">
                  จับคู่แล้ว {data.matchedCount}/{data.totalAll} ({matchedPercent}%)
                </span>
                <span className="text-meta">{data.total.toLocaleString()} รายการในตัวกรอง</span>
              </>
            )
          }
          actions={
            <Button
              variant="outline"
              size="sm"
              onClick={() => void refetch()}
              disabled={loading}
            >
              <RefreshCw
                className={cn("size-4 mr-1.5", loading && "animate-spin")}
              />
              รีเฟรช
            </Button>
          }
        />
      }
    >
      <div className="sticky top-0 z-20">
      <AdminToolbar>
        <AdminFilterSelect
          value={setFilter}
          onChange={(v) => patch({ set: v, page: 1 })}
          options={setOptions}
          placeholder="ทุกชุดการ์ด"
          className="w-[220px]"
        />
        <AdminFilterSelect
          value={matchedFilter}
          onChange={(v) => patch({ matched: v, page: 1 })}
          options={matchedOptions}
          placeholder="ทุกสถานะ"
          className="w-[180px]"
        />
      </AdminToolbar>
      </div>

      {fetchError ? (
        <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-8 text-center text-destructive text-sm">
          {fetchError}
        </div>
      ) : loading && !data ? (
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className="h-40 animate-pulse rounded-lg border border-[var(--p-hair)] bg-muted/20"
            />
          ))}
        </div>
      ) : data?.cards.length === 0 ? (
        <AdminEmptyState
          icon={Search}
          title="ไม่พบการ์ด parallel"
          description={
            matchedFilter || setFilter
              ? "ลองเปลี่ยนตัวกรองใหม่"
              : "ยังไม่มีการ์ด parallel ในระบบ"
          }
        />
      ) : (
        <div className="space-y-3">
          {data?.cards?.map((card) => (
            <Surface
              key={card.id}
              variant="outline"
              className={cn(
                "p-4 transition-colors",
                saving === card.id
                  ? "border-primary/40 bg-primary/5"
                  : "border-[var(--p-hair)] bg-card",
              )}
            >
              {/* Card header */}
              <div className="mb-3 flex items-center gap-2.5">
                <span className="font-mono text-sm font-bold text-primary">
                  {card.baseCode}
                </span>
                <span className="text-sm text-muted-foreground truncate">
                  {card.nameEn ?? card.nameJp}
                </span>
                <RarityBadge rarity={card.rarity} size="sm" />
                <span className="rounded bg-muted/50 px-1.5 py-0.5 text-overlay font-mono text-muted-foreground">
                  {card.set.code}
                </span>
                {card.latestPriceJpy != null && (
                  <span className="ml-auto font-mono text-sm font-semibold tabular-nums">
                    {formatJpy(card.latestPriceJpy)}
                  </span>
                )}
              </div>

              {/* Image matching area */}
              <div className="flex items-start gap-4">
                {/* Current image */}
                <div className="shrink-0 space-y-1.5">
                  <p className="text-label text-muted-foreground">
                    ปัจจุบัน (p{card.parallelIndex ?? "?"})
                  </p>
                  <div
                    className="group relative aspect-[63/88] w-28 cursor-zoom-in overflow-hidden rounded-lg border-2 border-primary/40 bg-muted/20 shadow-sm"
                    onClick={() => {
                      if (card.imageUrl) {
                          setLightbox([
                          {
                            src: card.imageUrl,
                            label: `ปัจจุบัน (p${card.parallelIndex ?? "?"})`,
                          },
                        ]);
                      }
                    }}
                  >
                    {card.imageUrl ? (
                      <>
                        <Image
                          src={card.imageUrl}
                          alt="รูปภาพปัจจุบัน"
                          fill
                          className="object-contain transition-transform group-hover:scale-105"
                          sizes="112px"
                          unoptimized
                        />
                        <div className="absolute inset-0 flex items-center justify-center bg-black/0 opacity-0 transition-all group-hover:bg-black/20 group-hover:opacity-100">
                          <ZoomIn className="size-5 text-white drop-shadow" />
                        </div>
                      </>
                    ) : (
                      <div className="flex h-full items-center justify-center text-meta">
                        N/A
                      </div>
                    )}
                    {card.parallelIndex != null && (
                      <div className="absolute top-1 right-1 flex size-5 items-center justify-center rounded-full bg-primary text-white shadow">
                        <Check className="size-3" />
                      </div>
                    )}
                  </div>
                </div>

                {/* Arrow separator */}
                <div className="flex items-center pt-10 text-muted-foreground/50 text-lg select-none">
                  →
                </div>

                {/* Candidate thumbnails */}
                <div className="flex flex-wrap gap-2 min-w-0">
                  {card.candidates.map((c) => {
                    const isActive = card.parallelIndex === c.pIndex;
                    const isFailed = failedImages.has(c.url);

                    return (
                      <div key={c.pIndex} className="flex flex-col gap-1">
                        <button
                          onClick={() => {
                            if (!isFailed) handleReassign(card.id, c.pIndex);
                          }}
                          disabled={saving === card.id || isFailed}
                          className={cn(
                            "group/card relative rounded-lg p-1.5 transition-all",
                            isActive
                              ? "bg-primary/10 ring-2 ring-primary shadow-sm"
                              : isFailed
                                ? "opacity-30 cursor-not-allowed ring-1 ring-border/20"
                                : "hover:bg-muted/60 hover:ring-primary/30 ring-1 ring-border/30",
                          )}
                        >
                          <p className="mb-1 text-center font-mono text-micro">
                            _p{c.pIndex}
                            {isActive && (
                              <Check className="ml-0.5 inline size-3 text-primary" />
                            )}
                          </p>
                          <div className="relative aspect-[63/88] w-[72px] overflow-hidden rounded bg-muted/20">
                            {isFailed ? (
                              <div className="flex h-full items-center justify-center text-overlay text-muted-foreground/60">
                                N/A
                              </div>
                            ) : (
                              <Image
                                src={c.url}
                                alt={`p${c.pIndex}`}
                                fill
                                className="object-contain"
                                sizes="72px"
                                onError={() => handleImageError(c.url)}
                              />
                            )}
                            {!isFailed && !isActive && (
                              <div
                                className="absolute inset-0 flex items-center justify-center bg-black/0 opacity-0 transition-all group-hover/card:bg-black/10 group-hover/card:opacity-100"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  openLightbox(card, c);
                                }}
                              >
                                <ZoomIn className="size-4 text-white drop-shadow" />
                              </div>
                            )}
                          </div>
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            </Surface>
          ))}
        </div>
      )}

      {data && (
        <AdminPagination
          page={page}
          totalPages={data.totalPages}
          onPageChange={(p) => patch({ page: p })}
          total={data.total}
          perPage={20}
        />
      )}

      {lightbox && (
        <Lightbox images={lightbox} onClose={() => setLightbox(null)} />
      )}
    </AdminPage>
  );
}
