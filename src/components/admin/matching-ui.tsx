"use client";

import Image from "next/image";
import { cn } from "@/lib/utils";
import { RarityBadge } from "@/components/shared/rarity-badge";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
export { relativeTime } from "@/lib/utils/time";

/* ── StatusBadge ── */

const STATUS_STYLES: Record<string, string> = {
  matched: "bg-success/15 text-success",
  suggested: "bg-info/15 text-info",
  pending: "bg-warning/15 text-warning",
  rejected: "bg-danger/15 text-danger",
};

export function StatusBadge({ status }: { status: string }) {
  return (
    <span
      className={cn(
        "inline-block rounded-full px-2 py-0.5 text-xs font-medium leading-none whitespace-nowrap",
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
        "relative aspect-[63/88] overflow-hidden rounded-sm border border-transparent dark:border-hair bg-muted/30 shrink-0",
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
        <span className="flex h-full items-center justify-center text-overlay text-muted-foreground">
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
    <Dialog open onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent
        showCloseButton={false}
        overlayClassName="bg-black/70"
        className="max-h-[calc(100dvh-2rem)] max-w-[calc(100%-2rem)] overflow-y-auto border-0 bg-transparent p-4 shadow-none sm:max-w-4xl"
      >
        <DialogTitle className="sr-only">Card image comparison</DialogTitle>
        <div className="grid gap-6 sm:grid-cols-2 sm:gap-8">
          {images.map((img, i) => (
            <div key={i} className="flex flex-col items-center gap-3">
              <p className="text-sm font-semibold text-white/80">{img.label}</p>
              <div className="relative aspect-[63/88] w-full max-w-72 overflow-hidden rounded-xl border-2 border-white/20 bg-black/50">
                <Image
                  src={img.src}
                  alt={img.label}
                  fill
                  className="object-contain"
                  sizes="(max-width: 639px) calc(100vw - 64px), 288px"
                  unoptimized
                />
              </div>
            </div>
          ))}
        </div>
        <DialogClose
          render={
            <button
              type="button"
              aria-label="Close image comparison"
              className="tap-safe absolute right-1 top-1 rounded-full bg-white/10 p-2 text-white transition-colors hover:bg-white/20 sm:right-3 sm:top-3"
            />
          }
        >
          <X className="size-6" />
        </DialogClose>
      </DialogContent>
    </Dialog>
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
    return <span className="text-meta">ไม่พบตัวเลือก</span>;

  return (
    <div className="flex flex-col gap-1">
      {candidates.map((c) => (
        <label
          key={c.id}
          className={cn(
            "flex items-center gap-2 rounded-lg px-2 py-1 cursor-pointer transition-colors",
            c.id === currentId
              ? "bg-info/10 ring-1 ring-info/40"
              : "hover:bg-muted/50"
          )}
        >
          <input
            type="radio"
            name="candidate"
            checked={c.id === currentId}
            onChange={() => onPick(c.id)}
            className="accent-info"
          />
          {onZoom ? (
            <button
              type="button"
              aria-label={`Zoom ${c.cardCode}`}
              onClick={(e) => {
                e.preventDefault();
                onZoom(c);
              }}
              className="tap-safe cursor-zoom-in rounded-sm"
            >
              <CardThumb src={c.imageUrl} />
            </button>
          ) : (
            <CardThumb src={c.imageUrl} />
          )}
          <div className="min-w-0">
            <p className="font-mono text-xs font-bold">{c.cardCode}</p>
            <p className="text-meta truncate">
              {c.nameJp}
            </p>
            <RarityBadge rarity={c.rarity} size="sm" />
          </div>
        </label>
      ))}
    </div>
  );
}
