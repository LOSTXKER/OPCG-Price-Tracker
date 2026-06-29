import Link from "next/link";
import type { Metadata } from "next";
import { ArrowRight, Layers, Store } from "lucide-react";
import { Surface } from "@/components/ui/surface";
import { Breadcrumb } from "@/components/shared/breadcrumb";
import { RelatedPages } from "@/components/shared/related-pages";
import { JsonLd } from "@/lib/seo/json-ld-script";
import { breadcrumbJsonLd } from "@/lib/seo/json-ld";
import { t, type Language } from "@/lib/i18n";
import { getServerLanguage } from "@/lib/i18n/server";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Buying Guide — คู่มือ OPCG",
  description:
    "Where to buy One Piece Card Game cards in Thailand and online. Trusted shops, pricing tips and what to watch out for.",
  alternates: { canonical: "/guide/buying" },
};

function buildShops(lang: Language) {
  return [
    {
      name: "Yuyu-tei",
      url: "https://yuyu-tei.jp",
      type: t(lang, "guideBuyShopYuyuteiType"),
      pros: t(lang, "guideBuyShopYuyuteiPros"),
      cons: t(lang, "guideBuyShopYuyuteiCons"),
    },
    {
      name: t(lang, "guideBuyShopThaiName"),
      url: null,
      type: t(lang, "guideBuyShopThaiType"),
      pros: t(lang, "guideBuyShopThaiPros"),
      cons: t(lang, "guideBuyShopThaiCons"),
    },
    {
      name: t(lang, "guideBuyShopMarketName"),
      url: "/marketplace",
      type: t(lang, "guideBuyShopMarketType"),
      pros: t(lang, "guideBuyShopMarketPros"),
      cons: t(lang, "guideBuyShopMarketCons"),
    },
  ];
}

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
  const shops = buildShops(lang);
  const tips = buildTips(lang);

  return (
    <div className="mx-auto max-w-3xl space-y-12">
      <JsonLd data={breadcrumbJsonLd([
        { name: "Home", href: "/" },
        { name: "Guide", href: "/guide" },
        { name: "Buying Guide", href: "/guide/buying" },
      ])} />
      <div className="space-y-3">
        <Breadcrumb items={[
          { label: "Home", href: "/" },
          { label: "Guide", href: "/guide" },
          { label: "Buying Guide" },
        ]} />
        <h1 className="font-sans text-h1">
          Buying Guide
        </h1>
        <p className="text-muted-foreground text-lg">
          {t(lang, "guideBuySubtitle")}
        </p>
      </div>

      <div className="space-y-4">
        <h2 className="font-sans text-h2">
          {t(lang, "guideBuyShopsHeading")}
        </h2>
        {shops.map((shop) => (
          <Surface key={shop.name} variant="panel" className="space-y-2 p-5">
            <div className="flex items-center gap-2">
              <h3 className="font-sans text-h4">
                {shop.url ? (
                  shop.url.startsWith("/") ? (
                    <Link
                      href={shop.url}
                      className="text-primary hover:underline"
                    >
                      {shop.name}
                    </Link>
                  ) : (
                    <a
                      href={shop.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:underline"
                    >
                      {shop.name}
                    </a>
                  )
                ) : (
                  shop.name
                )}
              </h3>
              <span className="text-muted-foreground text-xs">
                {shop.type}
              </span>
            </div>
            <div className="grid gap-2 text-sm sm:grid-cols-2">
              <div>
                <span className="text-foreground font-medium">✓ {t(lang, "guideBuyProsLabel")}:</span>{" "}
                <span className="text-muted-foreground">{shop.pros}</span>
              </div>
              <div>
                <span className="text-foreground font-medium">✗ {t(lang, "guideBuyConsLabel")}:</span>{" "}
                <span className="text-muted-foreground">{shop.cons}</span>
              </div>
            </div>
          </Surface>
        ))}
      </div>

      <div className="space-y-4">
        <h2 className="font-sans text-h2">
          {t(lang, "guideBuyTipsHeading")}
        </h2>
        <div className="space-y-2">
          {tips.map((tip, i) => (
            <Surface
              key={i}
              variant="panel"
              className="flex items-start gap-3 p-3"
            >
              <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-muted/10 font-sans text-xs font-bold text-foreground">
                {i + 1}
              </span>
              <p className="text-sm leading-relaxed">{tip}</p>
            </Surface>
          ))}
        </div>
      </div>

      <div className="rounded-xl border border-dashed border-primary/30 bg-primary/5 p-4">
        <h3 className="font-sans text-sm font-semibold text-primary">
          📊 {t(lang, "guideBuyReadPriceHeading")}
        </h3>
        <ul className="text-muted-foreground mt-2 space-y-1 text-sm">
          <li>
            <strong>{t(lang, "guideBuyReadPriceYenLabel")}</strong> = {t(lang, "guideBuyReadPriceYenDesc")}
          </li>
          <li>
            <strong>{t(lang, "guideBuyReadPriceBahtLabel")}</strong> = {t(lang, "guideBuyReadPriceBahtDesc")}
          </li>
          <li>
            <strong>{t(lang, "guideBuyReadPriceChangeLabel")}</strong> = {t(lang, "guideBuyReadPriceChangeDesc")}
          </li>
          <li>
            <strong>Community Price</strong> = {t(lang, "guideBuyReadPriceCommunityDesc")}
          </li>
        </ul>
      </div>

      <RelatedPages
        items={[
          { href: "/marketplace", icon: Store, title: "Marketplace", description: t(lang, "guideBuyRelatedMarketDesc") },
          { href: "/guide/sets", icon: Layers, title: t(lang, "guideBuyRelatedSetsTitle"), description: t(lang, "guideBuyRelatedSetsDesc") },
        ]}
      />

      <div className="flex items-center justify-between border-t border-border pt-6">
        <Link
          href="/guide/sets"
          className="text-muted-foreground text-sm hover:text-foreground"
        >
          ← Sets
        </Link>
        <Link
          href="/"
          className="group inline-flex items-center gap-2 font-sans text-sm font-semibold text-primary hover:underline"
        >
          {t(lang, "guideBuyCtaSearch")}
          <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
        </Link>
      </div>
    </div>
  );
}
