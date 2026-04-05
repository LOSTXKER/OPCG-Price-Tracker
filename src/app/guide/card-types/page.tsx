import Link from "next/link";
import Image from "next/image";
import type { Metadata } from "next";
import type { LucideIcon } from "lucide-react";
import {
  ArrowLeft,
  ArrowRight,
  Crown,
  ExternalLink,
  Hash,
  Heart,
  Info,
  Map,
  Shield,
  Sparkles,
  Swords,
  Users,
  Zap,
} from "lucide-react";
import { prisma } from "@/lib/db";
import { Breadcrumb } from "@/components/shared/breadcrumb";
import { JsonLd } from "@/lib/seo/json-ld-script";
import { breadcrumbJsonLd } from "@/lib/seo/json-ld";

export const metadata: Metadata = {
  title: "ประเภทการ์ด (Card Types) — คู่มือ OPCG",
  description:
    "เรียนรู้การ์ด 5 ประเภทใน One Piece Card Game: Leader, Character, Event, Stage และ DON!! พร้อมค่าสถานะ คีย์เวิร์ดสำคัญ และผังการ์ด อ้างอิงจากกฎ Bandai",
  alternates: { canonical: "/guide/card-types" },
};

/* ------------------------------------------------------------------ */
/*  Card type data                                                     */
/* ------------------------------------------------------------------ */

interface CardTypeInfo {
  name: string;
  nameJp: string;
  icon: LucideIcon;
  iconBg: string;
  iconColor: string;
  borderColor: string;
  stats: string[];
  role: string;
  rules: string[];
  featured?: boolean;
}

const CARD_TYPES: CardTypeInfo[] = [
  {
    name: "Leader",
    nameJp: "リーダー",
    icon: Crown,
    iconBg: "bg-orange-500/10",
    iconColor: "text-orange-500",
    borderColor: "border-orange-500/20",
    stats: ["Life 4-5", "Power 5000", "Color", "Effect"],
    role: "การ์ดผู้นำ 1 ใบต่อเด็ค กำหนดสีและกลยุทธ์ของเด็คทั้งหมด Leader อยู่บนสนามตลอดเกมและไม่สามารถถูกทำลายได้",
    rules: [
      "กำหนดสีของการ์ดที่ใส่ในเด็คได้ (ต้องตรงสีกับ Leader)",
      "เมื่อ Life หมดและถูกโจมตีสำเร็จอีกครั้ง = แพ้",
      "สามารถแนบ DON!! เพื่อเพิ่ม Power ได้เหมือน Character",
    ],
    featured: true,
  },
  {
    name: "Character",
    nameJp: "キャラクター",
    icon: Swords,
    iconBg: "bg-blue-500/10",
    iconColor: "text-blue-500",
    borderColor: "border-blue-500/20",
    stats: ["Cost", "Power", "Counter", "Effect", "Trigger"],
    role: "ตัวละครที่ลงสนามเพื่อโจมตีและป้องกัน เป็นประเภทที่มีจำนวนมากที่สุดในเกม",
    rules: [
      "จ่าย DON!! ตามค่า Cost เพื่อวางลงสนาม",
      "โจมตีได้ตั้งแต่เทิร์นถัดไป (ยกเว้นมี [Rush])",
      "เมื่อถูกโจมตีสำเร็จจะถูกส่งไป Trash ทันที",
      "บางใบมี Counter ช่วยป้องกันได้เมื่ออยู่ในมือ",
    ],
  },
  {
    name: "Event",
    nameJp: "イベント",
    icon: Sparkles,
    iconBg: "bg-purple-500/10",
    iconColor: "text-purple-500",
    borderColor: "border-purple-500/20",
    stats: ["Cost", "Effect", "Trigger"],
    role: "การ์ดเวทย์ที่ใช้แล้วส่งไป Trash ทันที มี Effect หลากหลายตั้งแต่เสริม Power จนถึงทำลายการ์ดฝ่ายตรงข้าม",
    rules: [
      "ใช้ได้ใน Main Phase ของเทิร์นตัวเอง",
      "บางใบมี [Counter] ใช้ในเทิร์นฝ่ายตรงข้ามได้ (Counter Event)",
      "ไม่มีค่า Power เพราะไม่ลงสนาม",
    ],
  },
  {
    name: "Stage",
    nameJp: "ステージ",
    icon: Map,
    iconBg: "bg-amber-500/10",
    iconColor: "text-amber-500",
    borderColor: "border-amber-500/20",
    stats: ["Cost", "Effect"],
    role: "การ์ดสนามที่ให้ Effect ต่อเนื่อง วางลงสนามแล้วอยู่ไปจนถูกแทนที่หรือทำลาย",
    rules: [
      "วางได้ครั้งละ 1 ใบ ถ้าวางใหม่จะแทนที่ใบเก่า",
      "ให้ข้อได้เปรียบระยะยาว เช่น เพิ่ม Power, ลด Cost, จั่วการ์ด",
      "ไม่มี Power และไม่สามารถถูกโจมตีโดยตรง",
    ],
  },
  {
    name: "DON!!",
    nameJp: "ドン!!カード",
    icon: Zap,
    iconBg: "bg-rose-500/10",
    iconColor: "text-rose-500",
    borderColor: "border-rose-500/20",
    stats: ["+1000 Power", "สูงสุด 10 ใบ"],
    role: "การ์ดพลังงานของเกม ไม่ใส่ในเด็ค 50 ใบ แต่แยกเป็นกอง 10 ใบต่างหาก ได้เพิ่ม 2 ใบทุกเทิร์น",
    rules: [
      "Rest (พลิกแนวนอน) เพื่อจ่ายค่า Cost ของการ์ดอื่น",
      "แนบเข้ากับ Leader/Character เพื่อเพิ่ม +1,000 Power ต่อ DON!! 1 ใบ",
      "DON!! ที่แนบจะกลับไป Cost Area เมื่อจบเทิร์น",
      "ทุกเด็คใช้ DON!! เหมือนกัน 10 ใบ (ไม่มีให้เลือก)",
    ],
  },
];

/* ------------------------------------------------------------------ */
/*  Stats data                                                         */
/* ------------------------------------------------------------------ */

const STATS = [
  { name: "Cost", desc: "ค่าลงสนาม จ่ายด้วย DON!!", types: "Character, Event, Stage", icon: Zap },
  { name: "Power", desc: "พลังโจมตีและป้องกัน เช่น 4000, 5000, 10000", types: "Leader, Character", icon: Swords },
  { name: "Counter", desc: "ค่าช่วยป้องกันเมื่อทิ้งจากมือ (+1000 หรือ +2000)", types: "Character บางใบ", icon: Shield },
  { name: "Life", desc: "จำนวน Life เริ่มต้น (4-5 ใบ) เฉพาะ Leader เท่านั้น", types: "Leader", icon: Heart },
  { name: "Color", desc: "สี: Red, Green, Blue, Purple, Black, Yellow หรือ Multicolor", types: "ทุกประเภท (ยกเว้น DON!!)", icon: Hash },
  { name: "Attribute", desc: "ประเภทโจมตี: Slash, Strike, Ranged, Special, Wisdom", types: "Character", icon: Swords },
  { name: "Trait", desc: "สังกัด เช่น Straw Hat Crew, Navy, The Four Emperors", types: "Leader, Character", icon: Users },
  { name: "Effect", desc: "ความสามารถพิเศษของการ์ด ถ้ามี", types: "ทุกประเภท", icon: Sparkles },
  { name: "Trigger", desc: "Effect พิเศษเมื่อการ์ดถูกเปิดจาก Life", types: "Character, Event, Stage", icon: Zap },
];

/* ------------------------------------------------------------------ */
/*  Keywords data                                                      */
/* ------------------------------------------------------------------ */

const KEYWORDS = [
  { keyword: "[Blocker]", desc: "Character นี้สามารถ rest ตัวเองเพื่อรับโจมตีแทน Leader หรือ Character อื่น", color: "bg-blue-500/10 text-blue-600 dark:text-blue-400" },
  { keyword: "[Rush]", desc: "โจมตีได้ทันทีในเทิร์นที่ลงสนาม (ปกติต้องรอเทิร์นถัดไป)", color: "bg-rose-500/10 text-rose-600 dark:text-rose-400" },
  { keyword: "[Double Attack]", desc: "เมื่อโจมตี Leader สำเร็จ ฝ่ายตรงข้ามเสีย Life 2 ใบแทน 1", color: "bg-amber-500/10 text-amber-600 dark:text-amber-400" },
  { keyword: "[Banish]", desc: "เมื่อทำลายการ์ดฝ่ายตรงข้าม ส่งไปนอกเกมแทนที่จะไป Trash", color: "bg-purple-500/10 text-purple-600 dark:text-purple-400" },
  { keyword: "[Counter]", desc: "Event ที่ใช้ได้ใน Counter Step ของเทิร์นฝ่ายตรงข้ามเพื่อเพิ่ม Power", color: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" },
  { keyword: "[On Play]", desc: "Effect ที่เกิดขึ้นทันทีเมื่อการ์ดถูกเล่นลงสนาม", color: "bg-sky-500/10 text-sky-600 dark:text-sky-400" },
];

/* ------------------------------------------------------------------ */
/*  DB query                                                           */
/* ------------------------------------------------------------------ */

type ExampleCard = {
  cardCode: string;
  nameEn: string | null;
  nameJp: string;
  imageUrl: string | null;
};

const CARD_TYPE_DB_MAP: Record<string, "LEADER" | "CHARACTER" | "EVENT" | "STAGE" | "DON"> = {
  Leader: "LEADER",
  Character: "CHARACTER",
  Event: "EVENT",
  Stage: "STAGE",
  "DON!!": "DON",
};

async function getExampleCardsByType(): Promise<Record<string, ExampleCard[]>> {
  try {
    const cards = await prisma.card.findMany({
      where: { imageUrl: { not: null }, isParallel: false },
      select: {
        cardCode: true,
        nameEn: true,
        nameJp: true,
        imageUrl: true,
        cardType: true,
      },
      orderBy: { cardCode: "asc" },
    });

    const byType: Record<string, ExampleCard[]> = {};
    for (const c of cards) {
      const key = c.cardType;
      if (!byType[key]) byType[key] = [];
      if (byType[key].length < 4) byType[key].push(c);
    }
    return byType;
  } catch {
    return {};
  }
}

/* ------------------------------------------------------------------ */
/*  Page                                                               */
/* ------------------------------------------------------------------ */

export default async function CardTypesPage() {
  const cardExamples = await getExampleCardsByType();
  const featured = CARD_TYPES[0]; // Leader
  const rest = CARD_TYPES.slice(1);

  return (
    <div className="mx-auto max-w-3xl space-y-12">
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "Home", href: "/" },
          { name: "Guide", href: "/guide" },
          { name: "Card Types", href: "/guide/card-types" },
        ])}
      />

      {/* ── 1. Hero + Intro ── */}
      <div className="space-y-3">
        <Breadcrumb
          items={[
            { label: "Home", href: "/" },
            { label: "Guide", href: "/guide" },
            { label: "ประเภทการ์ด" },
          ]}
        />
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
          ประเภทการ์ด (Card Types)
        </h1>
        <p className="text-lg leading-relaxed text-muted-foreground">
          One Piece Card Game มีการ์ด <strong className="text-foreground">5 ประเภท</strong>{" "}
          แต่ละประเภทมีบทบาทและวิธีใช้ต่างกัน
          การเข้าใจหน้าที่ของการ์ดแต่ละประเภทเป็นพื้นฐานสำคัญของการสร้างเด็คและวางกลยุทธ์
        </p>
      </div>

      {/* ── 2. Card Types ── */}
      <section className="space-y-4">
        {/* Featured: Leader */}
        {(() => {
          const dbKey = CARD_TYPE_DB_MAP[featured.name];
          const examples = dbKey ? cardExamples[dbKey] ?? [] : [];
          return (
            <div className={`overflow-hidden rounded-2xl border ${featured.borderColor} bg-card`}>
              <div className="flex items-start gap-4 p-6">
                <div className={`flex size-12 shrink-0 items-center justify-center rounded-xl ${featured.iconBg}`}>
                  <featured.icon className={`size-6 ${featured.iconColor}`} />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-baseline gap-2">
                    <h2 className="text-xl font-bold">{featured.name}</h2>
                    <span className="text-sm text-muted-foreground">{featured.nameJp}</span>
                  </div>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {featured.stats.map((s) => (
                      <span key={s} className="rounded-full bg-muted px-2.5 py-0.5 text-[11px] font-medium text-muted-foreground">
                        {s}
                      </span>
                    ))}
                  </div>
                  <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{featured.role}</p>
                  <ul className="mt-3 space-y-1.5">
                    {featured.rules.map((rule, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                        <span className="mt-1.5 size-1 shrink-0 rounded-full bg-orange-500" />
                        {rule}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
              {examples.length > 0 && (
                <div className="border-t border-orange-500/10 px-6 py-3">
                  <p className="mb-2 text-[10px] font-medium text-muted-foreground">ตัวอย่างการ์ด Leader</p>
                  <div className="flex gap-2">
                    {examples.map((card) => (
                      <Link key={card.cardCode} href={`/cards/${card.cardCode}`} className="group shrink-0">
                        <div className="relative aspect-[63/88] w-14 overflow-hidden rounded-lg bg-muted transition-transform group-hover:-translate-y-0.5">
                          {card.imageUrl && (
                            <Image src={card.imageUrl} alt={card.nameEn ?? card.nameJp} fill className="object-contain" sizes="56px" />
                          )}
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })()}

        {/* Rest: 2x2 grid */}
        <div className="grid gap-4 sm:grid-cols-2">
          {rest.map((type) => {
            const dbKey = CARD_TYPE_DB_MAP[type.name];
            const examples = dbKey ? cardExamples[dbKey] ?? [] : [];
            return (
              <div key={type.name} className={`overflow-hidden rounded-2xl border ${type.borderColor} bg-card`}>
                <div className="p-5">
                  <div className="flex items-start gap-3">
                    <div className={`flex size-10 shrink-0 items-center justify-center rounded-lg ${type.iconBg}`}>
                      <type.icon className={`size-5 ${type.iconColor}`} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-baseline gap-2">
                        <h2 className="text-sm font-bold">{type.name}</h2>
                        <span className="text-xs text-muted-foreground">{type.nameJp}</span>
                      </div>
                      <div className="mt-1.5 flex flex-wrap gap-1">
                        {type.stats.map((s) => (
                          <span key={s} className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
                            {s}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                  <p className="mt-3 text-xs leading-relaxed text-muted-foreground">{type.role}</p>
                  <ul className="mt-2.5 space-y-1">
                    {type.rules.map((rule, i) => (
                      <li key={i} className="flex items-start gap-2 text-xs text-muted-foreground">
                        <span className={`mt-1.5 size-1 shrink-0 rounded-full ${type.iconColor.replace("text-", "bg-")}`} />
                        {rule}
                      </li>
                    ))}
                  </ul>
                </div>
                {examples.length > 0 && (
                  <div className={`border-t px-5 py-3 ${type.borderColor}`}>
                    <p className="mb-2 text-[10px] font-medium text-muted-foreground">ตัวอย่างการ์ด</p>
                    <div className="flex gap-2">
                      {examples.map((card) => (
                        <Link key={card.cardCode} href={`/cards/${card.cardCode}`} className="group shrink-0">
                          <div className="relative aspect-[63/88] w-12 overflow-hidden rounded-lg bg-muted transition-transform group-hover:-translate-y-0.5">
                            {card.imageUrl && (
                              <Image src={card.imageUrl} alt={card.nameEn ?? card.nameJp} fill className="object-contain" sizes="48px" />
                            )}
                          </div>
                        </Link>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* ── 3. Card Anatomy Diagram ── */}
      <section className="space-y-4">
        <h2 className="text-xl font-semibold">ผังการ์ด (Card Anatomy)</h2>
        <p className="text-sm text-muted-foreground">
          ตำแหน่งของค่าสถานะต่างๆ บนการ์ด Character (การ์ดประเภทอื่นคล้ายกัน)
        </p>
        <div className="overflow-hidden rounded-xl border border-border/50 bg-card">
          <div className="border-b border-border/40 px-4 py-2 text-xs font-medium text-muted-foreground">
            ตัวอย่างผังการ์ด Character
          </div>
          <div className="relative mx-auto max-w-[280px] p-6">
            {/* Card frame */}
            <div className="aspect-[63/88] w-full rounded-xl border-2 border-border bg-muted/20 p-3">
              {/* Top row: Cost, Power, Attribute */}
              <div className="flex items-start justify-between">
                <div className="flex size-8 items-center justify-center rounded-lg border border-dashed border-blue-500/40 bg-blue-500/10 text-[10px] font-bold text-blue-500">
                  Cost
                </div>
                <div className="flex h-8 items-center justify-center rounded-lg border border-dashed border-rose-500/40 bg-rose-500/10 px-2 text-[10px] font-bold text-rose-500">
                  Power
                </div>
                <div className="flex size-8 items-center justify-center rounded-lg border border-dashed border-amber-500/40 bg-amber-500/10 text-[8px] font-bold text-amber-500">
                  Attr
                </div>
              </div>

              {/* Art area */}
              <div className="mt-2 flex aspect-[4/3] items-center justify-center rounded-lg border border-dashed border-border bg-muted/30">
                <span className="text-xs text-muted-foreground/50">Art</span>
              </div>

              {/* Type + Name + Trait */}
              <div className="mt-2 space-y-0.5">
                <div className="flex items-center gap-1.5">
                  <span className="rounded border border-dashed border-purple-500/40 bg-purple-500/10 px-1.5 py-0.5 text-[8px] font-bold text-purple-500">
                    Type
                  </span>
                  <span className="rounded border border-dashed border-primary/30 bg-primary/5 px-1.5 py-0.5 text-[8px] font-bold text-primary">
                    Color
                  </span>
                </div>
                <div className="rounded border border-dashed border-foreground/20 bg-foreground/5 px-1.5 py-0.5 text-[9px] font-semibold text-foreground/70">
                  Name
                </div>
                <div className="rounded border border-dashed border-emerald-500/40 bg-emerald-500/10 px-1.5 py-0.5 text-[8px] font-bold text-emerald-500">
                  Trait (สังกัด)
                </div>
              </div>

              {/* Bottom row: Effect area + Rarity/Block */}
              <div className="mt-1.5 flex items-end justify-between">
                <div className="flex-1 rounded border border-dashed border-orange-500/40 bg-orange-500/5 px-1.5 py-1 text-[7px] leading-tight text-orange-500">
                  Effect / Trigger
                </div>
                <div className="ml-1.5 flex items-center gap-1">
                  <span className="rounded border border-dashed border-amber-500/40 bg-amber-500/10 px-1 py-0.5 text-[8px] font-bold text-amber-500">
                    R
                  </span>
                  <span className="flex size-5 items-center justify-center rounded border border-dashed border-muted-foreground/30 bg-muted/30 text-[8px] font-bold text-muted-foreground">
                    2
                  </span>
                </div>
              </div>
            </div>

            {/* Labels outside */}
            <div className="mt-3 flex flex-wrap justify-center gap-2 text-[10px] text-muted-foreground">
              <span className="rounded bg-muted px-2 py-0.5">R = Rarity</span>
              <span className="rounded bg-muted px-2 py-0.5">2 = Block Icon</span>
              <span className="rounded bg-muted px-2 py-0.5">Attr = Attribute</span>
            </div>
          </div>
        </div>
      </section>

      {/* ── 4. Stats Reference ── */}
      <section className="space-y-4">
        <h2 className="text-xl font-semibold">ค่าสถานะ (Stats)</h2>
        <p className="text-sm text-muted-foreground">
          ค่าต่างๆ ที่ปรากฏบนการ์ดแต่ละใบ
        </p>
        <div className="grid gap-2 sm:grid-cols-2">
          {STATS.map((stat) => (
            <div key={stat.name} className="flex items-start gap-3 rounded-xl border border-border/50 bg-card px-4 py-3">
              <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-muted">
                <stat.icon className="size-4 text-muted-foreground" />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold">{stat.name}</p>
                <p className="text-xs leading-relaxed text-muted-foreground">{stat.desc}</p>
                <p className="mt-0.5 text-[10px] text-muted-foreground/60">
                  {stat.types}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── 5. Common Keywords ── */}
      <section className="space-y-4">
        <h2 className="text-xl font-semibold">คีย์เวิร์ดสำคัญ</h2>
        <p className="text-sm text-muted-foreground">
          คีย์เวิร์ดที่พบบ่อยบนการ์ด OPCG ที่ผู้เล่นควรรู้จัก
        </p>
        <div className="grid gap-2 sm:grid-cols-2">
          {KEYWORDS.map((kw) => (
            <div key={kw.keyword} className="flex items-start gap-3 rounded-xl border border-border/50 bg-card px-4 py-3">
              <span className={`shrink-0 rounded-md px-2 py-1 text-xs font-bold ${kw.color}`}>
                {kw.keyword}
              </span>
              <p className="text-xs leading-relaxed text-muted-foreground">
                {kw.desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* ── 6. Trigger Callout ── */}
      <div className="flex items-start gap-2.5 rounded-lg border border-amber-500/20 bg-amber-500/5 px-4 py-3">
        <Info className="mt-0.5 size-4 shrink-0 text-amber-500" />
        <div className="text-sm text-muted-foreground">
          <p>
            <strong className="text-foreground">Trigger:</strong>{" "}
            การ์ดประเภท Character, Event, และ Stage สามารถมี Trigger ได้
            เมื่อการ์ดนั้นถูกเปิดจาก Life (โดนโจมตี Leader สำเร็จ)
            จะได้ใช้ Effect พิเศษทันที เช่น เพิ่ม Power, จั่วการ์ด, หรือลงการ์ดฟรี
          </p>
          <p className="mt-1.5">
            <strong className="text-foreground">DON!!</strong>{" "}
            เป็นประเภทเดียวที่ไม่มี Trigger เพราะไม่ได้อยู่ในเด็ค 50 ใบ
          </p>
        </div>
      </div>

      {/* ── 7. Sources ── */}
      <section className="space-y-3">
        <h2 className="text-xl font-semibold">แหล่งอ้างอิง</h2>
        <div className="divide-y divide-border/50 rounded-xl border border-border/50 bg-card text-sm">
          {[
            {
              label: "Official Rules",
              desc: "กฎเกมอย่างเป็นทางการจาก Bandai",
              url: "https://en.onepiece-cardgame.com/rules/",
            },
            {
              label: "Play Guide",
              desc: "คู่มือวิธีเล่นพร้อมภาพประกอบจาก Bandai",
              url: "https://en.onepiece-cardgame.com/play-guide/",
            },
          ].map((src) => (
            <a
              key={src.url}
              href={src.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-muted/30"
            >
              <div className="min-w-0 flex-1">
                <p className="font-medium">{src.label}</p>
                <p className="text-xs text-muted-foreground">{src.desc}</p>
              </div>
              <ExternalLink className="size-4 shrink-0 text-muted-foreground/40" />
            </a>
          ))}
        </div>
      </section>

      {/* ── Navigation ── */}
      <div className="flex items-center justify-between border-t border-border pt-6">
        <Link
          href="/guide/getting-started"
          className="group inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="size-4 transition-transform group-hover:-translate-x-0.5" />
          เริ่มต้น
        </Link>
        <Link
          href="/guide/rarities"
          className="group inline-flex items-center gap-2 text-sm font-semibold text-primary hover:underline"
        >
          บทต่อไป: ความหายาก
          <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
        </Link>
      </div>
    </div>
  );
}
