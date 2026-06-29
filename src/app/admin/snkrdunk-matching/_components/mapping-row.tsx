import { Check, ExternalLink, RefreshCw, Undo2, X } from "lucide-react";

import { cn } from "@/lib/utils";
import {
  relativeTime,
  CardThumb,
  CandidatePicker,
} from "@/components/admin/matching-ui";
import { CompactPrices, StatusBadge } from "./match-ui";
import type { Mapping } from "./types";

export function MappingRow({
  m,
  idx,
  isSaving,
  candidateId,
  isFocused,
  isSelected,
  onFocus,
  onToggleSelect,
  onPickCandidate,
  onApprove,
  onReject,
  onRefresh,
  onUnmatch,
}: {
  m: Mapping;
  idx: number;
  isSaving: boolean;
  candidateId: number | null;
  isFocused: boolean;
  isSelected: boolean;
  onFocus: () => void;
  onToggleSelect: () => void;
  onPickCandidate: (cid: number) => void;
  onApprove: () => void;
  onReject: () => void;
  onRefresh: () => void;
  onUnmatch: () => void;
}) {
  return (
    <tr
      data-row-idx={idx}
      className={cn(
        "motion-base",
        isSaving && "opacity-50",
        idx % 2 === 1 && "bg-muted/10",
        isFocused && "ring-2 ring-inset ring-primary/40 bg-primary/5",
        isSelected && !isFocused && "bg-primary/5",
        !isFocused && "hover:bg-muted/70"
      )}
      onClick={onFocus}
    >
      {/* Checkbox */}
      <td className="py-3 pl-3 pr-1">
        <input
          type="checkbox"
          checked={isSelected}
          onChange={onToggleSelect}
          className="accent-primary"
          onClick={(e) => e.stopPropagation()}
        />
      </td>

      {/* SNKRDUNK card info */}
      <td className="py-3 pl-1 pr-2">
        <div className="flex items-start gap-2.5">
          <CardThumb src={m.thumbnailUrl} />
          <div className="min-w-0">
            <p className="font-mono text-xs font-bold">
              {m.productNumber}
            </p>
            <p className="mt-0.5 text-xs leading-tight text-muted-foreground line-clamp-2">
              {m.scrapedName}
            </p>
            <a
              href={`https://snkrdunk.com/en/trading-cards/${m.snkrdunkId}`}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-1 inline-flex items-center gap-1 text-xs text-info hover:underline"
            >
              <ExternalLink className="size-2.5" />
              {m.snkrdunkId}
            </a>
          </div>
        </div>
      </td>

      {/* Prices */}
      <td className="px-2 py-3">
        <CompactPrices m={m} />
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
              <p className="text-meta truncate">
                {m.matchedCard.nameJp}
              </p>
              {m.matchMethod && (
                <span className="text-meta text-muted-foreground/60">
                  ผ่าน {m.matchMethod}
                </span>
              )}
            </div>
          </div>
        ) : m.candidates.length === 0 ? (
          <span className="inline-flex items-center rounded-md bg-muted/50 px-2 py-0.5 text-meta">
            ไม่พบการ์ดที่ตรงกัน
          </span>
        ) : (
          <CandidatePicker
            candidates={m.candidates}
            currentId={candidateId}
            onPick={onPickCandidate}
          />
        )}
      </td>

      {/* Status */}
      <td className="px-2 py-3 text-center">
        <StatusBadge status={m.status} />
        <p className="mt-1 text-meta">
          {relativeTime(m.updatedAt)}
        </p>
      </td>

      {/* Actions */}
      <td className="px-2 py-3 pr-4">
        <div className="flex items-center justify-end gap-1">
          {m.status === "matched" ? (
            <>
              <button
                onClick={onRefresh}
                disabled={isSaving}
                className="rounded-lg p-1.5 text-info hover:bg-info-soft"
                title="รีเฟรชราคา"
              >
                <RefreshCw className="size-3.5" />
              </button>
              <button
                onClick={onUnmatch}
                disabled={isSaving}
                className="rounded-lg p-1.5 text-warning hover:bg-warning-soft"
                title="ยกเลิกจับคู่"
              >
                <Undo2 className="size-3.5" />
              </button>
            </>
          ) : (
            <>
              {candidateId && (
                <button
                  onClick={onApprove}
                  disabled={isSaving}
                  className="rounded-lg p-1.5 text-success hover:bg-success-soft"
                  title="อนุมัติ"
                >
                  <Check className="size-3.5" />
                </button>
              )}
              <button
                onClick={onReject}
                disabled={isSaving}
                className="rounded-lg p-1.5 text-danger hover:bg-danger-soft"
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
}
