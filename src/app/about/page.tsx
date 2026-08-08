import { JsonLd } from "@/lib/seo/json-ld-script";
import { breadcrumbJsonLd, organizationJsonLd } from "@/lib/seo/json-ld";
import { CONTACT_FACEBOOK_URL, SEO_PAGE_META } from "@/lib/seo/copy/site";
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
      {/* Brand entity, rendered once site-wide. `sameAs` carries the Facebook
          page because it is the team's real, owner-confirmed profile — and the
          same URL is the ContactPoint, since no mailbox is monitored. */}
      <JsonLd
        data={organizationJsonLd({
          sameAs: [CONTACT_FACEBOOK_URL],
          contactUrl: CONTACT_FACEBOOK_URL,
        })}
      />
      <AboutClient />
    </>
  );
}
