import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { LocalizedBreadcrumb } from "@/components/shared/localized-breadcrumb";
import { FaqSection } from "@/components/shared/faq-section";
import { JsonLd } from "@/lib/seo/json-ld-script";
import { breadcrumbJsonLd, itemListJsonLd } from "@/lib/seo/json-ld";
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

  const { title, description } = buildSetDetailMeta(
    SEO_LANG,
    toSetSeoData(SEO_LANG, data),
  );

  return {
    title,
    description,
    alternates: { canonical: `/opcg/sets/${data.set.code}` },
    openGraph: { title, description, type: "article", locale: "th_TH" },
    twitter: { card: "summary_large_image", title, description },
  };
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
            `ราคาการ์ดวันพีซในชุด ${code} ${data.setName}`,
            listedCards.map((card) => ({
              name: `${card.cardCode} ${getCardName(lang, card)}`,
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
              <section
                aria-labelledby="set-intro-heading"
                className="max-w-3xl space-y-2"
              >
                <h2 id="set-intro-heading" className="text-h3">
                  {buildSetIntroHeading(lang, seo)}
                </h2>
                {introParagraphs.map((paragraph, i) => (
                  <p key={i} className="text-body text-muted-foreground">
                    {paragraph}
                  </p>
                ))}
                <p className="text-meta">
                  <Link
                    href="/opcg/sets"
                    className="underline-offset-2 hover:text-foreground hover:underline"
                  >
                    ดูชุดการ์ดวันพีซทั้งหมด
                  </Link>
                </p>
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
