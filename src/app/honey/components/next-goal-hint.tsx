"use client";

import { Target } from "lucide-react";
import { type Language } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { localizedName } from "../types";
import type { HoneyLevel, ShopItem } from "../types";

type Variant = "inline" | "card";

/**
 * Picks the user's "next goal" — the cheapest currently-redeemable shop
 * item they don't yet have enough Honey for. Items the user can already
 * afford are filtered out; we want the hint to point forward, not at things
 * that are already in reach. If everything is reachable (or the user is
 * brand new with no eligible items) we return null and the caller skips
 * rendering the hint entirely.
 */
function pickNextGoal(
  shopItems: ShopItem[],
  points: number,
  userLevel: number,
): ShopItem | null {
  const now = Date.now();
  const candidates = shopItems
    .filter((item) => item.isActive)
    .filter((item) => (item.requiredLevel ?? 0) <= userLevel)
    .filter((item) => item.cost > points)
    .filter((item) => {
      if (!item.availableUntil) return true;
      return new Date(item.availableUntil).getTime() > now;
    })
    .filter((item) => item.stock == null || item.stock > 0);

  if (candidates.length === 0) return null;
  candidates.sort((a, b) => a.cost - b.cost);
  return candidates[0];
}

function formatGoalLine(
  lang: Language,
  itemName: string,
  remaining: number,
): string {
  const remStr = remaining.toLocaleString();
  if (lang === "TH") return `เป้าหมายต่อไป: ${itemName} • อีก ${remStr} 🍯`;
  if (lang === "JP") return `次の目標: ${itemName} • あと ${remStr} 🍯`;
  return `Next goal: ${itemName} • ${remStr} 🍯 to go`;
}

/**
 * Single-line hint pointing the user toward the cheapest still-unaffordable
 * shop item they're currently eligible for. Two variants:
 *   - `inline` — flows at the bottom of `HoneyStatusBar` as a thin pill row.
 *   - `card`   — sits in `DailyMissionsCard` between the balance and the
 *                progress strip, so the daily-mission cadence is tied to
 *                a concrete goal in the same viewport.
 */
export function NextGoalHint({
  lang,
  shopItems,
  points,
  level,
  variant = "inline",
  className,
}: {
  lang: Language;
  shopItems: ShopItem[];
  points: number;
  level: HoneyLevel | null;
  variant?: Variant;
  className?: string;
}) {
  const userLevel = level?.level ?? 0;
  const goal = pickNextGoal(shopItems, points, userLevel);
  if (!goal) return null;

  const itemName = localizedName(goal, lang);
  const remaining = Math.max(0, goal.cost - points);
  const lineText = formatGoalLine(lang, itemName, remaining);
  const ariaLabel = lang === "TH"
    ? "เป้าหมายต่อไป"
    : lang === "JP"
      ? "次の目標"
      : "Next goal";

  if (variant === "card") {
    return (
      <div
        role="note"
        aria-label={ariaLabel}
        className={cn(
          "flex items-center gap-2 border-t border-dashed border-primary/20 bg-primary/[0.02] px-5 py-2 text-xs sm:px-6",
          className,
        )}
      >
        <Target className="size-3.5 shrink-0 text-primary" />
        <span className="min-w-0 flex-1 truncate text-foreground">
          <span className="text-meta">{ariaLabel}: </span>
          <span className="font-semibold">{itemName}</span>
        </span>
        <span className="shrink-0 rounded-full bg-primary/10 px-2 py-0.5 text-xs font-bold tabular-nums text-primary">
          {remaining.toLocaleString()} 🍯
        </span>
      </div>
    );
  }

  return (
    <div
      role="note"
      aria-label={ariaLabel}
      className={cn(
        "inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/[0.04] px-3 py-1 text-xs",
        className,
      )}
    >
      <Target className="size-3.5 shrink-0 text-primary" />
      <span className="text-foreground">{lineText}</span>
    </div>
  );
}
