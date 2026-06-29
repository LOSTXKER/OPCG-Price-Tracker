"use client";

import { Award, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { RewardChips } from "./reward-chip";

/**
 * Unified bonus row used by both the daily perfect-day bonus and the
 * monthly missions bonus. Renders inside the parent missions card (above
 * the task grid) so users see the goal of completing all tasks before
 * scanning the list, instead of scrolling past the grid to find an
 * orphaned bonus card below.
 *
 * The component renders without its own border/radius — the parent card
 * provides those — and uses `border-b` to separate itself from the task
 * grid that follows.
 */
export function BonusRow({
  title,
  completed,
  total,
  honey,
  ticket = 0,
  claimed,
  action,
  className,
}: {
  title: React.ReactNode;
  completed: number;
  total: number;
  honey: number;
  ticket?: number;
  claimed: boolean;
  action: React.ReactNode;
  className?: string;
}) {
  const pct = total > 0 ? Math.min(100, Math.round((completed / total) * 100)) : 0;

  return (
    <div
      className={cn(
        "flex items-center gap-3.5 border-b bg-muted/30 p-3.5",
        className,
      )}
    >
      <div
        className={cn(
          "flex size-9 shrink-0 items-center justify-center rounded-lg",
          claimed ? "text-price-up" : "text-primary",
        )}
      >
        {claimed ? <CheckCircle2 className="size-5" /> : <Award className="size-5" />}
      </div>

      <div className="min-w-0 flex-1">
        <p className="text-xs font-semibold">
          {title}
          <span className="ml-1.5 text-xs font-semibold tabular-nums text-muted-foreground">
            ({completed}/{total})
          </span>
        </p>
        <RewardChips honey={honey} ticket={ticket} muted={claimed} />
        {!claimed && (
          <div className="mt-1.5 h-1 overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-primary/80 motion-base"
              style={{ width: `${pct}%` }}
            />
          </div>
        )}
      </div>

      <div className="shrink-0">{action}</div>
    </div>
  );
}
