import Image from "next/image";
import type { Metadata } from "next";
import {
  AlertTriangle,
  Check,
  Dices,
  Eye,
  Flame,
  Info,
  Layers,
  LineChart,
  Receipt,
  ShieldAlert,
  Sparkles,
  Store,
  Truck,
  X,
} from "lucide-react";
import { Surface } from "@/components/ui/surface";
import { Breadcrumb } from "@/components/shared/breadcrumb";
import { FaqSection } from "@/components/shared/faq-section";
import { PageHeader } from "@/components/layout/page-header";
import { CardThumbStrip } from "@/components/guide/card-thumb-strip";
import { GuideCallout } from "@/components/guide/guide-callout";
import { GuideFigure } from "@/components/guide/guide-figure";
import { GuidePointList, type GuidePoint } from "@/components/guide/guide-point-list";
import { GuidePriceFacts } from "@/components/guide/guide-price-facts";
import { GuidePrevNext } from "@/components/guide/guide-prev-next";
import { GuideSourceList } from "@/components/guide/guide-source-list";
import { RelatedPageCard, RelatedPages } from "@/components/shared/related-pages";
import { baseCardCode } from "@/lib/cards/card-code";
import {
  getGuideLatestBooster,
  getGuideParallelPair,
  getGuidePriceSnapshot,
} from "@/lib/guide/card-examples";
import { formatPriceSnapshot, formatThb } from "@/lib/guide/price-format";
import { JsonLd } from "@/lib/seo/json-ld-script";
import { breadcrumbJsonLd } from "@/lib/seo/json-ld";
import { isMarketplaceEnabled } from "@/lib/marketplace/feature-flag";
import { t, type Language } from "@/lib/i18n";
import { getServerLanguage } from "@/lib/i18n/server";
import {
  GUIDE_META,
  guideBuyBoxFigure,
  guideBuyBoxHeading,
  guideBuyBoxParagraphs,
  guideBuyVersionFigure,
  guideBuyCautionHeading,
  guideBuyCautionItems,
  guideBuyChannels,
  guideBuyChannelsHeading,
  guideBuyCheckHeading,
  guideBuyCheckSteps,
  guideBuyConditionHeading,
  guideBuyConditionParagraphs,
  guideBuyFaq,
  guideBuyH1,
  guideBuyIntroParagraphs,
  guideBuyJapanHeading,
  guideBuyJapanParagraphs,
  guideBuyLead,
  guideBuySources,
  guideFaqHeading,
  guideHubTrendingLinkDesc,
  guideHubTrendingLinkTitle,
} from "@/lib/seo/copy/guide";
import { buildPageMetadata } from "@/lib/seo/page-metadata";

export const dynamic = "force-dynamic";

export const metadata: Metadata = buildPageMetadata({
  title: GUIDE_META.buying.title,
  description: GUIDE_META.buying.description,
  canonical: "/guide/buying",
  ogType: "article",
});

function buildTips(lang: Language) {
  return [
    t(lang, "guideBuyTip1"),
    t(lang, "guideBuyTip2"),
    t(lang, "guideBuyTip3"),
    t(lang, "guideBuyTip4"),
    t(lang, "guideBuyTip5"),
  ];
}

export default async function BuyingGuidePage() {
  const lang = await getServerLanguage();
  const marketplaceEnabled = await isMarketplaceEnabled();
  const channels = guideBuyChannels(lang);
  const tips = buildTips(lang);

  // Live catalogue rows for the two figures below. All three helpers are cached
  // for an hour and degrade to null, so the prose still renders without a DB.
  const [parallelPair, latestBooster, snapshotAt] = await Promise.all([
    getGuideParallelPair(),
    getGuideLatestBooster(),
    getGuidePriceSnapshot(),
  ]);
  const versionFigure = guideBuyVersionFigure(lang);
  const boxFigure = guideBuyBoxFigure(lang);

  // The import-tax paragraph is the one with real money consequences, and it was
  // buried as the third of four consecutive paragraphs. Lifting it into a warning
  // callout breaks the run and gives it the weight it earns.
  const japanParagraphs = guideBuyJapanParagraphs(lang);
  const japanTaxIndex = 2;

  const cautionPoints: GuidePoint[] = guideBuyCautionItems(lang).map((item, i) => ({
    id: `caution-${i}`,
    body: item,
    icon: [Eye, Receipt, Truck, ShieldAlert, AlertTriangle][i] ?? ShieldAlert,
  }));

  const boxFacts = latestBooster
    ? [
        {
          id: "cards",
          label: boxFigure.cardsLabel,
          value: latestBooster.cardCount.toLocaleString("en-US"),
          sub: latestBooster.code.toUpperCase(),
        },
        latestBooster.packsPerBox && latestBooster.cardsPerPack
          ? {
              id: "packs",
              label: boxFigure.packsLabel,
              value: `${latestBooster.packsPerBox} × ${latestBooster.cardsPerPack}`,
              sub: `= ${latestBooster.packsPerBox * latestBooster.cardsPerPack}`,
            }
          : null,
        // The newest set's priciest card is often the very parallel the version
        // figure above already shows (both pick "dearest parallel"), which reads
        // as a rendering bug. Drop the fact rather than print the card twice.
        latestBooster.topCard?.priceThb != null &&
        latestBooster.topCard.cardCode !== parallelPair?.parallel.cardCode
          ? {
              id: "top",
              label: boxFigure.topCardLabel,
              value: formatThb(latestBooster.topCard.priceThb),
              sub: baseCardCode(latestBooster.topCard.cardCode),
              href: `/opcg/cards/${latestBooster.topCard.cardCode}`,
            }
          : null,
      ].filter((fact): fact is NonNullable<typeof fact> => fact !== null)
    : [];

  return (
    <div className="mx-auto max-w-3xl space-y-12">
      <JsonLd data={breadcrumbJsonLd([
        { name: t(lang, "home"), href: "/" },
        { name: t(lang, "guideBreadcrumbGuide"), href: "/guide" },
        { name: t(lang, "guideHomeGuideBuyingTitle"), href: "/guide/buying" },
      ])} />
      <PageHeader
        breadcrumb={
          <Breadcrumb
            items={[
              { label: t(lang, "home"), href: "/" },
              { label: t(lang, "guideBreadcrumbGuide"), href: "/guide" },
              { label: t(lang, "guideHomeGuideBuyingTitle") },
            ]}
            hideMobileBack
          />
        }
        back={{ href: "/guide", label: t(lang, "guideBreadcrumbGuide") }}
        title={guideBuyH1(lang)}
        description={guideBuyLead(lang)}
      />

      {/* ── 1. Intro prose ── */}
      <section className="space-y-3 text-body leading-relaxed text-muted-foreground">
        {guideBuyIntroParagraphs(lang).map((paragraph, i) => (
          <p key={i}>{paragraph}</p>
        ))}
      </section>

      {/* ── 2. Buying channels ── */}
      <section className="space-y-4">
        <h2 className="font-sans text-h2">{guideBuyChannelsHeading(lang)}</h2>
        {channels.map((channel) => (
          <Surface
            key={channel.id}
            id={channel.id}
            variant="panel"
            className="scroll-mt-24 space-y-3 p-5"
          >
            <div className="flex flex-wrap items-baseline gap-2">
              <h3 className="font-sans text-h4">{channel.name}</h3>
              <span className="text-meta">{channel.type}</span>
            </div>
            <p className="text-sm leading-relaxed text-muted-foreground">
              {channel.body}
            </p>
            <div className="grid gap-2 text-sm sm:grid-cols-2">
              <div className="flex items-start gap-1.5">
                <Check className="mt-0.5 size-4 shrink-0 text-emerald-500" />
                <span>
                  <span className="font-medium text-foreground">
                    {t(lang, "guideBuyProsLabel")}:
                  </span>{" "}
                  <span className="text-muted-foreground">{channel.pros}</span>
                </span>
              </div>
              <div className="flex items-start gap-1.5">
                <X className="mt-0.5 size-4 shrink-0 text-red-500" />
                <span>
                  <span className="font-medium text-foreground">
                    {t(lang, "guideBuyConsLabel")}:
                  </span>{" "}
                  <span className="text-muted-foreground">{channel.cons}</span>
                </span>
              </div>
            </div>
          </Surface>
        ))}
      </section>

      {/* ── 3. Importing from Japan ── */}
      <section className="space-y-4">
        <h2 className="font-sans text-h2">{guideBuyJapanHeading(lang)}</h2>
        <div className="space-y-3 text-sm leading-relaxed text-muted-foreground">
          {japanParagraphs.map((paragraph, i) =>
            i === japanTaxIndex ? (
              <GuideCallout key={i} tone="warning" icon={AlertTriangle}>
                <p className="text-body-sm leading-relaxed">{paragraph}</p>
              </GuideCallout>
            ) : (
              <p key={i}>{paragraph}</p>
            ),
          )}
        </div>
      </section>

      {/* ── 4. Checking the price on Meecard ── */}
      <section className="space-y-4">
        <h2 className="font-sans text-h2">{guideBuyCheckHeading(lang)}</h2>
        <div className="space-y-2">
          {guideBuyCheckSteps(lang).map((step) => (
            <Surface key={step.title} variant="outline" className="p-4">
              <h3 className="text-sm font-semibold">{step.title}</h3>
              <p className="mt-1 text-body-sm leading-relaxed text-muted-foreground">
                {step.body}
              </p>
            </Surface>
          ))}
        </div>

        {/* This section tells the reader to check which *version* they are being
            quoted, then never showed one. Two real prints of the same card, with
            their real prices, make the point in a glance. */}
        {parallelPair &&
          parallelPair.base.priceThb != null &&
          parallelPair.parallel.priceThb != null && (
            <GuideFigure
              eyebrow={`${versionFigure.eyebrow} — ${baseCardCode(parallelPair.base.cardCode)}`}
              caption={versionFigure.caption}
              snapshot={formatPriceSnapshot(lang, snapshotAt)}
            >
              <CardThumbStrip
                size="xl"
                showCaption
                className="justify-center gap-6"
                cards={[
                  {
                    cardCode: parallelPair.base.cardCode,
                    name: formatThb(parallelPair.base.priceThb),
                    imageUrl: parallelPair.base.imageUrl,
                    label: versionFigure.standardLabel,
                  },
                  {
                    cardCode: parallelPair.parallel.cardCode,
                    name: formatThb(parallelPair.parallel.priceThb),
                    imageUrl: parallelPair.parallel.imageUrl,
                    label: versionFigure.parallelLabel,
                  },
                ]}
              />
            </GuideFigure>
          )}

        <GuideCallout tone="info" icon={Info}>
          <div>
            <h3 className="font-sans text-sm font-semibold text-primary">
              {t(lang, "guideBuyReadPriceHeading")}
            </h3>
            <ul className="mt-2 space-y-1 text-sm text-muted-foreground">
              <li>
                <strong>{t(lang, "guideBuyReadPriceYenLabel")}</strong> ={" "}
                {t(lang, "guideBuyReadPriceYenDesc")}
              </li>
              <li>
                <strong>{t(lang, "guideBuyReadPriceBahtLabel")}</strong> ={" "}
                {t(lang, "guideBuyReadPriceBahtDesc")}
              </li>
              <li>
                <strong>{t(lang, "guideBuyReadPriceChangeLabel")}</strong> ={" "}
                {t(lang, "guideBuyReadPriceChangeDesc")}
              </li>
              <li>
                <strong>Community Price</strong> ={" "}
                {t(lang, "guideBuyReadPriceCommunityDesc")}
              </li>
            </ul>
          </div>
        </GuideCallout>
      </section>

      {/* ── 5. Condition & storage ── */}
      <section className="space-y-4">
        <h2 className="font-sans text-h2">{guideBuyConditionHeading(lang)}</h2>
        <div className="space-y-3 text-sm leading-relaxed text-muted-foreground">
          {guideBuyConditionParagraphs(lang).map((paragraph, i) => (
            <p key={i}>{paragraph}</p>
          ))}
        </div>
      </section>

      {/* ── 6. Box vs singles ── */}
      <section className="space-y-4">
        <h2 className="font-sans text-h2">{guideBuyBoxHeading(lang)}</h2>
        <div className="space-y-3 text-sm leading-relaxed text-muted-foreground">
          {guideBuyBoxParagraphs(lang).map((paragraph, i) => (
            <p key={i}>{paragraph}</p>
          ))}
        </div>
        {/* The section argues about a physical object the reader has to decide
            whether to buy, so show the object. The eyebrow lives here rather
            than on the numbers below so the set is named once, not twice. */}
        {latestBooster?.boxImageUrl && (
          <GuideFigure eyebrow={`${boxFigure.eyebrow} — ${latestBooster.name}`}>
            <div className="relative mx-auto aspect-square w-40 sm:w-48">
              <Image
                src={latestBooster.boxImageUrl}
                alt=""
                fill
                className="object-contain"
                sizes="(min-width: 640px) 192px, 160px"
              />
            </div>
          </GuideFigure>
        )}

        {/* "Box or singles?" is an arithmetic question, so give the reader the
            actual arithmetic for a set they can go and buy today. */}
        {boxFacts.length > 0 && (
          <GuidePriceFacts
            eyebrow={
              latestBooster?.boxImageUrl
                ? undefined
                : `${boxFigure.eyebrow} — ${latestBooster!.name}`
            }
            facts={boxFacts}
            snapshot={formatPriceSnapshot(lang, snapshotAt)}
          />
        )}
        {boxFacts.length > 0 && (
          <p className="text-body-sm leading-relaxed text-muted-foreground">{boxFigure.caption}</p>
        )}

        <RelatedPageCard
          item={{
            href: "/opcg/drop-calculator",
            icon: Dices,
            title: t(lang, "guideHomeToolDropTitle"),
            description: t(lang, "guideHomeToolDropDesc"),
          }}
        />
      </section>

      {/* ── 7. Before you pay ── */}
      <section className="space-y-4">
        <h2 className="font-sans text-h2">{guideBuyCautionHeading(lang)}</h2>
        <GuidePointList points={cautionPoints} tone="warning" />
      </section>

      {/* ── 8. Existing buying tips ── */}
      <section className="space-y-4">
        <h2 className="font-sans text-h2">{t(lang, "guideBuyTipsHeading")}</h2>
        <div className="space-y-2">
          {tips.map((tip, i) => (
            <Surface
              key={i}
              variant="panel"
              className="flex items-start gap-3 p-3"
            >
              <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-primary/10 font-sans text-xs font-bold text-primary">
                {i + 1}
              </span>
              <p className="text-sm leading-relaxed">{tip}</p>
            </Surface>
          ))}
        </div>
      </section>

      {/* ── 9. FAQ (server-rendered + FAQPage JSON-LD) ── */}
      <FaqSection title={guideFaqHeading(lang)} items={guideBuyFaq(lang)} />

      {/* ── 10. Sources ── */}
      <GuideSourceList
        heading={t(lang, "guideRaritySourcesHeading")}
        sources={guideBuySources(lang)}
      />

      {/*
        The marketplace is behind an admin flag and 404s while it is off — the
        old "Marketplace" card sent users and crawlers to a dead route. Link to
        live price pages instead until the flag flips.
      */}
      <RelatedPages
        items={
          marketplaceEnabled
            ? [
                {
                  href: "/marketplace",
                  icon: Store,
                  title: "Marketplace",
                  description: t(lang, "guideBuyRelatedMarketDesc"),
                },
                {
                  href: "/guide/sets",
                  icon: Layers,
                  title: t(lang, "guideBuyRelatedSetsTitle"),
                  description: t(lang, "guideBuyRelatedSetsDesc"),
                },
              ]
            : [
                {
                  href: "/",
                  icon: LineChart,
                  title: t(lang, "guideStartRelatedPricesTitle"),
                  description: t(lang, "guideStartRelatedPricesDesc"),
                },
                {
                  href: "/opcg/trending",
                  icon: Flame,
                  title: guideHubTrendingLinkTitle(lang),
                  description: guideHubTrendingLinkDesc(lang),
                },
                {
                  href: "/guide/rarities",
                  icon: Sparkles,
                  title: t(lang, "guideHomeGuideRaritiesTitle"),
                  description: t(lang, "guideHomeGuideRaritiesDesc"),
                },
              ]
        }
      />

      <GuidePrevNext
        prev={{ href: "/guide/sets", label: t(lang, "guideSetBreadcrumbSets") }}
        next={{ href: "/guide", label: t(lang, "guideStartNavAllGuides") }}
      />
    </div>
  );
}
