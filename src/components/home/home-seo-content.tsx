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
      "ดูราคาจาก Yuyu-tei ที่อัปเดตรายวัน มีกราฟย้อนหลังให้ดูแนวโน้มราคาได้เลย",
    href: "/market-overview",
  },
  {
    icon: Wallet,
    title: "จัดการ Portfolio",
    description:
      "เพิ่มการ์ดที่มีอยู่ แล้วดูมูลค่ารวมเปลี่ยนแปลงแบบ real-time ได้เลย",
    href: "/portfolio",
  },
  {
    icon: Calculator,
    title: "คำนวณดรอป",
    description:
      "อยากรู้ว่าเปิดกี่กล่องถึงจะได้การ์ดที่ต้องการ? ลองคำนวณดูได้ด้วย drop rate จริง",
    href: "/drop-calculator",
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
      "เว็บดูราคาการ์ด OPCG ที่อัปเดตทุกวัน มีทั้ง Portfolio, Drop Calculator, เทียบราคา และตลาดซื้อขายการ์ดในที่เดียว",
  },
  {
    question: "ราคาการ์ดมาจากไหน?",
    answer:
      "ราคาหลักมาจาก Yuyu-tei ร้านการ์ดที่ใหญ่สุดในญี่ปุ่น แปลงเป็นบาทกับ USD ให้เลย แล้วก็มีราคาจาก SNKRDUNK สำหรับการ์ดเกรด PSA 10 ด้วย",
  },
  {
    question: "อัปเดตราคาบ่อยแค่ไหน?",
    answer:
      "อัปเดตอย่างน้อยวันละครั้ง มีกราฟย้อนหลังให้ดูด้วยว่าราคาเปลี่ยนไปยังไง",
  },
  {
    question: "Portfolio คืออะไร?",
    answer:
      "เอาไว้บันทึกการ์ดที่มีอยู่ แล้วดูมูลค่ารวมแบบ real-time ได้ มีกราฟย้อนหลัง, สัดส่วนการ์ด และ Performance ให้ดูด้วย",
  },
  {
    question: "Drop Calculator ทำอะไรได้?",
    answer:
      "คำนวณโอกาสได้การ์ดที่ต้องการจากกล่อง ใส่จำนวนกล่องที่จะซื้อแล้วดูได้เลยว่าโอกาสได้การ์ดแต่ละใบเท่าไร ใช้ drop rate จริง",
  },
  {
    question: "ใช้ฟรีมั้ย?",
    answer:
      "ดูราคา กราฟ ข้อมูลชุดการ์ด Drop Calculator ใช้ฟรีหมด ถ้าอยากได้ Portfolio ขั้นสูง, Price Alerts หรือ Export อัปเกรดเป็น Pro ได้",
  },
  {
    question: "Marketplace คืออะไร?",
    answer:
      "ตลาดซื้อขายการ์ดบน Meecard ลงขายเองหรือซื้อจากคนอื่นได้เลย มีราคาตลาดจริงให้อ้างอิง",
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
            ราคาการ์ด OPCG ขึ้นกับหลายอย่าง ทั้ง{" "}
            <Link
              href="/guide/rarities"
              className="font-medium text-primary hover:underline"
            >
              ความหายาก (rarity)
            </Link>
            , ภาพสวยมั้ย, แรงในเกมมั้ย แล้วก็ supply/demand ในตลาด
            การ์ดหายากอย่าง SEC หรือ SP ราคาหลักหมื่นขึ้นไป ส่วน C ไม่ถึง
            10 บาทก็มี
          </p>
          <p>
            Meecard ใช้ราคาจาก <strong>Yuyu-tei</strong>{" "}
            ร้านการ์ดที่ใหญ่สุดในญี่ปุ่น เอามาเป็นราคากลางอ้างอิง
            แล้วก็มีข้อมูลจาก SNKRDUNK ด้วยสำหรับการ์ดเกรด PSA 10
          </p>
          <p>
            อ่านเพิ่มเติมเรื่อง{" "}
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
