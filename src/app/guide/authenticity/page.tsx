import type { Metadata } from "next";
import Link from "next/link";
import {
  AlertTriangle,
  AlarmClock,
  Crop,
  ImageOff,
  Info,
  Layers,
  LineChart,
  PackageOpen,
  PackageX,
  ShieldCheck,
  Sparkles,
  Store,
  TrendingDown,
  Type,
} from "lucide-react";

import { Breadcrumb } from "@/components/shared/breadcrumb";
import { FaqSection } from "@/components/shared/faq-section";
import { RelatedPages } from "@/components/shared/related-pages";
import { PageHeader } from "@/components/layout/page-header";
import { Surface } from "@/components/ui/surface";
import { CardThumbStrip } from "@/components/guide/card-thumb-strip";
import { GuideCallout } from "@/components/guide/guide-callout";
import { GuideFigure } from "@/components/guide/guide-figure";
import { GuidePointList, type GuidePoint } from "@/components/guide/guide-point-list";
import { GuidePrevNext } from "@/components/guide/guide-prev-next";
import { GuideSourceList } from "@/components/guide/guide-source-list";
import { getGuidePriceSnapshot, getGuideTopCards } from "@/lib/guide/card-examples";
import { formatPriceSnapshot, formatThb } from "@/lib/guide/price-format";
import { CompareSchematic, LightTestSchematic } from "./card-schematics";
import { JsonLd } from "@/lib/seo/json-ld-script";
import { breadcrumbJsonLd } from "@/lib/seo/json-ld";
import { clientEnv } from "@/lib/env";
import { t } from "@/lib/i18n";
import { getServerLanguage } from "@/lib/i18n/server";
import {
  GUIDE_AUTHENTICITY_META,
  GUIDE_AUTHENTICITY_PUBLISHED_AT,
  GUIDE_AUTHENTICITY_UPDATED_AT,
  guideAuthBestMethodBody,
  guideAuthBestMethodHeading,
  guideAuthChecks,
  guideAuthChecksHeading,
  guideAuthFaq,
  guideAuthGradingBody,
  guideAuthGradingHeading,
  guideAuthH1,
  guideAuthIntro,
  guideAuthLead,
  guideAuthLightTestBody,
  guideAuthLightTestHeading,
  guideAuthRedFlags,
  guideAuthRedFlagsHeading,
  guideAuthRipBody,
  guideAuthRipHeading,
  guideAuthTerms,
  guideAuthTermsHeading,
  guideAuthUpdatedLabel,
  guideAuthCompareLabels,
  guideAuthLightLabels,
  guideAuthValueFigure,
} from "@/lib/seo/copy/guide-authenticity";
import { buildPageMetadata } from "@/lib/seo/page-metadata";

/**
 * Icons for the on-card checks and the listing red flags. Kept next to the page
 * rather than in the copy module so the copy stays plain data (and translatable)
 * while the visual treatment lives with the markup. Keyed by the stable `id`
 * each copy entry already carries, so a copy reorder can't desync them.
 */
const CHECK_ICONS: Record<string, typeof Layers> = {
  back: Layers,
  print: Type,
  foil: Sparkles,
  cut: Crop,
  stock: Layers,
};

const RED_FLAG_ICONS: Record<string, typeof Layers> = {
  price: TrendingDown,
  photos: ImageOff,
  "loose-packs": PackageOpen,
  resealed: PackageX,
  pressure: AlarmClock,
};

export const dynamic = "force-dynamic";

export const metadata: Metadata = buildPageMetadata({
  title: GUIDE_AUTHENTICITY_META.title,
  description: GUIDE_AUTHENTICITY_META.description,
  canonical: "/guide/authenticity",
  ogType: "article",
});

export default async function AuthenticityGuidePage() {
  const lang = await getServerLanguage();
  const baseUrl = clientEnv().NEXT_PUBLIC_APP_URL;

  // Real catalogue data for the "counterfeits follow value" figure. Both are
  // cached for an hour and degrade to empty/null, so the page still renders its
  // prose if the database is unreachable — see @/lib/guide/card-examples.
  const [topCards, snapshotAt] = await Promise.all([
    getGuideTopCards(6),
    getGuidePriceSnapshot(),
  ]);
  const pricedTopCards = topCards.filter((card) => card.priceThb != null);
  const valueFigure = guideAuthValueFigure(lang);
  const compareLabels = guideAuthCompareLabels(lang);
  const lightLabels = guideAuthLightLabels(lang);

  const [introOpening, introCaveat, ...introRest] = guideAuthIntro(lang);

  const checkPoints: GuidePoint[] = guideAuthChecks(lang).map((check) => ({
    id: `check-${check.id}`,
    title: check.title,
    body: check.body,
    icon: CHECK_ICONS[check.id],
  }));

  const redFlagPoints: GuidePoint[] = guideAuthRedFlags(lang).map((flag) => ({
    id: `flag-${flag.id}`,
    icon: RED_FLAG_ICONS[flag.id],
    body: (
      <>
        {flag.before}
        {flag.link && (
          <>
            {" "}
            <Link href={flag.link.href} className="font-medium text-primary hover:underline">
              {flag.link.label}
            </Link>
            {flag.after && ` ${flag.after}`}
          </>
        )}
      </>
    ),
  }));

  return (
    <>
      <JsonLd
        data={breadcrumbJsonLd([
          { name: t(lang, "home"), href: "/" },
          { name: t(lang, "guide"), href: "/guide" },
          { name: guideAuthH1(lang), href: "/guide/authenticity" },
        ])}
      />

      {/* Article schema — this page cites a rule that can go stale (grading
          advice, counterfeit alerts), so dateModified matters for freshness
          signals even though the copy isn't a dated news article. */}
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "Article",
          headline: guideAuthH1(lang),
          description: GUIDE_AUTHENTICITY_META.description,
          url: `${baseUrl}/guide/authenticity`,
          inLanguage: "th-TH",
          datePublished: GUIDE_AUTHENTICITY_PUBLISHED_AT,
          dateModified: GUIDE_AUTHENTICITY_UPDATED_AT,
          author: { "@type": "Organization", name: "Meecard" },
          publisher: { "@type": "Organization", name: "Meecard", url: baseUrl },
        }}
      />

      <Breadcrumb
        items={[
          { label: t(lang, "home"), href: "/" },
          { label: t(lang, "guide"), href: "/guide" },
          { label: guideAuthH1(lang) },
        ]}
      />

      <PageHeader title={guideAuthH1(lang)} description={guideAuthLead(lang)}>
        <p className="text-meta">อัปเดตล่าสุด: {guideAuthUpdatedLabel(lang)}</p>
      </PageHeader>

      <div className="mt-8 space-y-12">
        {/* The single most important caveat on this page used to sit as the
            middle of three consecutive paragraphs. Pulling it into a callout
            both breaks the wall of text and gives it the weight it deserves. */}
        <section className="space-y-4">
          {introOpening && <p className="text-body leading-relaxed">{introOpening}</p>}
          {introCaveat && (
            <GuideCallout tone="info" icon={Info}>
              <p className="text-body-sm leading-relaxed">{introCaveat}</p>
            </GuideCallout>
          )}
          {introRest.map((paragraph) => (
            <p key={paragraph.slice(0, 24)} className="text-body leading-relaxed">
              {paragraph}
            </p>
          ))}
        </section>

        <section className="space-y-4">
          <h2 className="text-h2">{guideAuthBestMethodHeading(lang)}</h2>
          {guideAuthBestMethodBody(lang).map((paragraph) => (
            <p key={paragraph.slice(0, 24)} className="text-body leading-relaxed">
              {paragraph}
            </p>
          ))}
          <GuideFigure>
            <CompareSchematic
              lightLabel={compareLabels.light}
              knownLabel={compareLabels.known}
              suspectLabel={compareLabels.suspect}
            />
          </GuideFigure>
        </section>

        <section className="space-y-4">
          <h2 className="text-h2">{guideAuthChecksHeading(lang)}</h2>
          <GuidePointList points={checkPoints} />
        </section>

        <section className="space-y-4">
          <h2 className="text-h2">{guideAuthLightTestHeading(lang)}</h2>
          {guideAuthLightTestBody(lang).map((paragraph) => (
            <p key={paragraph.slice(0, 24)} className="text-body leading-relaxed">
              {paragraph}
            </p>
          ))}
          <GuideFigure>
            <LightTestSchematic
              opaqueLabel={lightLabels.opaque}
              translucentLabel={lightLabels.translucent}
            />
          </GuideFigure>
        </section>

        <section className="space-y-3">
          <h2 className="text-h2">{guideAuthRipHeading(lang)}</h2>
          <GuideCallout tone="warning" icon={AlertTriangle}>
            <p className="text-body-sm leading-relaxed">{guideAuthRipBody(lang)}</p>
          </GuideCallout>
        </section>

        <section className="space-y-4">
          <h2 className="text-h2">{guideAuthGradingHeading(lang)}</h2>
          {guideAuthGradingBody(lang).map((paragraph) => (
            <p key={paragraph.slice(0, 24)} className="text-body leading-relaxed">
              {paragraph}
            </p>
          ))}

          {/* "Counterfeits follow value" is the argument for paying to grade an
              expensive card — so show what the top of the market actually costs
              instead of asserting it. Hidden entirely when the query is empty
              rather than rendered as a blank frame. */}
          {pricedTopCards.length > 0 && (
            <GuideFigure
              eyebrow={valueFigure.eyebrow}
              caption={valueFigure.caption}
              snapshot={formatPriceSnapshot(lang, snapshotAt)}
            >
              <CardThumbStrip
                size="lg"
                scroll
                showCaption
                cards={pricedTopCards.map((card) => ({
                  cardCode: card.cardCode,
                  name: card.name,
                  imageUrl: card.imageUrl,
                  label: formatThb(card.priceThb!),
                }))}
              />
            </GuideFigure>
          )}
        </section>

        <section className="space-y-4">
          <h2 className="text-h2">{guideAuthTermsHeading(lang)}</h2>
          <div className="grid gap-3 sm:grid-cols-3">
            {guideAuthTerms(lang).map((term) => (
              <Surface key={term.id} variant="outline" className="space-y-1.5 p-4">
                <h3 className="text-h5">{term.title}</h3>
                <p className="text-body-sm leading-relaxed text-muted-foreground">{term.body}</p>
              </Surface>
            ))}
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="text-h2">{guideAuthRedFlagsHeading(lang)}</h2>
          <GuidePointList points={redFlagPoints} tone="danger" />
        </section>

        <FaqSection items={guideAuthFaq(lang)} />

        <GuideSourceList
          heading={t(lang, "guideRaritySourcesHeading")}
          sources={[
            {
              label: "ONE PIECE CARD GAME — ประกาศเตือนการ์ดปลอม (พ.ย. 2024)",
              desc: "ประกาศทางการของ Bandai เรื่องการ์ดปลอมของ Winner card ฉบับภาษาอังกฤษ",
              url: "https://asia-en.onepiece-cardgame.com/topics/018.php",
            },
            {
              label: "ONE PIECE CARD GAME — เว็บทางการ (ไทย)",
              desc: "ข้อมูลผลิตภัณฑ์ ชุดการ์ด และประกาศจากผู้ผลิต ใช้ตรวจว่าการ์ดที่เห็นมีอยู่จริงไหม",
              url: "https://asia-th.onepiece-cardgame.com/",
            },
            {
              label: "ราคากลางการ์ดวันพีชบน Meecard",
              desc: "เทียบราคาที่คนขายเสนอกับราคาตลาด ก่อนตัดสินใจว่าของถูกผิดปกติหรือเปล่า",
              url: "/opcg/search",
              internal: true,
            },
          ]}
        />

        <GuidePrevNext
          prev={{ href: "/guide/buying", label: t(lang, "guideHomeGuideBuyingTitle") }}
          next={{ href: "/guide", label: t(lang, "guide") }}
        />
      </div>

      <RelatedPages
        items={[
          {
            href: "/guide/buying",
            icon: Store,
            title: "ซื้อการ์ดวันพีชที่ไหนดี",
            description: "ช่องทางซื้อในไทย สั่งจากญี่ปุ่น และวิธีเช็คราคาก่อนโอน",
          },
          {
            href: "/opcg/most-expensive",
            icon: LineChart,
            title: "การ์ดวันพีชที่แพงที่สุด",
            description: "ใบไหนแพงพอที่จะคุ้มค่าให้คนทำปลอม",
          },
          {
            href: "/guide/rarities",
            icon: ShieldCheck,
            title: "ความหายากการ์ดวันพีช",
            description: "SEC · Parallel · Treasure Rare ต่างกันยังไง",
          },
        ]}
      />
    </>
  );
}
