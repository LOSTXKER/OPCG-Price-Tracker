import Image from "next/image";
import Link from "next/link";
import { Crown, Package } from "lucide-react";

import { Price } from "@/components/shared/price-inline";
import { PriceUsd } from "@/components/shared/price-usd";
import { FormattedDate } from "@/components/shared/formatted-date";
import { DropRateDialog } from "@/app/sets/[setCode]/set-page-client";
import { getCardName, t, type Language } from "@/lib/i18n";
import type {
  CardData,
  RarityGroup,
} from "@/components/sets/set-detail-content";
import {
  GRADE_TIER_BY_KEY,
  getGradePriceValue,
  type GradeKey,
  type GradePriceValue,
} from "@/lib/pricing/grade-tiers";

export type SetHighestGradeCard = {
  card: CardData;
  price: GradePriceValue;
};

/** Resolve the set-wide leader within one grade without mixing JPY and USD. */
export function getSetHighestGradeCard(
  groups: RarityGroup[],
  grade: GradeKey,
): SetHighestGradeCard | null {
  let highest: SetHighestGradeCard | null = null;

  for (const card of groups.flatMap((group) => group.cards)) {
    const price = getGradePriceValue(
      {
        rawPriceJpy: card.latestPriceJpy,
        psa10PriceUsd: card.psa10PriceUsd,
      },
      grade,
    );
    if (!price) continue;
    if (!highest || price.amount > highest.price.amount) {
      highest = { card, price };
    }
  }

  return highest;
}

export interface SetHeroProps {
  lang: Language;
  code: string;
  name: string;
  type: string;
  releaseDate: Date | string | null;
  boxImage: string | null;
  cardCount: number;
  rarityGroups: RarityGroup[];
  packsPerBox: number | null;
  cardsPerPack: number | null;
  hasDropRates: boolean;
  grade: GradeKey;
}

/**
 * Set hero — identity-led (not a financial dashboard): the box art is the ONE
 * saturated anchor (chrome stays espresso-neutral) lit by the warm overhead glow
 * the page renders above it; the OP code is the hero, with the set name + a calm
 * stat line (count · avg · top card) supporting it. (VISION §1 card-is-hero · §4
 * restraint — depth by light, not shadow.)
 */
export function SetHero({
  lang,
  code,
  name,
  type,
  releaseDate,
  boxImage,
  cardCount,
  rarityGroups,
  packsPerBox,
  cardsPerPack,
  hasDropRates,
  grade,
}: SetHeroProps) {
  const highest = getSetHighestGradeCard(rarityGroups, grade);
  const topCard = highest?.card ?? null;
  const tier = GRADE_TIER_BY_KEY[grade];

  return (
    <header className="relative flex flex-row items-center gap-4 sm:gap-7 lg:gap-10">
      {/* box art — the one saturated element (lit by the page's overhead glow).
          Row layout (card left, identity right) at every width. Sized tall enough
          that the art reaches down past the stat line to the drop-rate (เบส). */}
      {/* On phones the card self-stretches to the identity column's height so the
          art reaches the drop-rate (เบส); on sm+ it's the fixed-aspect poster. */}
      <div className="surface-1 relative w-40 shrink-0 self-stretch overflow-hidden rounded-xl sm:aspect-[3/4] sm:w-52 sm:self-center lg:w-60">
        {boxImage ? (
          <Image
            src={boxImage}
            alt={name}
            fill
            className="object-cover object-top"
            sizes="(min-width: 1024px) 240px, (min-width: 640px) 208px, 160px"
            preload
          />
        ) : (
          <div className="flex h-full items-center justify-center">
            <Package className="size-8 text-muted-foreground/30" />
          </div>
        )}
      </div>

      {/* identity — OP code is the hero */}
      <div className="min-w-0 flex-1">
        <p className="text-eyebrow">
          {type}
          {releaseDate && (
            <>
              {" · "}
              <FormattedDate
                date={releaseDate}
                options={{ year: "numeric", month: "short" }}
              />
            </>
          )}
        </p>
        {/* One visible H1 carrying BOTH the set code and the set name — the
            code keeps the display weight, the name sits on its own line inside
            the same heading (Google reads "OP01 Romance Dawn"). */}
        <h1 className="mt-1.5">
          <span className="text-display block text-foreground">
            {code.toUpperCase()}
          </span>
          {/* The two lines are separate blocks, so without this the heading's
              text content reads "OP01Romance Dawn" to crawlers and screen
              readers. Visually nothing changes. */}
          <span className="sr-only"> — </span>
          <span className="text-h3 mt-0.5 block font-normal text-muted-foreground">
            {name}
          </span>
        </h1>

        {/* calm stat line — count · top card (เบส: avg price dropped) */}
        <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2.5">
          <Stat label={t(lang, "card")}>
            <span className="tnum">{cardCount.toLocaleString()}</span>
          </Stat>

          {topCard && (
            <>
              <span
                aria-hidden
                className="hidden h-4 w-px bg-hair sm:block"
              />
              <Link
                href={`/opcg/cards/${topCard.cardCode}`}
                className="group ease-chrome -mx-1.5 flex items-center gap-2 rounded-lg px-1.5 py-1 transition-colors hover:bg-muted/60"
              >
                <span className="surface-1 relative aspect-[63/88] w-7 shrink-0 overflow-hidden rounded-sm">
                  {topCard.imageUrl ? (
                    <Image
                      src={topCard.imageUrl}
                      alt={getCardName(lang, topCard)}
                      fill
                      className="object-contain"
                      sizes="28px"
                    />
                  ) : (
                    <Crown className="absolute inset-0 m-auto size-3 text-muted-foreground/30" />
                  )}
                </span>
                <span className="flex flex-col leading-tight">
                  <span className="text-meta flex items-center gap-1">
                    <Crown className="size-3 text-primary" />
                    {t(lang, "highestValue")} · {tier.label}
                  </span>
                  <span className="text-price tnum inline-flex flex-wrap items-baseline gap-1 text-foreground group-hover:text-primary">
                    {highest?.price.currency === "USD" ? (
                      <PriceUsd usd={highest.price.amount} />
                    ) : (
                      <Price
                        jpy={highest?.price.amount ?? 0}
                        thb={topCard.latestPriceThb}
                      />
                    )}
                  </span>
                </span>
              </Link>
            </>
          )}
        </div>

        {hasDropRates && (
          <div className="mt-4">
            <DropRateDialog
              groups={rarityGroups}
              packsPerBox={packsPerBox}
              cardsPerPack={cardsPerPack}
            />
          </div>
        )}
      </div>
    </header>
  );
}

function Stat({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <span className="inline-flex items-baseline gap-1.5">
      <span className="text-meta">{label}</span>
      <span className="text-sm font-semibold text-foreground">{children}</span>
    </span>
  );
}
