import { Ticket } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Neutral reward chips for missions/achievements. The honey emoji + ticket
 * glyph already read as "reward", so we drop the localized "Reward:" prefix
 * to cut one element per row across ~8 daily/monthly cards. Pill backgrounds
 * stay muted so reward chips don't fight the rest of the page for attention.
 */
export function RewardChips({
  honey,
  ticket,
  muted,
  className,
}: {
  honey: number;
  ticket: number;
  muted?: boolean;
  className?: string;
}) {
  if (honey <= 0 && ticket <= 0) return null;

  return (
    <div className={cn("mt-1.5 flex items-center gap-1.5", muted && "opacity-50", className)}>
      {honey > 0 && (
        <span className="inline-flex items-center gap-1 rounded-md bg-muted/60 px-1.5 py-0.5 text-xs font-semibold text-foreground">
          <span className="text-xs leading-none">🍯</span>
          <span className="tabular-nums">x{honey}</span>
        </span>
      )}
      {ticket > 0 && (
        <span className="inline-flex items-center gap-1 rounded-md bg-muted/60 px-1.5 py-0.5 text-xs font-semibold text-foreground">
          <Ticket className="size-3" />
          <span className="tabular-nums">x{ticket}</span>
        </span>
      )}
    </div>
  );
}
