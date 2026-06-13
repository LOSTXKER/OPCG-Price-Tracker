import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export type CardCondition = "NM" | "LP" | "MP" | "HP" | "DMG" | "DAMAGED" | string;

export interface ConditionBadgeProps {
  condition: CardCondition;
  className?: string;
  /** Render a compact pill (smaller height, denser padding). */
  size?: "default" | "sm";
}

/**
 * Map: physical card grade → semantic Badge variant.
 *
 *   NM  → success (mint / pristine)
 *   LP  → info    (light play, still excellent)
 *   MP  → warning (moderate play, visible wear)
 *   HP  → danger  (heavy play, significant damage)
 *   DMG → neutral (damaged / not playable)
 *
 * Replaces `conditionStyles()` rainbow Tailwind colors (`emerald-/amber-/
 * orange-/rose-500`) in `listing-card.tsx`, `profile-listing-card.tsx`, and
 * marketplace listings — all routes now derive color from the theme tokens.
 */
export function ConditionBadge({ condition, className, size = "default" }: ConditionBadgeProps) {
  const c = condition.toUpperCase();
  const variant = mapCondition(c);

  return (
    <Badge
      variant={variant}
      className={cn(size === "sm" && "h-4 px-1.5 text-micro", className)}
    >
      {c}
    </Badge>
  );
}

function mapCondition(c: string) {
  if (c === "NM") return "success" as const;
  if (c === "LP") return "info" as const;
  if (c === "MP") return "warning" as const;
  if (c === "HP") return "danger" as const;
  if (c === "DMG" || c === "DAMAGED") return "neutral" as const;
  return "outline" as const;
}
