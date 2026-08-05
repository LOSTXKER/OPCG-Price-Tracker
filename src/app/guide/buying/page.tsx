import Link from "next/link";
import type { Metadata } from "next";
import {
  Check,
  Flame,
  Info,
  Layers,
  LineChart,
  Sparkles,
  Store,
  X,
} from "lucide-react";
import { Surface } from "@/components/ui/surface";
import { Breadcrumb } from "@/components/shared/breadcrumb";
import { FaqSection } from "@/components/shared/faq-section";
import { PageHeader } from "@/components/layout/page-header";
import { GuideCallout } from "@/components/guide/guide-callout";
import { GuidePrevNext } from "@/components/guide/guide-prev-next";
import { GuideSourceList } from "@/components/guide/guide-source-list";
import { RelatedPages } from "@/components/shared/related-pages";
import { JsonLd } from "@/lib/seo/json-ld-script";
import { breadcrumbJsonLd } from "@/lib/seo/json-ld";
import { isMarketplaceEnabled } from "@/lib/marketplace/feature-flag";
import { t, type Language } from "@/lib/i18n";
import { getServerLanguage } from "@/lib/i18n/server";
import {
  GUIDE_META,
  guideBuyBoxHeading,
  guideBuyBoxParagraphs,
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

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: GUIDE_META.buying.title,
  description: GUIDE_META.buying.description,
  alternates: { canonical: "/guide/buying" },
};

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

  return (
    <div className="mx-auto max-w-3xl space-y-12">
      <JsonLd data={breadcrumbJsonLd([
        { name: "Home", href: "/" },
        { name: "Guide", href: "/guide" },
        { name: "Buying Guide", href: "/guide/buying" },
      ])} />
      <PageHeader
        breadcrumb={
          <Breadcrumb
            items={[
              { label: t(lang, "home"), href: "/" },
              { label: "Guide", href: "/guide" },
              { label: t(lang, "guideHomeGuideBuyingTitle") },
            ]}
            hideMobileBack
          />
        }
        back={{ href: "/guide", label: "Guide" }}
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
          {guideBuyJapanParagraphs(lang).map((paragraph, i) => (
            <p key={i}>{paragraph}</p>
          ))}
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
        <Link
          href="/opcg/drop-calculator"
          className="inline-flex items-center gap-1.5 rounded-lg border border-primary/30 bg-primary/5 px-4 py-2.5 text-sm font-medium text-primary motion-base hover:bg-primary/10"
        >
          {t(lang, "guideHomeToolDropTitle")}
        </Link>
      </section>

      {/* ── 7. Before you pay ── */}
      <section className="space-y-4">
        <h2 className="font-sans text-h2">{guideBuyCautionHeading(lang)}</h2>
        <Surface variant="outline" className="divide-y divide-hair">
          {guideBuyCautionItems(lang).map((item, i) => (
            <p key={i} className="px-4 py-3 text-sm leading-relaxed text-muted-foreground">
              {item}
            </p>
          ))}
        </Surface>
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
