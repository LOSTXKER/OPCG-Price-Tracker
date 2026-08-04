import type { Metadata } from "next";

import { JsonLd } from "@/lib/seo/json-ld-script";
import { breadcrumbJsonLd } from "@/lib/seo/json-ld";
import { TOOL_PAGE_METADATA } from "@/lib/seo/copy/tools";

export const metadata: Metadata = {
  title: TOOL_PAGE_METADATA.decks.title,
  description: TOOL_PAGE_METADATA.decks.description,
  alternates: { canonical: TOOL_PAGE_METADATA.decks.canonical },
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
