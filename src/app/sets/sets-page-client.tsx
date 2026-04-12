"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Crown,
  Gift,
  MoreHorizontal,
  Package,
  Sparkles,
  Swords,
} from "lucide-react";

import { useUIStore } from "@/stores/ui-store";
import { t } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { Price } from "@/components/shared/price-inline";
import { FormattedDate } from "@/components/shared/formatted-date";

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
  topCard: { imageUrl: string | null; latestPriceJpy: number | null } | null;
  totalValue: number;
};

const TYPE_ORDER = ["BOOSTER", "EXTRA_BOOSTER", "STARTER", "PROMO", "OTHER"];
const TYPE_LABEL: Record<string, string> = {
  BOOSTER: "Booster Pack",
  EXTRA_BOOSTER: "Extra Booster",
  STARTER: "Starter Deck",
  PROMO: "Promo",
  OTHER: "Other",
};
const TYPE_ICON: Record<string, React.ComponentType<{ className?: string }>> = {
  BOOSTER: Package,
  EXTRA_BOOSTER: Sparkles,
  STARTER: Swords,
  PROMO: Gift,
  OTHER: MoreHorizontal,
};

const ALL_TYPES = "ALL";

// ─── Header ──────────────────────────────────────────────────────────

export function SetsPageHeader({
  totalSets,
  totalMarketValue,
}: {
  totalSets: number;
  totalMarketValue: number;
}) {
  const lang = useUIStore((s) => s.language);
  return (
    <div>
      <h1 className="page-header">
        {t(lang, "setsTitle")}
      </h1>
      <p className="mt-1 text-sm text-muted-foreground">
        {t(lang, "setsDesc")}
      </p>
      <p className="mt-3 flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
        <span className="font-semibold text-foreground">
          {totalSets} {t(lang, "setCount")}
        </span>
        <span className="text-border">·</span>
        <span>
          {t(lang, "totalValueLabel")}{" "}
          <span className="font-semibold text-foreground">
            <Price jpy={totalMarketValue} />
          </span>
        </span>
      </p>
    </div>
  );
}

export function HighestValueSetLabel() {
  const lang = useUIStore((s) => s.language);
  return (
    <h2 className="text-lg font-semibold">{t(lang, "highestValueSet")}</h2>
  );
}

export function CardCountLabel({ count }: { count: number }) {
  const lang = useUIStore((s) => s.language);
  return (
    <span className="shrink-0 text-xs text-muted-foreground">
      {count} {t(lang, "cardsCount")}
    </span>
  );
}

// ─── Main list with filters ──────────────────────────────────────────

export function SetsListClient({
  sets,
  mostValuable,
}: {
  sets: SetWithCard[];
  mostValuable: SetWithCard[];
}) {
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
    for (const t of TYPE_ORDER) map.set(t, []);
    for (const s of filtered) {
      const list = map.get(s.type) ?? [];
      list.push(s);
      map.set(s.type, list);
    }
    return map;
  }, [filtered]);

  const showMostValuable = activeType === ALL_TYPES;

  return (
    <>
      {/* Type filter pills */}
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
        <button
          type="button"
          onClick={() => setActiveType(ALL_TYPES)}
          className={cn(
            "shrink-0 rounded-full px-3.5 py-1.5 text-xs font-medium transition-colors",
            activeType === ALL_TYPES
              ? "bg-primary text-primary-foreground"
              : "bg-muted text-muted-foreground hover:bg-muted/80"
          )}
        >
          All <span className="ml-1 tabular-nums opacity-70">{sets.length}</span>
        </button>
        {TYPE_ORDER.map((type) => {
          const count = typeCounts.get(type) ?? 0;
          if (count === 0) return null;
          return (
            <button
              key={type}
              type="button"
              onClick={() => setActiveType(type)}
              className={cn(
                "shrink-0 rounded-full px-3.5 py-1.5 text-xs font-medium transition-colors",
                activeType === type
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:bg-muted/80"
              )}
            >
              {TYPE_LABEL[type]} <span className="ml-1 tabular-nums opacity-70">{count}</span>
            </button>
          );
        })}
      </div>

      {/* Top 5 most valuable */}
      {showMostValuable && mostValuable.length > 0 && (
        <section className="panel overflow-hidden">
          <div className="flex items-center gap-2.5 border-b border-border/40 px-5 py-3.5">
            <div className="flex size-7 items-center justify-center rounded-lg bg-amber-500/10">
              <Crown className="size-3.5 text-amber-600 dark:text-amber-400" />
            </div>
            <HighestValueSetLabel />
          </div>
          <div className="divide-y divide-border/30">
            {mostValuable.map((s, i) => {
              const thumb = s.boxImageUrl ?? s.topCard?.imageUrl;
              return (
                <Link
                  key={s.id}
                  href={`/sets/${s.code}`}
                  className="group flex items-center gap-4 px-5 py-3.5 transition-colors hover:bg-muted/30"
                >
                  <span
                    className={`flex size-7 shrink-0 items-center justify-center rounded-full font-mono text-xs font-bold ${i < 3 ? "bg-amber-500/10 text-amber-600 dark:text-amber-400" : "bg-muted text-muted-foreground"}`}
                  >
                    {i + 1}
                  </span>
                  {thumb && (
                    <div className="relative size-10 shrink-0 overflow-hidden rounded-lg bg-muted">
                      <Image
                        src={thumb}
                        alt=""
                        fill
                        className="object-contain"
                        sizes="40px"
                      />
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="shrink-0 rounded bg-primary/10 px-1.5 py-0.5 font-mono text-xs font-bold text-primary">
                        {s.code.toUpperCase()}
                      </span>
                      <span className="truncate text-sm font-medium transition-colors group-hover:text-primary">
                        {s.nameEn ?? s.name}
                      </span>
                    </div>
                  </div>
                  <CardCountLabel count={s.productCardCount} />
                  <span className="shrink-0 font-price text-sm font-bold tabular-nums">
                    <Price jpy={s.totalValue} />
                  </span>
                </Link>
              );
            })}
          </div>
        </section>
      )}

      {/* Sets grouped by type */}
      {filtered.length === 0 ? (
        <div className="py-12 text-center text-sm text-muted-foreground">
          {t(lang, "noCardsFound")}
        </div>
      ) : (
        <div className="space-y-12">
          {TYPE_ORDER.map((type) => {
            const list = grouped.get(type) ?? [];
            if (list.length === 0) return null;
            const TypeIcon = TYPE_ICON[type];
            return (
              <section key={type} className="space-y-5">
                <div className="flex items-center gap-3">
                  <div className="flex size-8 items-center justify-center rounded-lg bg-primary/10">
                    <TypeIcon className="size-4 text-primary" />
                  </div>
                  <h2 className="text-lg font-semibold tracking-tight">
                    {TYPE_LABEL[type]}
                  </h2>
                  <span className="rounded-full bg-muted px-2.5 py-0.5 text-xs font-semibold tabular-nums text-muted-foreground">
                    {list.length}
                  </span>
                </div>
                <div className="flex gap-4 overflow-x-auto pb-4 snap-x snap-mandatory scrollbar-none sm:grid sm:grid-cols-2 sm:overflow-visible sm:pb-0 sm:snap-none lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
                  {list.map((s) => (
                    <SetCard key={s.id} set={s} />
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

// ─── Compact SetCard ─────────────────────────────────────────────────

function SetCard({ set }: { set: SetWithCard }) {
  const imageUrl = set.boxImageUrl ?? set.topCard?.imageUrl;

  return (
    <Link
      href={`/sets/${set.code}`}
      className="group block w-[56vw] shrink-0 snap-start sm:w-auto sm:shrink"
    >
      <div className="panel flex h-full flex-col overflow-hidden transition-all duration-200 hover:shadow-md hover:-translate-y-0.5">
        <div className="relative aspect-[4/5] w-full overflow-hidden bg-muted/20">
          {imageUrl ? (
            <Image
              src={imageUrl}
              alt={set.nameEn ?? set.name}
              fill
              className="object-contain p-3 transition-transform duration-300 group-hover:scale-105"
              sizes="(max-width: 640px) 56vw, (max-width: 1024px) 33vw, 20vw"
            />
          ) : (
            <div className="flex h-full items-center justify-center">
              <Package className="size-10 text-muted-foreground/15" />
            </div>
          )}
        </div>

        <div className="flex flex-1 flex-col gap-1 border-t border-border/30 p-3">
          <div className="mb-0.5 flex items-center gap-2">
            <span className="shrink-0 rounded bg-primary/10 px-1.5 py-0.5 font-mono text-xs font-bold text-primary">
              {set.code.toUpperCase()}
            </span>
          </div>
          <p className="text-sm font-semibold leading-snug line-clamp-2 transition-colors group-hover:text-primary">
            {set.nameEn ?? set.name}
          </p>

          <div className="mt-auto flex items-center justify-between gap-2 pt-1.5">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <CardCountLabel count={set.productCardCount} />
              {set.releaseDate && (
                <>
                  <span className="text-border">·</span>
                  <FormattedDate
                    date={new Date(set.releaseDate)}
                    options={{ year: "numeric", month: "short" }}
                  />
                </>
              )}
            </div>
            {set.totalValue > 0 && (
              <span className="shrink-0 font-price text-xs font-semibold text-foreground">
                <Price jpy={set.totalValue} />
              </span>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}
