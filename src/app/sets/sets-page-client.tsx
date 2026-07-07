"use client";

import { useMemo, useState } from "react";

import { useUIStore } from "@/stores/ui-store";
import { t } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { AdSlot } from "@/components/ads/ad-slot";
import { PageHeader } from "@/components/layout/page-header";
import { SectionHead } from "@/components/shared/section-head";
import { EmptyState } from "@/components/shared/empty-state";
import { SetPosterTile } from "@/components/sets/set-poster-tile";

export type SetWithCard = {
  id: number;
  code: string;
  name: string;
  nameEn: string | null;
  type: string;
  cardCount: number;
  productCardCount: number;
  releaseDate: string | null;
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

// ─── Header ──────────────────────────────────────────────────────────

export function SetsPageHeader() {
  const lang = useUIStore((s) => s.language);
  return (
    <PageHeader title={t(lang, "setsTitle")} description={t(lang, "setsDesc")} />
  );
}

// ─── Main list with filter ───────────────────────────────────────────

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
      {/* Type filter — horizontal scrollable tab bar. Static (not sticky): it
          scrolls away with the page instead of floating over the grid. */}
      <div className="no-sb -mx-5 flex items-center gap-1 overflow-x-auto border-b border-hair px-5 sm:mx-0 sm:px-0">
        {filterOptions.map((opt) => {
          const active = activeType === opt.value;
          return (
            <button
              key={opt.value}
              type="button"
              onClick={() => setActiveType(opt.value)}
              aria-pressed={active}
              className={cn(
                "ease-chrome relative -mb-px shrink-0 border-b-2 px-2.5 py-2.5 text-xs font-semibold transition-colors",
                active
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              )}
            >
              {opt.label}
              <span
                className={cn(
                  "ml-1.5 tabular-nums",
                  active ? "text-primary/60" : "text-muted-foreground/60"
                )}
              >
                {opt.count}
              </span>
            </button>
          );
        })}
      </div>

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
                    title={TYPE_LABEL[type]!}
                    action={
                      <span className="text-meta tabular-nums">
                        {list.length}
                      </span>
                    }
                  />
                )}

                <div className="grid grid-cols-3 gap-x-3 gap-y-4 sm:grid-cols-4 lg:grid-cols-6 xl:grid-cols-7">
                  {list.map((s) => (
                    <SetCard key={s.id} set={s} />
                  ))}
                </div>

                {idx === 0 && (
                  <AdSlot placement="browse-in-feed" className="mt-6 py-2.5" />
                )}
              </section>
            );
          })}
        </div>
      )}
    </>
  );
}

// ─── Set card (poster tile — art-forward, floats on canvas) ──────────

function SetCard({ set }: { set: SetWithCard }) {
  const lang = useUIStore((s) => s.language);
  return (
    <SetPosterTile
      code={set.code}
      displayName={set.nameEn ?? set.name}
      imageUrl={set.boxImageUrl ?? set.topCard?.imageUrl}
      showCount
      count={set.productCardCount}
      countLabel={t(lang, "cardsCount")}
    />
  );
}
