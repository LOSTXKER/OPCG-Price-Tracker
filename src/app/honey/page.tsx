import type { Metadata } from "next";
import { Breadcrumb } from "@/components/shared/breadcrumb";
import { JsonLd } from "@/lib/seo/json-ld-script";
import { breadcrumbJsonLd } from "@/lib/seo/json-ld";
import HoneyClient from "./honey-client";

export const metadata: Metadata = {
  title: "Honey Rewards",
  description:
    "Earn Honey points by contributing to the Meecard community. Complete daily missions, achievements and climb the leaderboard.",
  alternates: { canonical: "/honey" },
};

export default function HoneyPage() {
  return (
    <>
      <JsonLd data={breadcrumbJsonLd([{ name: "Home", href: "/" }, { name: "Honey Rewards", href: "/honey" }])} />
      <Breadcrumb items={[{ label: "Home", href: "/" }, { label: "Honey Rewards" }]} />
      <HoneyClient />
    </>
  );
}
