import type { Metadata } from "next";
import { Breadcrumb } from "@/components/shared/breadcrumb";
import { JsonLd } from "@/lib/seo/json-ld-script";
import { breadcrumbJsonLd } from "@/lib/seo/json-ld";
import CompareClient from "./compare-client";

export const metadata: Metadata = {
  title: "Compare Cards",
  description:
    "Compare OPCG card prices, stats and price history side by side. Find the best value across different cards and rarities.",
  alternates: { canonical: "/compare" },
};

export default function ComparePage() {
  return (
    <>
      <JsonLd data={breadcrumbJsonLd([{ name: "Home", href: "/" }, { name: "Compare Cards", href: "/compare" }])} />
      <Breadcrumb items={[{ label: "Home", href: "/" }, { label: "Compare Cards" }]} />
      <CompareClient />
    </>
  );
}
