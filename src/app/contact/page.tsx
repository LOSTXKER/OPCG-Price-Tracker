import { JsonLd } from "@/lib/seo/json-ld-script";
import { breadcrumbJsonLd } from "@/lib/seo/json-ld";
import { SEO_PAGE_META } from "@/lib/seo/copy/site";
import { buildPageMetadata } from "@/lib/seo/page-metadata";
import ContactClient from "./contact-client";

export const metadata = buildPageMetadata({
  title: SEO_PAGE_META.contact.title,
  description: SEO_PAGE_META.contact.description,
  canonical: "/contact",
});

export default function ContactPage() {
  return (
    <>
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "Home", href: "/" },
          { name: "Contact", href: "/contact" },
        ])}
      />
      <ContactClient />
    </>
  );
}
