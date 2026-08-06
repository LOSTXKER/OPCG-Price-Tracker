import type { Metadata } from "next";

/**
 * Standard metadata for an indexable SEO page: title/description +
 * self-canonical + a matching openGraph block whose og:url equals the
 * canonical.
 *
 * Why this exists (SEO round 2): almost every page declared only
 * title/description/canonical, so og:title/og:description fell back to the
 * ROOT layout's values — sharing any page through LINE/Facebook (the main
 * channel for Thai collectors) showed the homepage preview, and og:url was
 * missing entirely. One helper, one shape, no per-page drift.
 *
 * Usage: `export const metadata = buildPageMetadata({...})`, or spread the
 * result inside `generateMetadata` and override what the page computes.
 * `title` here is the VISIBLE part only — the root layout's template appends
 * " | Meecard" to the <title>; og:title deliberately stays untemplated (the
 * share card already shows the site name separately).
 */
export function buildPageMetadata(opts: {
  title: string;
  description: string;
  /** Path form, e.g. "/guide/authenticity" — resolved against metadataBase. */
  canonical: string;
  /** Absolute or path image URL; omit to fall back to the site-wide OG image. */
  ogImage?: string | null;
  /** "article" for guide/editorial pages, "website" (default) otherwise. */
  ogType?: "website" | "article";
}): Metadata {
  const { title, description, canonical, ogImage, ogType = "website" } = opts;
  return {
    title,
    description,
    alternates: { canonical },
    openGraph: {
      title,
      description,
      url: canonical,
      type: ogType,
      locale: "th_TH",
      ...(ogImage ? { images: [ogImage] } : {}),
    },
    twitter: { card: "summary_large_image", title, description },
  };
}
