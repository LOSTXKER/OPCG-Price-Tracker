import Link from "next/link";
import {
  BookOpen,
  Calculator,
  ChevronRight,
  GitCompareArrows,
  Layers,
  Palette,
  ShoppingCart,
  Sparkles,
  Store,
  Swords,
} from "lucide-react";
import { Breadcrumb } from "@/components/shared/breadcrumb";
import { FaqSection } from "@/components/shared/faq-section";
import { RelatedPages } from "@/components/shared/related-pages";
import { JsonLd } from "@/lib/seo/json-ld-script";
import { breadcrumbJsonLd } from "@/lib/seo/json-ld";

const guides = [
  {
    href: "/guide/getting-started",
    icon: BookOpen,
    title: "เริ่มต้น",
    description: "One Piece Card Game คืออะไร? เริ่มต้นที่นี่",
    color: "text-primary",
  },
  {
    href: "/guide/card-types",
    icon: Swords,
    title: "ประเภทการ์ด",
    description: "Leader, Character, Event, Stage, DON!! — แต่ละประเภททำอะไร",
    color: "text-blue-500",
  },
  {
    href: "/guide/rarities",
    icon: Sparkles,
    title: "ความหายาก",
    description: "C, UC, R, SR, SEC, SP — ยิ่งหายากยิ่งแพง",
    color: "text-foreground",
  },
  {
    href: "/guide/colors",
    icon: Palette,
    title: "สี",
    description: "Red, Blue, Green, Purple, Black, Yellow — สีบอกสไตล์การเล่น",
    color: "text-emerald-500",
  },
  {
    href: "/guide/sets",
    icon: Layers,
    title: "ชุดการ์ด",
    description: "ชุดการ์ดทั้งหมดตั้งแต่ OP01 — Timeline ครบ",
    color: "text-muted-foreground",
  },
  {
    href: "/guide/buying",
    icon: ShoppingCart,
    title: "คู่มือการซื้อ",
    description: "ซื้อการ์ดที่ไหนดี? วิธีอ่านราคา ร้านค้าแนะนำ",
    color: "text-muted-foreground",
  },
];

export default function GuideLandingPage() {
  return (
    <div className="space-y-12">
      <div className="mx-auto max-w-2xl text-center pt-8">
        <h1 className="font-sans text-4xl font-bold tracking-tight">
          เริ่มต้นกับ OPCG
        </h1>
        <p className="mt-3 text-lg text-muted-foreground">
          ไม่ว่าจะเป็นมือใหม่หรือเพิ่งเข้าวงการ เราจะพาคุณรู้จักทุกอย่าง
          เกี่ยวกับ One Piece Card Game
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {guides.map((guide) => (
          <Link key={guide.href} href={guide.href} className="group block">
            <div className="flex h-full items-start gap-4 rounded-2xl bg-muted/30 p-6 transition-all hover:bg-muted/60">
              <div className={`mt-0.5 shrink-0 ${guide.color}`}>
                <guide.icon className="size-6" />
              </div>
              <div className="min-w-0 flex-1 space-y-1">
                <h2 className="font-sans text-base font-semibold group-hover:text-primary transition-colors">
                  {guide.title}
                </h2>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {guide.description}
                </p>
              </div>
              <ChevronRight className="mt-1 size-4 shrink-0 text-muted-foreground/40 transition-transform group-hover:translate-x-0.5" />
            </div>
          </Link>
        ))}
      </div>

      <RelatedPages
        title="เครื่องมือ"
        items={[
          { href: "/pull-calculator", icon: Calculator, title: "Pull Calculator", description: "คำนวณโอกาสดึงการ์ดจากกล่อง" },
          { href: "/deck-calculator", icon: Calculator, title: "Deck Calculator", description: "คำนวณราคารวมเด็คของคุณ" },
          { href: "/compare", icon: GitCompareArrows, title: "เปรียบเทียบการ์ด", description: "เทียบการ์ดหลายใบแบบ side-by-side" },
          { href: "/marketplace", icon: Store, title: "Marketplace", description: "ซื้อขายการ์ดในตลาด Meecard" },
        ]}
      />
      <FaqSection items={[
        { question: "One Piece Card Game คืออะไร?", answer: "OPCG เป็นเกมการ์ดจาก Bandai ที่อิงจากมังงะ One Piece เปิดตัวในปี 2022 มีผู้เล่นทั่วโลก เกมใช้ระบบ Leader + 50 การ์ดเด็ค" },
        { question: "เริ่มต้นเล่นต้องใช้อะไรบ้าง?", answer: "ต้องมี Leader 1 ใบ กับเด็ค 50 ใบที่ตรงสีกับ Leader สามารถเริ่มจาก Starter Deck ที่พร้อมเล่นได้เลย" },
        { question: "ซื้อการ์ดที่ไหนดี?", answer: "ในไทยมีหลายร้านค้าทั้งออนไลน์และหน้าร้าน ดูรายละเอียดได้ที่คู่มือการซื้อ สำหรับราคาอ้างอิงดูได้จาก Meecard" },
        { question: "การ์ดที่แพงที่สุดมีอะไรบ้าง?", answer: "การ์ดที่แพงที่สุดมักจะเป็น SEC (Secret Rare) หรือ SP (Special) โดยเฉพาะการ์ดตัวละครยอดนิยมอย่าง Luffy, Shanks ราคาอาจถึงหลักหมื่นบาท" },
      ]} />
    </div>
  );
}
