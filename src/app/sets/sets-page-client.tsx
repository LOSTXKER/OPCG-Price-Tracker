"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Package } from "lucide-react";

import { useUIStore } from "@/stores/ui-store";
import { t } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { AdSlot } from "@/components/ads/ad-slot";
import { PageHeader } from "@/components/layout/page-header";
import { SectionHead } from "@/components/shared/section-head";
import { EmptyState } from "@/components/shared/empty-state";

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
      <div className="no-sb -mx-5 flex items-center gap-1 overflow-x-auto border-b border-[var(--p-hair)] px-5 sm:mx-0 sm:px-0">
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
  const imageUrl = set.boxImageUrl ?? set.topCard?.imageUrl;
  const displayName = set.nameEn ?? set.name;

  return (
    <Link
      href={`/sets/${set.code}`}
      aria-label={displayName}
      className="group flex flex-col gap-2 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      <div className="surface-1 ease-chrome relative aspect-[3/4] w-full overflow-hidden rounded-lg shadow-[var(--panel-shadow)] group-lift">
        {imageUrl ? (
          <Image
            src={imageUrl}
            alt={displayName}
            fill
            sizes="(max-width: 640px) 45vw, (max-width: 1024px) 30vw, 22vw"
            className="object-cover object-top"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <Package className="size-8 text-muted-foreground/30" />
          </div>
        )}
      </div>

      <div className="min-w-0">
        {/* set code is the hero (เบส — collectors browse by OP/ST code first);
            the set name supports it underneath. */}
        <div className="flex items-baseline justify-between gap-1.5">
          <span className="text-h5 truncate text-foreground">
            {set.code.toUpperCase()}
          </span>
          <span className="text-meta shrink-0 tabular-nums">
            {set.productCardCount} {t(lang, "cardsCount")}
          </span>
        </div>
        <p className="text-meta truncate">{displayName}</p>
      </div>
    </Link>
  );
}
