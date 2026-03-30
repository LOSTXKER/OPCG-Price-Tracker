import Link from "next/link";
import type { Metadata } from "next";
import { ArrowRight, BookOpen, Layers, LineChart, Target, Trophy, Users } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Breadcrumb } from "@/components/shared/breadcrumb";
import { RelatedPages } from "@/components/shared/related-pages";
import { JsonLd } from "@/lib/seo/json-ld-script";
import { breadcrumbJsonLd } from "@/lib/seo/json-ld";

export const metadata: Metadata = {
  title: "Getting Started — คู่มือ OPCG",
  description:
    "New to One Piece Card Game? Start here. Learn the basics, rules, deck building and how to play OPCG.",
  alternates: { canonical: "/guide/getting-started" },
};

const features = [
  {
    icon: Users,
    title: "เลือก Leader",
    description: "ทุกเด็คเริ่มจาก Leader 1 ใบ ที่กำหนดสีและความสามารถของเด็ค",
  },
  {
    icon: Target,
    title: "สร้างเด็ค 50 ใบ",
    description: "เลือกการ์ด Character, Event, Stage ที่เข้ากับ Leader ของคุณ",
  },
  {
    icon: Trophy,
    title: "ลดชีวิตคู่แข่ง",
    description: "โจมตีด้วย Character จนชีวิตของฝ่ายตรงข้ามเป็น 0 แล้วโจมตี Leader อีกครั้ง",
  },
];

export default function GettingStartedPage() {
  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <JsonLd data={breadcrumbJsonLd([
        { name: "Home", href: "/" },
        { name: "Guide", href: "/guide" },
        { name: "Getting Started", href: "/guide/getting-started" },
      ])} />
      <div className="space-y-3">
        <Breadcrumb items={[
          { label: "Home", href: "/" },
          { label: "Guide", href: "/guide" },
          { label: "Getting Started" },
        ]} />
        <h1 className="font-sans text-3xl font-bold tracking-tight">
          One Piece Card Game คืออะไร?
        </h1>
        <p className="text-muted-foreground text-lg leading-relaxed">
          OPCG เป็นเกมการ์ดจาก Bandai ที่อิงจากมังงะ/อนิเมะ One Piece
          เปิดตัวในปี 2022 และกลายเป็นเกมการ์ดที่ได้รับความนิยมมากที่สุดอันดับต้นๆ ของโลก
        </p>
      </div>

      <div className="bg-hero-gradient overflow-hidden rounded-2xl p-6 text-white sm:p-8">
        <div className="flex items-center gap-3">
          <BookOpen className="size-8" />
          <div>
            <h2 className="font-sans text-xl font-bold">วิธีเล่นแบบย่อ</h2>
            <p className="text-white/80 text-sm">3 ขั้นตอนง่ายๆ</p>
          </div>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        {features.map((item, i) => (
          <Card key={i}>
            <CardContent className="space-y-2 p-5">
              <div className="flex items-center gap-2">
                <span className="flex size-7 items-center justify-center rounded-full bg-primary/10 font-sans text-sm font-bold text-primary">
                  {i + 1}
                </span>
                <item.icon className="size-5 text-primary" />
              </div>
              <h3 className="font-sans text-sm font-semibold">
                {item.title}
              </h3>
              <p className="text-muted-foreground text-sm leading-relaxed">
                {item.description}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="space-y-4">
        <h2 className="font-sans text-xl font-semibold">ราคาการ์ดทำงานยังไง?</h2>
        <div className="text-muted-foreground space-y-3 text-sm leading-relaxed">
          <p>
            ราคาการ์ดขึ้นอยู่กับหลายปัจจัย — ความหายาก (rarity), ความสวยของภาพ,
            ความแรงในเกม, และ supply/demand ของตลาด
          </p>
          <p>
            เว็บเราดึงราคาจาก <strong>Yuyu-tei</strong> ซึ่งเป็นร้านการ์ดออนไลน์ที่ใหญ่ที่สุดในญี่ปุ่น
            แล้วแปลงเป็นบาทให้อัตโนมัติ เพื่อให้คุณเห็นราคาอ้างอิงสำหรับตลาดไทย
          </p>
          <p>
            การ์ดหายากอย่าง <strong>SEC (Secret Rare)</strong> หรือ{" "}
            <strong>SP (Special)</strong> อาจมีราคาหลักหมื่นบาท
            ในขณะที่การ์ด <strong>C (Common)</strong> อาจไม่ถึง 10 บาท
          </p>
        </div>
      </div>

      <RelatedPages
        items={[
          { href: "/", icon: LineChart, title: "ดูราคาการ์ด", description: "ราคาอัปเดตทุกวันจาก Yuyu-tei" },
          { href: "/sets", icon: Layers, title: "ดูชุดการ์ด", description: "เลือกชุดที่สนใจและดูการ์ดทั้งหมด" },
        ]}
      />

      <div className="flex justify-end border-t border-border pt-6">
        <Link
          href="/guide/card-types"
          className="group inline-flex items-center gap-2 font-sans text-sm font-semibold text-primary hover:underline"
        >
          บทต่อไป: ประเภทการ์ด
          <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
        </Link>
      </div>
    </div>
  );
}
