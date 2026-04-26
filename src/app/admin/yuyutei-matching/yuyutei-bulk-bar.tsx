"use client";

import { Check, Loader2, Sparkles, X, XCircle } from "lucide-react";

interface BulkBarProps {
  selectedCount: number;
  aiRunning: boolean;
  bulkBusy: boolean;
  canApprove: boolean;
  onAiSuggest: () => void;
  onAiRecheck: () => void;
  onApprove: () => void;
  onReject: () => void;
  onClear: () => void;
}

export function YuyuteiBulkBar({
  selectedCount,
  aiRunning,
  bulkBusy,
  canApprove,
  onAiSuggest,
  onAiRecheck,
  onApprove,
  onReject,
  onClear,
}: BulkBarProps) {
  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 flex items-center gap-3 rounded-xl border border-border bg-popover px-5 py-3 shadow-2xl animate-in slide-in-from-bottom-4 fade-in duration-200">
      <span className="text-sm font-medium tabular-nums">
        {selectedCount} รายการที่เลือก
      </span>

      <div className="h-5 w-px bg-border" />

      <button
        onClick={onAiSuggest}
        disabled={aiRunning}
        className="flex items-center gap-1.5 rounded-lg bg-violet-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-violet-700 disabled:opacity-30 transition-colors"
      >
        {aiRunning ? (
          <Loader2 className="size-3.5 animate-spin" />
        ) : (
          <Sparkles className="size-3.5" />
        )}
        AI Suggest
      </button>

      <button
        onClick={onAiRecheck}
        disabled={aiRunning}
        className="flex items-center gap-1.5 rounded-lg border border-violet-500/40 px-3 py-1.5 text-xs font-semibold text-violet-600 hover:bg-violet-500/10 disabled:opacity-30 transition-colors"
      >
        <Sparkles className="size-3.5" /> Re-check
      </button>

      <button
        onClick={onApprove}
        disabled={bulkBusy || !canApprove}
        className="flex items-center gap-1.5 rounded-lg bg-green-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-green-700 disabled:opacity-30 transition-colors"
      >
        <Check className="size-3.5" /> Approve
      </button>

      <button
        onClick={onReject}
        disabled={bulkBusy}
        className="flex items-center gap-1.5 rounded-lg border border-red-500/30 px-3 py-1.5 text-xs font-semibold text-red-500 hover:bg-red-500/10 disabled:opacity-30 transition-colors"
      >
        <XCircle className="size-3.5" /> Reject
      </button>

      <div className="h-5 w-px bg-border" />

      <button
        onClick={onClear}
        className="rounded-md p-1 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
        aria-label="ยกเลิกการเลือก"
      >
        <X className="size-4" />
      </button>
    </div>
  );
}
