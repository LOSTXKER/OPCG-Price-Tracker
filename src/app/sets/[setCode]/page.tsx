import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { Breadcrumb } from "@/components/shared/breadcrumb";
import { JsonLd } from "@/lib/seo/json-ld-script";
import { breadcrumbJsonLd } from "@/lib/seo/json-ld";
import { t } from "@/lib/i18n";
import { getServerLanguage } from "@/lib/i18n/server";
import { formatCount } from "@/lib/utils/currency";
import { getSet, getSetDetailData } from "@/lib/data/set-detail";
import { SetHero } from "@/components/sets/set-hero";
import { SetDetailContent } from "@/components/sets/set-detail-content";

export const dynamic = "force-dynamic";

export async function generateMetadata(props: {
  params: Promise<{ setCode: string }>;
}): Promise<Metadata> {
  const { setCode } = await props.params;
  const set = await getSet(setCode);
  if (!set) return { title: "Set not found" };

  const title = `${set.code.toUpperCase()} — ${set.nameEn ?? set.name}`;
  const description = `${formatCount(set.productCardCount)} cards · ${set.nameEn ?? set.name} — One Piece Card Game`;

  return {
    title,
    description,
    alternates: { canonical: `/sets/${set.code}` },
    openGraph: { title, description, type: "article" },
    twitter: { card: "summary_large_image", title, description },
  };
}

export default async function SetDetailPage(props: {
  params: Promise<{ setCode: string }>;
}) {
  const { setCode } = await props.params;
  const data = await getSetDetailData(setCode);
  if (!data) notFound();

  const lang = await getServerLanguage();
  const { set } = data;

  return (
    <>
      <JsonLd
        data={breadcrumbJsonLd([
          { name: t(lang, "home"), href: "/" },
          { name: t(lang, "sets"), href: "/sets" },
          {
            name: `${set.code.toUpperCase()} — ${data.setName}`,
            href: `/sets/${set.code}`,
          },
        ])}
      />
      <div className="space-y-10">
        {/* (warm overhead glow now lives once in the layout — PageContent) */}
        <div>
          <Breadcrumb
            items={[
              { label: t(lang, "home"), href: "/" },
              { label: t(lang, "sets"), href: "/sets" },
              { label: set.code.toUpperCase() },
            ]}
          />
          <SetHero
            lang={lang}
            code={set.code}
            name={data.setName}
            type={data.setType}
            releaseDate={set.releaseDate}
            boxImage={data.boxImage}
            avgPrice={data.avgPrice}
            cardCount={data.cardCount}
            topCard={data.topCard}
            rarityGroups={data.rarityGroups}
            packsPerBox={set.packsPerBox}
            cardsPerPack={set.cardsPerPack}
            hasDropRates={set.dropRates.length > 0}
          />
        </div>

        <SetDetailContent groups={data.rarityGroups} totalCards={data.cardCount} />
      </div>
    </>
  );
}
