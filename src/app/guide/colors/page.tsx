import Link from "next/link";
import type { Metadata } from "next";
import { ArrowRight } from "lucide-react";

export const metadata: Metadata = {
  title: "Colors — คู่มือ OPCG",
};

const colors = [
  {
    name: "Red",
    hex: "#DC2626",
    characters: "Luffy, Ace, Kid",
    style: "โจมตีรุนแรง เน้น Rush + Power",
    description: "สีของการโจมตี เร่ง Power ให้สูงลิ่ว และเคลียร์สนามฝ่ายตรงข้ามอย่างรวดเร็ว",
  },
  {
    name: "Blue",
    hex: "#3B82F6",
    characters: "Doflamingo, Crocodile, Nami",
    style: "ควบคุมมือ เล่นตามจังหวะ",
    description: "สีของการควบคุม สลับการ์ดกลับมือ ดึงเกมยาว และเลือกจังหวะเด็ดขาด",
  },
  {
    name: "Green",
    hex: "#22C55E",
    characters: "Zoro, Uta, Marco",
    style: "Ramp DON!! + Board control",
    description: "สีของการสร้างทรัพยากร เร่ง DON!! เพิ่มเร็ว พัก Character ให้พร้อมรบอีกครั้ง",
  },
  {
    name: "Purple",
    hex: "#8B5CF6",
    characters: "Kaido, Big Mom, Caesar",
    style: "Cost reduction + ค่ายผิด",
    description: "สีของ Cost reduction ลดค่าวางการ์ดตัวใหญ่ ใช้ DON!! จาก trash area ได้",
  },
  {
    name: "Black",
    hex: "#374151",
    characters: "Rob Lucci, Gecko Moria, Sakazuki",
    style: "Removal + ทำลายการ์ด",
    description: "สีของการทำลายล้าง KO การ์ดฝ่ายตรงข้ามที่มี Cost ต่ำ เน้นคุม Board",
  },
  {
    name: "Yellow",
    hex: "#EAB308",
    characters: "Sabo, Katakuri, Charlotte",
    style: "Life manipulation + Trigger",
    description: "สีของ Life trick ใช้ Life เป็นทรัพยากร trigger effect จาก Life area",
  },
];

export default function ColorsPage() {
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
          Colors
        </h1>
        <p className="text-muted-foreground text-lg">
          สีบอกสไตล์การเล่น — แต่ละสีมี playstyle ที่ต่างกัน
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {colors.map((color) => (
          <div
            key={color.name}
            className="overflow-hidden rounded-xl border border-border bg-card"
          >
            <div
              className="h-2"
              style={{ backgroundColor: color.hex }}
            />
            <div className="space-y-2 p-4">
              <div className="flex items-center gap-2">
                <div
                  className="size-4 rounded-full"
                  style={{ backgroundColor: color.hex }}
                />
                <h2 className="font-sans text-base font-semibold">
                  {color.name}
                </h2>
              </div>
              <p className="text-xs font-medium text-foreground">
                {color.style}
              </p>
              <p className="text-muted-foreground text-sm leading-relaxed">
                {color.description}
              </p>
              <p className="text-muted-foreground text-xs">
                ตัวอย่าง Leader: {color.characters}
              </p>
            </div>
          </div>
        ))}
      </div>

      <div className="flex items-center justify-between border-t border-border pt-6">
        <Link
          href="/guide/rarities"
          className="text-muted-foreground text-sm hover:text-foreground"
        >
          ← Rarities
        </Link>
        <Link
          href="/guide/sets"
          className="group inline-flex items-center gap-2 font-sans text-sm font-semibold text-primary hover:underline"
        >
          บทต่อไป: Sets
          <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
        </Link>
      </div>
    </div>
  );
}
