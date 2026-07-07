import Image from "next/image";
import Link from "next/link";
import { Crown, Package } from "lucide-react";

import { Price } from "@/components/shared/price-inline";
import { FormattedDate } from "@/components/shared/formatted-date";
import { DropRateDialog } from "@/app/sets/[setCode]/set-page-client";
import { t, type Language } from "@/lib/i18n";
import type { RarityGroup } from "@/components/sets/set-detail-content";
import type { SetDetailTopCard } from "@/lib/data/set-detail";

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
  topCard,
  rarityGroups,
  packsPerBox,
  cardsPerPack,
  hasDropRates,
}: {
  lang: Language;
  code: string;
  name: string;
  type: string;
  releaseDate: Date | null;
  boxImage: string | null;
  cardCount: number;
  topCard: SetDetailTopCard | null;
  rarityGroups: RarityGroup[];
  packsPerBox: number | null;
  cardsPerPack: number | null;
  hasDropRates: boolean;
}) {
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
            priority
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
        <h1 className="text-display mt-1.5 text-foreground">
          {code.toUpperCase()}
        </h1>
        <p className="text-h3 mt-0.5 font-normal text-muted-foreground">
          {name}
        </p>

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
                href={`/cards/${topCard.cardCode}`}
                className="group ease-chrome -mx-1.5 flex items-center gap-2 rounded-lg px-1.5 py-1 transition-colors hover:bg-muted/60"
              >
                <span className="surface-1 relative aspect-[63/88] w-7 shrink-0 overflow-hidden rounded-sm">
                  {topCard.imageUrl ? (
                    <Image
                      src={topCard.imageUrl}
                      alt={topCard.nameEn ?? topCard.nameJp}
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
                    {t(lang, "highestValue")}
                  </span>
                  <span className="text-price tnum text-foreground group-hover:text-primary">
                    <Price jpy={topCard.latestPriceJpy ?? 0} />
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
