"use client";

import Image from "next/image";
import { cn } from "@/lib/utils";
import { RarityBadge } from "@/components/shared/rarity-badge";
export { relativeTime } from "@/lib/utils/time";

/* ── StatusBadge ── */

const STATUS_STYLES: Record<string, string> = {
  matched: "bg-green-500/15 text-green-600",
  suggested: "bg-blue-500/15 text-blue-600",
  pending: "bg-amber-500/15 text-amber-600",
  rejected: "bg-red-500/15 text-red-500",
};

export function StatusBadge({ status }: { status: string }) {
  return (
    <span
      className={cn(
        "inline-block rounded-full px-2 py-0.5 text-[11px] font-medium leading-none whitespace-nowrap",
        STATUS_STYLES[status]
      )}
    >
      {status}
    </span>
  );
}

/* ── CardThumb ── */

export function CardThumb({
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

/* ── Lightbox ── */

import { X } from "lucide-react";

export function Lightbox({
  images,
  onClose,
}: {
  images: { src: string; label: string }[];
  onClose: () => void;
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm"
      onClick={onClose}
    >
      <div className="flex gap-8 p-8" onClick={(e) => e.stopPropagation()}>
        {images.map((img, i) => (
          <div key={i} className="flex flex-col items-center gap-3">
            <p className="text-sm text-white/80 font-semibold">{img.label}</p>
            <div className="relative w-72 aspect-[63/88] overflow-hidden rounded-xl border-2 border-white/20 bg-black/50">
              <Image
                src={img.src}
                alt={img.label}
                fill
                className="object-contain"
                sizes="288px"
                unoptimized
              />
            </div>
          </div>
        ))}
      </div>
      <button
        onClick={onClose}
        className="absolute top-4 right-4 rounded-full bg-white/10 p-2 text-white hover:bg-white/20 transition-colors"
      >
        <X className="size-6" />
      </button>
    </div>
  );
}

/* ── CandidatePicker ── */

export interface MatchingCard {
  id: number;
  cardCode: string;
  nameJp: string;
  nameEn: string | null;
  rarity: string;
  imageUrl: string | null;
  isParallel: boolean;
  parallelIndex?: number | null;
}

export function CandidatePicker({
  candidates,
  currentId,
  onPick,
  onZoom,
}: {
  candidates: MatchingCard[];
  currentId: number | null;
  onPick: (cardId: number) => void;
  onZoom?: (card: MatchingCard) => void;
}) {
  if (candidates.length === 0)
    return <span className="text-xs text-muted-foreground">ไม่พบ candidate</span>;

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
          {onZoom ? (
            <div
              role="button"
              tabIndex={0}
              onClick={(e) => {
                e.preventDefault();
                onZoom(c);
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  onZoom(c);
                }
              }}
              className="cursor-zoom-in"
            >
              <CardThumb src={c.imageUrl} />
            </div>
          ) : (
            <CardThumb src={c.imageUrl} />
          )}
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
