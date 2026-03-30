import type { Metadata } from "next";
import { Breadcrumb } from "@/components/shared/breadcrumb";
import { JsonLd } from "@/lib/seo/json-ld-script";
import { breadcrumbJsonLd } from "@/lib/seo/json-ld";
import PullCalculatorClient from "./pull-calculator-client";

export const metadata: Metadata = {
  title: "Pull Calculator",
  description:
    "Calculate your odds of pulling specific OPCG cards from booster boxes. Estimate pack and box probabilities by rarity.",
  alternates: { canonical: "/pull-calculator" },
};

export default function PullCalculatorPage() {
  return (
    <>
      <JsonLd data={breadcrumbJsonLd([{ name: "Home", href: "/" }, { name: "Pull Calculator", href: "/pull-calculator" }])} />
      <Breadcrumb items={[{ label: "Home", href: "/" }, { label: "Pull Calculator" }]} />
      <PullCalculatorClient />
    </>
  );
}
