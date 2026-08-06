import type { Metadata } from "next";

import { JsonLd } from "@/lib/seo/json-ld-script";
import { breadcrumbJsonLd } from "@/lib/seo/json-ld";
import { buildPageMetadata } from "@/lib/seo/page-metadata";
import { TOOL_PAGE_METADATA } from "@/lib/seo/copy/tools";

// noindex (SEO round 2, owner-approved option ข, 2026-08-07): this hub is a
// thin navigation page (intro + 3 links) whose title/description used to
// nearly duplicate /opcg/deck-calculator, risking Google indexing the wrong
// page for "สร้างเด็ค/คำนวณราคา" queries. Un-noindex once this route ships
// real sample-deck content of its own — until then it's link-equity-only
// (follow: true keeps the links to the tools crawlable).
export const metadata: Metadata = {
  ...buildPageMetadata({
    title: TOOL_PAGE_METADATA.decks.title,
    description: TOOL_PAGE_METADATA.decks.description,
    canonical: TOOL_PAGE_METADATA.decks.canonical,
  }),
  robots: { index: false, follow: true },
};

export default function DecksLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      {/* BreadcrumbList — matches the sibling tool routes. The page itself is a
          client component, so the structured data is emitted from this server
          layout. */}
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "Home", href: "/" },
          { name: "Decks & Tools", href: "/opcg/decks" },
        ])}
      />
      {children}
    </>
  );
}
