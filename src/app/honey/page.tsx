import { JsonLd } from "@/lib/seo/json-ld-script";
import { breadcrumbJsonLd } from "@/lib/seo/json-ld";
import { HoneyPublicExplainer } from "@/components/honey/honey-public-explainer";
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
      <HoneyClient />
      {/* Indexable explainer for logged-out visitors and crawlers — the honey
          dashboard itself only resolves after client-side auth. */}
      <HoneyPublicExplainer />
    </>
  );
}
