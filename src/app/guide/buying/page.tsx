import Link from "next/link";
import type { Metadata } from "next";
import { ArrowRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

export const metadata: Metadata = {
  title: "Buying Guide — คู่มือ OPCG",
};

const shops = [
  {
    name: "Yuyu-tei",
    url: "https://yuyu-tei.jp",
    type: "ออนไลน์ (ญี่ปุ่น)",
    pros: "ราคาอ้างอิงหลัก สต็อกเยอะ ราคาเป็นกลาง",
    cons: "ต้องส่งผ่าน Proxy/Forwarder มีค่าส่งเพิ่ม",
  },
  {
    name: "ร้านการ์ดในไทย",
    url: null,
    type: "หน้าร้าน / ออนไลน์",
    pros: "ซื้อง่าย ได้ของเลย ไม่ต้องรอส่ง",
    cons: "ราคาอาจสูงกว่า Yuyu-tei 20-50%",
  },
  {
    name: "Marketplace (เว็บเรา)",
    url: "/marketplace",
    type: "C2C ซื้อขายระหว่างผู้เล่น",
    pros: "อาจได้ราคาดี เจรจาได้ เห็นราคาเทียบตลาด",
    cons: "ต้องเช็คความน่าเชื่อถือของผู้ขาย",
  },
];

const tips = [
  "เช็คราคาตลาดก่อนซื้อเสมอ — ใช้เว็บเราเทียบราคา Yuyu-tei",
  "การ์ด Parallel มักมีราคาสูงกว่า Normal Version มาก",
  "อย่ารีบซื้อการ์ดใหม่สัปดาห์แรก ราคามักจะลดลงหลังออก 2-3 สัปดาห์",
  "ถ้าเล่นเกม ให้ซื้อ Starter Deck ก่อน — ได้ Leader + การ์ดพร้อมเล่น",
  "สำหรับนักสะสม ให้โฟกัสชุดใดชุดหนึ่งก่อน ไม่ต้องสะสมทุกชุดพร้อมกัน",
];

export default function BuyingGuidePage() {
  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <div className="space-y-3">
        <Link
          href="/guide"
          className="text-muted-foreground text-sm hover:text-foreground"
        >
          ← คู่มือทั้งหมด
        </Link>
        <h1 className="font-sans text-3xl font-bold tracking-tight">
          Buying Guide
        </h1>
        <p className="text-muted-foreground text-lg">
          ซื้อการ์ดที่ไหนดี? วิธีอ่านราคา เคล็ดลับประหยัด
        </p>
      </div>

      <div className="space-y-4">
        <h2 className="font-sans text-xl font-semibold">
          แหล่งซื้อการ์ด
        </h2>
        {shops.map((shop) => (
          <Card key={shop.name}>
            <CardContent className="space-y-2 p-5">
              <div className="flex items-center gap-2">
                <h3 className="font-sans text-base font-semibold">
                  {shop.url ? (
                    shop.url.startsWith("/") ? (
                      <Link
                        href={shop.url}
                        className="text-primary hover:underline"
                      >
                        {shop.name}
                      </Link>
                    ) : (
                      <a
                        href={shop.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary hover:underline"
                      >
                        {shop.name}
                      </a>
                    )
                  ) : (
                    shop.name
                  )}
                </h3>
                <span className="text-muted-foreground text-xs">
                  {shop.type}
                </span>
              </div>
              <div className="grid gap-2 text-sm sm:grid-cols-2">
                <div>
                  <span className="text-price-up font-medium">✓ ข้อดี:</span>{" "}
                  <span className="text-muted-foreground">{shop.pros}</span>
                </div>
                <div>
                  <span className="text-price-down font-medium">✗ ข้อเสีย:</span>{" "}
                  <span className="text-muted-foreground">{shop.cons}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="space-y-4">
        <h2 className="font-sans text-xl font-semibold">
          เคล็ดลับการซื้อ
        </h2>
        <div className="space-y-2">
          {tips.map((tip, i) => (
            <div
              key={i}
              className="flex items-start gap-3 rounded-lg border border-border bg-card p-3"
            >
              <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-muted/10 font-sans text-xs font-bold text-foreground">
                {i + 1}
              </span>
              <p className="text-sm leading-relaxed">{tip}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-xl border border-dashed border-primary/30 bg-primary/5 p-4">
        <h3 className="font-sans text-sm font-semibold text-primary">
          📊 วิธีอ่านราคาบนเว็บเรา
        </h3>
        <ul className="text-muted-foreground mt-2 space-y-1 text-sm">
          <li>
            <strong>ราคา ¥</strong> = ราคาจาก Yuyu-tei (เยน)
          </li>
          <li>
            <strong>ราคา ฿</strong> = คำนวณจากอัตราแลกเปลี่ยนวันนั้น (โดยประมาณ)
          </li>
          <li>
            <strong>% เปลี่ยนแปลง</strong> = เทียบกับราคาเมื่อวานหรือ 7 วันก่อน
          </li>
          <li>
            <strong>Community Price</strong> = ราคาเฉลี่ยที่ผู้ใช้รายงาน (ตลาดไทย)
          </li>
        </ul>
      </div>

      <div className="flex items-center justify-between border-t border-border pt-6">
        <Link
          href="/guide/sets"
          className="text-muted-foreground text-sm hover:text-foreground"
        >
          ← Sets
        </Link>
        <Link
          href="/cards"
          className="group inline-flex items-center gap-2 font-sans text-sm font-semibold text-primary hover:underline"
        >
          เริ่มค้นหาการ์ดเลย!
          <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
        </Link>
      </div>
    </div>
  );
}
