import Link from "next/link";
import {
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
import {
  RelatedPages,
  type RelatedPageItem,
} from "@/components/shared/related-pages";

const features = [
  {
    icon: LineChart,
    title: "ราคาการ์ดวันพีซอัปเดตทุกวัน",
    description:
      "ติดตามราคาการ์ด OPCG จาก Yuyu-tei แบบเรียลไทม์ พร้อมกราฟราคาย้อนหลังให้ดูแนวโน้มตลาด",
    href: "/market-overview",
  },
  {
    icon: Wallet,
    title: "จัดการ Portfolio การ์ดของคุณ",
    description:
      "เพิ่มการ์ด One Piece ที่ถืออยู่ แล้วดูมูลค่าพอร์ตรวมเปลี่ยนแปลงแบบเรียลไทม์ พร้อมกราฟและสถิติ",
    href: "/portfolio",
  },
  {
    icon: Calculator,
    title: "คำนวณ Drop Rate กล่องสุ่ม",
    description:
      "จำลองการเปิดกล่องสุ่มการ์ด OPCG คำนวณโอกาสได้การ์ดที่ต้องการจาก drop rate จริง ช่วยวางแผนก่อนซื้อ",
    href: "/drop-calculator",
  },
];

const exploreItems: RelatedPageItem[] = [
  {
    icon: Layers,
    href: "/sets",
    title: "ชุดการ์ด OPCG ทั้งหมด",
    description: "ดูทุกชุดการ์ดวันพีซพร้อมมูลค่าประเมินรวม",
  },
  {
    icon: TrendingUp,
    href: "/trending",
    title: "การ์ดวันพีซมาแรงวันนี้",
    description: "การ์ด OPCG ที่ราคาขยับมากที่สุดในวันนี้",
  },
  {
    icon: Store,
    href: "/marketplace",
    title: "ตลาดซื้อขายการ์ด",
    description: "ซื้อขายการ์ดวันพีซในตลาดของ Meecard ราคายุติธรรม",
  },
  {
    icon: Sparkles,
    href: "/guide",
    title: "คู่มือ One Piece Card Game",
    description: "เรียนรู้กฎ ระบบ rarity และเทคนิคเล่นเกม",
  },
  {
    icon: GitCompareArrows,
    href: "/compare",
    title: "เปรียบเทียบราคาการ์ด",
    description: "เทียบราคาและข้อมูลการ์ด OPCG หลายใบแบบ side-by-side",
  },
  {
    icon: ShoppingCart,
    href: "/deck-calculator",
    title: "คำนวณราคาเด็ค",
    description: "คำนวณราคารวมเด็คจากราคาตลาดปัจจุบัน",
  },
];

const faqItems: FaqItem[] = [
  {
    question: "Meecard คืออะไร?",
    answer:
      "Meecard คือเว็บไซต์ติดตามราคาการ์ด One Piece Card Game (OPCG) ที่อัปเดตทุกวัน รวมฟีเจอร์ Portfolio, Drop Calculator, เปรียบเทียบราคา และ Marketplace ซื้อขายการ์ดไว้ในที่เดียว",
  },
  {
    question: "ราคาการ์ด OPCG มาจากแหล่งไหน?",
    answer:
      "ราคาหลักอ้างอิงจาก Yuyu-tei ร้านการ์ดเกมที่ใหญ่ที่สุดในญี่ปุ่น แปลงเป็นเงินบาทและ USD อัตโนมัติ นอกจากนี้ยังมีราคาการ์ดเกรด PSA 10 จาก SNKRDUNK",
  },
  {
    question: "อัปเดตราคาการ์ดวันพีซบ่อยแค่ไหน?",
    answer:
      "ราคาอัปเดตอย่างน้อยวันละ 1 ครั้ง พร้อมกราฟราคาย้อนหลังให้ดูแนวโน้มตลาดว่าการ์ดขึ้นหรือลง",
  },
  {
    question: "Portfolio ใน Meecard ใช้ทำอะไร?",
    answer:
      "บันทึกการ์ดวันพีซที่คุณมี ดูมูลค่ารวมเปลี่ยนแปลงแบบเรียลไทม์ พร้อมกราฟย้อนหลัง สัดส่วนตาม rarity และผลตอบแทน (performance)",
  },
  {
    question: "Drop Calculator คำนวณอะไรได้บ้าง?",
    answer:
      "คำนวณโอกาสที่จะได้การ์ดที่ต้องการจากการเปิดกล่อง OPCG ใส่จำนวนกล่องแล้วดูโอกาสได้ของแต่ละ rarity โดยใช้ drop rate จริง",
  },
  {
    question: "Meecard ใช้ฟรีไหม?",
    answer:
      "ฟีเจอร์หลักอย่างราคาการ์ด กราฟย้อนหลัง ข้อมูลชุดการ์ด และ Drop Calculator ใช้ฟรีทั้งหมด สำหรับ Portfolio ขั้นสูง แจ้งเตือนราคา หรือ Export ข้อมูล สามารถอัปเกรดเป็น Pro ได้",
  },
  {
    question: "Marketplace บน Meecard คืออะไร?",
    answer:
      "ตลาดซื้อขายการ์ด One Piece ที่ผู้ใช้สามารถลงขายหรือซื้อการ์ดจากคนอื่นได้โดยตรง มีราคาตลาดจริงให้เทียบเป็นข้อมูลอ้างอิง",
  },
];

export function HomeSeoContent() {
  return (
    <div className="space-y-16 pt-6">
      {/* Features */}
      <section className="space-y-5">
        <div>
          <h2 className="text-xl font-semibold">
            Meecard ช่วยคุณติดตามราคาการ์ด One Piece ได้ยังไงบ้าง?
          </h2>
          <p className="mt-1.5 text-sm text-muted-foreground">
            เครื่องมือครบชุดสำหรับนักสะสมและนักเทรดการ์ด OPCG
          </p>
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
          {features.map((f) => (
            <Link
              key={f.href}
              href={f.href}
              className="group flex flex-col gap-4 rounded-xl border border-border/50 bg-card p-6 transition-all hover:bg-muted/40 hover:shadow-md"
            >
              <div className="flex size-11 items-center justify-center rounded-full bg-primary/10">
                <f.icon className="size-5 text-primary" />
              </div>
              <div>
                <p className="text-sm font-semibold transition-colors group-hover:text-primary">
                  {f.title}
                </p>
                <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">
                  {f.description}
                </p>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Price explainer */}
      <section className="rounded-xl border border-border/50 bg-card/50 p-6 space-y-4">
        <h2 className="text-xl font-semibold">
          ราคาการ์ด OPCG (One Piece Card Game) กำหนดจากอะไร?
        </h2>
        <div className="space-y-3 text-sm leading-relaxed text-muted-foreground">
          <p>
            ราคาการ์ดวันพีซขึ้นอยู่กับหลายปัจจัย ทั้ง{" "}
            <Link
              href="/guide/rarities"
              className="font-medium text-primary hover:underline"
            >
              ความหายาก (rarity)
            </Link>{" "}
            อย่าง SEC, SP, SR ภาพอาร์ตเวิร์กพิเศษ ความแรงในเมตา
            และอุปสงค์อุปทานในตลาด การ์ดระดับ SEC หรือ SP
            ราคาอาจสูงหลักหมื่นถึงหลักแสน ในขณะที่การ์ด Common เริ่มต้นไม่ถึง
            10 บาท
          </p>
          <p>
            Meecard อ้างอิงราคาจาก <strong>Yuyu-tei</strong>{" "}
            ร้านการ์ดเกมอันดับหนึ่งของญี่ปุ่น แปลงเป็นเงินบาทและ USD
            ให้อัตโนมัติ พร้อมข้อมูลจาก SNKRDUNK สำหรับการ์ดที่ผ่านการเกรด PSA
            10
          </p>
          <p>
            เรียนรู้เพิ่มเติมเกี่ยวกับ{" "}
            <Link
              href="/guide/buying"
              className="font-medium text-primary hover:underline"
            >
              วิธีซื้อการ์ดวันพีซและร้านค้าแนะนำ
            </Link>{" "}
            หรือเริ่มต้นด้วย{" "}
            <Link
              href="/guide/getting-started"
              className="font-medium text-primary hover:underline"
            >
              คู่มือเล่น OPCG สำหรับมือใหม่
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
