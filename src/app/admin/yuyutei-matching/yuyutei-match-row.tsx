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

export interface MatchRowProps {
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
              className="cursor-zoom-in hover:opacity-80 ring-2 ring-success/50 rounded-sm motion-base"
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
              className="inline-block cursor-help rounded-sm bg-muted px-1.5 py-0.5 font-mono text-xs text-muted-foreground"
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
                  "inline-block rounded-sm px-1.5 py-0.5 text-xs font-bold w-fit",
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

export function YuyuteiMatchCard({
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
    <article
      className={cn(
        "space-y-4 p-4 motion-base",
        isChecked && "bg-primary/[0.06]",
        !isChecked && m.status === "suggested" && "bg-info/[0.02]",
        !isChecked && m.status === "pending" && "bg-warning/[0.02]",
        !isChecked && m.status === "matched" && "bg-success/[0.02]",
        m.status === "rejected" && "opacity-60",
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <label className="flex min-h-11 cursor-pointer items-center gap-3">
          <input
            type="checkbox"
            checked={isChecked}
            onChange={() => onToggle(m.id, false)}
            className="size-4 accent-primary"
            aria-label={`เลือก ${m.scrapedCode}`}
          />
          <span className="text-eyebrow">รายการ Yuyutei</span>
        </label>
        {showStatus && <StatusBadge status={m.status} />}
      </div>

      <div className="flex items-start gap-3">
        <button
          type="button"
          onClick={() =>
            onLightbox(
              m,
              isMatched ? m.matchedCard! : suggestedCard ?? undefined,
            )
          }
          className="shrink-0 cursor-zoom-in rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          aria-label={`ขยายรูป ${m.scrapedCode}`}
        >
          <CardThumb src={yuyuHd(m.scrapedImage)} size="md" />
        </button>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="font-mono text-sm font-bold">
              {m.scrapedCode}
            </span>
            {m.scrapedRarity && (
              <RarityBadge rarity={m.scrapedRarity} size="sm" />
            )}
          </div>
          <p className="text-body-sm text-muted-foreground">
            {m.scrapedName}
          </p>
          <p className="text-meta font-mono">
            {m.setCode.toUpperCase()} · {m.yuyuteiId}
          </p>
          <p className="mt-2 font-mono text-sm font-bold text-primary">
            {formatJpy(m.priceJpy)}
          </p>
        </div>
      </div>

      <div className="space-y-2 border-t border-hair pt-4">
        <p className="text-eyebrow">การ์ดในฐานข้อมูล</p>
        {isMatched ? (
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => onLightbox(m, m.matchedCard!)}
              className="shrink-0 cursor-zoom-in rounded-sm ring-2 ring-success/50 focus-visible:outline-none focus-visible:ring-ring"
              aria-label={`ขยายรูป ${m.matchedCard!.cardCode}`}
            >
              <CardThumb src={m.matchedCard!.imageUrl} size="md" />
            </button>
            <div className="min-w-0">
              <p className="font-mono text-sm font-bold text-success">
                {m.matchedCard!.cardCode}
              </p>
              <RarityBadge rarity={m.matchedCard!.rarity} size="sm" />
              <p className="text-meta truncate">
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
      </div>

      <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 border-t border-hair pt-3">
        <dt className="text-meta">วิธีจับคู่</dt>
        <dd className="text-right text-body-sm">
          {m.matchMethod ? (
            <>
              <span className="font-mono">{m.matchMethod}</span>
              {m.geminiScore != null && (
                <span className="ml-2 font-mono text-muted-foreground">
                  {Math.round(m.geminiScore * 100)}%
                </span>
              )}
            </>
          ) : (
            "—"
          )}
        </dd>
        <dt className="text-meta">อัปเดตล่าสุด</dt>
        <dd className="text-right text-body-sm">
          {m.actionByUser ? (
            <>
              {m.actionByUser.displayName ||
                m.actionByUser.email.split("@")[0]}
              <span className="ml-2 text-meta">{relativeTime(m.actionAt)}</span>
            </>
          ) : (
            "—"
          )}
        </dd>
      </dl>

      <div className="flex flex-wrap items-center justify-end gap-2 border-t border-hair pt-3">
        {isSaving || isAiProcessing ? (
          <span className="inline-flex min-h-11 items-center gap-2 text-meta" role="status">
            <Loader2 className="size-4 animate-spin" />
            กำลังบันทึก…
          </span>
        ) : isMatched ? (
          <button
            type="button"
            onClick={() => onUnmatch(m.id)}
            className="inline-flex min-h-11 items-center gap-1.5 rounded-lg border border-warning/30 px-3 text-sm text-warning hover:bg-warning/10"
          >
            <Undo2 className="size-3.5" />
            ยกเลิกจับคู่
          </button>
        ) : (
          <>
            {m.scrapedImage && m.candidates.length > 0 && (
              <button
                type="button"
                onClick={() => onAiSuggest(m.id)}
                className="inline-flex min-h-11 items-center gap-1.5 rounded-lg bg-violet-600 px-3 text-sm font-semibold text-white hover:bg-violet-700"
              >
                <Sparkles className="size-3.5" />
                AI
              </button>
            )}
            <button
              type="button"
              onClick={() => {
                if (effectiveCardId) onApprove(m.id, effectiveCardId);
              }}
              disabled={!effectiveCardId}
              className="inline-flex min-h-11 items-center gap-1.5 rounded-lg bg-success px-3 text-sm font-semibold text-success-foreground hover:bg-success/90 disabled:opacity-30"
            >
              <Check className="size-3.5" />
              อนุมัติ
            </button>
            <button
              type="button"
              onClick={() => onReject(m.id)}
              className="inline-flex min-h-11 items-center gap-1.5 rounded-lg border border-danger/30 px-3 text-sm text-danger hover:bg-danger/10"
            >
              <X className="size-3.5" />
              ปฏิเสธ
            </button>
          </>
        )}
      </div>
    </article>
  );
}
