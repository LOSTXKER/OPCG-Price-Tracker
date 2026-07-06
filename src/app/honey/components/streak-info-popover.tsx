"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Info } from "lucide-react";

import { type Language, t } from "@/lib/i18n";
import { STREAK_TIERS } from "@/lib/honey/streak";
import { useHydrated } from "@/hooks/use-hydrated";

type StreakNote = { icon: string; text: string };

function streakInfoNotes(lang: Language): StreakNote[] {
  return [
    { icon: "🎟️", text: t(lang, "streakInfoNoteRaffleTicket") },
    { icon: "⏸️", text: t(lang, "streakInfoNoteResetWarning") },
  ];
}

type StreakTier = { range: string; reward: string };

function streakInfoTiers(lang: Language): StreakTier[] {
  return [
    { range: t(lang, "streakInfoTierRangeDays1to6"), reward: `+${STREAK_TIERS[0].reward}` },
    { range: t(lang, "streakInfoTierRangeDays7to29"), reward: `+${STREAK_TIERS[1].reward}` },
    { range: t(lang, "streakInfoTierRangeDay30Plus"), reward: `+${STREAK_TIERS[2].reward}` },
  ];
}

/**
 * Click-to-open info popover that explains the streak reward tiers as a
 * compact light-themed card. Uses local state + outside-click detection
 * instead of the shared Tooltip because:
 *   1. Tooltip's default surface is dark (bg-foreground), which fights the
 *      "soft card" page treatment when the popup is dense and reads more
 *      like a mini help card than a one-line tooltip.
 *   2. Tooltip ships a hard-coded arrow whose color can't be themed from
 *      the consumer side, leaving a dark arrow pointing at a light card.
 *
 * The popover is portaled to `document.body` because the parent streak
 * card uses `overflow-hidden` (so the inner divider doesn't bleed past
 * the rounded corners). Without the portal, the popover gets clipped by
 * the card's bounds. We measure the trigger's viewport rect on open and
 * keep it synced via scroll/resize listeners.
 */
export function StreakInfoPopover({ lang }: { lang: Language }) {
  const [open, setOpen] = useState(false);
  const mounted = useHydrated();
  const [pos, setPos] = useState<{ left: number; top: number } | null>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function updatePos() {
      if (!triggerRef.current) return;
      const rect = triggerRef.current.getBoundingClientRect();
      setPos({
        left: rect.left + rect.width / 2,
        top: rect.bottom + 8,
      });
    }
    updatePos();
    window.addEventListener("scroll", updatePos, true);
    window.addEventListener("resize", updatePos);
    return () => {
      window.removeEventListener("scroll", updatePos, true);
      window.removeEventListener("resize", updatePos);
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    function handleClickOutside(e: MouseEvent) {
      const target = e.target as Node;
      if (
        popoverRef.current && !popoverRef.current.contains(target) &&
        triggerRef.current && !triggerRef.current.contains(target)
      ) {
        setOpen(false);
      }
    }
    function handleEscape(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [open]);

  const title = t(lang, "streakInfoTitle2");
  const tiers = streakInfoTiers(lang);
  const notes = streakInfoNotes(lang);
  const perDay = t(lang, "streakPerDaySuffix");

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label={title}
        aria-expanded={open}
        className="inline-flex size-5 items-center justify-center rounded-full text-muted-foreground motion-base hover:bg-muted hover:text-foreground"
      >
        <Info className="size-3.5" />
      </button>
      {mounted && open && pos
        ? createPortal(
            <div
              ref={popoverRef}
              role="dialog"
              aria-label={title}
              className="fixed z-50 w-[280px] -translate-x-1/2 rounded-xl border bg-card p-4 shadow-lg"
              style={{ left: pos.left, top: pos.top }}
            >
              <p className="text-sm font-bold">{title}</p>
              <ul className="mt-3 flex flex-col gap-2">
                {tiers.map((tier) => (
                  <li key={tier.range} className="flex items-center justify-between gap-3">
                    <span className="text-body-sm text-foreground">{tier.range}</span>
                    <span className="inline-flex items-center gap-1 text-sm font-bold tabular-nums text-foreground">
                      {tier.reward}
                      <span aria-hidden>🍯</span>
                      <span className="text-meta font-normal">{perDay}</span>
                    </span>
                  </li>
                ))}
              </ul>
              <ul className="mt-3 flex flex-col gap-1.5 border-t pt-3">
                {notes.map((note) => (
                  <li key={note.text} className="flex items-start gap-2 text-meta">
                    <span aria-hidden className="shrink-0 leading-5">{note.icon}</span>
                    <span className="leading-5">{note.text}</span>
                  </li>
                ))}
              </ul>
            </div>,
            document.body,
          )
        : null}
    </>
  );
}
