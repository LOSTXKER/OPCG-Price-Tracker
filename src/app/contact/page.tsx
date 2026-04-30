import type { Metadata } from "next";
import { JsonLd } from "@/lib/seo/json-ld-script";
import { breadcrumbJsonLd } from "@/lib/seo/json-ld";
import ContactClient from "./contact-client";

export const metadata: Metadata = {
  title: "Contact Us",
  description:
    "Get in touch with the Meecard team — questions, feedback, bug reports, or partnership requests.",
  alternates: { canonical: "/contact" },
};

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
