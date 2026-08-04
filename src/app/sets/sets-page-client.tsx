"use client";

import { useMemo, useState } from "react";

import { useUIStore } from "@/stores/ui-store";
import { t } from "@/lib/i18n";
import { setTypeHeading } from "@/lib/seo/copy/sets";
import { SectionHead } from "@/components/shared/section-head";
import { EmptyState } from "@/components/shared/empty-state";
import { SetPosterTile } from "@/components/sets/set-poster-tile";
import { SegmentedControl } from "@/components/ui/segmented-control";

export type SetWithCard = {
  id: number;
  code: string;
  name: string;
  nameEn: string | null;
  type: string;
  cardCount: number;
  productCardCount: number;
  releaseDate: string | null;
  /** Pre-formatted release month from the server (deterministic, no re-format
   *  on the client) — shown on the tile so the grid carries a real date signal. */
  releaseLabel: string | null;
  boxImageUrl: string | null;
  topCard: { imageUrl: string | null } | null;
  boxPriceJpy: number | null;
};

const TYPE_ORDER = ["BOOSTER", "EXTRA_BOOSTER", "STARTER", "PROMO", "OTHER"];
const TYPE_LABEL: Record<string, string> = {
  BOOSTER: "Booster Pack",
  EXTRA_BOOSTER: "Extra Booster",
  STARTER: "Starter Deck",
  PROMO: "Promo",
  OTHER: "Other",
};

const ALL_TYPES = "ALL";

export type SetTypeFilterOption = {
  value: string;
  label: string;
  count: number;
};

export function SetTypeFilter({
  options,
  value,
  onChange,
  ariaLabel,
}: {
  options: SetTypeFilterOption[];
  value: string;
  onChange: (value: string) => void;
  ariaLabel: string;
}) {
  return (
    <div className="no-sb -mx-5 overflow-x-auto px-5 sm:mx-0 sm:px-0">
      <SegmentedControl
        options={options.map((option) => ({
          value: option.value,
          label: option.label,
          badge: (
            <span className="rounded-full bg-background/70 px-1.5 text-micro tabular-nums text-current opacity-70">
              {option.count}
            </span>
          ),
        }))}
        value={value}
        onChange={onChange}
        ariaLabel={ariaLabel}
        size="sm"
        compactVisual
        className="w-max shrink-0"
      />
    </div>
  );
}

// ─── Main list with filter ───────────────────────────────────────────
// (The page header is rendered on the SERVER — see src/app/sets/page.tsx — so
//  the H1 with the target keyword is in the first HTML response.)

export function SetsListClient({ sets }: { sets: SetWithCard[] }) {
  const lang = useUIStore((s) => s.language);
  const [activeType, setActiveType] = useState<string>(ALL_TYPES);

  const typeCounts = useMemo(() => {
    const map = new Map<string, number>();
    for (const s of sets) map.set(s.type, (map.get(s.type) ?? 0) + 1);
    return map;
  }, [sets]);

  const filtered = useMemo(() => {
    if (activeType === ALL_TYPES) return sets;
    return sets.filter((s) => s.type === activeType);
  }, [sets, activeType]);

  const grouped = useMemo(() => {
    const map = new Map<string, SetWithCard[]>();
    for (const type of TYPE_ORDER) map.set(type, []);
    for (const s of filtered) {
      const list = map.get(s.type) ?? [];
      list.push(s);
      map.set(s.type, list);
    }
    return map;
  }, [filtered]);

  const visibleTypes = useMemo(
    () => TYPE_ORDER.filter((type) => (grouped.get(type)?.length ?? 0) > 0),
    [grouped]
  );

  const filterOptions = useMemo(
    () => [
      { value: ALL_TYPES, label: t(lang, "allTab"), count: sets.length },
      ...TYPE_ORDER.filter((type) => (typeCounts.get(type) ?? 0) > 0).map(
        (type) => ({
          value: type,
          label: TYPE_LABEL[type]!,
          count: typeCounts.get(type) ?? 0,
        })
      ),
    ],
    [sets.length, typeCounts, lang]
  );

  // When a single type is active, the tab already names it — the per-section
  // heading would just duplicate it, so only show headings in the "All" view.
  const showSectionHeads = activeType === ALL_TYPES;

  return (
    <>
      {/* Type filter — canonical single-choice rail. Static (not sticky): it
          scrolls away with the page and remains horizontally scrollable. */}
      <SetTypeFilter
        options={filterOptions}
        value={activeType}
        onChange={setActiveType}
        ariaLabel={`${t(lang, "filter")} ${t(lang, "setsTitle")}`}
      />

      {visibleTypes.length === 0 ? (
        <EmptyState variant="plain" title={t(lang, "noCardsFound")} />
      ) : (
        <div className="space-y-8">
          {visibleTypes.map((type, idx) => {
            const list = grouped.get(type) ?? [];
            return (
              <section key={type}>
                {showSectionHeads && (
                  <SectionHead
                    // Thai gloss next to the English type name — "บูสเตอร์
                    // (Booster Pack)" — so the section headings carry Thai
                    // keywords instead of English-only labels.
                    title={setTypeHeading(lang, type)}
                    action={
                      <span className="text-meta tabular-nums">
                        {list.length}
                      </span>
                    }
                  />
                )}

                <div className="grid grid-cols-3 gap-x-3 gap-y-4 sm:grid-cols-4 lg:grid-cols-6 xl:grid-cols-7">
                  {list.map((s, setIndex) => (
                    <SetCard
                      key={s.id}
                      set={s}
                      preload={idx === 0 && setIndex === 0}
                    />
                  ))}
                </div>
              </section>
            );
          })}
        </div>
      )}
    </>
  );
}

// ─── Set card (poster tile — art-forward, floats on canvas) ──────────

function SetCard({
  set,
  preload = false,
}: {
  set: SetWithCard;
  preload?: boolean;
}) {
  const lang = useUIStore((s) => s.language);
  return (
    <SetPosterTile
      code={set.code}
      displayName={set.nameEn ?? set.name}
      imageUrl={set.boxImageUrl ?? set.topCard?.imageUrl}
      showCount
      count={set.productCardCount}
      countLabel={t(lang, "cardsCount")}
      releaseLabel={set.releaseLabel}
      preload={preload}
    />
  );
}
