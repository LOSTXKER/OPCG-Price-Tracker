"use client";

import Link from "next/link";
import Image from "next/image";
import {
  BookOpen,
  Compass,
  Crown,
  Info,
  Mail,
  Sparkles,
  Wrench,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useUIStore } from "@/stores/ui-store";
import { usePublicConfig } from "@/hooks/use-public-config";
import { t } from "@/lib/i18n";

type FooterLink = {
  href: string;
  label: string;
};

type FooterColumn = {
  title: string;
  icon: LucideIcon;
  links: FooterLink[];
};

export function Footer() {
  const lang = useUIStore((s) => s.language);
  const { config } = usePublicConfig();
  const year = new Date().getFullYear();

  const exploreLinks: FooterLink[] = [
    { href: "/", label: t(lang, "market") },
    { href: "/sets", label: t(lang, "sets") },
    { href: "/cards", label: t(lang, "cards") },
    { href: "/trending", label: t(lang, "footerTrending") },
    { href: "/market-overview", label: t(lang, "marketOverview") },
  ];

  const toolLinks: FooterLink[] = [
    { href: "/drop-calculator", label: t(lang, "dropCalculator") },
    { href: "/deck-calculator", label: t(lang, "deckCalculatorNav") },
    { href: "/compare", label: t(lang, "compareCards") },
    { href: "/portfolio", label: t(lang, "portfolioNav") },
    { href: "/watchlist", label: t(lang, "watchlistNav") },
  ];

  const communityLinks: FooterLink[] = [
    ...(config.marketplaceEnabled
      ? [
          { href: "/marketplace", label: t(lang, "marketplace") },
          { href: "/seller", label: t(lang, "footerSell") },
        ]
      : []),
    { href: "/honey", label: t(lang, "honeyPageTitle") },
    { href: "/raffle/winners", label: t(lang, "footerPrizeWinners") },
    { href: "/blog", label: t(lang, "footerBlog") },
    { href: "/pricing", label: t(lang, "pricing") },
  ];

  const guideLinks: FooterLink[] = [
    { href: "/guide/getting-started", label: t(lang, "gettingStarted") },
    { href: "/guide/card-types", label: t(lang, "cardTypesGuide") },
    { href: "/guide/rarities", label: t(lang, "raritiesGuide") },
    { href: "/guide/colors", label: t(lang, "colorsGuide") },
    { href: "/guide/sets", label: t(lang, "footerSetsGuide") },
    { href: "/guide/buying", label: t(lang, "footerBuyingGuide") },
  ];

  const columns: FooterColumn[] = [
    { title: t(lang, "footerExplore"), icon: Compass, links: exploreLinks },
    { title: t(lang, "tools"), icon: Wrench, links: toolLinks },
    { title: t(lang, "footerCommunity"), icon: Sparkles, links: communityLinks },
    { title: t(lang, "guide"), icon: BookOpen, links: guideLinks },
  ];

  return (
    <footer className="border-t border-hair bg-gradient-to-b from-transparent via-muted/10 to-muted/20">
      {/* pb clears the fixed mobile bottom-nav (md+ has no bottom-nav). */}
      <div className="mx-auto max-w-7xl px-4 pt-10 pb-28 md:px-6 md:py-12 md:pb-12 lg:px-8">
        <div className="grid gap-10 lg:grid-cols-12">
          {/* Brand block */}
          <div className="lg:col-span-4">
            <Link href="/" className="inline-flex items-center gap-2.5">
              <Image
                src="/meecard.png"
                alt="Meecard"
                width={32}
                height={29}
                className="h-auto select-none"
              />
              <span className="text-base font-bold tracking-tight">Meecard</span>
            </Link>

            <p className="mt-4 max-w-sm text-body-sm text-muted-foreground">
              {t(lang, "footerTagline")}
            </p>

            <div className="mt-5 flex flex-wrap items-center gap-1.5">
              <span className="inline-flex items-center rounded-full border border-hair bg-background/60 px-2.5 py-1 text-micro text-muted-foreground">
                {t(lang, "footerLanguagesLine")}
              </span>
              <span className="inline-flex items-center rounded-full border border-hair bg-background/60 px-2.5 py-1 text-micro text-muted-foreground">
                {t(lang, "footerCurrenciesLine")}
              </span>
            </div>

            <Link
              href="/pricing"
              className="ease-chrome mt-5 inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1.5 text-xs font-medium text-primary transition-colors hover:bg-primary/15"
            >
              <Crown className="size-3.5" />
              {t(lang, "pricing")}
            </Link>

            <p className="mt-6 text-meta text-muted-foreground/70">
              {t(lang, "footerSources")}
            </p>
            <p className="mt-1 max-w-sm text-meta text-muted-foreground/50">
              {t(lang, "footerDisclaimer")}
            </p>
          </div>

          {/* Link columns */}
          <div className="grid grid-cols-2 gap-8 sm:grid-cols-4 lg:col-span-8">
            {columns.map((col) => (
              <FooterColumnView key={col.title} column={col} />
            ))}
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-12 flex flex-col gap-3 border-t border-hair pt-6 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-meta text-muted-foreground/70">
            &copy; {year} Meecard
          </p>
          <nav className="flex flex-wrap items-center gap-x-5 gap-y-2 text-meta text-muted-foreground/70">
            <Link
              href="/about"
              className="ease-chrome inline-flex items-center gap-1 transition-colors hover:text-foreground"
            >
              <Info className="size-3.5" />
              {t(lang, "aboutUs")}
            </Link>
            <Link
              href="/guide"
              className="ease-chrome transition-colors hover:text-foreground"
            >
              {t(lang, "guide")}
            </Link>
            <Link
              href="/pricing"
              className="ease-chrome transition-colors hover:text-foreground"
            >
              {t(lang, "pricing")}
            </Link>
            <Link
              href="/contact"
              className="ease-chrome inline-flex items-center gap-1 transition-colors hover:text-foreground"
            >
              <Mail className="size-3.5" />
              {t(lang, "contactUs")}
            </Link>
          </nav>
        </div>
      </div>
    </footer>
  );
}

function FooterColumnView({ column }: { column: FooterColumn }) {
  const Icon = column.icon;
  return (
    <div>
      <div className="flex items-center gap-1.5">
        <Icon className="size-3 text-primary/60" />
        <p className="text-eyebrow text-primary/60">{column.title}</p>
      </div>
      <nav className="mt-3 flex flex-col gap-2">
        {column.links.map((link) => (
          <Link
            key={`${column.title}-${link.href}`}
            href={link.href}
            className="text-meta ease-chrome transition-colors hover:text-foreground"
          >
            {link.label}
          </Link>
        ))}
      </nav>
    </div>
  );
}
