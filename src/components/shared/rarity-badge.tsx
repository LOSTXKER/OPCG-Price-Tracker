import { cn } from "@/lib/utils";
import { RARITY_BADGE_ACCENT } from "@/lib/constants/rarity";

export type RarityBadgeProps = {
  rarity: string;
  size?: "sm" | "md";
  className?: string;
};

export function RarityBadge({ rarity, size = "md", className }: RarityBadgeProps) {
  const accent = RARITY_BADGE_ACCENT[rarity];

  return (
    <span
      className={cn(
        "inline-flex items-center rounded font-medium",
        accent ? `${accent.text} ${accent.bg}` : "bg-muted text-foreground",
        size === "sm" && "px-1.5 py-0.5 text-[11px]",
        size === "md" && "px-2 py-0.5 text-xs",
        className
      )}
    >
      {rarity}
    </span>
  );
}
