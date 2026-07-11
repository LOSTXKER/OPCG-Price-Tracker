import type { Metadata } from "next";
import { LocalizedBreadcrumb } from "@/components/shared/localized-breadcrumb";
import { JsonLd } from "@/lib/seo/json-ld-script";
import { breadcrumbJsonLd } from "@/lib/seo/json-ld";
import DeckCalculatorClient from "./deck-calculator-client";

export const metadata: Metadata = {
  title: "Deck Calculator",
  description:
    "Calculate the total value of your OPCG deck. Add cards and instantly see the combined cost in JPY, THB and USD.",
  alternates: { canonical: "/opcg/deck-calculator" },
};

export default function DeckCalculatorPage() {
  return (
    <>
      <JsonLd data={breadcrumbJsonLd([{ name: "Home", href: "/" }, { name: "Deck Calculator", href: "/opcg/deck-calculator" }])} />
      <LocalizedBreadcrumb items={[{ labelKey: "home", href: "/" }, { labelKey: "deckCalculatorNav" }]} />
      <DeckCalculatorClient />
    </>
  );
}
