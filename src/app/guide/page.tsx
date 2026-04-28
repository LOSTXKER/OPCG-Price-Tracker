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
import { PageHeader } from "@/components/layout/page-header";
import { Surface } from "@/components/ui/surface";
import { JsonLd } from "@/lib/seo/json-ld-script";
import { breadcrumbJsonLd } from "@/lib/seo/json-ld";

interface GuideItem {
  href: string;
  icon: LucideIcon;
  title: string;
  description: string;
  featured?: boolean;
}

const guides: GuideItem[] = [
  {
    href: "/guide/getting-started",
    icon: BookOpen,
    title: "เริ่มต้น",
    description:
      "One Piece Card Game คืออะไร? กฎพื้นฐาน วิธีเล่น และสิ่งที่มือใหม่ควรรู้ทั้งหมด เริ่มต้นที่นี่",
    featured: true,
  },
  {
    href: "/guide/card-types",
    icon: Swords,
    title: "ประเภทการ์ด",
    description: "Leader, Character, Event, Stage, DON!! — แต่ละประเภททำอะไร",
  },
  {
    href: "/guide/rarities",
    icon: Sparkles,
    title: "ความหายาก",
    description: "C, UC, R, SR, SEC, SP — ยิ่งหายากยิ่งแพง",
  },
  {
    href: "/guide/colors",
    icon: Palette,
    title: "สี",
    description: "Red, Blue, Green, Purple, Black, Yellow — สีบอกสไตล์การเล่น",
  },
  {
    href: "/guide/sets",
    icon: Layers,
    title: "ชุดการ์ด",
    description: "ชุดการ์ดทั้งหมดตั้งแต่ OP01 — Timeline ครบ",
  },
  {
    href: "/guide/buying",
    icon: ShoppingCart,
    title: "คู่มือการซื้อ",
    description: "ซื้อการ์ดที่ไหนดี? วิธีอ่านราคา ร้านค้าแนะนำ",
  },
];

const tools: Array<{
  href: string;
  icon: LucideIcon;
  title: string;
  description: string;
}> = [
  {
    href: "/drop-calculator",
    icon: Calculator,
    title: "Drop Calculator",
    description: "คำนวณโอกาสดึงการ์ดจากกล่อง",
  },
  {
    href: "/deck-calculator",
    icon: Calculator,
    title: "Deck Calculator",
    description: "คำนวณราคารวมเด็คของคุณ",
  },
  {
    href: "/compare",
    icon: GitCompareArrows,
    title: "เปรียบเทียบการ์ด",
    description: "เทียบการ์ดหลายใบแบบ side-by-side",
  },
  {
    href: "/marketplace",
    icon: Store,
    title: "Marketplace",
    description: "ซื้อขายการ์ดในตลาด Meecard",
  },
];

export default function GuideLandingPage() {
  const featured = guides[0];
  const rest = guides.slice(1);
  const FeaturedIcon = featured.icon;

  return (
    <div className="space-y-10">
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "Home", href: "/" },
          { name: "Guide", href: "/guide" },
        ])}
      />

      <PageHeader
        breadcrumb={
          <Breadcrumb
            items={[
              { label: "Home", href: "/" },
              { label: "Guide" },
            ]}
          />
        }
        title="เริ่มต้นกับ OPCG"
        description="ไม่ว่าจะเป็นมือใหม่หรือเพิ่งเข้าวงการ เราจะพาคุณรู้จักทุกอย่างเกี่ยวกับ One Piece Card Game"
      />

      <section>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Link
            href={featured.href}
            className="group relative row-span-1 sm:row-span-1 lg:row-span-2"
          >
            <Surface
              variant="panel"
              padding="none"
              className="flex h-full flex-col justify-between p-6 transition-colors group-hover:border-primary/30 sm:p-7"
            >
              <div>
                <div className="flex size-12 items-center justify-center rounded-xl bg-primary/10">
                  <FeaturedIcon className="size-6 text-primary" />
                </div>
                <h2 className="mt-4 text-h3 transition-colors group-hover:text-primary">
                  {featured.title}
                </h2>
                <p className="mt-2 text-body-sm text-muted-foreground">
                  {featured.description}
                </p>
              </div>
              <div className="mt-6 flex items-center gap-2 text-sm font-medium text-primary">
                เริ่มเลย
                <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
              </div>
            </Surface>
          </Link>

          {rest.map((guide) => {
            const Icon = guide.icon;
            return (
              <Link key={guide.href} href={guide.href} className="group">
                <Surface
                  variant="outline"
                  padding="none"
                  className="flex h-full items-start gap-4 p-5 transition-colors group-hover:bg-muted/40"
                >
                  <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-muted">
                    <Icon className="size-5 text-muted-foreground" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h2 className="text-h4 transition-colors group-hover:text-primary">
                      {guide.title}
                    </h2>
                    <p className="mt-1 text-meta">{guide.description}</p>
                  </div>
                  <ChevronRight className="mt-0.5 size-4 shrink-0 text-muted-foreground/40 transition-transform group-hover:translate-x-0.5 group-hover:text-muted-foreground" />
                </Surface>
              </Link>
            );
          })}
        </div>
      </section>

      <section className="space-y-5">
        <div>
          <div className="flex items-center gap-2">
            <Wrench className="size-5 text-muted-foreground" />
            <h2 className="text-h3">เครื่องมือ</h2>
          </div>
          <p className="mt-1 page-subtitle">
            เครื่องมือที่ช่วยให้คุณวิเคราะห์และวางแผนก่อนซื้อการ์ด
          </p>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {tools.map((tool) => {
            const Icon = tool.icon;
            return (
              <Link key={tool.href} href={tool.href} className="group">
                <Surface
                  variant="outline"
                  padding="none"
                  className="flex h-full flex-col gap-3 p-5 transition-colors group-hover:bg-muted/40"
                >
                  <div className="flex size-10 items-center justify-center rounded-lg bg-muted">
                    <Icon className="size-5 text-muted-foreground" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="text-h5 transition-colors group-hover:text-primary">
                      {tool.title}
                    </h3>
                    <p className="mt-1 text-meta">{tool.description}</p>
                  </div>
                  <div className="flex items-center gap-1 text-xs font-medium text-muted-foreground transition-colors group-hover:text-primary">
                    เปิดเครื่องมือ
                    <ArrowRight className="size-3 transition-transform group-hover:translate-x-0.5" />
                  </div>
                </Surface>
              </Link>
            );
          })}
        </div>
      </section>

      <section className="space-y-5">
        <div>
          <h2 className="text-h3">คำถามที่พบบ่อย</h2>
          <p className="mt-1 page-subtitle">
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
