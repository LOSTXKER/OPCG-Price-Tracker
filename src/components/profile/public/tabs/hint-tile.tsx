"use client";

import Link from "next/link";
import {
  ArrowRight,
  ImagePlus,
  Layers,
  Package,
  Sparkles,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { CARD_BG } from "@/lib/constants/ui";
import { t, type Language } from "@/lib/i18n";
import { cn } from "@/lib/utils";

/**
 * Companion card rendered alongside a lone listing/collection item so the
 * grid doesn't read as a single orphan tile in a sea of empty columns.
 *
 * Visual contract: the tile mirrors the listing card it pairs with —
 * same `.panel` surface, same `aspect-[63/88]` top "image" area (filled
 * with a brand-warm gradient + centered icon), same bottom info block.
 * The dashed border + softer surface make it read as a "ghost" card
 * (placeholder/CTA) rather than a real listing.
 *
 * Two flavours:
 *   - listings: links to "/marketplace/create" for owners or to the
 *     seller's marketplace page for visitors when more inventory exists
 *   - collection: links to "/portfolio" for owners; renders a quiet
 *     non-link tile for visitors
 */
export function HintTile({
  kind,
  isOwner,
  href,
  className,
  lang,
}: {
  kind: "listings" | "collection";
  isOwner: boolean;
  /**
   * Optional href override — listings tab passes its marketplace URL when
   * `listingTotal > 1`, otherwise the tile becomes a non-link.
   */
  href?: string | null;
  className?: string;
  lang: Language;
}) {
  const config = resolveConfig({ kind, isOwner, href, lang });
  const Icon = config.icon;
  const isInteractive = !!config.href;

  const wrapperClass = cn(
    "group/hint relative flex h-full flex-col overflow-hidden rounded-xl border border-dashed",
    "border-primary/25 bg-card/40 transition-all duration-200",
    isInteractive &&
      "hover:border-primary/60 hover:bg-primary/[0.04]",
    className,
  );

  const body = (
    <>
      {/* Top "image" area — same aspect ratio as the paired listing card */}
      <div
        className={cn(
          "relative aspect-[63/88] w-full overflow-hidden",
          CARD_BG,
        )}
      >
        {/* Brand-warm gradient wash so the empty area still feels deliberate */}
        <div
          aria-hidden
          className="absolute inset-0 bg-gradient-to-br from-primary/12 via-amber-500/8 to-rose-300/10"
        />
        {/* Soft radial glow behind the icon */}
        <div
          aria-hidden
          className="absolute inset-0 opacity-70"
          style={{
            backgroundImage:
              "radial-gradient(60% 50% at 50% 45%, rgba(115,83,62,0.18), transparent 70%)",
          }}
        />
        {/* Centered icon medallion */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div
            className={cn(
              "relative flex size-16 items-center justify-center rounded-2xl bg-background/85 text-primary shadow-sm ring-1 ring-primary/15",
              "transition-transform duration-200",
              isInteractive && "group-hover/hint:scale-105",
            )}
          >
            <Icon className="size-7" aria-hidden />
            {isInteractive && (
              <Sparkles
                className="absolute -right-1.5 -top-1.5 size-4 text-amber-500 opacity-80"
                aria-hidden
              />
            )}
          </div>
        </div>
      </div>

      {/* Bottom info area — same padding/typography as the listing card */}
      <div className="flex flex-1 flex-col p-2.5">
        <p
          className="truncate text-sm font-semibold leading-snug text-foreground"
          title={config.title}
        >
          {config.title}
        </p>
        {config.subtitle && (
          <p className="mt-1 line-clamp-2 text-meta">{config.subtitle}</p>
        )}
        {config.cta && (
          <div className="mt-auto pt-2">
            <span className="inline-flex items-center gap-1 text-xs font-semibold text-primary">
              {config.cta}
              <ArrowRight
                className={cn(
                  "size-3.5 transition-transform",
                  isInteractive && "group-hover/hint:translate-x-0.5",
                )}
              />
            </span>
          </div>
        )}
      </div>
    </>
  );

  if (config.href) {
    return (
      <Link
        href={config.href}
        className={cn(wrapperClass, "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring")}
      >
        {body}
      </Link>
    );
  }
  return <div className={wrapperClass}>{body}</div>;
}

type Resolved = {
  icon: LucideIcon;
  title: string;
  subtitle: string;
  cta: string | null;
  href: string | null;
};

function resolveConfig({
  kind,
  isOwner,
  href,
  lang,
}: {
  kind: "listings" | "collection";
  isOwner: boolean;
  href?: string | null;
  lang: Language;
}): Resolved {
  if (kind === "listings") {
    if (isOwner) {
      return {
        icon: ImagePlus,
        title: t(lang, "completenessListing"),
        subtitle: t(lang, "completenessSubtitle"),
        cta: t(lang, "startSelling"),
        href: "/marketplace/create",
      };
    }
    if (href) {
      return {
        icon: Package,
        title: t(lang, "showcaseViewAll"),
        subtitle: t(lang, "tabListings"),
        cta: t(lang, "showcaseViewAll"),
        href,
      };
    }
    return {
      icon: Package,
      title: t(lang, "noListingsPublic"),
      subtitle: "",
      cta: null,
      href: null,
    };
  }

  // kind === "collection"
  if (isOwner) {
    return {
      icon: Layers,
      title: t(lang, "completenessCard"),
      subtitle: t(lang, "addYourFirstCard"),
      cta: t(lang, "addYourFirstCard"),
      href: "/portfolio",
    };
  }
  return {
    icon: Layers,
    title: t(lang, "tabCollection"),
    subtitle: t(lang, "noCollectionYet"),
    cta: null,
    href: null,
  };
}
