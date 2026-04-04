import Link from "next/link";
import Image from "next/image";
import type { Metadata } from "next";
import {
  ArrowLeft,
  ArrowRight,
  ExternalLink,
  ImageIcon,
  Info,
  Package,
  Printer,
  Sparkles,
  Swords,
  Users,
} from "lucide-react";
import { prisma } from "@/lib/db";
import { Breadcrumb } from "@/components/shared/breadcrumb";
import { JsonLd } from "@/lib/seo/json-ld-script";
import { breadcrumbJsonLd } from "@/lib/seo/json-ld";

export const metadata: Metadata = {
  title: "ความหายาก (Rarities) — คู่มือ OPCG",
  description:
    "คู่มือระดับความหายากของ One Piece Card Game ครบทุก Rarity: C, UC, R, SR, SEC, SP, TR พร้อม Parallel, Box Pattern, ปัจจัยราคา อ้างอิงจาก Bandai",
  alternates: { canonical: "/guide/rarities" },
};

/* ------------------------------------------------------------------ */
/*  Rarity data                                                        */
/* ------------------------------------------------------------------ */

interface RarityTier {
  code: string;
  name: string;
  color: string;
  perSet: string;
  priceJpy: string;
  description: string;
  prominent?: boolean;
}

const RARITY_TIERS: RarityTier[] = [
  {
    code: "TR",
    name: "Treasure Rare",
    color: "#EF4444",
    perSet: "บางชุดมี 1 ใบ บางชุดไม่มี",
    priceJpy: "¥100,000-1,000,000+",
    description: "หายากที่สุดในเกม เริ่มมีตั้งแต่ชุด OP05 ไม่ได้มีทุกชุด เป็นที่ต้องการสูงสุดของนักสะสม",
    prominent: true,
  },
  {
    code: "SP",
    name: "Special",
    color: "#EC4899",
    perSet: "ประมาณ 10 แบบ",
    priceJpy: "¥3,000-600,000+",
    description: "การ์ดที่เอามาวาดภาพใหม่ทั้งหมด มักเป็น manga art สวยมาก โอกาสได้ต่ำมาก",
    prominent: true,
  },
  {
    code: "SEC",
    name: "Secret Rare",
    color: "#F59E0B",
    perSet: "ประมาณ 2 แบบ",
    priceJpy: "¥500-5,000",
    description: "การ์ดลับที่หายากมาก งานศิลป์ระดับพรีเมียม โอกาสเจอประมาณ 1 ใบต่อ 3 กล่อง",
    prominent: true,
  },
  {
    code: "SR",
    name: "Super Rare",
    color: "#8B5CF6",
    perSet: "ประมาณ 10 แบบ",
    priceJpy: "¥80-2,000",
    description: "การ์ดหายากที่มี Effect ทรงพลัง การันตี 3 ใบต่อกล่อง ตัวที่ใช้ในเมตาแข่งขันราคาสูง",
  },
  {
    code: "R",
    name: "Rare",
    color: "#3B82F6",
    perSet: "ประมาณ 26 แบบ",
    priceJpy: "¥80-200",
    description: "การ์ดหายากพอประมาณ มี Effect ที่ดีและใช้งานได้จริงในเด็ค",
  },
  {
    code: "UC",
    name: "Uncommon",
    color: "#22C55E",
    perSet: "ประมาณ 30 แบบ",
    priceJpy: "¥80",
    description: "การ์ดที่ไม่ธรรมดา หาได้ไม่ยาก บางใบมี Effect ที่ใช้งานได้ดีในเด็ค",
  },
  {
    code: "C",
    name: "Common",
    color: "#6B7280",
    perSet: "ประมาณ 45 แบบ",
    priceJpy: "¥30",
    description: "การ์ดพื้นฐานที่เจอมากที่สุด ทุกซองจะมีหลายใบ ราคาถูกแต่บางใบก็ใช้งานได้ดี",
  },
  {
    code: "L",
    name: "Leader",
    color: "#F97316",
    perSet: "ประมาณ 6 แบบ",
    priceJpy: "¥50",
    description: "การ์ดผู้นำสำหรับตั้งเด็ค มีใน Booster และ Starter Deck",
  },
  {
    code: "DON",
    name: "DON!!",
    color: "#EA580C",
    perSet: "ใช้ 10 ใบต่อเด็ค",
    priceJpy: "¥100-50,000+",
    description: "การ์ดพลังงาน ปกติไม่มีมูลค่า แต่เวอร์ชันพิเศษ (Alternative Art) สะสมได้ราคาสูง",
  },
  {
    code: "P",
    name: "Promo",
    color: "#06B6D4",
    perSet: "แจกตามงานอีเวนต์",
    priceJpy: "แล้วแต่ความหายาก",
    description: "การ์ดโปรโมชัน แจกในงานอีเวนต์ ทัวร์นาเมนต์ หรือมาพร้อมสินค้าเฉพาะ",
  },
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

async function getExampleCards(): Promise<{
  byRarity: Record<string, ExampleCard[]>;
  parallels: ExampleCard[];
}> {
  try {
    const [cards, parallels] = await Promise.all([
      prisma.card.findMany({
        where: { imageUrl: { not: null }, isParallel: false },
        select: {
          cardCode: true,
          nameEn: true,
          nameJp: true,
          imageUrl: true,
          rarity: true,
        },
        orderBy: { cardCode: "asc" },
      }),
      prisma.card.findMany({
        where: { imageUrl: { not: null }, isParallel: true },
        select: {
          cardCode: true,
          nameEn: true,
          nameJp: true,
          imageUrl: true,
          rarity: true,
        },
        orderBy: { cardCode: "asc" },
        take: 6,
      }),
    ]);

    const byRarity: Record<string, ExampleCard[]> = {};
    for (const c of cards) {
      if (!byRarity[c.rarity]) byRarity[c.rarity] = [];
      if (byRarity[c.rarity].length < 4) {
        byRarity[c.rarity].push(c);
      }
    }

    return { byRarity, parallels };
  } catch {
    return { byRarity: {}, parallels: [] };
  }
}

/* ------------------------------------------------------------------ */
/*  Page                                                               */
/* ------------------------------------------------------------------ */

export default async function RaritiesPage() {
  const { byRarity, parallels } = await getExampleCards();
  const prominent = RARITY_TIERS.filter((r) => r.prominent);
  const regular = RARITY_TIERS.filter((r) => !r.prominent);

  return (
    <div className="mx-auto max-w-3xl space-y-12">
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "Home", href: "/" },
          { name: "Guide", href: "/guide" },
          { name: "Rarities", href: "/guide/rarities" },
        ])}
      />

      {/* ── 1. Hero + Intro ── */}
      <div className="space-y-3">
        <Breadcrumb
          items={[
            { label: "Home", href: "/" },
            { label: "Guide", href: "/guide" },
            { label: "ความหายาก" },
          ]}
        />
        <h1 className="text-3xl font-bold tracking-tight">
          ความหายาก (Rarities)
        </h1>
        <p className="text-lg leading-relaxed text-muted-foreground">
          ยิ่งหายากยิ่งแพง — ทำความรู้จักกับระดับความหายากทั้งหมดใน One Piece Card Game
          ตั้งแต่ <strong className="text-foreground">Common</strong> ไปจนถึง{" "}
          <strong className="text-foreground">Treasure Rare</strong> ที่หายากที่สุด
        </p>
      </div>

      {/* ── 2. Rarity Tiers ── */}
      <section className="space-y-4">
        <h2 className="text-xl font-semibold">ระดับความหายาก</h2>
        <p className="text-sm text-muted-foreground">
          เรียงจากหายากที่สุดลงมา — &quot;แบบ&quot; หมายถึงจำนวนการ์ดต่างกันในแต่ละชุด
          ราคาอ้างอิงจาก Yuyu-tei (ตลาดรับซื้อ-ขายการ์ดญี่ปุ่น)
        </p>

        {/* Prominent tiers: TR, SP, SEC */}
        <div className="space-y-3">
          {prominent.map((rarity) => {
            const examples = byRarity[rarity.code] ?? [];
            return (
              <div
                key={rarity.code}
                className="overflow-hidden rounded-2xl border bg-card"
                style={{ borderColor: `${rarity.color}30` }}
              >
                <div className="flex items-start gap-4 p-5">
                  <div
                    className="flex size-14 shrink-0 items-center justify-center rounded-xl text-base font-bold text-white"
                    style={{ backgroundColor: rarity.color }}
                  >
                    {rarity.code}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-baseline gap-2">
                      <h3 className="text-base font-bold">{rarity.name}</h3>
                      <span className="text-xs text-muted-foreground">{rarity.perSet}</span>
                    </div>
                    <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                      {rarity.description}
                    </p>
                    <p className="mt-2 text-sm">
                      <span className="text-muted-foreground">ราคาตลาด: </span>
                      <span className="font-mono font-semibold" style={{ color: rarity.color }}>
                        {rarity.priceJpy}
                      </span>
                    </p>
                  </div>
                </div>
                {examples.length > 0 && (
                  <div className="border-t px-5 py-3" style={{ borderColor: `${rarity.color}15` }}>
                    <p className="mb-2 text-[10px] font-medium text-muted-foreground">ตัวอย่างการ์ด</p>
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
          })}
        </div>

        {/* Regular tiers */}
        <div className="grid gap-2 sm:grid-cols-2">
          {regular.map((rarity) => (
            <div
              key={rarity.code}
              className="flex items-start gap-3 rounded-xl border border-border/50 bg-card p-4"
            >
              <div
                className="flex size-10 shrink-0 items-center justify-center rounded-lg text-xs font-bold text-white"
                style={{ backgroundColor: rarity.color }}
              >
                {rarity.code}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-baseline gap-1.5">
                  <h3 className="text-sm font-semibold">{rarity.name}</h3>
                  <span className="text-[10px] text-muted-foreground">{rarity.perSet}</span>
                </div>
                <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">
                  {rarity.description}
                </p>
                <p className="mt-1 font-mono text-xs font-medium" style={{ color: rarity.color }}>
                  {rarity.priceJpy}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── 3. Parallel Art ── */}
      <section className="space-y-4">
        <h2 className="text-xl font-semibold">Parallel Art (ภาพพิเศษ)</h2>
        <p className="text-sm leading-relaxed text-muted-foreground">
          การ์ดทุก rarity ตั้งแต่ C ถึง SEC สามารถมีเวอร์ชัน{" "}
          <strong className="text-foreground">Parallel</strong> ได้ ซึ่งก็คือการ์ดใบเดียวกัน
          (stat/effect เหมือนเดิม 100%) แต่{" "}
          <strong className="text-foreground">ภาพวาดใหม่ทั้งหมด</strong>{" "}
          ที่สวยกว่า หายากกว่า และแพงกว่าเวอร์ชันปกติมาก
        </p>

        {/* Price comparison example */}
        <div className="overflow-hidden rounded-xl border border-border/50 bg-card">
          <div className="border-b border-border/40 px-4 py-2 text-xs font-medium text-muted-foreground">
            ตัวอย่างราคา: การ์ดใบเดียวกันแต่ต่าง rarity
          </div>
          <div className="grid grid-cols-3 divide-x divide-border/40">
            {[
              { label: "SEC (ปกติ)", price: "¥500", color: "#F59E0B", sub: "ภาพมาตรฐาน" },
              { label: "P-SEC (Parallel)", price: "¥1,480", color: "#F59E0B", sub: "ภาพ alternate art" },
              { label: "Super Parallel", price: "¥198,000", color: "#EC4899", sub: "manga art หายากสุด" },
            ].map((item) => (
              <div key={item.label} className="p-4 text-center">
                <p className="text-[11px] font-medium text-muted-foreground">{item.label}</p>
                <p className="mt-1 font-mono text-lg font-bold" style={{ color: item.color }}>
                  {item.price}
                </p>
                <p className="mt-0.5 text-[10px] text-muted-foreground">{item.sub}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Parallel tiers list */}
        <div className="flex flex-wrap gap-2">
          {[
            { code: "P-C", name: "Parallel Common", color: "#6B7280" },
            { code: "P-UC", name: "Parallel Uncommon", color: "#22C55E" },
            { code: "P-R", name: "Parallel Rare", color: "#3B82F6" },
            { code: "P-SR", name: "Parallel Super Rare", color: "#8B5CF6" },
            { code: "P-SEC", name: "Parallel Secret Rare", color: "#F59E0B" },
            { code: "P-L", name: "Parallel Leader", color: "#F97316" },
          ].map((p) => (
            <div
              key={p.code}
              className="flex items-center gap-2 rounded-lg border border-border/50 bg-card px-3 py-1.5"
            >
              <span
                className="size-2.5 rounded-full"
                style={{ backgroundColor: p.color }}
              />
              <span className="text-xs font-semibold">{p.code}</span>
              <span className="text-xs text-muted-foreground">{p.name}</span>
            </div>
          ))}
        </div>

        {/* Parallel example cards */}
        {parallels.length > 0 && (
          <div>
            <p className="mb-2 text-xs font-medium text-muted-foreground">ตัวอย่าง Parallel Art</p>
            <div className="flex gap-2 overflow-x-auto pb-1">
              {parallels.map((card) => (
                <Link key={card.cardCode} href={`/cards/${card.cardCode}`} className="group shrink-0">
                  <div className="relative aspect-[63/88] w-16 overflow-hidden rounded-lg bg-muted transition-transform group-hover:-translate-y-0.5">
                    {card.imageUrl && (
                      <Image src={card.imageUrl} alt={card.nameEn ?? card.nameJp} fill className="object-contain" sizes="64px" />
                    )}
                  </div>
                  <p className="mt-1 max-w-16 truncate text-center text-[10px] text-muted-foreground">
                    {card.nameEn ?? card.nameJp}
                  </p>
                </Link>
              ))}
            </div>
          </div>
        )}
      </section>

      {/* ── 4. SP Reprint ── */}
      <section className="space-y-4">
        <h2 className="text-xl font-semibold">SP Reprint (การ์ดพิเศษข้ามเซ็ต)</h2>
        <div className="space-y-3 text-sm leading-relaxed text-muted-foreground">
          <p>
            <strong className="text-foreground">SP (Special)</strong> คือการ์ดที่ถูก{" "}
            <strong className="text-foreground">reprint จากเซ็ตเก่า</strong>{" "}
            แล้ววาดภาพใหม่ทั้งหมด (มักเป็น manga art จากมังงะ One Piece ต้นฉบับ)
            stat/effect เหมือนต้นฉบับทุกประการ แต่ภาพสวยมากจนเป็นที่ต้องการสูง
          </p>
          <p>
            SP มี <strong className="text-foreground">โอกาสออกต่ำมาก</strong> — ซื้อ 12 กล่อง (1 ลัง)
            มักได้ SP เพียงประมาณ 1 ใบ ทำให้ราคาตลาดสูงตั้งแต่หลักพันถึงหลักแสนเยน
            โดยเฉพาะตัวละครยอดนิยมอย่าง Nami, Hancock, Zoro
          </p>
        </div>

        <div className="flex items-start gap-2.5 rounded-lg border border-pink-500/20 bg-pink-500/5 px-4 py-3">
          <Info className="mt-0.5 size-4 shrink-0 text-pink-500" />
          <p className="text-sm text-muted-foreground">
            <strong className="text-foreground">Card code:</strong>{" "}
            SP reprint ยังใช้ code จากเซ็ตเดิม เช่น OP05-067 แต่อยู่ในซอง OP09
            ใน Meecard จะแสดงเป็นการ์ดแยกจากเวอร์ชันปกติ
          </p>
        </div>
      </section>

      {/* ── 5. Box Pattern ── */}
      <section className="space-y-6">
        <div>
          <h2 className="text-xl font-semibold">ซื้อ 1 กล่อง ได้อะไรบ้าง?</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            1 กล่อง Booster JP มี 24 ซอง (ซองละ 6 ใบ) —
            การ์ดหายากที่ได้จะขึ้นกับว่ากล่องนั้นเป็นรูปแบบไหน
          </p>
        </div>

        {/* ทุกกล่องได้ */}
        <div className="rounded-xl border border-border/50 bg-card p-5">
          <p className="text-sm font-semibold">ทุกกล่องจะได้</p>
          <div className="mt-3 space-y-2">
            <div className="flex items-center gap-3">
              <div className="flex size-9 items-center justify-center rounded-lg bg-purple-500/10">
                <span className="text-xs font-bold text-purple-500">SR</span>
              </div>
              <p className="text-sm text-muted-foreground">
                <strong className="text-foreground">Super Rare 3-4 ใบ</strong>
              </p>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex size-9 items-center justify-center rounded-lg bg-blue-500/10">
                <span className="text-xs font-bold text-blue-500">R</span>
              </div>
              <p className="text-sm text-muted-foreground">
                <strong className="text-foreground">Rare 7-8 ใบ</strong>
              </p>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex size-9 items-center justify-center rounded-lg bg-orange-500/10">
                <span className="text-xs font-bold text-orange-500">L</span>
              </div>
              <p className="text-sm text-muted-foreground">
                <strong className="text-foreground">Leader ประมาณ 4 ใบ</strong>
              </p>
            </div>
          </div>
        </div>

        {/* อธิบาย SEC vs Parallel */}
        <div className="rounded-xl border border-border/50 bg-muted/20 p-5 text-sm leading-relaxed text-muted-foreground">
          <p className="font-semibold text-foreground">แล้ว SEC กับ Parallel ล่ะ?</p>
          <p className="mt-2">
            นอกจากการ์ดข้างบน แต่ละกล่องจะมีโอกาสได้{" "}
            <strong className="text-foreground">SEC</strong> (Secret Rare){" "}
            หรือ{" "}
            <strong className="text-foreground">Parallel</strong> (การ์ดภาพพิเศษ){" "}
            แต่ <strong className="text-foreground">จะไม่ได้ทั้งสองอย่างในกล่องเดียวกัน</strong>
          </p>
          <p className="mt-3">
            เช่น ถ้าซื้อ 3 กล่อง อาจได้แบบนี้:
          </p>
          <div className="mt-3 space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="flex size-6 items-center justify-center rounded bg-amber-500 text-[10px] font-bold text-white">1</span>
              <span>กล่องที่ 1 → ได้ <strong className="text-foreground">SEC</strong> 1 ใบ (ไม่ได้ Parallel)</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="flex size-6 items-center justify-center rounded bg-purple-500 text-[10px] font-bold text-white">2</span>
              <span>กล่องที่ 2 → ได้ <strong className="text-foreground">Parallel</strong> 1 ใบ (ไม่ได้ SEC)</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="flex size-6 items-center justify-center rounded bg-blue-500 text-[10px] font-bold text-white">3</span>
              <span>กล่องที่ 3 → ได้ <strong className="text-foreground">Parallel</strong> 2 ใบ (ไม่ได้ SEC)</span>
            </div>
          </div>
        </div>

        {/* 3 รูปแบบ */}
        <div>
          <p className="text-sm font-medium">โอกาสเจอแต่ละแบบ</p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            * จากข้อมูลเปิดซองของ community ญี่ปุ่น — Bandai ไม่ได้เปิดเผยตัวเลขอย่างเป็นทางการ
          </p>
        </div>
        <div className="space-y-2">
          <div className="flex items-center gap-4 rounded-xl border border-purple-500/25 bg-purple-500/[0.03] px-5 py-4">
            <p className="w-14 shrink-0 text-2xl font-bold tabular-nums text-purple-600 dark:text-purple-400">42%</p>
            <div>
              <p className="text-sm font-semibold">Parallel 1 ใบ</p>
              <p className="text-xs text-muted-foreground">ได้การ์ดภาพพิเศษ (alternate art) 1 ใบ</p>
            </div>
          </div>

          <div className="flex items-center gap-4 rounded-xl border border-amber-500/25 bg-amber-500/[0.03] px-5 py-4">
            <p className="w-14 shrink-0 text-2xl font-bold tabular-nums text-amber-600 dark:text-amber-400">33%</p>
            <div>
              <p className="text-sm font-semibold">SEC 1 ใบ</p>
              <p className="text-xs text-muted-foreground">ได้ Secret Rare ภาพสวยหายาก 1 ใบ</p>
            </div>
          </div>

          <div className="flex items-center gap-4 rounded-xl border border-blue-500/25 bg-blue-500/[0.03] px-5 py-4">
            <p className="w-14 shrink-0 text-2xl font-bold tabular-nums text-blue-600 dark:text-blue-400">25%</p>
            <div>
              <p className="text-sm font-semibold">Parallel 2 ใบ</p>
              <p className="text-xs text-muted-foreground">โชคดี! ได้ภาพพิเศษถึง 2 ใบ</p>
            </div>
          </div>
        </div>

        {/* SP */}
        <div className="flex items-start gap-2.5 rounded-lg border border-pink-500/20 bg-pink-500/5 px-4 py-3">
          <Info className="mt-0.5 size-4 shrink-0 text-pink-500" />
          <p className="text-sm text-muted-foreground">
            <strong className="text-foreground">แล้ว SP ล่ะ?</strong>{" "}
            SP หายากกว่ามาก — จากข้อมูล community ประมาณ 12 กล่อง (1 ลัง) จะได้ SP สัก 1 ใบ
            ลองใช้{" "}
            <Link href="/drop-calculator" className="font-medium text-primary hover:underline">
              Drop Calculator
            </Link>{" "}
            คำนวณโอกาสได้การ์ดที่ต้องการ
          </p>
        </div>
      </section>

      {/* ── 6. Price Factors ── */}
      <section className="space-y-4">
        <h2 className="text-xl font-semibold">อะไรทำให้การ์ดแพง?</h2>
        <p className="text-sm text-muted-foreground">
          ราคาการ์ด OPCG ขึ้นอยู่กับหลายปัจจัยประกอบกัน
        </p>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {[
            {
              icon: Sparkles,
              title: "Rarity",
              desc: "SEC, SP, TR ยิ่งหายากยิ่งแพง Parallel แพงกว่าปกติหลายเท่า",
              iconBg: "bg-amber-500/10",
              iconColor: "text-amber-500",
            },
            {
              icon: Users,
              title: "ตัวละครยอดนิยม",
              desc: "Luffy, Shanks, Nami, Hancock การ์ดตัวละครดังราคาสูงกว่าตัวละครรอง",
              iconBg: "bg-rose-500/10",
              iconColor: "text-rose-500",
            },
            {
              icon: Swords,
              title: "Meta (แข่งขัน)",
              desc: "การ์ดที่ใช้ในเด็คเทียร์ 1 ของสนามแข่งจะมีราคาสูง",
              iconBg: "bg-blue-500/10",
              iconColor: "text-blue-500",
            },
            {
              icon: ImageIcon,
              title: "ภาพสวย / Manga Art",
              desc: "Super Parallel และ manga art มีคนสะสมเยอะ ดันราคาขึ้นสูง",
              iconBg: "bg-pink-500/10",
              iconColor: "text-pink-500",
            },
            {
              icon: Package,
              title: "Supply น้อย",
              desc: "SP, TR มีอัตราออกต่ำมาก supply น้อยทำให้ราคาพุ่ง",
              iconBg: "bg-purple-500/10",
              iconColor: "text-purple-500",
            },
            {
              icon: Printer,
              title: "เซ็ตหมดพิมพ์",
              desc: "เซ็ตเก่าที่ไม่พิมพ์เพิ่มแล้ว การ์ดในเซ็ตนั้นราคาจะเพิ่มขึ้นเรื่อยๆ",
              iconBg: "bg-emerald-500/10",
              iconColor: "text-emerald-500",
            },
          ].map((factor) => (
            <div key={factor.title} className="rounded-xl border border-border/50 bg-card p-4">
              <div className={`flex size-9 items-center justify-center rounded-lg ${factor.iconBg}`}>
                <factor.icon className={`size-4.5 ${factor.iconColor}`} />
              </div>
              <h3 className="mt-3 text-sm font-semibold">{factor.title}</h3>
              <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                {factor.desc}
              </p>
            </div>
          ))}
        </div>
      </section>

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
              label: "Yuyu-tei",
              desc: "แหล่งอ้างอิงราคาตลาดญี่ปุ่น (ราคาเยน)",
              url: "https://yuyu-tei.jp/",
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
          href="/guide/card-types"
          className="group inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="size-4 transition-transform group-hover:-translate-x-0.5" />
          ประเภทการ์ด
        </Link>
        <Link
          href="/guide/colors"
          className="group inline-flex items-center gap-2 text-sm font-semibold text-primary hover:underline"
        >
          บทต่อไป: สี
          <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
        </Link>
      </div>
    </div>
  );
}
