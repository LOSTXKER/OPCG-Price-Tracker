import Link from "next/link";
import type { Metadata } from "next";
import { ArrowRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

export const metadata: Metadata = {
  title: "Card Types — คู่มือ OPCG",
};

const cardTypes = [
  {
    name: "Leader",
    nameJp: "リーダー",
    color: "border-l-orange-500",
    emoji: "👑",
    description:
      "หัวหน้าเด็คของคุณ มีได้แค่ 1 ใบ กำหนดสีของเด็คและมี Life เป็นตัวกำหนดความทน",
    details: "Leader อยู่บนสนามตลอด ไม่สามารถถูกทำลายได้ แต่เมื่อ Life หมดและถูกโจมตีอีกครั้งจะแพ้",
  },
  {
    name: "Character",
    nameJp: "キャラクター",
    color: "border-l-blue-500",
    emoji: "⚔️",
    description:
      "ลูกทีมที่ใช้โจมตีและป้องกัน มีค่า Cost, Power, Counter และอาจมี Effect พิเศษ",
    details:
      "วางลงสนามด้วยการจ่าย DON!! ตามค่า Cost สามารถโจมตีได้ในเทิร์นถัดไป",
  },
  {
    name: "Event",
    nameJp: "イベント",
    color: "border-l-purple-500",
    emoji: "✨",
    description:
      "การ์ดเวทย์ที่ใช้แล้วทิ้ง มี Effect หลากหลายตั้งแต่เสริม Power จนถึงทำลายการ์ดฝ่ายตรงข้าม",
    details:
      "ใช้ได้ในเทิร์นของตัวเอง บางใบสามารถใช้ในเทิร์นฝ่ายตรงข้ามได้ (Counter Event)",
  },
  {
    name: "Stage",
    nameJp: "ステージ",
    color: "border-l-green-500",
    emoji: "🏴‍☠️",
    description:
      "การ์ดสนามที่ให้ Effect ต่อเนื่อง วางลงสนามแล้วอยู่ไปจนถูกทำลาย",
    details: "ให้ข้อได้เปรียบระยะยาว เช่น เพิ่ม Power หรือลด Cost",
  },
  {
    name: "DON!!",
    nameJp: "ドン!!カード",
    color: "border-l-primary",
    emoji: "💪",
    description:
      "พลังงานของเกม ใช้สำหรับจ่าย Cost ของการ์ดอื่น เริ่มต้น 0 แจก 2 ใบต่อเทิร์น สูงสุด 10",
    details:
      "สามารถแนบ DON!! เข้ากับ Character หรือ Leader เพื่อเพิ่ม Power +1000 ต่อ DON!! 1 ใบ",
  },
];

export default function CardTypesPage() {
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
          Card Types
        </h1>
        <p className="text-muted-foreground text-lg">
          OPCG มีการ์ด 5 ประเภท แต่ละประเภทมีบทบาทและวิธีใช้ต่างกัน
        </p>
      </div>

      <div className="space-y-4">
        {cardTypes.map((type) => (
          <Card key={type.name} className={`border-l-4 ${type.color}`}>
            <CardContent className="space-y-2 p-5">
              <div className="flex items-center gap-3">
                <span className="text-2xl">{type.emoji}</span>
                <div>
                  <h2 className="font-sans text-lg font-semibold">
                    {type.name}
                  </h2>
                  <span className="text-muted-foreground text-sm">
                    {type.nameJp}
                  </span>
                </div>
              </div>
              <p className="text-sm leading-relaxed">{type.description}</p>
              <p className="text-muted-foreground text-sm leading-relaxed">
                {type.details}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="flex items-center justify-between border-t border-border pt-6">
        <Link
          href="/guide/getting-started"
          className="text-muted-foreground text-sm hover:text-foreground"
        >
          ← Getting Started
        </Link>
        <Link
          href="/guide/rarities"
          className="group inline-flex items-center gap-2 font-sans text-sm font-semibold text-primary hover:underline"
        >
          บทต่อไป: Rarities
          <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
        </Link>
      </div>
    </div>
  );
}
