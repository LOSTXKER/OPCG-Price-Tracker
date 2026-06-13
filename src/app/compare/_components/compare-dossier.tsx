import { useMemo } from "react";

import { t, type Language } from "@/lib/i18n";
import { RarityBadge } from "@/components/shared/rarity-badge";
import type { CompareCard } from "@/hooks/use-compare-data";
import {
  ChangeValue,
  CompareDetails,
  CompareFact,
  CompareRow,
  CompareSection,
  NumericCell,
  PriceCell,
} from "./compare-section";

type CompareWinners = {
  lowestPrice: string | null;
  topGain7d: string | null;
  topGain30d: string | null;
};

/**
 * The static-data dossier: pricing, basic info, and gameplay stats sections.
 * All sections are driven purely by the resolved `cards` + `winners` — no
 * local state — so they live apart from the page's data/layout orchestration.
 */
export function CompareDossier({
  cards,
  placeholderCount,
  winners,
  priceFormatter,
  lang,
}: {
  cards: CompareCard[];
  placeholderCount: number;
  winners: CompareWinners;
  priceFormatter: (n: number) => string;
  lang: Language;
}) {
  // Labels for the Basic Info dossier — kept in one place so the filled
  // column render and the empty-column placeholder stay in sync.
  const basicInfoLabels = useMemo(
    () => [
      t(lang, "set"),
      t(lang, "rarity"),
      t(lang, "type"),
      t(lang, "color"),
      t(lang, "variant"),
      t(lang, "attribute"),
      t(lang, "trait"),
    ],
    [lang],
  );

  return (
    <>
      <CompareSection title={t(lang, "comparePricing")}>
        <CompareRow
          label={t(lang, "price")}
          cards={cards}
          placeholderCount={placeholderCount}
        >
          {(card) => (
            <PriceCell
              value={card.currentPrice}
              winner={card.cardCode === winners.lowestPrice}
              formatter={priceFormatter}
            />
          )}
        </CompareRow>
        <CompareRow
          label={`${t(lang, "change")} 7 ${t(lang, "days")}`}
          cards={cards}
          placeholderCount={placeholderCount}
        >
          {(card) => (
            <ChangeValue
              value={card.change7d}
              winner={card.cardCode === winners.topGain7d}
            />
          )}
        </CompareRow>
        <CompareRow
          label={`${t(lang, "change")} 30 ${t(lang, "days")}`}
          cards={cards}
          placeholderCount={placeholderCount}
        >
          {(card) => (
            <ChangeValue
              value={card.change30d}
              winner={card.cardCode === winners.topGain30d}
            />
          )}
        </CompareRow>
      </CompareSection>

      <CompareSection title={t(lang, "compareBasicInfo")}>
        <CompareDetails
          cards={cards}
          placeholderCount={placeholderCount}
          factLabels={basicInfoLabels}
        >
          {(card) => (
            <>
              <CompareFact label={t(lang, "set")}>
                <span className="font-mono">
                  {card.setCode?.toUpperCase() || "—"}
                </span>
              </CompareFact>
              <CompareFact label={t(lang, "rarity")}>
                <RarityBadge rarity={card.rarity} size="sm" />
              </CompareFact>
              <CompareFact label={t(lang, "type")}>
                <span className="capitalize">
                  {card.cardType?.toLowerCase() || "—"}
                </span>
              </CompareFact>
              <CompareFact label={t(lang, "color")}>
                {card.color || "—"}
              </CompareFact>
              <CompareFact label={t(lang, "variant")}>
                {card.isParallel ? t(lang, "parallel") : t(lang, "regular")}
              </CompareFact>
              <CompareFact label={t(lang, "attribute")}>
                {card.attribute ?? "—"}
              </CompareFact>
              <CompareFact label={t(lang, "trait")}>
                <span className="block max-w-full break-words text-balance">
                  {card.trait ?? "—"}
                </span>
              </CompareFact>
            </>
          )}
        </CompareDetails>
      </CompareSection>

      <CompareSection title={t(lang, "compareStats")}>
        <CompareRow
          label={t(lang, "cost")}
          cards={cards}
          placeholderCount={placeholderCount}
        >
          {(card) => <NumericCell value={card.cost} />}
        </CompareRow>
        <CompareRow
          label={t(lang, "power")}
          cards={cards}
          highlight="max"
          getValue={(c) => c.power}
          placeholderCount={placeholderCount}
        >
          {(card, win) => (
            <NumericCell value={card.power} winner={win} format />
          )}
        </CompareRow>
        <CompareRow
          label={t(lang, "counter")}
          cards={cards}
          highlight="max"
          getValue={(c) => c.counter}
          placeholderCount={placeholderCount}
        >
          {(card, win) => <NumericCell value={card.counter} winner={win} />}
        </CompareRow>
        <CompareRow
          label={t(lang, "life")}
          cards={cards}
          placeholderCount={placeholderCount}
        >
          {(card) => <NumericCell value={card.life} />}
        </CompareRow>
      </CompareSection>
    </>
  );
}
