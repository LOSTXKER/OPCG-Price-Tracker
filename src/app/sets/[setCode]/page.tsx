import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { ArrowLink } from "@/components/shared/arrow-link";
import { SectionHead } from "@/components/shared/section-head";
import { LocalizedBreadcrumb } from "@/components/shared/localized-breadcrumb";
import { FaqSection } from "@/components/shared/faq-section";
import { JsonLd } from "@/lib/seo/json-ld-script";
import { baseCardCode } from "@/lib/cards/card-code";
import { breadcrumbJsonLd, itemListJsonLd } from "@/lib/seo/json-ld";
import { buildPageMetadata } from "@/lib/seo/page-metadata";
import { getCardName, t, type Language } from "@/lib/i18n";
import {
  buildSetDetailMeta,
  buildSetFaq,
  buildSetFaqTitle,
  buildSetIntro,
  buildSetIntroHeading,
} from "@/lib/seo/copy/sets";
import {
  getAllSetCodes,
  getSetDetailData,
  getOtherSets,
  toSetSeoData,
} from "@/lib/data/set-detail";
import { SetDetailView } from "@/components/sets/set-detail-view";
import {
  SetDropRateTable,
  toDropRateRows,
} from "@/components/sets/set-drop-rate-table";
import { OtherSets } from "@/components/sets/other-sets";
import { AdPageContentReady } from "@/components/ads/ad-audience-provider";

/**
 * ISR instead of force-dynamic: there are ~51 finite set codes and this route
 * runs the heaviest query in the app, which Googlebot would otherwise trigger
 * on every crawl. Nothing here is per-user; the language is resolved client-side
 * (client-convert pattern) so no `cookies()` call pins the page to dynamic.
 */
export const revalidate = 1800;

/** Thai-first: the server HTML every crawler sees is Thai (doc/seo-content-plan.md §3.8). */
const SEO_LANG: Language = "TH";

/** Cap the ItemList payload — a big set can carry 300+ cards. */
const ITEM_LIST_MAX = 100;

export async function generateStaticParams() {
  const codes = await getAllSetCodes();
  return codes.map((setCode) => ({ setCode }));
}

export async function generateMetadata(props: {
  params: Promise<{ setCode: string }>;
}): Promise<Metadata> {
  const { setCode } = await props.params;
  const data = await getSetDetailData(setCode);
  if (!data) return { title: "ไม่พบชุดการ์ดนี้" };

  const seo = toSetSeoData(SEO_LANG, data);
  const { title, description } = buildSetDetailMeta(SEO_LANG, seo);

  return buildPageMetadata({
    title,
    description,
    canonical: `/opcg/sets/${data.set.code}`,
    ogType: "article",
    // Share preview shows the set's own box art (or its top card) instead of
    // the generic site-wide OG image — every set used to look identical on
    // LINE/Facebook (SEO round 2).
    ogImage: data.boxImage ?? null,
  });
}

export default async function SetDetailPage(props: {
  params: Promise<{ setCode: string }>;
}) {
  const { setCode } = await props.params;
  const data = await getSetDetailData(setCode);
  if (!data) notFound();

  const lang = SEO_LANG;
  const { set } = data;
  const otherSets = await getOtherSets(set.code);

  const seo = toSetSeoData(lang, data);
  const introParagraphs = buildSetIntro(lang, seo);
  const faqItems = buildSetFaq(lang, seo);
  const dropRateRows = toDropRateRows(data.rarityGroups);
  const code = set.code.toUpperCase();

  const listedCards = data.rarityGroups
    .flatMap((group) => group.cards)
    .slice(0, ITEM_LIST_MAX);

  return (
    <>
      {data.cardCount > 0 && <AdPageContentReady />}
      <JsonLd
        data={breadcrumbJsonLd([
          { name: t(lang, "home"), href: "/" },
          { name: t(lang, "sets"), href: "/opcg/sets" },
          {
            name: `${code} — ${data.setName}`,
            href: `/opcg/sets/${set.code}`,
          },
        ])}
      />
      {listedCards.length > 0 && (
        <JsonLd
          data={itemListJsonLd(
            `ราคาการ์ดวันพีชในชุด ${code} ${data.setName}`,
            listedCards.map((card) => ({
              // Printed card number in the reader-facing `name`; the full
              // code stays in `url` below (see @/lib/cards/card-code).
              name: `${baseCardCode(card.cardCode)} ${getCardName(lang, card)}`,
              url: `/opcg/cards/${card.cardCode}`,
              image: card.imageUrl,
            })),
          )}
        />
      )}
      <div className="space-y-10">
        {/* (warm overhead glow now lives once in the layout — PageContent) */}
        <div>
          <LocalizedBreadcrumb
            items={[
              { labelKey: "home", href: "/" },
              { labelKey: "sets", href: "/opcg/sets" },
              { label: code },
            ]}
          />
          <SetDetailView
            hero={{
              code: set.code,
              name: data.setName,
              type: data.setType,
              releaseDate: set.releaseDate,
              boxImage: data.boxImage,
              cardCount: data.cardCount,
              packsPerBox: set.packsPerBox,
              cardsPerPack: set.cardsPerPack,
              hasDropRates: set.dropRates.length > 0,
            }}
            groups={data.rarityGroups}
            totalCards={data.cardCount}
            intro={
              /* SectionHead rhythm (title left, "all sets" action right) + ONE
                 keyword sentence (owner call เบส 2026-08-07). FULL content
                 width on purpose: capping this block (tried max-w-3xl) left
                 the action link stranded mid-page, aligned with nothing — the
                 card grid below is full-width, so the header rail must be too.
                 The sentence is short enough to hold one line on desktop. */
              <section aria-labelledby="set-intro-heading">
                <SectionHead
                  title={buildSetIntroHeading(lang, seo)}
                  action={
                    <ArrowLink href="/opcg/sets" className="shrink-0">
                      ดูชุดทั้งหมด
                    </ArrowLink>
                  }
                />
                {introParagraphs.map((paragraph, i) => (
                  <p key={i} className="-mt-2 text-body-sm leading-relaxed text-muted-foreground">
                    {paragraph}
                  </p>
                ))}
              </section>
            }
          />
        </div>

        <SetDropRateTable
          lang={lang}
          code={set.code}
          rows={dropRateRows}
          packsPerBox={set.packsPerBox}
          cardsPerPack={set.cardsPerPack}
        />

        <FaqSection
          title={buildSetFaqTitle(lang, seo)}
          items={faqItems}
        />

        {otherSets.length > 0 && <OtherSets sets={otherSets} />}
      </div>
    </>
  );
}
