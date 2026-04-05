import Link from "next/link";
import Image from "next/image";
import type { Metadata } from "next";
import {
  ArrowLeft,
  ArrowRight,
  Crown,
  ExternalLink,
  Heart,
  Info,
  Layers,
  LineChart,
  RefreshCw,
  Sparkles,
  Swords,
  Zap,
} from "lucide-react";
import { prisma } from "@/lib/db";
import { Breadcrumb } from "@/components/shared/breadcrumb";
import { RelatedPages } from "@/components/shared/related-pages";
import { JsonLd } from "@/lib/seo/json-ld-script";
import { breadcrumbJsonLd } from "@/lib/seo/json-ld";

export const metadata: Metadata = {
  title: "Getting Started — คู่มือ OPCG",
  description:
    "คู่มือเริ่มต้นเล่น One Piece Card Game (OPCG) ครบจบในหน้าเดียว กฎ วิธีเล่น ระบบ DON!! เทิร์น การโจมตี เงื่อนไขชนะ อ้างอิงกฎจาก Bandai",
  alternates: { canonical: "/guide/getting-started" },
};

/* ------------------------------------------------------------------ */
/*  Turn phases data                                                   */
/* ------------------------------------------------------------------ */

const TURN_PHASES = [
  {
    name: "Refresh Phase",
    nameTh: "พักการ์ด",
    description: "ตั้งการ์ดที่พักอยู่ (rested) กลับเป็นแนวตั้ง (active) ทั้งหมด รวมถึง DON!! ที่ใช้ไปแล้ว",
    color: "bg-emerald-500",
    icon: RefreshCw,
  },
  {
    name: "Draw Phase",
    nameTh: "จั่วการ์ด",
    description: "จั่วการ์ด 1 ใบจากเด็ค (ผู้เล่นคนแรกไม่จั่วในเทิร์นแรก)",
    color: "bg-blue-500",
    icon: Layers,
  },
  {
    name: "DON!! Phase",
    nameTh: "เพิ่ม DON!!",
    description: "วาง DON!! 2 ใบจากกอง DON!! มาที่ Cost Area (เทิร์นแรกของผู้เล่นคนแรกวางแค่ 1 ใบ, สูงสุด 10 ใบ)",
    color: "bg-amber-500",
    icon: Zap,
  },
  {
    name: "Main Phase",
    nameTh: "เฟสหลัก",
    description: "ลงการ์ดจากมือ, แนบ DON!! เข้ากับ Leader/Character (+1000 Power ต่อ DON!! 1 ใบ), ใช้ Effect, และประกาศโจมตี",
    color: "bg-rose-500",
    icon: Swords,
  },
  {
    name: "End Phase",
    nameTh: "จบเทิร์น",
    description: "ส่งต่อเทิร์นให้ฝ่ายตรงข้าม DON!! ที่แนบกับการ์ดจะกลับไปที่ Cost Area",
    color: "bg-purple-500",
    icon: Sparkles,
  },
];

/* ------------------------------------------------------------------ */
/*  Combat steps data                                                  */
/* ------------------------------------------------------------------ */

const COMBAT_STEPS = [
  {
    step: 1,
    name: "ประกาศโจมตี",
    description: "เลือกเป้าหมาย: Leader ฝ่ายตรงข้าม หรือ Character ที่ rested (แนวนอน)",
    color: "bg-rose-500/10 text-rose-500 border-rose-500/20",
  },
  {
    step: 2,
    name: "Block",
    description: "ฝ่ายป้องกันอาจใช้ Character ที่มี [Blocker] รับแทนเป้าหมาย",
    color: "bg-blue-500/10 text-blue-500 border-blue-500/20",
  },
  {
    step: 3,
    name: "Counter",
    description: "ฝ่ายป้องกันเล่นการ์ด Counter จากมือเพื่อเพิ่ม Power ให้เป้าหมาย",
    color: "bg-amber-500/10 text-amber-500 border-amber-500/20",
  },
  {
    step: 4,
    name: "ตัดสิน",
    description: "เทียบ Power — ถ้าผู้โจมตีเท่าหรือมากกว่า = โจมตีสำเร็จ ถ้าโดน Leader = เปิด Life 1 ใบ",
    color: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
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

async function getSetupCards(): Promise<{
  leader: ExampleCard | null;
  don: ExampleCard | null;
}> {
  try {
    const [leader, don] = await Promise.all([
      prisma.card.findFirst({
        where: { cardType: "LEADER", imageUrl: { not: null }, isParallel: false },
        select: { cardCode: true, nameEn: true, nameJp: true, imageUrl: true },
        orderBy: { cardCode: "asc" },
      }),
      prisma.card.findFirst({
        where: { cardType: "DON", imageUrl: { not: null }, isParallel: false },
        select: { cardCode: true, nameEn: true, nameJp: true, imageUrl: true },
        orderBy: { cardCode: "asc" },
      }),
    ]);
    return { leader, don };
  } catch {
    return { leader: null, don: null };
  }
}

/* ------------------------------------------------------------------ */
/*  Page                                                               */
/* ------------------------------------------------------------------ */

export default async function GettingStartedPage() {
  const { leader, don } = await getSetupCards();
  return (
    <div className="mx-auto max-w-3xl space-y-12">
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "Home", href: "/" },
          { name: "Guide", href: "/guide" },
          { name: "Getting Started", href: "/guide/getting-started" },
        ])}
      />

      {/* ── 1. Hero + Intro ── */}
      <div className="space-y-3">
        <Breadcrumb
          items={[
            { label: "Home", href: "/" },
            { label: "Guide", href: "/guide" },
            { label: "เริ่มต้น" },
          ]}
        />
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
          One Piece Card Game คืออะไร?
        </h1>
        <p className="text-lg leading-relaxed text-muted-foreground">
          <strong className="text-foreground">One Piece Card Game (OPCG)</strong>{" "}
          เป็น Trading Card Game จาก{" "}
          <strong className="text-foreground">Bandai</strong>{" "}
          อิงจากมังงะ/อนิเมะ One Piece เปิดตัวในญี่ปุ่นปี 2022
          ปัจจุบันมีเวอร์ชันหลายภาษารวมถึงอังกฤษ ไทย จีน และเกาหลี
          ผู้เล่น 2 คนสู้กันโดยใช้เด็คของตัวเอง เป้าหมายคือทำให้ Life ของฝ่ายตรงข้ามหมดแล้วโจมตี Leader ให้สำเร็จ
        </p>
      </div>

      {/* ── 2. สิ่งที่ต้องมี ── */}
      <section className="space-y-4">
        <h2 className="text-xl font-semibold">สิ่งที่ต้องมีก่อนเล่น</h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            { label: "Leader", count: "1 ใบ", desc: "การ์ดผู้นำ", color: "border-orange-500/30 bg-orange-500/5" },
            { label: "Deck", count: "50 ใบ", desc: "การ์ดในเด็ค", color: "border-primary/30 bg-primary/5" },
            { label: "DON!!", count: "10 ใบ", desc: "การ์ดพลังงาน", color: "border-amber-500/30 bg-amber-500/5" },
            { label: "Life", count: "4-5 ใบ", desc: "จากเด็คตาม Leader", color: "border-rose-500/30 bg-rose-500/5" },
          ].map((item) => (
            <div
              key={item.label}
              className={`rounded-xl border p-4 text-center ${item.color}`}
            >
              <p className="text-2xl font-bold tabular-nums">{item.count}</p>
              <p className="text-sm font-semibold">{item.label}</p>
              <p className="mt-0.5 text-xs text-muted-foreground">{item.desc}</p>
            </div>
          ))}
        </div>
        {/* Leader & DON!! card examples */}
        {(leader || don) && (
          <div className="flex items-center gap-6 rounded-xl border border-border/50 bg-card px-5 py-4">
            {leader?.imageUrl && (
              <Link href={`/cards/${leader.cardCode}`} className="group shrink-0">
                <p className="mb-1.5 text-center text-[10px] font-medium text-muted-foreground">Leader</p>
                <div className="relative aspect-[63/88] w-20 overflow-hidden rounded-lg bg-muted transition-transform group-hover:-translate-y-0.5">
                  <Image src={leader.imageUrl} alt={leader.nameEn ?? leader.nameJp} fill className="object-contain" sizes="80px" />
                </div>
                <p className="mt-1 max-w-20 truncate text-center text-[10px] text-muted-foreground">
                  {leader.nameEn ?? leader.nameJp}
                </p>
              </Link>
            )}
            {don?.imageUrl && (
              <Link href={`/cards/${don.cardCode}`} className="group shrink-0">
                <p className="mb-1.5 text-center text-[10px] font-medium text-muted-foreground">DON!!</p>
                <div className="relative aspect-[63/88] w-20 overflow-hidden rounded-lg bg-muted transition-transform group-hover:-translate-y-0.5">
                  <Image src={don.imageUrl} alt={don.nameEn ?? don.nameJp} fill className="object-contain" sizes="80px" />
                </div>
                <p className="mt-1 max-w-20 truncate text-center text-[10px] text-muted-foreground">
                  {don.nameEn ?? don.nameJp}
                </p>
              </Link>
            )}
            <p className="text-xs leading-relaxed text-muted-foreground">
              ตัวอย่างการ์ด <strong className="text-foreground">Leader</strong> กับ{" "}
              <strong className="text-foreground">DON!!</strong> จริงจากเกม
              — ทุกเด็คต้องมี Leader 1 ใบ และ DON!! 10 ใบ
            </p>
          </div>
        )}

        <div className="flex items-start gap-2.5 rounded-lg border border-blue-500/20 bg-blue-500/5 px-4 py-3">
          <Info className="mt-0.5 size-4 shrink-0 text-blue-500" />
          <p className="text-sm text-muted-foreground">
            <strong className="text-foreground">Tip:</strong> ถ้ายังไม่เคยเล่น
            ซื้อ <strong>Starter Deck</strong> ได้เลย
            มี Leader + เด็ค 50 ใบ + DON!! 10 ใบ พร้อมเล่นทันที
            ใบละไม่กี่ร้อยบาท
          </p>
        </div>
      </section>

      {/* ── 3. เซ็ตอัพ (Game Setup) ── */}
      <section className="space-y-4">
        <h2 className="text-xl font-semibold">เซ็ตอัพก่อนเริ่มเกม</h2>
        <ol className="space-y-3">
          {[
            { step: "วาง Leader", detail: "วาง Leader Card หงายหน้าไว้ตรงกลางฝั่งของคุณ" },
            { step: "วางกอง DON!!", detail: "วาง DON!! 10 ใบคว่ำหน้าไว้ด้านซ้ายของ Leader" },
            { step: "สับเด็คและจั่ว", detail: "สับเด็ค 50 ใบ วางคว่ำหน้า จั่วขึ้นมือ 5 ใบ — สามารถ mulligan (คืนมือแล้วจั่วใหม่) ได้ 1 ครั้ง" },
            { step: "วาง Life", detail: "หยิบการ์ดจากบนสุดของเด็คมาวางคว่ำหน้าเป็น Life ตามจำนวนที่ Leader กำหนด (ส่วนใหญ่ 4 หรือ 5 ใบ)" },
          ].map((item, i) => (
            <li key={i} className="flex items-start gap-3">
              <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">
                {i + 1}
              </span>
              <div>
                <p className="text-sm font-semibold">{item.step}</p>
                <p className="text-sm leading-relaxed text-muted-foreground">
                  {item.detail}
                </p>
              </div>
            </li>
          ))}
        </ol>

        {/* Game board diagram */}
        <div className="overflow-hidden rounded-xl border border-border/50 bg-card">
          <div className="border-b border-border/40 px-4 py-2 text-xs font-medium text-muted-foreground">
            แผนผังสนามเล่น (ฝั่งเดียว)
          </div>
          <div className="grid grid-cols-3 gap-2 p-4 text-center text-[11px] sm:grid-cols-5">
            <div className="flex flex-col items-center gap-1">
              <div className="flex size-14 items-center justify-center rounded-lg border-2 border-dashed border-amber-500/40 bg-amber-500/5 sm:size-16">
                <span className="font-bold text-amber-600 dark:text-amber-400">DON!!</span>
              </div>
              <span className="text-muted-foreground">กอง DON!!</span>
            </div>
            <div className="flex flex-col items-center gap-1">
              <div className="flex size-14 items-center justify-center rounded-lg border-2 border-dashed border-rose-500/40 bg-rose-500/5 sm:size-16">
                <Heart className="size-4 text-rose-500" />
              </div>
              <span className="text-muted-foreground">Life</span>
            </div>
            <div className="flex flex-col items-center gap-1">
              <div className="flex size-14 items-center justify-center rounded-lg border-2 border-orange-500/50 bg-orange-500/10 sm:size-16">
                <Crown className="size-5 text-orange-500" />
              </div>
              <span className="font-medium text-foreground">Leader</span>
            </div>
            <div className="col-span-2 flex flex-col items-center gap-1 sm:col-span-2">
              <div className="flex h-14 w-full items-center justify-center rounded-lg border-2 border-dashed border-border bg-muted/30 sm:h-16">
                <span className="text-muted-foreground">Character Area</span>
              </div>
              <span className="text-muted-foreground">วาง Character / Stage</span>
            </div>
            <div className="col-span-2 flex flex-col items-center gap-1 sm:col-span-2">
              <div className="flex h-14 w-full items-center justify-center rounded-lg border-2 border-dashed border-primary/30 bg-primary/5 sm:h-16">
                <Zap className="size-4 text-primary" />
              </div>
              <span className="text-muted-foreground">Cost Area (DON!! ที่ใช้ได้)</span>
            </div>
            <div className="flex flex-col items-center gap-1">
              <div className="flex size-14 items-center justify-center rounded-lg border-2 border-dashed border-border bg-muted/30 sm:size-16">
                <span className="text-muted-foreground/60">Trash</span>
              </div>
              <span className="text-muted-foreground">ทิ้ง</span>
            </div>
            <div className="flex flex-col items-center gap-1">
              <div className="flex size-14 items-center justify-center rounded-lg border-2 border-dashed border-primary/40 bg-primary/5 sm:size-16">
                <Layers className="size-4 text-primary" />
              </div>
              <span className="text-muted-foreground">เด็ค</span>
            </div>
            <div className="flex flex-col items-center gap-1">
              <div className="flex size-14 items-center justify-center rounded-lg border-2 border-dashed border-border bg-muted/30 sm:size-16">
                <span className="text-muted-foreground/60">5 ใบ</span>
              </div>
              <span className="text-muted-foreground">มือ</span>
            </div>
          </div>
        </div>
      </section>

      {/* ── 4. เทิร์นการเล่น (Turn Phases) ── */}
      <section className="space-y-4">
        <h2 className="text-xl font-semibold">เทิร์นการเล่น (5 เฟส)</h2>
        <p className="text-sm text-muted-foreground">
          แต่ละเทิร์นจะเดินตาม 5 เฟสนี้ตามลำดับ
        </p>
        <div className="space-y-0">
          {TURN_PHASES.map((phase, i) => (
            <div key={phase.name} className="flex gap-4">
              {/* Timeline connector */}
              <div className="flex flex-col items-center">
                <div className={`flex size-8 shrink-0 items-center justify-center rounded-full ${phase.color} text-white`}>
                  <phase.icon className="size-4" />
                </div>
                {i < TURN_PHASES.length - 1 && (
                  <div className="w-0.5 flex-1 bg-border" />
                )}
              </div>
              {/* Content */}
              <div className={`${i < TURN_PHASES.length - 1 ? "pb-6" : ""}`}>
                <div className="flex items-baseline gap-2">
                  <h3 className="text-sm font-semibold">{phase.name}</h3>
                  <span className="text-xs text-muted-foreground">
                    {phase.nameTh}
                  </span>
                </div>
                <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                  {phase.description}
                </p>
              </div>
            </div>
          ))}
        </div>
        <div className="flex items-start gap-2.5 rounded-lg border border-amber-500/20 bg-amber-500/5 px-4 py-3">
          <Info className="mt-0.5 size-4 shrink-0 text-amber-500" />
          <p className="text-sm text-muted-foreground">
            <strong className="text-foreground">ผู้เล่นคนแรก:</strong>{" "}
            เทิร์นแรกจั่ว DON!! ได้แค่ 1 ใบ (แทนที่จะ 2)
            และไม่จั่วการ์ดใน Draw Phase เพื่อความสมดุล
          </p>
        </div>
      </section>

      {/* ── 5. ระบบ DON!! ── */}
      <section className="space-y-4">
        <h2 className="text-xl font-semibold">ระบบ DON!!</h2>
        <p className="text-sm leading-relaxed text-muted-foreground">
          DON!! คือระบบพลังงานของ OPCG ที่ไม่ซ้ำใคร ทุกเทิร์นคุณจะได้ DON!! เพิ่ม 2 ใบ
          (สูงสุด 10 ใบ) ใช้ได้ 2 แบบ:
        </p>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="rounded-xl border border-border/50 bg-card p-5">
            <div className="flex size-9 items-center justify-center rounded-lg bg-amber-500/10">
              <Zap className="size-5 text-amber-500" />
            </div>
            <h3 className="mt-3 text-sm font-semibold">จ่าย Cost</h3>
            <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
              Rest (พลิกแนวนอน) DON!! ตามจำนวน Cost ของการ์ดที่ต้องการลงสนาม
              เช่น Character ที่มี Cost 5 ต้อง rest DON!! 5 ใบ
            </p>
          </div>
          <div className="rounded-xl border border-border/50 bg-card p-5">
            <div className="flex size-9 items-center justify-center rounded-lg bg-rose-500/10">
              <Swords className="size-5 text-rose-500" />
            </div>
            <h3 className="mt-3 text-sm font-semibold">แนบเพิ่ม Power</h3>
            <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
              แนบ DON!! เข้ากับ Leader หรือ Character เพื่อเพิ่ม{" "}
              <strong className="text-foreground">+1,000 Power ต่อ DON!! 1 ใบ</strong>{" "}
              จนจบเทิร์น DON!! จะกลับไปที่ Cost Area
            </p>
          </div>
        </div>
      </section>

      {/* ── 6. การโจมตีและป้องกัน (Combat) ── */}
      <section className="space-y-4">
        <h2 className="text-xl font-semibold">การโจมตีและป้องกัน</h2>
        <p className="text-sm text-muted-foreground">
          ในเฟส Main คุณสามารถประกาศโจมตีได้ การโจมตีมี 4 ขั้นตอน:
        </p>
        <div className="grid gap-3 sm:grid-cols-2">
          {COMBAT_STEPS.map((step) => (
            <div
              key={step.step}
              className={`rounded-xl border p-4 ${step.color}`}
            >
              <div className="flex items-center gap-2">
                <span className="flex size-6 items-center justify-center rounded-full bg-current/10 text-xs font-bold">
                  {step.step}
                </span>
                <h3 className="text-sm font-semibold">{step.name}</h3>
              </div>
              <p className="mt-2 text-xs leading-relaxed opacity-80">
                {step.description}
              </p>
            </div>
          ))}
        </div>
        <div className="flex items-start gap-2.5 rounded-lg border border-rose-500/20 bg-rose-500/5 px-4 py-3">
          <Info className="mt-0.5 size-4 shrink-0 text-rose-500" />
          <div className="space-y-1 text-sm text-muted-foreground">
            <p>
              <strong className="text-foreground">Life:</strong>{" "}
              เมื่อ Leader โดนโจมตีสำเร็จ ให้เปิด Life บนสุด 1 ใบเข้ามือ
              ถ้าการ์ดนั้นมี <strong>Trigger</strong> จะได้ใช้ Effect พิเศษทันที
            </p>
            <p>
              <strong className="text-foreground">Character:</strong>{" "}
              เมื่อ Character โดนโจมตีสำเร็จ ให้ส่งไปกอง Trash (ทิ้ง) ทันที
            </p>
          </div>
        </div>
      </section>

      {/* ── 7. เงื่อนไขชนะ ── */}
      <section className="space-y-4">
        <h2 className="text-xl font-semibold">เงื่อนไขชนะ</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="rounded-xl border border-border/50 bg-card p-5">
            <div className="flex items-center gap-2">
              <Swords className="size-5 text-rose-500" />
              <h3 className="text-sm font-semibold">โจมตีจนหมด Life</h3>
            </div>
            <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
              เมื่อฝ่ายตรงข้ามไม่มี Life เหลือ
              และคุณโจมตี Leader ของเขาสำเร็จอีกครั้ง = <strong className="text-foreground">คุณชนะ</strong>
            </p>
          </div>
          <div className="rounded-xl border border-border/50 bg-card p-5">
            <div className="flex items-center gap-2">
              <Layers className="size-5 text-blue-500" />
              <h3 className="text-sm font-semibold">เด็คหมด (Deck Out)</h3>
            </div>
            <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
              ถ้าฝ่ายตรงข้ามต้องจั่วการ์ดแต่เด็คหมด = <strong className="text-foreground">คุณชนะ</strong>{" "}
              (เกิดขึ้นไม่บ่อยแต่เป็นไปได้)
            </p>
          </div>
        </div>
      </section>

      {/* ── 8. ราคาการ์ดทำงานยังไง ── */}
      <section className="space-y-4">
        <h2 className="text-xl font-semibold">ราคาการ์ดทำงานยังไง?</h2>
        <div className="space-y-3 text-sm leading-relaxed text-muted-foreground">
          <p>
            ราคาการ์ดขึ้นอยู่กับหลายปัจจัย —{" "}
            <Link href="/guide/rarities" className="font-medium text-primary hover:underline">ความหายาก (rarity)</Link>,
            ความสวยของภาพ, ความแรงในเมตาแข่งขัน, และ supply/demand ของตลาด
          </p>
          <p>
            Meecard ดึงราคาจาก <strong className="text-foreground">Yuyu-tei</strong>{" "}
            ร้านการ์ดออนไลน์ที่ใหญ่ที่สุดในญี่ปุ่น แล้วแปลงเป็นบาทให้อัตโนมัติ
            พร้อมราคาการ์ดเกรด PSA 10 จาก SNKRDUNK
          </p>
          <p>
            การ์ดหายากอย่าง <strong className="text-foreground">SEC (Secret Rare)</strong> หรือ{" "}
            <strong className="text-foreground">SP (Special)</strong> อาจมีราคาหลักหมื่นบาท
            ในขณะที่การ์ด <strong className="text-foreground">C (Common)</strong> เริ่มต้นไม่ถึง 10 บาท
            ดูรายละเอียดเพิ่มในหน้า{" "}
            <Link href="/guide/rarities" className="font-medium text-primary hover:underline">ความหายาก</Link>{" "}
            และ{" "}
            <Link href="/guide/buying" className="font-medium text-primary hover:underline">คู่มือการซื้อ</Link>
          </p>
        </div>
      </section>

      {/* ── 9. แหล่งอ้างอิง ── */}
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
            {
              label: "Comprehensive Rules (PDF)",
              desc: "กฎฉบับเต็มสำหรับกรรมการและผู้เล่นขั้นสูง",
              url: "https://en.onepiece-cardgame.com/pdf/rule_comprehensive.pdf",
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

      {/* ── Related pages ── */}
      <RelatedPages
        items={[
          {
            href: "/",
            icon: LineChart,
            title: "ดูราคาการ์ด",
            description: "ราคาอัปเดตทุกวันจาก Yuyu-tei",
          },
          {
            href: "/sets",
            icon: Layers,
            title: "ดูชุดการ์ด",
            description: "เลือกชุดที่สนใจและดูการ์ดทั้งหมด",
          },
        ]}
      />

      {/* ── 10. Navigation ── */}
      <div className="flex items-center justify-between border-t border-border pt-6">
        <Link
          href="/guide"
          className="group inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="size-4 transition-transform group-hover:-translate-x-0.5" />
          คู่มือทั้งหมด
        </Link>
        <Link
          href="/guide/card-types"
          className="group inline-flex items-center gap-2 text-sm font-semibold text-primary hover:underline"
        >
          บทต่อไป: ประเภทการ์ด
          <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
        </Link>
      </div>
    </div>
  );
}
