import type { Metadata } from "next";
import { Breadcrumb } from "@/components/shared/breadcrumb";
import { JsonLd } from "@/lib/seo/json-ld-script";
import { breadcrumbJsonLd } from "@/lib/seo/json-ld";
import DropCalculatorClient from "./drop-calculator-client";

export const metadata: Metadata = {
  title: "Drop Calculator",
  description:
    "Calculate your odds of pulling specific OPCG cards from booster boxes. Estimate pack and box probabilities by rarity.",
  alternates: { canonical: "/drop-calculator" },
};

export default function DropCalculatorPage() {
  return (
    <>
      <JsonLd data={breadcrumbJsonLd([{ name: "Home", href: "/" }, { name: "Drop Calculator", href: "/drop-calculator" }])} />
      <Breadcrumb items={[{ label: "Home", href: "/" }, { label: "Drop Calculator" }]} />
      <DropCalculatorClient />
    </>
  );
}
