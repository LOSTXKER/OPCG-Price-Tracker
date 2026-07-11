"use client";

import { Info } from "lucide-react";

import { type Language, t } from "@/lib/i18n";
import { STREAK_TIERS } from "@/lib/honey/streak";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

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

/** Click-to-open reward guide using the canonical positioned Base UI popover. */
export function StreakInfoPopover({ lang }: { lang: Language }) {
  const title = t(lang, "streakInfoTitle2");
  const tiers = streakInfoTiers(lang);
  const notes = streakInfoNotes(lang);
  const perDay = t(lang, "streakPerDaySuffix");

  return (
    <Popover>
      <PopoverTrigger
        render={
          <button
            type="button"
            aria-label={title}
            className="tap-safe inline-flex size-5 items-center justify-center rounded-full text-muted-foreground motion-base hover:bg-muted hover:text-foreground"
          />
        }
      >
        <Info className="size-3.5" />
      </PopoverTrigger>
      <PopoverContent
        aria-label={title}
        showArrow={false}
        sideOffset={8}
        className="w-[280px] border bg-card p-4"
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
      </PopoverContent>
    </Popover>
  );
}
