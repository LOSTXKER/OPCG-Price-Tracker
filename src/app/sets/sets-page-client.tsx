"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Package } from "lucide-react";

import { useUIStore } from "@/stores/ui-store";
import { t } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { Price } from "@/components/shared/price-inline";
import { Surface } from "@/components/ui/surface";
import { AdSlot } from "@/components/ads/ad-slot";
import { PageHeader } from "@/components/layout/page-header";
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

const ALL_TYPES = "ALL";

// ─── Header ──────────────────────────────────────────────────────────

export function SetsPageHeader() {
  const lang = useUIStore((s) => s.language);
  return (
    <PageHeader
      title={t(lang, "setsTitle")}
      description={t(lang, "setsDesc")}
    />
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
      {/* Filter rail — ghost pills, sticky under app header */}
      <div className="sticky top-14 z-10 -mx-4 bg-background/85 px-4 backdrop-blur supports-[backdrop-filter]:bg-background/70 sm:mx-0 sm:px-0">
        <div className="flex gap-2 overflow-x-auto py-2 scrollbar-none">
          <FilterPill
            active={activeType === ALL_TYPES}
            onClick={() => setActiveType(ALL_TYPES)}
            label="All"
            count={sets.length}
          />
          {TYPE_ORDER.map((type) => {
            const count = typeCounts.get(type) ?? 0;
            if (count === 0) return null;
            return (
              <FilterPill
                key={type}
                active={activeType === type}
                onClick={() => setActiveType(type)}
                label={TYPE_LABEL[type]}
                count={count}
              />
            );
          })}
        </div>
      </div>

      {/* Top 5 most valuable — visual featured rail (box art + rank badge) */}
      {showMostValuable && mostValuable.length > 0 && (
        <section className="space-y-4">
          <div className="flex items-baseline gap-3 border-b border-[var(--p-hair)] pb-2">
            <h2 className="text-h2">{t(lang, "highestValueSet")}</h2>
            <span className="text-meta tabular-nums">Top 5</span>
          </div>
          <div className="grid grid-cols-2 gap-x-4 gap-y-6 sm:grid-cols-3 lg:grid-cols-5">
            {mostValuable.map((s, i) => (
              <SetTile key={s.id} set={s} rank={i + 1} />
            ))}
          </div>
        </section>
      )}

      {/* In-feed ad (FREE users only; collapses otherwise) */}
      <AdSlot placement="browse-in-feed" className="aspect-[6/1] sm:aspect-[12/1]" />

      {/* Sets grouped by type */}
      {filtered.length === 0 ? (
        <EmptyState variant="dashed" title={t(lang, "noCardsFound")} />
      ) : (
        <div className="space-y-12">
          {TYPE_ORDER.map((type) => {
            const list = grouped.get(type) ?? [];
            if (list.length === 0) return null;
            return (
              <section key={type} className="space-y-4">
                <div className="flex items-baseline gap-3 border-b border-[var(--p-hair)] pb-2">
                  <h2 className="text-h2">{TYPE_LABEL[type]}</h2>
                  <span className="text-meta tabular-nums">{list.length}</span>
                </div>
                <div className="grid grid-cols-2 gap-x-4 gap-y-6 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
                  {list.map((s) => (
                    <SetTile key={s.id} set={s} />
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

// ─── Ghost filter pill ───────────────────────────────────────────────

function FilterPill({
  active,
  onClick,
  label,
  count,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  count: number;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "shrink-0 rounded-full border px-3 py-1.5 text-xs font-medium ease-chrome transition-colors",
        active
          ? "border-foreground bg-foreground text-background"
          : "border-[var(--p-hair)] bg-transparent text-foreground hover:bg-muted"
      )}
    >
      {label}
      <span
        className={cn(
          "ml-1.5 tabular-nums",
          active ? "text-background/70" : "text-muted-foreground"
        )}
      >
        {count}
      </span>
    </button>
  );
}

// ─── Branded placeholder for image-less sets (no box art / top card) ──
// A warm gradient + the set code so an imageless set reads as intentional,
// not a broken grey box (older Starter Decks rarely ship box art).

function SetPlaceholder({ code }: { code: string }) {
  return (
    <div className="flex aspect-[4/5] flex-col items-center justify-center gap-2 bg-gradient-to-br from-foreground/[0.08] via-foreground/[0.03] to-transparent">
      <Package className="size-7 text-muted-foreground/25" />
      <span className="text-eyebrow text-muted-foreground/55">{code.toUpperCase()}</span>
    </div>
  );
}

// ─── Shared SetTile ──────────────────────────────────────────────────
// ONE tile for both the featured rail and the per-type grids (pass `rank`
// to show a badge). Keep all set-card visuals here so every set surface
// stays identical and easy to evolve.

function SetTile({ set, rank }: { set: SetWithCard; rank?: number }) {
  const lang = useUIStore((s) => s.language);
  const imageUrl = set.boxImageUrl ?? set.topCard?.imageUrl;

  return (
    <Surface
      as={Link}
      variant="outline"
      interactive
      href={`/sets/${set.code}`}
      className="group block overflow-hidden ease-chrome transition-colors"
    >
      <div className="relative overflow-hidden border-b border-[var(--p-hair)] bg-muted/20">
        {rank != null && (
          <span
            className={cn(
              "absolute left-2 top-2 z-10 flex size-6 items-center justify-center rounded-full text-xs font-bold tabular-nums",
              rank === 1
                ? "bg-primary text-primary-foreground"
                : "bg-background/80 text-foreground ring-1 ring-[var(--p-hair)] backdrop-blur"
            )}
          >
            {rank}
          </span>
        )}
        {imageUrl ? (
          <Image
            src={imageUrl}
            alt={set.nameEn ?? set.name}
            width={500}
            height={700}
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
            className="block h-auto w-full"
          />
        ) : (
          <SetPlaceholder code={set.code} />
        )}
      </div>

      <div className="space-y-1 p-3">
        <div className="text-meta font-mono">{set.code.toUpperCase()}</div>
        <p className="text-sm font-medium leading-snug line-clamp-2 ease-chrome transition-colors group-hover:text-foreground">
          {set.nameEn ?? set.name}
        </p>
        <div className="flex items-center justify-between gap-2 pt-1 text-meta">
          <span className="tabular-nums">
            {set.productCardCount} {t(lang, "cardsCount")}
          </span>
          {set.totalValue > 0 && (
            <span className="font-price text-xs font-semibold tabular-nums text-foreground">
              <Price jpy={set.totalValue} />
            </span>
          )}
        </div>
      </div>
    </Surface>
  );
}
