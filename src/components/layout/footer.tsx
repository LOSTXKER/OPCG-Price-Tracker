"use client";

import Link from "next/link";
import { useUIStore } from "@/stores/ui-store";
import { t } from "@/lib/i18n";

export function Footer() {
  const lang = useUIStore((s) => s.language);

  const quickLinks = [
    { label: t(lang, "market"), href: "/" },
    { label: t(lang, "sets"), href: "/sets" },
    { label: t(lang, "dropCalc"), href: "/pull-calculator" },
    { label: t(lang, "marketplace"), href: "/marketplace" },
  ];

  const resourceLinks = [
    { label: t(lang, "gettingStarted"), href: "/guide/getting-started" },
    { label: t(lang, "cardTypesGuide"), href: "/guide/card-types" },
    { label: t(lang, "raritiesGuide"), href: "/guide/rarities" },
    { label: t(lang, "colorsGuide"), href: "/guide/colors" },
  ];
  return (
    <footer className="hidden border-t border-border/30 md:block">
      <div className="mx-auto max-w-6xl px-4 py-10 md:px-6">
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {/* Brand */}
          <div className="lg:col-span-2">
            <p className="text-sm font-semibold text-foreground">Meecard</p>
            <p className="mt-2 max-w-sm text-xs leading-relaxed text-muted-foreground">
              One Piece Card Game price tracker updated daily.
              Prices from Yuyu-tei, portfolio & collection tracking.
            </p>
            <p className="mt-4 text-[11px] text-muted-foreground/60">
              Price data sourced from Yuyu-tei &middot; Card images &copy; BANDAI
            </p>
          </div>

          {/* Quick links */}
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground/60">
              {t(lang, "quickLinks")}
            </p>
            <nav className="mt-3 flex flex-col gap-2">
              {quickLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="text-xs text-muted-foreground transition-colors hover:text-foreground"
                >
                  {link.label}
                </Link>
              ))}
            </nav>
          </div>

          {/* Resources */}
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground/60">
              {t(lang, "guide")}
            </p>
            <nav className="mt-3 flex flex-col gap-2">
              {resourceLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="text-xs text-muted-foreground transition-colors hover:text-foreground"
                >
                  {link.label}
                </Link>
              ))}
            </nav>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-8 flex items-center justify-between border-t border-border/30 pt-6">
          <p className="text-[11px] text-muted-foreground/50">
            &copy; {new Date().getFullYear()} Meecard
          </p>
          <nav className="flex items-center gap-4 text-[11px] text-muted-foreground/50">
            <Link href="/guide" className="transition-colors hover:text-muted-foreground">
              {t(lang, "guide")}
            </Link>
            <a
              href="mailto:support@meecard.app"
              className="transition-colors hover:text-muted-foreground"
            >
              {t(lang, "contact")}
            </a>
          </nav>
        </div>
      </div>
    </footer>
  );
}
