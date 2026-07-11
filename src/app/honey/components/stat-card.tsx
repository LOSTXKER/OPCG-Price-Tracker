"use client";

import { cn } from "@/lib/utils";
import { t, type Language } from "@/lib/i18n";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

/**
 * Single shared layout for every stat tile. The whole card is the Popover trigger
 * (a real <button>), so a separate "?" affordance is no longer needed — the card
 * is the affordance. Icons render inline at 20px without a tinted box; the four
 * cards intentionally share visual weight so they sit as a quiet status strip.
 */
export function HoneyStatCard({
  icon,
  label,
  value,
  emphasis = "default",
  detail,
  ariaLabel,
  guideContent,
}: {
  icon: React.ReactNode;
  label: string;
  value: React.ReactNode;
  /** "honey" gets the largest value font to keep brand emphasis without color tint. */
  emphasis?: "honey" | "default";
  detail?: React.ReactNode;
  ariaLabel: string;
  guideContent: React.ReactNode;
}) {
  return (
    <Popover>
      <PopoverTrigger
        render={(triggerProps) => <button type="button" {...triggerProps} aria-label={ariaLabel} />}
        className={cn(
          "panel group relative flex h-full w-full flex-col p-4 text-left",
          "cursor-pointer motion-base hover:bg-muted/70",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
        )}
      >
        <div className="flex items-center gap-2">
          <span className="flex size-5 shrink-0 items-center justify-center text-muted-foreground">
            {icon}
          </span>
          <p className="text-eyebrow">{label}</p>
        </div>

        <div className="flex flex-1 items-center py-2.5">
          <p
            className={cn(
              "tabular-nums leading-none",
              emphasis === "honey" ? "text-h1" : "text-h2",
            )}
          >
            {value}
          </p>
        </div>

        {/* Detail (lifetime earned / ticket usage / streak reward / rank
            progress) collapses below sm so the 2×2 status grid stays shallow on
            mobile and tabs sit closer to the fold. The how-to guide remains
            reachable via the card popover; full detail returns at sm+. */}
        {detail && <div className="mt-auto hidden sm:block">{detail}</div>}
      </PopoverTrigger>
      <PopoverContent className="w-56 rounded-lg">
        {guideContent}
      </PopoverContent>
    </Popover>
  );
}

/**
 * Footer for the Honey stat card. Dropped the old "next goal" nudge — it
 * read like a shop upsell pinned to the user's balance. Now it quietly
 * reports how much honey they've earned across their whole account, which
 * is the most useful long-term context for the balance above it.
 */
export function HoneyCardDetail({
  lang,
  lifetimeEarned,
}: {
  lang: Language;
  lifetimeEarned: number;
}) {
  if (lifetimeEarned > 0) {
    return (
      <p className="text-meta tabular-nums">
        <span className="text-muted-foreground">
          {t(lang, "honeyLifetimeEarned")}
        </span>{" "}
        <span className="font-semibold text-foreground">
          {lifetimeEarned.toLocaleString()}
        </span>
      </p>
    );
  }

  return (
    <p className="text-meta">
      {t(lang, "honeyStartEarningToday")}
    </p>
  );
}
