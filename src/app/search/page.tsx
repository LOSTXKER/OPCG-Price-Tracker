import type { Metadata } from "next";
import { Suspense } from "react";
import { Layers, TrendingUp, GitCompareArrows } from "lucide-react";
import { Breadcrumb } from "@/components/shared/breadcrumb";
import { RelatedPages } from "@/components/shared/related-pages";
import { JsonLd } from "@/lib/seo/json-ld-script";
import { breadcrumbJsonLd } from "@/lib/seo/json-ld";
import SearchClient from "./search-client";

export const metadata: Metadata = {
  title: "Search Cards",
  description:
    "Search the entire OPCG card database. Find cards by name, set, rarity, color and more.",
  alternates: { canonical: "/search" },
};

export default function SearchPage() {
  return (
    <>
      <JsonLd data={breadcrumbJsonLd([{ name: "Home", href: "/" }, { name: "Search", href: "/search" }])} />
      <Breadcrumb items={[{ label: "Home", href: "/" }, { label: "Search" }]} />
      <Suspense>
        <SearchClient />
      </Suspense>
      <RelatedPages items={[
        { href: "/sets", icon: Layers, title: "ชุดการ์ด", description: "ดูทุกชุดการ์ดพร้อมมูลค่า" },
        { href: "/trending", icon: TrendingUp, title: "Trending", description: "การ์ดที่ราคาขยับมากที่สุด" },
        { href: "/compare", icon: GitCompareArrows, title: "เปรียบเทียบ", description: "เทียบการ์ดหลายใบ" },
      ]} />
    </>
  );
}
