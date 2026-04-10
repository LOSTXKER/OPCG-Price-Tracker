import { cn } from "@/lib/utils";

export function LimitCounter({
  current,
  max,
  className,
}: {
  current: number;
  max: number;
  className?: string;
}) {
  const isUnlimited = !isFinite(max);
  const pct = isUnlimited ? 0 : max === 0 ? 100 : (current / max) * 100;
  const isFull = pct >= 100 && !isUnlimited;
  const isHigh = pct > 80 && !isFull;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-0.5 rounded-md px-1.5 py-0.5 text-xs font-semibold tabular-nums",
        isFull
          ? "bg-destructive/10 text-destructive"
          : isHigh
            ? "bg-amber-500/10 text-amber-600 dark:text-amber-400"
            : "bg-muted text-muted-foreground",
        className,
      )}
    >
      {current}/{isUnlimited ? "∞" : max}
    </span>
  );
}
