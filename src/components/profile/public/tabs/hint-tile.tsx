"use client";

import Link from "next/link";
import {
  ArrowRight,
  ImagePlus,
  Layers,
  Package,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

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

  // Collection cards are pure 63:88 portraits (no info area), so the hint
  // tile sized "image area + info area below" used to read as visibly
  // taller than its paired card. We collapse everything into a single
  // 63:88 box and centre it. Listings cards already have their own info
  // area, so they keep the original split layout.
  const isCollection = kind === "collection";

  const wrapperClass = cn(
    "group/hint relative overflow-hidden rounded-xl border border-dashed",
    "border-hair bg-transparent transition-colors duration-200",
    isCollection ? "aspect-[63/88] flex" : "flex h-full flex-col",
    isInteractive && "hover:border-primary/50 hover:bg-card/40",
    className,
  );

  const body = isCollection ? (
    <div className="flex flex-1 flex-col items-center justify-center gap-2.5 p-3 text-center">
      <div
        className={cn(
          "flex size-12 items-center justify-center rounded-full bg-muted/40 text-muted-foreground transition-colors duration-200",
          isInteractive && "group-hover/hint:bg-primary/10 group-hover/hint:text-primary",
        )}
      >
        <Icon className="size-5" aria-hidden />
      </div>
      <p
        className="line-clamp-2 text-balance text-body-sm font-semibold leading-snug text-foreground"
        title={config.title}
      >
        {config.title}
      </p>
      {config.cta && (
        <span className="inline-flex items-center gap-1 text-xs font-medium text-primary">
          {config.cta}
          <ArrowRight
            className={cn(
              "size-3.5 transition-transform",
              isInteractive && "group-hover/hint:translate-x-0.5",
            )}
          />
        </span>
      )}
    </div>
  ) : (
    <>
      {/* Top "image" area — mirrors the listing card's image surface so
          the ghost tile lines up to the pixel with its paired card. Kept
          deliberately quiet (no gradient wash, no sparkle). */}
      <div className="relative aspect-[63/88] w-full overflow-hidden">
        <div className="absolute inset-0 flex items-center justify-center">
          <div
            className={cn(
              "flex size-12 items-center justify-center rounded-full bg-muted/40 text-muted-foreground transition-colors duration-200",
              isInteractive && "group-hover/hint:bg-primary/10 group-hover/hint:text-primary",
            )}
          >
            <Icon className="size-5" aria-hidden />
          </div>
        </div>
      </div>

      {/* Bottom info area — same padding/typography as the listing card.
          Title wraps to two lines (no `truncate`) because Thai action
          phrases like "เพิ่มการ์ดในคอลเลกชัน" easily exceed the narrow
          column width; truncating felt cramped. `text-balance` evens
          out the two-line break so the second line doesn't end up with
          a single dangling syllable like "เลกชัน". Subtitle is hidden
          when it would just repeat the CTA verbatim. */}
      <div className="flex flex-1 flex-col p-2.5">
        <p
          className="line-clamp-2 text-balance text-body-sm font-semibold leading-snug text-foreground"
          title={config.title}
        >
          {config.title}
        </p>
        {config.subtitle && config.subtitle !== config.cta && (
          <p className="mt-1 line-clamp-2 text-balance text-meta">
            {config.subtitle}
          </p>
        )}
        {config.cta && (
          <div className="mt-auto pt-2">
            <span className="inline-flex items-center gap-1 text-xs font-medium text-primary">
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
  // The narrow tile column doesn't fit a meaningful subtitle in addition
  // to title + CTA, so for the action-oriented owner/visitor flows we
  // intentionally drop the subtitle and let the title carry the message.
  if (kind === "listings") {
    if (isOwner) {
      return {
        icon: ImagePlus,
        title: t(lang, "completenessListing"),
        subtitle: "",
        cta: t(lang, "startSelling"),
        href: "/marketplace/create",
      };
    }
    if (href) {
      return {
        icon: Package,
        title: t(lang, "showcaseViewAll"),
        subtitle: "",
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
      subtitle: "",
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
