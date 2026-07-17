"use client";

import Image from "next/image";
import Link from "next/link";

import { PriceTag } from "@/components/ui/price-tag";
import { BLUR_DATA_URL } from "@/lib/constants/ui";
import { DEFAULT_GAME } from "@/lib/game/constants";
import { getCardName, t } from "@/lib/i18n";
import { useUIStore } from "@/stores/ui-store";

import { WATCHLIST_MOVER_MIN_ITEMS } from "./watchlist-sort";
import {
  formatEntryThb,
  getEntryChange,
  type ChangePeriod,
  type WatchlistEntry,
} from "./watchlist-types";

/**
 * "ขยับแรงวันนี้" — the page's beauty moment: real card art of today's
 * biggest movers, ahead of the flat price-check list. `entries` is already
 * the selected/sorted mover set (see `selectWatchlistMovers` in
 * watchlist-sort.ts) — this component only owns the self-hide rule + tiles.
 */
export function WatchlistMoverShelf({
  entries,
  period,
  itemCount,
  editMode,
}: {
  entries: WatchlistEntry[];
  period: ChangePeriod;
  /** Count over ALL watched cards (unfiltered) — the "≥4 watched" gate. */
  itemCount: number;
  editMode: boolean;
}) {
  const lang = useUIStore((s) => s.language);

  if (editMode || itemCount < WATCHLIST_MOVER_MIN_ITEMS || entries.length === 0) {
    return null;
  }

  return (
    <div>
      <p className="text-eyebrow mb-2">{t(lang, "todaysMovers")}</p>
      <div className="no-sb flex snap-x snap-mandatory gap-3 overflow-x-auto sm:grid sm:grid-cols-6 sm:gap-4 sm:overflow-visible">
        {entries.map((entry) => (
          <WatchTile key={entry.id} entry={entry} period={period} />
        ))}
      </div>
    </div>
  );
}

function WatchTile({ entry, period }: { entry: WatchlistEntry; period: ChangePeriod }) {
  const lang = useUIStore((s) => s.language);
  const displayName = getCardName(lang, entry.card);
  const change = getEntryChange(entry, period);

  return (
    <Link
      href={`/${entry.card.set.game?.slug ?? DEFAULT_GAME}/cards/${entry.card.cardCode}`}
      aria-label={displayName}
      className="group w-[92px] shrink-0 snap-start rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:w-full"
    >
      <div className="relative aspect-[63/88] w-full overflow-hidden rounded-xl bg-muted ring-1 ring-hair">
        {entry.card.imageUrl && (
          <Image
            src={entry.card.imageUrl}
            alt={displayName}
            fill
            sizes="92px"
            className="ease-chrome object-cover sm:motion-safe:group-hover:scale-[1.05]"
            placeholder="blur"
            blurDataURL={BLUR_DATA_URL}
          />
        )}
      </div>
      <p className="mt-1.5">
        <PriceTag change={change} changeOnly changeStyle="plain" size="sm" />
      </p>
      <p className="text-meta tabular-nums">{formatEntryThb(entry.card)}</p>
    </Link>
  );
}
