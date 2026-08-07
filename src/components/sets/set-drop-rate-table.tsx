import { BarChart3 } from "lucide-react";

import { RarityBadge } from "@/components/shared/rarity-badge";
import { RelatedPageCard } from "@/components/shared/related-pages";
import { SectionHead } from "@/components/shared/section-head";
import { Surface } from "@/components/ui/surface";
import { rarityThaiName, setDropRateCopy } from "@/lib/seo/copy/sets";
import type { Language } from "@/lib/i18n";
import { formatPullPct } from "@/lib/utils/pull-rate";
import type { RarityGroup } from "@/components/sets/set-detail-content";

/** Compact "~x.xx" formatting for an expected-copies figure. */
function formatDropCount(value: number): string {
  if (value >= 100) return `~${Math.round(value)}`;
  if (value >= 10) return `~${value.toFixed(0)}`;
  if (value >= 1) return `~${value.toFixed(1)}`;
  if (value >= 0.01) return `~${value.toFixed(2)}`;
  return `~${value.toFixed(3)}`;
}

export type SetDropRateRow = {
  rarity: string;
  cardCount: number;
  avgPerBox: number;
  ratePerPack: number;
  chancePerCard: number;
};

/** Drop-rate rows straight from the page data (no client state involved). */
export function toDropRateRows(groups: RarityGroup[]): SetDropRateRow[] {
  return groups
    .filter((group) => group.pullRate)
    .map((group) => ({
      rarity: group.rarity,
      cardCount: group.cards.length,
      avgPerBox: group.pullRate!.avgPerBox,
      ratePerPack: group.pullRate!.ratePerPack,
      chancePerCard: group.pullChancePerBox ?? 0,
    }));
}

/**
 * SERVER-rendered drop-rate table.
 *
 * The same numbers also live in `DropRateDialog`, but a dialog mounts its
 * content on open, so Googlebot never saw them — and 50 of 51 sets have this
 * data, which no Thai competitor publishes. This section puts every row in the
 * first HTML response; the dialog stays for the in-page interaction.
 */
export function SetDropRateTable({
  lang,
  code,
  rows,
  packsPerBox,
  cardsPerPack,
  calculatorHref = "/opcg/drop-calculator",
}: {
  lang: Language;
  code: string;
  rows: SetDropRateRow[];
  packsPerBox: number | null;
  cardsPerPack: number | null;
  calculatorHref?: string;
}) {
  if (rows.length === 0) return null;
  const copy = setDropRateCopy(lang, code);

  return (
    <section id="drop-rate" className="space-y-4">
      <SectionHead title={copy.heading} />
      <p className="text-body text-muted-foreground">{copy.intro}</p>

      <Surface variant="outline" padding="lg" className="space-y-3">
        {packsPerBox && cardsPerPack && (
          <p className="text-meta">{copy.boxNote(packsPerBox, cardsPerPack)}</p>
        )}

        {/* <sm: list fallback — a 4-column table does not read on a phone. */}
        <div className="divide-y divide-hair sm:hidden">
          {rows.map((row) => (
            <div key={row.rarity} className="space-y-1 py-3">
              <div className="flex items-center justify-between gap-2">
                <span className="flex items-center gap-2">
                  <RarityBadge rarity={row.rarity} size="sm" />
                  {lang === "TH" && rarityThaiName(row.rarity) && (
                    <span className="text-meta">
                      {rarityThaiName(row.rarity)}
                    </span>
                  )}
                </span>
                <span className="text-code text-sm font-semibold text-foreground">
                  {formatDropCount(row.avgPerBox)}
                  <span className="text-meta ml-1">{copy.perBoxShort}</span>
                </span>
              </div>
              <div className="text-meta flex items-center justify-between gap-2 tabular-nums">
                <span>
                  {copy.cardsInSet}: {row.cardCount} {copy.unitCards} ·{" "}
                  {copy.chanceShort}
                </span>
                <span className="text-code font-semibold text-primary">
                  {formatPullPct(row.chancePerCard)}
                </span>
              </div>
            </div>
          ))}
        </div>

        <div className="hidden overflow-x-auto sm:block">
          <table className="w-full border-collapse text-sm">
            <caption className="sr-only">{copy.heading}</caption>
            <thead>
              <tr className="border-b border-hair">
                <th scope="col" className="text-eyebrow py-2 text-left">
                  {copy.rarity}
                </th>
                <th scope="col" className="text-eyebrow py-2 pl-3 text-right">
                  {copy.cardsInSet}
                </th>
                <th scope="col" className="text-eyebrow py-2 pl-3 text-right">
                  {copy.perBox}
                </th>
                <th scope="col" className="text-eyebrow py-2 pl-3 text-right">
                  {copy.perPack}
                </th>
                <th scope="col" className="text-eyebrow py-2 pl-3 text-right">
                  {copy.chance}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-hair">
              {rows.map((row) => (
                <tr key={row.rarity}>
                  <th scope="row" className="py-2.5 text-left font-normal">
                    <span className="flex items-center gap-2">
                      <RarityBadge rarity={row.rarity} size="sm" />
                      {lang === "TH" && rarityThaiName(row.rarity) && (
                        <span className="text-meta">
                          {rarityThaiName(row.rarity)}
                        </span>
                      )}
                    </span>
                  </th>
                  <td className="py-2.5 pl-3 text-right text-sm tabular-nums text-muted-foreground">
                    {row.cardCount}
                  </td>
                  <td className="text-code py-2.5 pl-3 text-right text-sm font-semibold">
                    {formatDropCount(row.avgPerBox)}
                  </td>
                  <td className="text-code py-2.5 pl-3 text-right text-sm text-muted-foreground">
                    {formatDropCount(row.ratePerPack)}
                  </td>
                  <td className="text-code py-2.5 pl-3 text-right text-sm font-semibold text-primary">
                    {formatPullPct(row.chancePerCard)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Surface>

      {/* Next-step CTA — full card in the RelatedPages grammar, not a buried
          text line: this is the page's highest-value handoff (owner call,
          เบส 2026-08-07). Width capped so a lone card doesn't stretch the
          whole row on desktop. */}
      <RelatedPageCard
        item={{
          href: calculatorHref,
          icon: BarChart3,
          title: copy.calculatorLabel,
          description: copy.calculatorDesc,
        }}
        className="sm:max-w-md"
      />
    </section>
  );
}
