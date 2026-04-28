"use client";

import { CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Edge-to-edge horizontal row used by every claim/list pattern on /honey:
 * daily missions, monthly missions, achievements, and one-off banners
 * (free ticket, etc.).
 *
 * The previous design wrapped every list-row icon in a 40x40 muted box;
 * that was a lot of squares to look at when a tab might render 10+ rows.
 * This row keeps the icon inline at 16px so the page reads more like a
 * list of sentences than a deck of badges.
 */
export function ClaimRow({
  icon: Icon,
  title,
  description,
  reward,
  progress,
  action,
  claimed,
  className,
}: {
  icon: React.ElementType;
  title: React.ReactNode;
  description?: React.ReactNode;
  /** Reward chips (use `<RewardChips />`) — placed below description. */
  reward?: React.ReactNode;
  /** Optional inline progress bar — placed below reward. */
  progress?: React.ReactNode;
  /** Right-side action (claim button / share button / Go link / claimed indicator). */
  action?: React.ReactNode;
  claimed?: boolean;
  className?: string;
}) {
  return (
    <div className={cn("flex items-center gap-3.5 bg-background p-4", className)}>
      <div
        className={cn(
          "flex size-8 shrink-0 items-center justify-center rounded-lg text-muted-foreground",
          claimed && "text-price-up",
        )}
      >
        {claimed ? <CheckCircle2 className="size-4.5" /> : <Icon className="size-4.5" />}
      </div>

      <div className="min-w-0 flex-1">
        <p
          className={cn(
            "text-xs font-semibold",
            claimed && "text-muted-foreground line-through",
          )}
        >
          {title}
        </p>
        {description && <p className="mt-0.5 text-meta line-clamp-1">{description}</p>}
        {reward}
        {progress}
      </div>

      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}
