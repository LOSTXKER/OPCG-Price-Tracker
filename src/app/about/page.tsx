import { JsonLd } from "@/lib/seo/json-ld-script";
import { breadcrumbJsonLd, organizationJsonLd } from "@/lib/seo/json-ld";
import { SEO_PAGE_META, SUPPORT_EMAIL } from "@/lib/seo/copy/site";
import { buildPageMetadata } from "@/lib/seo/page-metadata";
import AboutClient from "./about-client";

export const metadata = buildPageMetadata({
  title: SEO_PAGE_META.about.title,
  description: SEO_PAGE_META.about.description,
  canonical: "/about",
});

export default function AboutPage() {
  return (
    <>
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "Home", href: "/" },
          { name: "About", href: "/about" },
        ])}
      />
      {/* Brand entity, rendered once site-wide. `sameAs` is omitted on purpose:
          no verified social profile is linked from this page yet, and inventing
          one would be a false trust signal. */}
      <JsonLd data={organizationJsonLd({ email: SUPPORT_EMAIL })} />
      <AboutClient />
    </>
  );
}
