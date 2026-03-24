import { cn } from "@/lib/utils";

const ACCENT_RARITIES: Record<string, string> = {
  SEC: "text-amber-600 dark:text-amber-400",
  "P-SEC": "text-amber-600 dark:text-amber-400",
  SP: "text-amber-600 dark:text-amber-400",
  SR: "text-purple-600 dark:text-purple-400",
  "P-SR": "text-purple-600 dark:text-purple-400",
  R: "text-sky-600 dark:text-sky-400",
  "P-R": "text-sky-600 dark:text-sky-400",
  L: "text-red-600 dark:text-red-400",
  "P-L": "text-red-600 dark:text-red-400",
  DON: "text-orange-600 dark:text-orange-400",
};

export type RarityBadgeProps = {
  rarity: string;
  size?: "sm" | "md";
  className?: string;
};

export function RarityBadge({ rarity, size = "md", className }: RarityBadgeProps) {
  const accent = ACCENT_RARITIES[rarity];

  return (
    <span
      className={cn(
        "inline-flex items-center rounded bg-muted font-medium",
        accent ?? "text-foreground",
        size === "sm" && "px-1.5 py-0.5 text-[10px]",
        size === "md" && "px-2 py-0.5 text-[11px]",
        className
      )}
    >
      {rarity}
    </span>
  );
}
