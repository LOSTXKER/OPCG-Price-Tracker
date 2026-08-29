"use client"

import Image from "next/image"
import { useSyncExternalStore } from "react"
import { useTheme } from "next-themes"
import { Heart, Moon, Sun } from "lucide-react"

import { RarityBadge } from "@/components/shared/rarity-badge"
import { IconButton } from "@/components/ui/icon-button"
import { PriceTag } from "@/components/ui/price-tag"
import { SegmentedControl } from "@/components/ui/segmented-control"
import { cn } from "@/lib/utils"

import { useProtoVariant } from "../_kit/use-proto-variant"
import { MANGA_CARDS } from "./_data"

/* ------------------------------------------------------------------ ป้าย */

type Kind = "manga" | "mangaRed" | "wanted"

const KIND_LABEL: Record<Kind, string> = {
  manga: "มังงะ",
  mangaRed: "มังงะแดง",
  wanted: "ใบประกาศจับ",
}

/** ป้ายสั้นสำหรับที่แคบ — แถวมือถือมีที่เหลือไม่ถึง 40px */
const KIND_SHORT: Record<Kind, string> = {
  manga: "มังงะ",
  mangaRed: "มังงะแดง",
  wanted: "ประกาศจับ",
}

const KIND_TONE: Record<Kind, string> = {
  manga: "bg-foreground/10 text-foreground/80",
  mangaRed: "bg-red-500/15 text-red-700 dark:bg-red-500/25 dark:text-red-300",
  wanted: "bg-stone-500/15 text-stone-700 dark:bg-stone-400/25 dark:text-stone-200",
}

function ArtBadge({
  kind,
  short = false,
  className,
}: {
  kind: Kind
  short?: boolean
  className?: string
}) {
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center whitespace-nowrap rounded-sm px-1.5 py-0.5 text-micro",
        KIND_TONE[kind],
        className,
      )}
    >
      {short ? KIND_SHORT[kind] : KIND_LABEL[kind]}
    </span>
  )
}

/* --------------------------------------------------------------- ทางเลือก */

type Way = "beside" | "onimage" | "nameline"

const WAY_OPTIONS = [
  { value: "beside", label: "ก · ต่อท้ายป้ายเดิม" },
  { value: "onimage", label: "ข · บนรูปการ์ด" },
  { value: "nameline", label: "ค · ต่อท้ายชื่อการ์ด" },
] as const

const WAY_VALUES = WAY_OPTIONS.map((o) => o.value)

const COPY: Record<Way, { name: string; summary: string; tradeoff: string }> = {
  beside: {
    name: "ก · ป้ายมังงะต่อท้ายป้ายความหายากเดิม",
    summary:
      "อยู่บรรทัดเดียวกับรหัสการ์ดและป้าย SP/SEC — อ่านเรียงกันเป็นประโยคเดียว “OP13-118 · P-SEC · มังงะแดง”",
    tradeoff:
      "บรรทัดนั้นมีที่แค่ 116px และตอนนี้ใช้ไปหมดแล้ว (รหัส 62 + ป้ายเดิม 43) — พอมีป้ายที่สอง รหัสการ์ดจะโดนย่อเหลือ “OP13-…” ทุกแถวที่เป็นการ์ดมังงะ · บนคอมไม่มีปัญหานี้",
  },
  onimage: {
    name: "ข · ป้ายมังงะซ้อนอยู่บนรูปการ์ด (มุมล่าง)",
    summary:
      "ไม่กินที่บรรทัดข้อความเลย รหัสการ์ดกับป้ายเดิมอยู่ครบเหมือนทุกวันนี้ — และตาไปตกที่รูปการ์ดอยู่แล้ว ป้ายเลยอยู่ตรงที่คนมองพอดี",
    tradeoff:
      "รูปในแถวกว้างแค่ 44px ป้ายจึงต้องเล็กมากและบังภาพส่วนล่างของการ์ด · คำว่า “ใบประกาศจับ” ยาวเกินกว่าจะใส่ในรูป ต้องย่อเหลือจุดสีหรือคำสั้นกว่านี้",
  },
  nameline: {
    name: "ค · ป้ายมังงะต่อท้ายชื่อการ์ด (บรรทัดบน)",
    summary:
      "ยกไปอยู่บรรทัดชื่อ ซึ่งมีที่เหลือมากกว่าเพราะชื่อสั้นกว่าความกว้างที่มี — บรรทัดล่างยังเป็น “รหัส + ความหายาก” เหมือนเดิมทุกแถว",
    tradeoff:
      "ชื่อการ์ดต้องหดลงเมื่อมีป้าย (ชื่อยาวจะโดนตัดเร็วขึ้นเฉพาะการ์ดมังงะ) · ป้ายลอยอยู่ข้างชื่อ อาจอ่านเป็นส่วนหนึ่งของชื่อการ์ด",
  },
}

const NOTES = [
  "รายชื่อทั้งหมดนี้มาจากการไล่ดูรูปการ์ด SP + SEC + P-SEC ครบ 233 ใบ — ไม่ได้เดาจากรหัสหรือชื่อ เพราะฐานข้อมูลไม่มีอะไรบอกเลยว่าใบไหนเป็นมังงะ",
  "ระหว่างไล่ดูเจอลายที่สามด้วย: ใบประกาศจับ (WANTED · DEAD OR ALIVE) 16 ใบ — ใส่มาให้ดูด้วย ถ้าไม่อยากได้ป้ายนี้บอกได้ ตัดทิ้งง่าย",
  "ชุด OP13 เข้าคู่กันพอดี: Luffy/Ace/Sabo ใบ _p2 เป็นมังงะขาวดำ · _p3 เป็นมังงะแดง · _p4 เป็นใบประกาศจับ",
  "คีย์ที่ใช้จำคือรหัสเต็มรวมท้าย _p2 / _r1 เพราะลายพิเศษผูกกับงานพิมพ์ใบนั้น ไม่ใช่กับหมายเลขการ์ด",
  "ยังไม่ได้แตะฐานข้อมูล — รายชื่ออยู่ในไฟล์เดียวในโค้ด แก้เพิ่ม/ลบได้ทันทีโดยไม่ต้องย้ายข้อมูล",
  "หน้านี้ไม่ได้ต่อฐานข้อมูล ราคากับรูปเป็นค่าที่คัดมาตอนทำหน้า",
] as const

/* ------------------------------------------------------------------ แถว */

type CardRow = (typeof MANGA_CARDS)[number]

function Row({ card, way }: { card: CardRow; way: Way }) {
  const kind = card.kind as Kind
  const price = card.price ? `${Math.round(card.price * 0.21).toLocaleString()} ฿` : "—"

  return (
    <div className="ease-chrome flex min-h-[52px] items-center gap-3 px-4 py-2.5 active:bg-muted">
      <span className="w-5 shrink-0 text-center font-price text-xs text-muted-foreground">1</span>
      <div className="relative shrink-0">
        <div className="hairline relative aspect-[63/88] w-11 overflow-hidden rounded-md bg-muted">
          <Image src={card.img} alt={card.name} fill className="object-contain" sizes="44px" />
        </div>
        {way === "onimage" && (
          <span
            className={cn(
              "absolute inset-x-0 bottom-0 truncate px-0.5 text-center text-overlay leading-4",
              kind === "mangaRed"
                ? "bg-red-600/85 text-white"
                : kind === "wanted"
                  ? "bg-stone-700/85 text-white"
                  : "bg-foreground/80 text-background",
            )}
          >
            {KIND_SHORT[kind]}
          </span>
        )}
      </div>
      <div className="flex min-w-0 flex-1 items-center gap-3">
        <div className="min-w-0 flex-1">
          <p className="flex min-w-0 items-center gap-1.5 text-sm font-medium leading-tight">
            <span className="truncate">{card.name}</span>
            {way === "nameline" && <ArtBadge kind={kind} short />}
          </p>
          <div className="mt-0.5 flex min-w-0 items-center gap-1.5 text-meta">
            <span className="truncate font-mono">{card.base}</span>
            <RarityBadge rarity={card.rarity} size="sm" className="shrink-0" />
            {way === "beside" && <ArtBadge kind={kind} short />}
          </div>
        </div>
        <div className="flex shrink-0 flex-col items-end gap-1 text-right">
          <p className="font-price text-sm font-semibold">{price}</p>
          <PriceTag change={12.4} changeOnly changeStyle="plain" showArrow={false} size="sm" />
        </div>
      </div>
      <button
        type="button"
        aria-label="เพิ่มเข้ารายการโปรด"
        className="-mr-2 inline-flex h-11 w-8 shrink-0 items-center justify-center rounded-sm text-muted-foreground/40"
      >
        <Heart className="size-5" />
      </button>
    </div>
  )
}

/* ------------------------------------------------------------ page shell */

const subscribeNever = () => () => {}

const GROUPS: { kind: Kind; title: string; note: string }[] = [
  {
    kind: "manga",
    title: "มังงะ",
    note: "พื้นหลังเป็นแผงการ์ตูนขาวดำจากมังงะต้นฉบับ",
  },
  {
    kind: "mangaRed",
    title: "มังงะแดง",
    note: "แผงมังงะแบบเดียวกัน แต่พิมพ์ด้วยหมึกแดงทั้งใบ",
  },
  {
    kind: "wanted",
    title: "ใบประกาศจับ (เจอเพิ่มระหว่างทาง)",
    note: "ลาย WANTED · DEAD OR ALIVE — ไม่ใช่แผงมังงะ แต่เป็นอีกลายที่แยกออกชัด",
  },
]

export default function MangaBadgeProtoPage() {
  const [way, setWay] = useProtoVariant<Way>("v", WAY_VALUES, "beside")
  const { resolvedTheme, setTheme } = useTheme()
  const mounted = useSyncExternalStore(
    subscribeNever,
    () => true,
    () => false,
  )
  const isDark = mounted && resolvedTheme === "dark"
  const copy = COPY[way]

  const sample = GROUPS.map(
    (g) => MANGA_CARDS.find((c) => c.kind === g.kind) as CardRow,
  ).filter(Boolean)

  return (
    <main className="min-h-screen bg-background px-4 py-8 text-foreground sm:px-6 lg:px-10">
      <div className="mx-auto max-w-[1200px]">
        <h1 className="text-h1">ป้ายมังงะ · มังงะแดง</h1>
        <p className="mt-2 max-w-3xl text-body text-muted-foreground">
          ฐานข้อมูลไม่มีอะไรบอกเลยว่าใบไหนเป็นการ์ดลายมังงะ — ป้ายที่ขูดมาจากร้านญี่ปุ่นมีแค่
          SP / SEC / P-SEC · ฉันเลยไล่ดูรูปการ์ดทั้ง 233 ใบเองแล้วแยกออกมาได้{" "}
          <strong>มังงะ 35 ใบ · มังงะแดง 5 ใบ · ใบประกาศจับ 16 ใบ</strong> ·
          หน้านี้มีสองเรื่องให้เคาะ: <strong>ป้ายควรวางตรงไหนของแถว</strong> และ{" "}
          <strong>รายชื่อที่ฉันจัดไว้ถูกไหม</strong>
        </p>

        <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
          <div className="overflow-x-auto pb-1">
            <SegmentedControl
              options={WAY_OPTIONS}
              value={way}
              onChange={setWay}
              ariaLabel="เลือกตำแหน่งป้ายมังงะ"
              className="min-w-max"
              compactVisual={false}
            />
          </div>
          <IconButton
            aria-label={isDark ? "ดูแบบโหมดสว่าง" : "ดูแบบโหมดมืด"}
            onClick={() => setTheme(isDark ? "light" : "dark")}
            size="lg"
            className="rounded-full"
          >
            {isDark ? <Sun className="size-[18px]" /> : <Moon className="size-[18px]" />}
          </IconButton>
        </div>

        <section className="mt-6 grid gap-8 lg:grid-cols-[375px_minmax(0,1fr)]">
          <div className="min-w-0">
            <p className="text-eyebrow mb-2">แถวรายการบนมือถือ (กว้าง 375px เท่าของจริง)</p>
            <div className="-mx-4 sm:mx-0">
              <div className="hairline w-[375px] max-w-full overflow-hidden rounded-none bg-background sm:rounded-[2rem]">
                <div className="divide-y divide-hair">
                  {sample.map((card) => (
                    <Row key={card.code} card={card} way={way} />
                  ))}
                </div>
              </div>
            </div>
            <p className="mt-2 text-meta">
              สามแถวนี้คือการ์ดจริงของแต่ละลาย เรียงบน-ล่าง: มังงะ · มังงะแดง · ใบประกาศจับ
            </p>
          </div>

          <div className="space-y-6">
            <div className="border-l-2 border-primary pl-4">
              <h2 className="text-h3">{copy.name}</h2>
              <p className="mt-1.5 max-w-2xl text-body-sm">{copy.summary}</p>
              <p className="mt-1 max-w-2xl text-meta">ข้อแลก: {copy.tradeoff}</p>
            </div>

            <div>
              <p className="text-eyebrow mb-2">บนคอมและหน้าการ์ด (ที่กว้าง ไม่มีปัญหาเรื่องที่)</p>
              <div className="hairline space-y-3 rounded-2xl bg-card p-4">
                {sample.map((card) => (
                  <div key={card.code} className="flex items-center gap-3">
                    <div className="hairline relative size-10 shrink-0 overflow-hidden rounded-md bg-muted">
                      <Image
                        src={card.img}
                        alt={card.name}
                        fill
                        className="object-contain"
                        sizes="40px"
                      />
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium leading-tight">{card.name}</p>
                      <div className="mt-0.5 flex items-center gap-1.5 text-meta">
                        <span className="font-mono">{card.base}</span>
                        <RarityBadge rarity={card.rarity} size="sm" />
                        <ArtBadge kind={card.kind as Kind} />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-2 text-body-sm text-muted-foreground">
              <p className="font-medium text-foreground">สิ่งที่ต้องรู้:</p>
              {NOTES.map((n) => (
                <p key={n}>• {n}</p>
              ))}
            </div>
          </div>
        </section>

        <section className="mt-12">
          <h2 className="text-h2">ตรวจรายชื่อ — ฉันจัดไว้แบบนี้ ใบไหนผิดบอกได้</h2>
          <p className="mt-1.5 max-w-3xl text-body-sm text-muted-foreground">
            ทุกใบในนี้ฉันดูรูปเองทีละใบ · ถ้าเจอใบที่ไม่ควรอยู่ในกลุ่ม หรือรู้ว่ามีใบที่ตกหล่น
            บอกรหัสมาได้เลย แก้ที่ไฟล์เดียว
          </p>

          {GROUPS.map((group) => {
            const cards = MANGA_CARDS.filter((c) => c.kind === group.kind)
            return (
              <div key={group.kind} className="mt-8">
                <div className="mb-3 flex flex-wrap items-baseline gap-2">
                  <h3 className="text-h3">{group.title}</h3>
                  <ArtBadge kind={group.kind} />
                  <span className="text-meta">{cards.length} ใบ · {group.note}</span>
                </div>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-6">
                  {cards.map((card) => (
                    <div key={card.code} className="min-w-0">
                      <div className="hairline relative aspect-[63/88] overflow-hidden rounded-lg bg-muted">
                        <Image
                          src={card.img}
                          alt={card.name}
                          fill
                          className="object-contain"
                          sizes="(min-width: 1024px) 180px, (min-width: 640px) 22vw, 45vw"
                        />
                      </div>
                      <p className="mt-1.5 truncate font-mono text-meta">{card.code}</p>
                      <p className="truncate text-meta">{card.name}</p>
                    </div>
                  ))}
                </div>
              </div>
            )
          })}
        </section>
      </div>
    </main>
  )
}
