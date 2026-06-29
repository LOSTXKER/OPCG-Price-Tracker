"use client";

import { Loader2, Sparkles, Square } from "lucide-react";
import { cn } from "@/lib/utils";
import type { AiLogEntry } from "./yuyutei-types";

interface AiPanelProps {
  log: AiLogEntry[];
  progress: { current: number; total: number } | null;
  running: boolean;
  onCancel: () => void;
  onClear: () => void;
}

export function YuyuteiAiPanel({
  log,
  progress,
  running,
  onCancel,
  onClear,
}: AiPanelProps) {
  if (log.length === 0) return null;

  return (
    <div className="rounded-xl border border-violet-500/30 bg-violet-500/5 overflow-hidden">
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-violet-500/20 bg-violet-500/10">
        <div className="flex items-center gap-2">
          <Sparkles className="size-4 text-violet-600" />
          <span className="text-sm font-semibold text-violet-700 dark:text-violet-300">
            บันทึกการจับคู่โดย AI
          </span>
          {progress && (
            <span className="text-xs text-violet-600/70 font-mono">
              [{progress.current}/{progress.total}]
            </span>
          )}
        </div>
        {running ? (
          <button
            onClick={onCancel}
            className="flex items-center gap-1 rounded-md bg-red-600 px-2.5 py-1 text-xs font-semibold text-white hover:bg-red-700 motion-base"
          >
            <Square className="size-3" /> ยกเลิก
          </button>
        ) : (
          <button
            onClick={onClear}
            className="text-xs text-violet-600/50 hover:text-violet-600 motion-base"
          >
            ล้าง
          </button>
        )}
      </div>

      {progress && (
        <div className="h-1 bg-violet-500/10">
          <div
            className="h-full bg-violet-500 motion-slow"
            style={{ width: `${(progress.current / progress.total) * 100}%` }}
          />
        </div>
      )}

      <div className="max-h-48 overflow-y-auto px-4 py-2 font-mono text-xs space-y-0.5">
        {log.map((entry, i) => (
          <div key={i} className="flex items-center gap-2">
            {entry.result === "processing" ? (
              <Loader2 className="size-3 animate-spin text-violet-500 shrink-0" />
            ) : entry.result === "ok" ? (
              <span className="text-green-500 shrink-0">&#10003;</span>
            ) : entry.result === "skip" ? (
              <span className="text-muted-foreground shrink-0">&#8212;</span>
            ) : (
              <span className="text-red-500 shrink-0">&#10007;</span>
            )}
            <span
              className={cn(
                "font-bold min-w-[80px]",
                entry.result === "ok" && "text-green-600",
                entry.result === "fail" && "text-red-500",
                entry.result === "processing" && "text-violet-600",
                entry.result === "skip" && "text-muted-foreground",
              )}
            >
              {entry.code}
            </span>
            <span className="text-muted-foreground">{entry.msg}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
