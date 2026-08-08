import { Calculator, Layers, Sparkles, type LucideIcon } from "lucide-react";

import { Surface } from "@/components/ui/surface";
import { RarityBadge } from "@/components/shared/rarity-badge";
import { RelatedPages } from "@/components/shared/related-pages";
import type { Language } from "@/lib/i18n";
import { buildDropCalculatorCopy } from "@/lib/seo/copy/tools";
import { BOX_PATTERNS } from "@/lib/utils/pull-rate";

export type AverageDropRate = {
  rarity: string;
  avgPerBox: number | null;
  ratePerPack: number | null;
  setCount: number;
};

/**
 * SERVER component — the whole explainer ("อัตราออกการ์ดวันพีช") is plain HTML
 * in the first response. Everything else on this route is client-fetched, so
 * without this block the biggest untapped Thai keyword had no crawlable copy.
 */
export function DropRateExplainer({
  lang,
  rates,
}: {
  lang: Language;
  rates: AverageDropRate[];
}) {
  const copy = buildDropCalculatorCopy(lang);

  return (
    <div className="mt-12 space-y-10">
      <section className="space-y-3">
        <h2 className="text-h2">{copy.howTitle}</h2>
        {copy.howParagraphs.map((paragraph) => (
          <p key={paragraph.slice(0, 24)} className="text-body leading-relaxed">
            {paragraph}
          </p>
        ))}
      </section>

      <section className="space-y-3">
        <h2 className="text-h2">{copy.boxPatternTitle}</h2>
        <p className="text-body-sm text-muted-foreground">{copy.boxPatternIntro}</p>
        <Surface variant="outline" className="divide-y divide-hair overflow-hidden">
          {BOX_PATTERNS.map((pattern) => (
            <div
              key={pattern.name}
              className="flex flex-wrap items-baseline justify-between gap-2 px-5 py-3"
            >
              <span className="text-body-sm font-medium">
                {pattern.name}{" "}
                <span className="text-meta">({pattern.nameJp})</span>
              </span>
              <span className="text-body-sm tabular-nums text-muted-foreground">
                {Math.round(pattern.prob * 100)}% · SEC {pattern.sec} · Parallel{" "}
                {pattern.parallel} · SR {pattern.sr}
              </span>
            </div>
          ))}
        </Surface>
      </section>

      <section className="space-y-3">
        <h2 className="text-h2">{copy.ratesTitle}</h2>
        <p className="text-body-sm text-muted-foreground">{copy.ratesIntro}</p>

        {rates.length === 0 ? (
          <p className="text-meta">{copy.ratesEmpty}</p>
        ) : (
          <Surface variant="panel" padding="none" className="overflow-hidden">
            {/* Dense data: list on phones, table from sm: up (AGENTS.md). */}
            <ul className="divide-y divide-hair sm:hidden">
              {rates.map((rate) => (
                <li
                  key={rate.rarity}
                  className="flex items-center justify-between gap-3 px-4 py-2.5"
                >
                  <RarityBadge rarity={rate.rarity} size="sm" />
                  <span className="text-body-sm tabular-nums text-muted-foreground">
                    {copy.tableHeads.perBox}: {formatRate(rate.avgPerBox)} ·{" "}
                    {copy.tableHeads.perPack}: {formatRate(rate.ratePerPack)}
                  </span>
                </li>
              ))}
            </ul>
            <table className="hidden w-full text-sm sm:table">
              <thead>
                <tr className="border-b border-hair text-eyebrow">
                  <th className="px-4 py-3 text-left">{copy.tableHeads.rarity}</th>
                  <th className="px-4 py-3 text-right">{copy.tableHeads.perBox}</th>
                  <th className="px-4 py-3 text-right">{copy.tableHeads.perPack}</th>
                </tr>
              </thead>
              <tbody>
                {rates.map((rate) => (
                  <tr key={rate.rarity} className="border-b border-hair last:border-0">
                    <td className="px-4 py-2.5">
                      <RarityBadge rarity={rate.rarity} size="sm" />
                    </td>
                    <td className="px-4 py-2.5 text-right tabular-nums">
                      {formatRate(rate.avgPerBox)}
                    </td>
                    <td className="px-4 py-2.5 text-right tabular-nums">
                      {formatRate(rate.ratePerPack)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Surface>
        )}
        <p className="text-meta">{copy.perPackNote}</p>
      </section>

      {/* Same tail grammar as every sibling tool page (RelatedPages cards) —
          the old bare "อ่านต่อ" link list was the only page still hand-rolling
          its tail (SEO CTA sweep, เบส 2026-08-07). */}
      <RelatedPages
        title={copy.linksTitle}
        items={copy.readNext.map((link) => ({
          ...link,
          icon: READ_NEXT_ICONS[link.href] ?? Layers,
        }))}
      />
    </div>
  );
}

/** Icons keyed by destination — copy stays plain data, presentation stays here. */
const READ_NEXT_ICONS: Record<string, LucideIcon> = {
  "/guide/rarities": Sparkles,
  "/opcg/sets": Layers,
  "/opcg/deck-calculator": Calculator,
};

function formatRate(value: number | null): string {
  if (value == null) return "—";
  return value >= 10 ? value.toFixed(0) : value.toFixed(2);
}
