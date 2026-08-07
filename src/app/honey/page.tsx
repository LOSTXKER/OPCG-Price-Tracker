import { JsonLd } from "@/lib/seo/json-ld-script";
import { breadcrumbJsonLd } from "@/lib/seo/json-ld";
import { SEO_PAGE_META } from "@/lib/seo/copy/site";
import { buildPageMetadata } from "@/lib/seo/page-metadata";
import HoneyClient from "./honey-client";

export const metadata = buildPageMetadata({
  title: SEO_PAGE_META.honey.title,
  description: SEO_PAGE_META.honey.description,
  canonical: "/honey",
});

export default function HoneyPage() {
  return (
    <>
      <JsonLd data={breadcrumbJsonLd([{ name: "Home", href: "/" }, { name: "Honey Rewards", href: "/honey" }])} />
      {/* HoneyClient owns the indexable explainer for logged-out visitors and
          crawlers itself now — it has to run in the exact same auth-unknown
          branch that renders on the server, not as a sibling mounted after
          it (see the CLS note in honey-client.tsx). */}
      <HoneyClient />
    </>
  );
}
