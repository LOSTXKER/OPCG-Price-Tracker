import Link from "next/link";
import type { Metadata } from "next";
import { ArrowRight, TrendingUp } from "lucide-react";
import { RARITIES } from "@/lib/constants/rarities";
import { Breadcrumb } from "@/components/shared/breadcrumb";
import { RelatedPages } from "@/components/shared/related-pages";
import { JsonLd } from "@/lib/seo/json-ld-script";
import { breadcrumbJsonLd } from "@/lib/seo/json-ld";

export const metadata: Metadata = {
  title: "Rarities — คู่มือ OPCG",
  description:
    "Complete guide to OPCG card rarities: Common, Uncommon, Rare, Super Rare, Secret Rare, and more. Pull rates and price ranges.",
  alternates: { canonical: "/guide/rarities" },
};

const rarityDescriptions: Record<string, { thaiName: string; description: string; priceRange: string }> = {
  C: {
    thaiName: "Common",
    description: "การ์ดพื้นฐานที่พบได้ง่ายที่สุด ทุกแพ็คจะมีการ์ด C จำนวนมาก",
    priceRange: "~10-30 บาท",
  },
  UC: {
    thaiName: "Uncommon",
    description: "การ์ดที่ไม่ธรรมดา พบได้ไม่ยากแต่มีค่ามากกว่า Common",
    priceRange: "~20-80 บาท",
  },
  R: {
    thaiName: "Rare",
    description: "การ์ดหายาก มักมี Effect ที่แรงกว่าและมีภาพสวยกว่า",
    priceRange: "~50-300 บาท",
  },
  SR: {
    thaiName: "Super Rare",
    description: "การ์ดหายากมาก มี Effect ทรงพลังและงานศิลป์พิเศษ เป็นที่ต้องการของทั้งนักสะสมและนักเล่น",
    priceRange: "~200-2,000 บาท",
  },
  SEC: {
    thaiName: "Secret Rare",
    description: "การ์ดหายากสุดๆ มีโอกาสน้อยมากที่จะเจอในแพ็ค งานศิลป์พิเศษระดับพรีเมียม",
    priceRange: "~1,000-30,000+ บาท",
  },
  L: {
    thaiName: "Leader",
    description: "การ์ด Leader สำหรับเป็นหัวหน้าเด็ค พบได้เฉพาะในแพ็ค Starter หรือ Booster",
    priceRange: "~50-500 บาท",
  },
  SP: {
    thaiName: "Special",
    description: "การ์ดพิเศษสุดหายาก มักเป็น Manga Art หรือ Alternate Art ที่สวยมาก",
    priceRange: "~5,000-50,000+ บาท",
  },
  P: {
    thaiName: "Promo",
    description: "การ์ดโปรโมชัน แจกในงานอีเวนต์หรือมาพร้อมสินค้าเฉพาะ",
    priceRange: "แล้วแต่ความหายาก",
  },
  DON: {
    thaiName: "DON!!",
    description: "การ์ด DON!! ใช้สำหรับเล่นการ์ดอื่น เพิ่มพลังตัวละคร มีเวอร์ชันพิเศษที่สะสมได้",
    priceRange: "~100-50,000+ บาท",
  },
};

export default function RaritiesPage() {
  const uniqueRarities = RARITIES.filter(
    (r) => !r.code.startsWith("P-")
  );

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <JsonLd data={breadcrumbJsonLd([
        { name: "Home", href: "/" },
        { name: "Guide", href: "/guide" },
        { name: "Rarities", href: "/guide/rarities" },
      ])} />
      <div className="space-y-3">
        <Breadcrumb items={[
          { label: "Home", href: "/" },
          { label: "Guide", href: "/guide" },
          { label: "Rarities" },
        ]} />
        <h1 className="font-sans text-3xl font-bold tracking-tight">
          Rarities
        </h1>
        <p className="text-muted-foreground text-lg">
          ยิ่งหายากยิ่งแพง — ทำความรู้จักกับระดับความหายากของ OPCG
        </p>
      </div>

      <div className="space-y-3">
        {uniqueRarities.map((rarity) => {
          const info = rarityDescriptions[rarity.code];
          if (!info) return null;
          return (
            <div
              key={rarity.code}
              className="panel flex items-start gap-4 p-4 transition-colors hover:bg-accent/50"
            >
              <div
                className="flex size-12 shrink-0 items-center justify-center rounded-lg font-sans text-lg font-bold text-white"
                style={{ backgroundColor: rarity.color }}
              >
                {rarity.code}
              </div>
              <div className="min-w-0 flex-1 space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="font-sans text-base font-semibold">
                    {rarity.name}
                  </h2>
                  <span className="text-muted-foreground text-sm">
                    {info.thaiName}
                  </span>
                </div>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  {info.description}
                </p>
                <p className="text-sm">
                  <span className="text-muted-foreground">ราคาประมาณ: </span>
                  <span className="font-mono font-medium text-foreground">
                    {info.priceRange}
                  </span>
                </p>
              </div>
            </div>
          );
        })}
      </div>

      <div className="rounded-xl border border-dashed border-border/30 bg-muted/5 p-4">
        <h3 className="font-sans text-sm font-semibold text-foreground">
          💡 เคล็ดลับ
        </h3>
        <p className="text-muted-foreground mt-1 text-sm leading-relaxed">
          การ์ด Parallel (P-SR, P-SEC ฯลฯ) คือเวอร์ชัน Alternate Art ของการ์ด Rare
          ขึ้นไป มีภาพสวยกว่าและหายากกว่าปกติ ราคาจึงสูงกว่าเวอร์ชันธรรมดา
        </p>
      </div>

      <RelatedPages
        items={[
          { href: "/trending", icon: TrendingUp, title: "Trending", description: "ดูการ์ดที่ราคาขยับมากที่สุด" },
        ]}
      />

      <div className="flex items-center justify-between border-t border-border pt-6">
        <Link
          href="/guide/card-types"
          className="text-muted-foreground text-sm hover:text-foreground"
        >
          ← Card Types
        </Link>
        <Link
          href="/guide/colors"
          className="group inline-flex items-center gap-2 font-sans text-sm font-semibold text-primary hover:underline"
        >
          บทต่อไป: Colors
          <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
        </Link>
      </div>
    </div>
  );
}
