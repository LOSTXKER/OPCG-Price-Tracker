import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import {
  ArrowRight,
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
  Wrench,
} from "lucide-react";
import { Breadcrumb } from "@/components/shared/breadcrumb";
import { FaqSection } from "@/components/shared/faq-section";
import { JsonLd } from "@/lib/seo/json-ld-script";
import { breadcrumbJsonLd } from "@/lib/seo/json-ld";

interface GuideItem {
  href: string;
  icon: LucideIcon;
  title: string;
  description: string;
  iconBg: string;
  iconColor: string;
  featured?: boolean;
}

const guides: GuideItem[] = [
  {
    href: "/guide/getting-started",
    icon: BookOpen,
    title: "เริ่มต้น",
    description:
      "One Piece Card Game คืออะไร? กฎพื้นฐาน วิธีเล่น และสิ่งที่มือใหม่ควรรู้ทั้งหมด เริ่มต้นที่นี่",
    iconBg: "bg-primary/10",
    iconColor: "text-primary",
    featured: true,
  },
  {
    href: "/guide/card-types",
    icon: Swords,
    title: "ประเภทการ์ด",
    description: "Leader, Character, Event, Stage, DON!! — แต่ละประเภททำอะไร",
    iconBg: "bg-rose-500/10",
    iconColor: "text-rose-500",
  },
  {
    href: "/guide/rarities",
    icon: Sparkles,
    title: "ความหายาก",
    description: "C, UC, R, SR, SEC, SP — ยิ่งหายากยิ่งแพง",
    iconBg: "bg-amber-500/10",
    iconColor: "text-amber-500",
  },
  {
    href: "/guide/colors",
    icon: Palette,
    title: "สี",
    description: "Red, Blue, Green, Purple, Black, Yellow — สีบอกสไตล์การเล่น",
    iconBg: "bg-purple-500/10",
    iconColor: "text-purple-500",
  },
  {
    href: "/guide/sets",
    icon: Layers,
    title: "ชุดการ์ด",
    description: "ชุดการ์ดทั้งหมดตั้งแต่ OP01 — Timeline ครบ",
    iconBg: "bg-emerald-500/10",
    iconColor: "text-emerald-500",
  },
  {
    href: "/guide/buying",
    icon: ShoppingCart,
    title: "คู่มือการซื้อ",
    description: "ซื้อการ์ดที่ไหนดี? วิธีอ่านราคา ร้านค้าแนะนำ",
    iconBg: "bg-cyan-500/10",
    iconColor: "text-cyan-500",
  },
];

const tools = [
  {
    href: "/drop-calculator",
    icon: Calculator,
    title: "Drop Calculator",
    description: "คำนวณโอกาสดึงการ์ดจากกล่อง",
    iconBg: "bg-orange-500/10",
    iconColor: "text-orange-500",
  },
  {
    href: "/deck-calculator",
    icon: Calculator,
    title: "Deck Calculator",
    description: "คำนวณราคารวมเด็คของคุณ",
    iconBg: "bg-violet-500/10",
    iconColor: "text-violet-500",
  },
  {
    href: "/compare",
    icon: GitCompareArrows,
    title: "เปรียบเทียบการ์ด",
    description: "เทียบการ์ดหลายใบแบบ side-by-side",
    iconBg: "bg-sky-500/10",
    iconColor: "text-sky-500",
  },
  {
    href: "/marketplace",
    icon: Store,
    title: "Marketplace",
    description: "ซื้อขายการ์ดในตลาด Meecard",
    iconBg: "bg-pink-500/10",
    iconColor: "text-pink-500",
  },
];

export default function GuideLandingPage() {
  const featured = guides[0];
  const rest = guides.slice(1);

  return (
    <div className="space-y-16">
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "Home", href: "/" },
          { name: "Guide", href: "/guide" },
        ])}
      />

      {/* ── Hero ── */}
      <div className="relative overflow-hidden rounded-2xl bg-muted/30 px-6 pb-10 pt-6">
        <Breadcrumb
          items={[
            { label: "Home", href: "/" },
            { label: "Guide" },
          ]}
        />
        <div className="mx-auto mt-6 max-w-2xl text-center">
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
            เริ่มต้นกับ OPCG
          </h1>
          <p className="mt-3 text-base text-muted-foreground sm:text-lg">
            ไม่ว่าจะเป็นมือใหม่หรือเพิ่งเข้าวงการ เราจะพาคุณรู้จักทุกอย่าง
            เกี่ยวกับ One Piece Card Game
          </p>
        </div>
      </div>

      {/* ── Guide Cards — Bento Grid ── */}
      <section>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {/* Featured card — spans 1 col on sm, 1 col + 2 rows on lg */}
          <Link
            href={featured.href}
            className="group relative row-span-1 sm:row-span-1 lg:row-span-2"
          >
            <div className="flex h-full flex-col justify-between rounded-2xl border border-primary/15 bg-primary/[0.04] p-6 transition-all hover:border-primary/30 hover:shadow-lg sm:p-7">
              <div>
                <div className={`flex size-12 items-center justify-center rounded-xl ${featured.iconBg}`}>
                  <featured.icon className={`size-6 ${featured.iconColor}`} />
                </div>
                <h2 className="mt-4 text-xl font-bold transition-colors group-hover:text-primary">
                  {featured.title}
                </h2>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  {featured.description}
                </p>
              </div>
              <div className="mt-6 flex items-center gap-2 text-sm font-medium text-primary">
                เริ่มเลย
                <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
              </div>
            </div>
          </Link>

          {/* Remaining guide cards */}
          {rest.map((guide) => (
            <Link key={guide.href} href={guide.href} className="group">
              <div className="flex h-full items-start gap-4 rounded-2xl border border-border/50 bg-card p-5 transition-all hover:border-border hover:bg-muted/40 hover:shadow-md">
                <div className={`flex size-10 shrink-0 items-center justify-center rounded-lg ${guide.iconBg}`}>
                  <guide.icon className={`size-5 ${guide.iconColor}`} />
                </div>
                <div className="min-w-0 flex-1">
                  <h2 className="text-sm font-semibold transition-colors group-hover:text-primary">
                    {guide.title}
                  </h2>
                  <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                    {guide.description}
                  </p>
                </div>
                <ChevronRight className="mt-0.5 size-4 shrink-0 text-muted-foreground/30 transition-transform group-hover:translate-x-0.5 group-hover:text-muted-foreground/60" />
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* ── Tools ── */}
      <section className="space-y-5">
        <div>
          <div className="flex items-center gap-2">
            <Wrench className="size-5 text-muted-foreground" />
            <h2 className="text-xl font-semibold">เครื่องมือ</h2>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            เครื่องมือที่ช่วยให้คุณวิเคราะห์และวางแผนก่อนซื้อการ์ด
          </p>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {tools.map((tool) => (
            <Link key={tool.href} href={tool.href} className="group">
              <div className="flex h-full flex-col gap-3 rounded-2xl border border-border/50 bg-card p-5 transition-all hover:border-border hover:bg-muted/40 hover:shadow-md">
                <div className={`flex size-10 items-center justify-center rounded-lg ${tool.iconBg}`}>
                  <tool.icon className={`size-5 ${tool.iconColor}`} />
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="text-sm font-semibold transition-colors group-hover:text-primary">
                    {tool.title}
                  </h3>
                  <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                    {tool.description}
                  </p>
                </div>
                <div className="flex items-center gap-1 text-xs font-medium text-muted-foreground/60 transition-colors group-hover:text-primary">
                  เปิดเครื่องมือ
                  <ArrowRight className="size-3 transition-transform group-hover:translate-x-0.5" />
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* ── FAQ ── */}
      <section className="space-y-5">
        <div>
          <h2 className="text-xl font-semibold">คำถามที่พบบ่อย</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            คำตอบสำหรับคำถามยอดนิยมเกี่ยวกับ One Piece Card Game และ Meecard
          </p>
        </div>
        <FaqSection
          title=""
          items={[
            {
              question: "One Piece Card Game คืออะไร?",
              answer:
                "เกมการ์ดสะสมและแข่งขัน (TCG) จาก Bandai อิงจากมังงะ/อนิเมะ One Piece เปิดตัวในญี่ปุ่นปี 2022 ผู้เล่น 2 คนสู้กันโดยใช้เด็ค 50 ใบ + Leader 1 ใบ + DON!! 10 ใบ ปัจจุบันมีเวอร์ชันหลายภาษา รวมถึงไทย อ่านกฎเพิ่มเติมได้ในหน้า \"เริ่มต้น\"",
            },
            {
              question: "เริ่มต้นเล่นต้องใช้อะไรบ้าง?",
              answer:
                "ใช้ Leader 1 ใบ, เด็ค 50 ใบที่ตรงสีกับ Leader, และ DON!! 10 ใบ ถ้ายังไม่รู้จะเอาอะไร ซื้อ Starter Deck ได้เลย — มีครบทุกอย่างพร้อมเล่นทันที ราคาไม่กี่ร้อยบาท",
            },
            {
              question: "Meecard คืออะไร?",
              answer:
                "Meecard คือเว็บไซต์ติดตามราคาการ์ด OPCG ดึงราคาจาก Yuyu-tei และ SNKRDUNK อัปเดตทุกวัน แปลงเป็นเงินบาทอัตโนมัติ นอกจากนี้ยังมีเครื่องมือคำนวณเช่น Drop Calculator, Deck Calculator และ Marketplace ซื้อขายการ์ด",
            },
            {
              question: "ซื้อการ์ดที่ไหนดี?",
              answer:
                "ในไทยมีหลายร้านทั้งออนไลน์และหน้าร้าน เช่น Shopee, Line OA ของร้านต่างๆ หรือตลาดนัดการ์ด ส่วนราคาอ้างอิงดูได้ที่ Meecard และรายละเอียดเพิ่มเติมในหน้า \"คู่มือการซื้อ\"",
            },
            {
              question: "การ์ดหายากที่สุดคือ Rarity อะไร?",
              answer:
                "Treasure Rare (TR) หายากที่สุด ตามมาด้วย SP (Special) และ SEC (Secret Rare) โดยเฉพาะตัวละครยอดนิยมอย่าง Luffy, Shanks, Nami ราคาสูงถึงหลักแสนเยน อ่านรายละเอียดทุก Rarity ได้ในหน้า \"ความหายาก\"",
            },
            {
              question: "ราคาการ์ดบน Meecard อ้างอิงจากไหน?",
              answer:
                "ราคาหลักมาจาก Yuyu-tei ร้านการ์ดออนไลน์ที่ใหญ่ที่สุดในญี่ปุ่น (ราคาเยน แปลงเป็นบาทอัตโนมัติ) และราคาเกรด PSA 10 จาก SNKRDUNK ราคาอัปเดตทุกวัน",
            },
          ]}
        />
      </section>
    </div>
  );
}
