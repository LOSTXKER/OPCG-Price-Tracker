import { Badge } from "@/components/ui/badge";
import { RARITY_MAP } from "@/lib/constants/rarities";
import { cn } from "@/lib/utils";

const DEFAULT_COLOR = "#6B7280";

function resolveRarityColor(code: string): string {
  const direct = RARITY_MAP.get(code);
  if (direct) return direct.color;
  const upper = code.toUpperCase();
  const fromUpper = RARITY_MAP.get(upper);
  if (fromUpper) return fromUpper.color;
  return DEFAULT_COLOR;
}

export type RarityBadgeProps = {
  rarity: string;
  size?: "sm" | "md";
  className?: string;
};

export function RarityBadge({
  rarity,
  size = "md",
  className,
}: RarityBadgeProps) {
  const bg = resolveRarityColor(rarity);

  return (
    <Badge
      variant="outline"
      className={cn(
        "border-0 font-semibold text-white shadow-none",
        size === "sm" && "h-5 px-1.5 text-[10px]",
        size === "md" && "h-5 px-2 text-xs",
        className
      )}
      style={{
        backgroundColor: bg,
        color: "#FFFFFF",
      }}
    >
      {rarity}
    </Badge>
  );
}
