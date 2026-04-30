import type { Metadata } from "next";
import { JsonLd } from "@/lib/seo/json-ld-script";
import { breadcrumbJsonLd } from "@/lib/seo/json-ld";
import AboutClient from "./about-client";

export const metadata: Metadata = {
  title: "About Us",
  description:
    "Meecard is an independent One Piece Card Game price tracker — daily prices, portfolio tools, marketplace and calculators built for collectors.",
  alternates: { canonical: "/about" },
};

export default function AboutPage() {
  return (
    <>
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "Home", href: "/" },
          { name: "About", href: "/about" },
        ])}
      />
      <AboutClient />
    </>
  );
}
