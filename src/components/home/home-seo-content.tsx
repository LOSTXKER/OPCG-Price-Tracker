import Link from "next/link";
import {
  BarChart3,
  Calculator,
  GitCompareArrows,
  Layers,
  LineChart,
  ShoppingCart,
  Sparkles,
  Store,
  TrendingUp,
  Wallet,
} from "lucide-react";
import { FaqSection, type FaqItem } from "@/components/shared/faq-section";
import { RelatedPages, type RelatedPageItem } from "@/components/shared/related-pages";

const features = [
  {
    icon: LineChart,
    title: "ราคาอัปเดตทุกวัน",
    description:
      "ราคาจาก Yuyu-tei อัปเดตทุกวัน พร้อมกราฟเปรียบเทียบย้อนหลัง ดูแนวโน้มราคาได้ทันที",
    href: "/market-overview",
  },
  {
    icon: Wallet,
    title: "จัดการ Portfolio",
    description:
      "บันทึกการ์ดที่มี ติดตามมูลค่ารวม ดู Allocation Chart และ Performance แบบ real-time",
    href: "/portfolio",
  },
  {
    icon: Calculator,
    title: "คำนวณโอกาสดึง",
    description:
      "Pull Calculator คำนวณโอกาสได้การ์ดที่ต้องการจากกล่อง ด้วยข้อมูล drop rate จริง",
    href: "/pull-calculator",
  },
];

const exploreItems: RelatedPageItem[] = [
  {
    icon: Layers,
    href: "/sets",
    title: "ชุดการ์ด",
    description: "ดูทุกชุดการ์ดพร้อมมูลค่าประเมิน",
  },
  {
    icon: TrendingUp,
    href: "/trending",
    title: "Trending",
    description: "การ์ดที่ราคาขยับมากที่สุดวันนี้",
  },
  {
    icon: Store,
    href: "/marketplace",
    title: "Marketplace",
    description: "ซื้อขายการ์ดในตลาดของ Meecard",
  },
  {
    icon: Sparkles,
    href: "/guide",
    title: "คู่มือ OPCG",
    description: "เรียนรู้เกมตั้งแต่เริ่มต้น",
  },
  {
    icon: GitCompareArrows,
    href: "/compare",
    title: "เปรียบเทียบ",
    description: "เทียบการ์ดหลายใบแบบ side-by-side",
  },
  {
    icon: ShoppingCart,
    href: "/deck-calculator",
    title: "Deck Calculator",
    description: "คำนวณราคารวมเด็คของคุณ",
  },
];

const faqItems: FaqItem[] = [
  {
    question: "Meecard คืออะไร?",
    answer:
      "Meecard เป็นเว็บติดตามราคาการ์ด One Piece Card Game (OPCG) ที่อัปเดตทุกวัน รวมเครื่องมือจัดการ Portfolio, Pull Calculator, เปรียบเทียบราคา และ Marketplace สำหรับซื้อขายการ์ด",
  },
  {
    question: "ราคาการ์ดมาจากไหน?",
    answer:
      "ราคาหลักดึงจาก Yuyu-tei ซึ่งเป็นร้านการ์ดออนไลน์ที่ใหญ่ที่สุดในญี่ปุ่น โดยเราแปลงเป็นเงินบาทและ USD ให้อัตโนมัติ นอกจากนี้ยังมีข้อมูลจาก SNKRDUNK สำหรับการ์ดเกรด PSA 10",
  },
  {
    question: "อัปเดตราคาบ่อยแค่ไหน?",
    answer:
      "ราคาอัปเดตอย่างน้อยวันละ 1 ครั้ง และแสดงกราฟราคาย้อนหลังเพื่อให้เห็นแนวโน้มตลาดได้ชัดเจน",
  },
  {
    question: "Portfolio คืออะไร?",
    answer:
      "Portfolio ช่วยให้คุณบันทึกการ์ดที่คุณมีอยู่ ติดตามมูลค่ารวมแบบ real-time ดูกราฟมูลค่าย้อนหลัง Allocation Chart และ Performance ของคอลเลกชัน",
  },
  {
    question: "Pull Calculator ทำอะไรได้?",
    answer:
      "Pull Calculator ช่วยคำนวณโอกาสในการดึงการ์ดที่ต้องการจากกล่องบูสเตอร์ โดยใช้ข้อมูล drop rate จริง คุณสามารถเลือกจำนวนกล่องและดูโอกาสได้การ์ดแต่ละใบ",
  },
  {
    question: "ใช้ฟรีมั้ย?",
    answer:
      "ฟีเจอร์หลักเช่นดูราคา กราฟ ข้อมูลชุดการ์ด และ Pull Calculator ใช้ได้ฟรี ฟีเจอร์เพิ่มเติมเช่น Portfolio ขั้นสูง, Price Alerts และ Export มีในแพลน Pro",
  },
  {
    question: "Marketplace คืออะไร?",
    answer:
      "Marketplace เป็นตลาดซื้อขายการ์ดของ Meecard ที่ผู้ใช้สามารถลงขายการ์ดและซื้อจากผู้ขายรายอื่นได้โดยตรง พร้อมราคาอ้างอิงจากตลาดจริง",
  },
];

export function HomeSeoContent() {
  return (
    <div className="space-y-12 pt-4">
      {/* Features */}
      <section className="space-y-4">
        <h2 className="text-lg font-semibold">Meecard ทำอะไรได้บ้าง?</h2>
        <div className="grid gap-4 sm:grid-cols-3">
          {features.map((f) => (
            <Link
              key={f.href}
              href={f.href}
              className="group flex flex-col gap-3 rounded-xl border border-border/50 bg-card p-5 transition-colors hover:bg-muted/40"
            >
              <f.icon className="size-6 text-primary" />
              <div>
                <p className="text-sm font-semibold group-hover:text-primary transition-colors">
                  {f.title}
                </p>
                <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                  {f.description}
                </p>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Price explainer */}
      <section className="space-y-3">
        <h2 className="text-lg font-semibold">
          ราคาการ์ด OPCG ทำงานยังไง?
        </h2>
        <div className="space-y-3 text-sm leading-relaxed text-muted-foreground">
          <p>
            ราคาการ์ด One Piece Card Game ขึ้นอยู่กับหลายปัจจัย ได้แก่{" "}
            <Link
              href="/guide/rarities"
              className="font-medium text-primary hover:underline"
            >
              ความหายาก (rarity)
            </Link>
            , ความสวยของภาพ, ความแรงในเกม และ supply/demand ของตลาด
            การ์ดหายากอย่าง SEC หรือ SP อาจมีราคาหลักหมื่นบาท ในขณะที่ C อาจไม่ถึง
            10 บาท
          </p>
          <p>
            Meecard ดึงราคาจาก <strong>Yuyu-tei</strong>{" "}
            ซึ่งเป็นร้านการ์ดที่ใหญ่ที่สุดในญี่ปุ่น
            เพื่อใช้เป็นราคาอ้างอิงที่น่าเชื่อถือสำหรับตลาดไทย
            นอกจากนี้ยังมีข้อมูลจาก SNKRDUNK สำหรับการ์ดเกรด PSA 10 อีกด้วย
          </p>
          <p>
            อ่านเพิ่มเติมเกี่ยวกับ{" "}
            <Link
              href="/guide/buying"
              className="font-medium text-primary hover:underline"
            >
              วิธีซื้อการ์ดและร้านค้าแนะนำ
            </Link>{" "}
            หรือ{" "}
            <Link
              href="/guide/getting-started"
              className="font-medium text-primary hover:underline"
            >
              เริ่มต้นเล่น OPCG
            </Link>
          </p>
        </div>
      </section>

      {/* Explore CTA grid */}
      <RelatedPages title="สำรวจเพิ่มเติม" items={exploreItems} />

      {/* FAQ */}
      <FaqSection items={faqItems} />
    </div>
  );
}
