"use client";

import { ArrowRight, Check, Loader2, Sparkles, Undo2, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatJpy } from "@/lib/utils/currency";
import { RarityBadge } from "@/components/shared/rarity-badge";
import {
  relativeTime,
  StatusBadge,
  CardThumb,
  CandidatePicker,
} from "@/components/admin/matching-ui";
import type { Mapping, MappingCard } from "./yuyutei-types";
import { METHOD_INFO, yuyuHd } from "./yuyutei-types";

interface MatchRowProps {
  m: Mapping;
  showStatus: boolean;
  isChecked: boolean;
  isSaving: boolean;
  isAiProcessing: boolean;
  effectiveCardId: number | null;
  onToggle: (id: number, shiftKey: boolean) => void;
  onApprove: (mappingId: number, cardId: number) => void;
  onUnmatch: (mappingId: number) => void;
  onReject: (mappingId: number) => void;
  onAiSuggest: (mappingId: number) => void;
  onPickCandidate: (mappingId: number, cardId: number) => void;
  onLightbox: (m: Mapping, card?: MappingCard) => void;
}

export function YuyuteiMatchRow({
  m,
  showStatus,
  isChecked,
  isSaving,
  isAiProcessing,
  effectiveCardId,
  onToggle,
  onApprove,
  onUnmatch,
  onReject,
  onAiSuggest,
  onPickCandidate,
  onLightbox,
}: MatchRowProps) {
  const isMatched = m.status === "matched" && m.matchedCard;
  const isSuggested = m.status === "suggested" && m.matchedCardId;
  const suggestedCard = isSuggested
    ? m.candidates.find((c) => c.id === m.matchedCardId) ?? m.matchedCard
    : null;

  return (
    <tr
      className={cn(
        "border-b border-hair motion-base group",
        "hover:bg-muted/70",
        isChecked && "!bg-primary/[0.06]",
        !isChecked && m.status === "suggested" && "bg-info/[0.02]",
        !isChecked && m.status === "pending" && "bg-warning/[0.02]",
        !isChecked && m.status === "matched" && "bg-success/[0.02]",
        m.status === "rejected" && "opacity-40",
      )}
    >
      {/* Checkbox */}
      <td
        className="px-3 py-3 text-center cursor-pointer"
        onClick={(e) => onToggle(m.id, e.shiftKey)}
      >
        <input
          type="checkbox"
          checked={isChecked}
          readOnly
          className="accent-primary size-3.5 pointer-events-none"
        />
      </td>

      {/* Status (conditional) */}
      {showStatus && (
        <td className="px-3 py-3">
          <StatusBadge status={m.status} />
        </td>
      )}

      {/* Yuyutei listing */}
      <td className="px-3 py-3">
        <div className="flex items-center gap-3">
          <div
            role="button"
            tabIndex={0}
            onClick={() =>
              onLightbox(
                m,
                isMatched
                  ? m.matchedCard!
                  : suggestedCard ?? undefined,
              )
            }
            onKeyDown={(e) => {
              if (e.key === "Enter")
                onLightbox(
                  m,
                  isMatched
                    ? m.matchedCard!
                    : suggestedCard ?? undefined,
                );
            }}
            className="cursor-zoom-in hover:opacity-80 motion-base"
            title="คลิกเพื่อขยายรูปภาพ"
          >
            <CardThumb src={yuyuHd(m.scrapedImage)} size="md" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="font-mono text-xs font-bold">
                {m.scrapedCode}
              </span>
              {m.scrapedRarity && (
                <RarityBadge rarity={m.scrapedRarity} size="sm" />
              )}
            </div>
            <p
              className="text-meta truncate max-w-[180px]"
              title={m.scrapedName}
            >
              {m.scrapedName}
            </p>
            <p className="text-xs text-muted-foreground/50 font-mono">
              {m.setCode.toUpperCase()} · {m.yuyuteiId}
            </p>
          </div>
        </div>
      </td>

      {/* Arrow */}
      <td className="px-1 py-3 text-center">
        <ArrowRight className="size-3.5 text-muted-foreground/30 mx-auto" />
      </td>

      {/* DB Card Match */}
      <td className="px-3 py-3">
        {isMatched ? (
          <div className="flex items-center gap-3">
            <div
              role="button"
              tabIndex={0}
              onClick={() => onLightbox(m, m.matchedCard!)}
              onKeyDown={(e) => {
                if (e.key === "Enter") onLightbox(m, m.matchedCard!);
              }}
              className="cursor-zoom-in hover:opacity-80 ring-2 ring-success/50 rounded motion-base"
              title="คลิกเพื่อขยายรูปภาพ"
            >
              <CardThumb src={m.matchedCard!.imageUrl} size="md" />
            </div>
            <div className="min-w-0">
              <p className="font-mono text-xs font-bold text-success">
                {m.matchedCard!.cardCode}
              </p>
              <RarityBadge rarity={m.matchedCard!.rarity} size="sm" />
              <p className="text-meta truncate max-w-[120px]">
                {m.matchedCard!.nameEn ?? m.matchedCard!.nameJp}
              </p>
            </div>
          </div>
        ) : (
          <CandidatePicker
            candidates={m.candidates}
            currentId={effectiveCardId}
            onPick={(cardId) => onPickCandidate(m.id, cardId)}
            onZoom={(card) => onLightbox(m, card)}
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
            <span
              className="inline-block cursor-help rounded bg-muted px-1.5 py-0.5 font-mono text-xs text-muted-foreground"
              title={
                METHOD_INFO.find((x) => x.key === m.matchMethod)?.desc ??
                m.matchMethod
              }
            >
              {m.matchMethod}
            </span>
            {m.geminiScore != null && (
              <span
                className={cn(
                  "inline-block rounded px-1.5 py-0.5 text-xs font-bold w-fit",
                  m.geminiScore >= 0.8 && "bg-success/15 text-success",
                  m.geminiScore >= 0.5 &&
                    m.geminiScore < 0.8 &&
                    "bg-warning/15 text-warning",
                  m.geminiScore < 0.5 && "bg-danger/15 text-danger",
                )}
              >
                {Math.round(m.geminiScore * 100)}%
              </span>
            )}
          </div>
        ) : (
          <span className="text-meta text-muted-foreground/50">—</span>
        )}
      </td>

      {/* Updated */}
      <td className="px-3 py-3">
        {m.actionByUser ? (
          <div className="min-w-0">
            <p
              className="text-xs font-medium truncate max-w-[120px]"
              title={m.actionByUser.email}
            >
              {m.actionByUser.displayName ||
                m.actionByUser.email.split("@")[0]}
            </p>
            <p
              className="text-meta"
              title={
                m.actionAt
                  ? new Date(m.actionAt).toLocaleString("th-TH")
                  : ""
              }
            >
              {relativeTime(m.actionAt)}
            </p>
          </div>
        ) : (
          <span className="text-meta text-muted-foreground/50">—</span>
        )}
      </td>

      {/* Actions */}
      <td className="px-3 py-3">
        <div className="flex items-center justify-center gap-1.5">
          {isSaving || isAiProcessing ? (
            <Loader2 className="size-4 animate-spin text-muted-foreground" />
          ) : isMatched ? (
            <button
              onClick={() => onUnmatch(m.id)}
              className="flex items-center gap-1 rounded-lg border border-warning/30 px-2 py-1 text-xs text-warning hover:bg-warning/10 motion-base"
              title="ยกเลิกการจับคู่"
            >
              <Undo2 className="size-3" /> ยกเลิกจับคู่
            </button>
          ) : (
            <>
              {m.scrapedImage && m.candidates.length > 0 && (
                <button
                  onClick={() => onAiSuggest(m.id)}
                  disabled={isAiProcessing}
                  className="flex items-center gap-1 rounded-lg bg-violet-600 px-2 py-1 text-xs font-semibold text-white hover:bg-violet-700 disabled:opacity-30 motion-base"
                  title="ให้ AI ช่วยจับคู่"
                >
                  <Sparkles className="size-3" /> AI
                </button>
              )}
              <button
                onClick={() => {
                  if (effectiveCardId) onApprove(m.id, effectiveCardId);
                }}
                disabled={!effectiveCardId}
                className="flex items-center gap-1 rounded-lg bg-success px-2 py-1 text-xs font-semibold text-success-foreground hover:bg-success/90 disabled:opacity-30 motion-base"
                title="อนุมัติการจับคู่"
              >
                <Check className="size-3" /> อนุมัติ
              </button>
              <button
                onClick={() => onReject(m.id)}
                className="flex items-center gap-1 rounded-lg border border-danger/30 px-2 py-1 text-xs text-danger hover:bg-danger/10 motion-base"
                title="ปฏิเสธ"
              >
                <X className="size-3" /> ปฏิเสธ
              </button>
            </>
          )}
        </div>
      </td>
    </tr>
  );
}
