"use client"

import Image from "next/image"
import { useSyncExternalStore } from "react"
import { useTheme } from "next-themes"
import {
  ArrowUp,
  Camera,
  Moon,
  ScanSearch,
  Search,
  Sun,
  WandSparkles,
} from "lucide-react"

import { IconButton } from "@/components/ui/icon-button"
import { SegmentedControl } from "@/components/ui/segmented-control"
import { cn } from "@/lib/utils"
import { useProtoFlag, useProtoVariant } from "../_kit/use-proto-variant"

/* ------------------------------------------------------------------ data */

type Photo = "current" | "badge" | "banner" | "card"
type Tab = "current" | "scan" | "wand" | "glow"

/** การ์ดมาแรงชุดตายตัว — ของจริง 12 ใบ (ตอนนี้ระบบส่งมาแค่ 6) */
/** การ์ดมาแรง 12 ใบ — ดึงจาก /api/cards/spotlight ของจริงมาแช่ไว้ (รูป/ชื่อ/rarity/ราคา/%
 *  ตรงกับที่เว็บจริงแสดง · แปลงเยน→บาทด้วยเรต 0.296 เท่าที่แถบชีพจรใช้) */
const MOVERS = [
  { name: "Buggy (Parallel)", code: "OP03-008", rarity: "SP", price: "2,066 ฿", change: 48.5, img: "https://pub-e1c871a889eb42a4bd7dcdc3a5926f3c.r2.dev/op03/OP03-008_p1.png" },
  { name: "Monkey.D.Luffy", code: "ST21-001", rarity: "P-L", price: "4,381 ฿", change: 33.3, img: "https://pub-e1c871a889eb42a4bd7dcdc3a5926f3c.r2.dev/st21/ST21-001_p1.png" },
  { name: "Kaido (Parallel)", code: "OP04-044", rarity: "P-SR", price: "172 ฿", change: 28.9, img: "https://pub-e1c871a889eb42a4bd7dcdc3a5926f3c.r2.dev/op04/OP04-044_p1.png" },
  { name: "Portgas.D.Ace", code: "ST13-011", rarity: "SP", price: "2,362 ฿", change: 28.7, img: "https://pub-e1c871a889eb42a4bd7dcdc3a5926f3c.r2.dev/st13/ST13-011_p2.png" },
  { name: "Rebecca (Parallel)", code: "OP04-039", rarity: "P-L", price: "1,178 ฿", change: 28.4, img: "https://pub-e1c871a889eb42a4bd7dcdc3a5926f3c.r2.dev/op04/OP04-039_p1.png" },
  { name: "Monkey.D.Dragon", code: "OP12-094", rarity: "P-SR", price: "379 ฿", change: 28, img: "https://pub-e1c871a889eb42a4bd7dcdc3a5926f3c.r2.dev/op12/OP12-094_p1.png" },
  { name: "Enel", code: "OP15-118", rarity: "P-SEC", price: "2,954 ฿", change: 26.3, img: "https://pub-e1c871a889eb42a4bd7dcdc3a5926f3c.r2.dev/op15/OP15-118_p1.png" },
  { name: "Jozu", code: "OP08-047", rarity: "R", price: "148 ฿", change: 25, img: "https://pub-e1c871a889eb42a4bd7dcdc3a5926f3c.r2.dev/op08/OP08-047.png" },
  { name: "Lim", code: "OP09-037", rarity: "SP", price: "882 ฿", change: 24.2, img: "https://pub-e1c871a889eb42a4bd7dcdc3a5926f3c.r2.dev/op09/OP09-037_p2.png" },
  { name: "Issho (Parallel)", code: "OP03-078", rarity: "SP", price: "734 ฿", change: 24, img: "https://pub-e1c871a889eb42a4bd7dcdc3a5926f3c.r2.dev/op03/OP03-078_p2.png" },
  { name: "Boa Hancock", code: "EB03-026", rarity: "P-SR", price: "734 ฿", change: 24, img: "https://pub-e1c871a889eb42a4bd7dcdc3a5926f3c.r2.dev/eb03/EB03-026_p1.png" },
  { name: "Charlotte Pudding (Parallel)", code: "OP08-058", rarity: "P-L", price: "586 ฿", change: 23.8, img: "https://pub-e1c871a889eb42a4bd7dcdc3a5926f3c.r2.dev/op08/OP08-058_p1.png" },
] as const

/** ยอดนิยม 3 ใบ — จาก /api/cards/spotlight ของจริงเช่นกัน */
const POPULAR = [
  { name: "Monkey.D.Luffy", code: "OP13-118", price: "378,880 ฿", img: "https://pub-e1c871a889eb42a4bd7dcdc3a5926f3c.r2.dev/op13/OP13-118_p3.png" },
  { name: "Monkey.D.Luffy", code: "OP13-118", price: "438 ฿", img: "https://pub-e1c871a889eb42a4bd7dcdc3a5926f3c.r2.dev/op13/OP13-118.png" },
  { name: "Shanks", code: "OP09-004", price: "17,701 ฿", img: "https://pub-e1c871a889eb42a4bd7dcdc3a5926f3c.r2.dev/op09/OP09-004_p5.png" },
] as const

const PHOTO_OPTIONS = [
  { value: "current", label: "ปัจจุบัน" },
  { value: "badge", label: "A · ติดป้าย AI" },
  { value: "banner", label: "B · แถบเน้น" },
  { value: "card", label: "C · การ์ดเด่น" },
] as const

const TAB_OPTIONS = [
  { value: "current", label: "ปัจจุบัน" },
  { value: "scan", label: "A · ไอคอนสแกน" },
  { value: "wand", label: "B · ไม้กายสิทธิ์" },
  { value: "glow", label: "C · เรืองแสง" },
] as const

const PHOTO_COPY: Record<Photo, { name: string; note: string }> = {
  current: {
    name: "ปัจจุบัน — ไอคอนกล้อง + ข้อความเดียว",
    note: "ไม่มีอะไรบอกว่าเบื้องหลังเป็น AI เลย ดูเหมือนปุ่มอัปโหลดรูปธรรมดา",
  },
  badge: {
    name: "A · ติดป้าย AI — เปลี่ยนน้อยที่สุด",
    note: "เปลี่ยนไอคอนกล้องเป็นไอคอนสแกน แล้วติดป้าย AI ตัวเล็กท้ายข้อความ · แถวยังสูงเท่าเดิม ไม่กินที่เพิ่ม",
  },
  banner: {
    name: "B · แถบเน้น — ไล่สีจางทั้งแถว",
    note: "พื้นหลังไล่สีแบรนด์จางๆ + ไอคอนในวงกลม + สองบรรทัด (หัวข้อ + วิธีใช้) · เด่นกว่าแบบ A ชัดเจน แต่กินความสูงเพิ่มราว 20px",
  },
  card: {
    name: "C · การ์ดเด่น — กรอบไล่สี",
    note: "ทำเป็นการ์ดมีกรอบไล่สี แยกออกจากรายการข้างล่างชัดเจน — เด่นสุด เหมาะถ้าอยากดันให้คนลองใช้ฟีเจอร์นี้",
  },
}

const TAB_COPY: Record<Tab, { name: string; note: string }> = {
  current: {
    name: "ปัจจุบัน — แว่นขยายล้วน",
    note: "อ่านออกว่าค้นหา แต่ไม่มีอะไรบอกว่าเบื้องหลังฉลาดกว่าช่องค้นหาทั่วไป",
  },
  scan: {
    name: "A · ไอคอนสแกน (ScanSearch)",
    note: "แว่นในกรอบสแกน — สื่อว่า 'สแกนหา' ไม่ใช่แค่พิมพ์หา · ยังอ่านออกว่าเป็นปุ่มค้นหาอยู่ ไม่ต้องเดา",
  },
  wand: {
    name: "B · ไม้กายสิทธิ์มีประกาย (WandSparkles)",
    note: "ภาษาสากลของ 'AI ช่วยทำให้' ที่คนคุ้นจากแอปอื่น · แต่ห่างจากความหมาย 'ค้นหา' มากที่สุดในสามแบบ",
  },
  glow: {
    name: "C · แว่นเดิม + วงเรืองแสง",
    note: "เก็บไอคอนแว่นที่คนคุ้นไว้ แล้วเพิ่มวงเรืองแสงไล่สีรอบปุ่ม — บอกว่า 'พิเศษ' โดยไม่เปลี่ยนความหมาย",
  },
}

const NOTES = [
  "Sparkles (✨) ถูกใช้ไปแล้วสามที่ในเว็บ (แพ็กเกจ · หน้าแรก · ท้ายเว็บ) ถ้าเอามาใช้กับ AI อีกจะกลายเป็นไอคอนที่แปลว่าอะไรก็ได้",
  "ข้อความปัจจุบันบอกอยู่แล้วว่าใช้ AI — แต่ซ่อนอยู่ในบรรทัดคำอธิบายที่มือถือไม่แสดง",
  "มาแรงตอนนี้ระบบส่งมา 6 ใบ ถ้าเอายาวเต็มจอต้องขยับเป็น 12 ใบ (แก้เลขเดียวใน API)",
  "ทุกปุ่มในตัวอย่างกดไม่ได้จริง · ข้อมูลเป็นค่าตายตัว",
] as const

/* ----------------------------------------------------------------- atoms */

function PhotoRow({ variant }: { variant: Photo }) {
  if (variant === "current") {
    return (
      <div className="border-b border-hair p-2">
        <div className="flex min-h-11 w-full items-center gap-2.5 rounded-xl px-3 text-left text-sm text-muted-foreground">
          <Camera className="size-4 text-primary" aria-hidden />
          <span className="flex-1">ค้นหาด้วยรูปภาพ</span>
        </div>
      </div>
    )
  }

  if (variant === "badge") {
    return (
      <div className="border-b border-hair p-2">
        <div className="flex min-h-11 w-full items-center gap-2.5 rounded-xl px-3 text-left text-sm text-muted-foreground">
          <ScanSearch className="size-[18px] text-primary" aria-hidden />
          <span className="flex-1 text-foreground">ค้นหาด้วยรูปภาพ</span>
          <span className="rounded-full bg-[var(--p-honey-soft)] px-2 py-0.5 text-micro font-semibold text-primary">
            AI
          </span>
        </div>
      </div>
    )
  }

  if (variant === "banner") {
    return (
      <div className="border-b border-hair p-2">
        <div className="flex w-full items-center gap-3 rounded-xl bg-gradient-to-r from-[var(--p-honey-soft)] to-transparent px-3 py-2 text-left">
          <span className="grid size-9 shrink-0 place-items-center rounded-full bg-primary/15 text-primary">
            <ScanSearch className="size-[18px]" aria-hidden />
          </span>
          <span className="min-w-0 flex-1">
            <span className="flex items-center gap-1.5">
              <span className="text-body-sm font-semibold text-foreground">
                สแกนการ์ดด้วย AI
              </span>
              <span className="rounded-full bg-primary/15 px-1.5 text-micro font-semibold text-primary">
                AI
              </span>
            </span>
            <span className="block truncate text-meta">
              ถ่ายรูปการ์ด แล้วให้ AI หาให้ว่าใบไหน
            </span>
          </span>
        </div>
      </div>
    )
  }

  return (
    <div className="border-b border-hair p-2">
      <div className="rounded-2xl bg-gradient-to-br from-primary/40 via-primary/15 to-transparent p-px">
        <div className="flex w-full items-center gap-3 rounded-[calc(1rem-1px)] bg-popover px-3 py-2.5 text-left">
          <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-primary/25 to-primary/5 text-primary">
            <ScanSearch className="size-5" aria-hidden />
          </span>
          <span className="min-w-0 flex-1">
            <span className="flex items-center gap-1.5">
              <span className="text-body-sm font-semibold text-foreground">
                สแกนการ์ดด้วย AI
              </span>
              <span className="rounded-full bg-primary px-1.5 text-micro font-semibold text-primary-foreground">
                AI
              </span>
            </span>
            <span className="block truncate text-meta">
              ถ่ายรูปหรืออัปโหลด แล้วให้ AI บอกว่าเป็นการ์ดใบไหน
            </span>
          </span>
        </div>
      </div>
    </div>
  )
}

function MoverRow({ m }: { m: (typeof MOVERS)[number] }) {
  const up = m.change > 0
  return (
    <div className="flex min-h-14 items-center gap-3 px-4 py-1.5">
      <span className="hairline relative h-10 w-7 shrink-0 overflow-hidden rounded bg-card">
        <Image
          src={m.img}
          alt={`${m.name} ${m.code}`}
          fill
          sizes="28px"
          className="select-none object-cover"
        />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-body-sm font-semibold">{m.name}</span>
        <span className="flex items-center gap-1.5">
          <span className="text-meta">{m.code}</span>
          <span className="hairline rounded px-1 text-micro text-muted-foreground">
            {m.rarity}
          </span>
        </span>
      </span>
      <span className="text-right">
        <span className="block font-price text-sm font-semibold tabular-nums">
          {m.price}
        </span>
        <span
          className={cn(
            "inline-flex items-center gap-0.5 font-price text-xs tabular-nums",
            up ? "text-price-up" : "text-price-down",
          )}
        >
          <ArrowUp className={cn("size-3", !up && "rotate-180")} aria-hidden />
          {up ? "+" : ""}
          {m.change.toFixed(1)}%
        </span>
      </span>
    </div>
  )
}

function SearchTabButton({ variant }: { variant: Tab }) {
  const icon =
    variant === "scan" ? (
      <ScanSearch className="size-6" strokeWidth={2.25} aria-hidden />
    ) : variant === "wand" ? (
      <WandSparkles className="size-6" strokeWidth={2.25} aria-hidden />
    ) : (
      <Search className="size-6" strokeWidth={2.25} aria-hidden />
    )

  return (
    <span className="relative flex flex-col items-center gap-1">
      {variant === "glow" && (
        <span
          aria-hidden
          className="absolute -top-7 size-14 rounded-full bg-gradient-to-br from-primary/60 to-primary/0 blur-md"
        />
      )}
      <span
        className={cn(
          "ease-chrome relative flex size-14 -mt-7 items-center justify-center rounded-full text-primary-foreground shadow-lg ring-4 ring-background",
          variant === "glow"
            ? "bg-gradient-to-br from-primary to-primary/80"
            : "bg-primary",
        )}
      >
        {icon}
      </span>
      <span className="text-micro text-muted-foreground">ค้นหา</span>
    </span>
  )
}

/* ------------------------------------------------------------ page shell */

const subscribeNever = () => () => {}

const PHOTO_VALUES = PHOTO_OPTIONS.map((o) => o.value)

const TAB_VALUES = TAB_OPTIONS.map((o) => o.value)

export default function SearchAiProtoPage() {
  const [photo, setPhoto] = useProtoVariant("photo", PHOTO_VALUES, "banner")
  const [tab, setTab] = useProtoVariant("tab", TAB_VALUES, "scan")
  const [longMovers, toggleLongMovers] = useProtoFlag("long", true)
  const { resolvedTheme, setTheme } = useTheme()
  const mounted = useSyncExternalStore(
    subscribeNever,
    () => true,
    () => false,
  )
  const isDark = mounted && resolvedTheme === "dark"
  const shown = longMovers ? MOVERS : MOVERS.slice(0, 6)

  return (
    <main className="min-h-screen bg-background px-4 py-8 text-foreground sm:px-6 lg:px-10">
      <div className="mx-auto max-w-[1200px]">
        <h1 className="text-h1">ค้นหาด้วยรูป · มาแรงยาวเต็มจอ · ปุ่มค้นหาให้ดูเทค</h1>
        <p className="mt-2 max-w-3xl text-body text-muted-foreground">
          สามเรื่องที่เบสสั่ง — แถวค้นหาด้วยรูปควรบอกว่าเบื้องหลังเป็น AI ·
          มาแรงยืดยาวเต็มจอ (6 → 12 ใบ) · และปุ่มค้นหาที่แถบล่างควรดูเทคขึ้น
        </p>

        <div className="mt-5 flex flex-wrap items-end justify-between gap-4">
          <div className="space-y-3">
            <div>
              <p className="text-eyebrow mb-1.5">แถวค้นหาด้วยรูป</p>
              <div className="overflow-x-auto pb-1">
                <SegmentedControl
                  options={PHOTO_OPTIONS}
                  value={photo}
                  onChange={setPhoto}
                  ariaLabel="เลือกแบบแถวค้นหาด้วยรูป"
                  className="min-w-max"
                  compactVisual={false}
                />
              </div>
            </div>
            <div>
              <p className="text-eyebrow mb-1.5">ปุ่มค้นหาแถบล่าง</p>
              <div className="overflow-x-auto pb-1">
                <SegmentedControl
                  options={TAB_OPTIONS}
                  value={tab}
                  onChange={setTab}
                  ariaLabel="เลือกแบบปุ่มค้นหา"
                  className="min-w-max"
                  compactVisual={false}
                />
              </div>
            </div>
            <button
              type="button"
              onClick={toggleLongMovers}
              className="hairline ease-chrome h-10 rounded-full px-3.5 text-sm font-medium transition-colors hover:bg-muted"
            >
              {longMovers ? "มาแรง 12 ใบ (กดดู 6 ใบเดิม)" : "มาแรง 6 ใบ (กดดู 12 ใบ)"}
            </button>
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

        <section className="mt-6 grid gap-8 lg:grid-cols-[390px_minmax(0,1fr)]">
          <div>
            <p className="text-eyebrow mb-2">ช่องค้นหาเต็มจอ (390px)</p>
            <div className="hairline flex h-[720px] flex-col overflow-hidden rounded-[2rem] bg-popover">
              <div className="flex items-center gap-2 border-b border-hair px-3">
                <Search className="size-4 shrink-0 text-muted-foreground" aria-hidden />
                <span className="h-12 flex-1 leading-[3rem] text-base text-muted-foreground">
                  ค้นหาการ์ด, ชุด, รหัส...
                </span>
                <span className="h-10 shrink-0 px-2.5 text-sm font-medium leading-10 text-primary">
                  ยกเลิก
                </span>
              </div>
              <PhotoRow variant={photo} />
              <div className="min-h-0 flex-1 overflow-y-auto">
                <p className="px-4 pb-1 pt-3 text-eyebrow">ยอดนิยม</p>
                <div className="flex gap-2 overflow-hidden px-4 pb-2">
                  {POPULAR.slice(0, 2).map((c) => (
                    <span
                      key={c.img}
                      className="hairline flex shrink-0 items-center gap-2 rounded-xl bg-card px-2.5 py-1.5"
                    >
                      <span className="relative h-8 w-6 shrink-0 overflow-hidden rounded bg-muted">
                        <Image
                          src={c.img}
                          alt={`${c.name} ${c.code}`}
                          fill
                          sizes="24px"
                          className="select-none object-cover"
                        />
                      </span>
                      <span>
                        <span className="block text-xs font-semibold">{c.name}</span>
                        <span className="block text-meta">{c.price}</span>
                      </span>
                    </span>
                  ))}
                </div>
                <div className="flex items-center justify-between px-4 pb-1 pt-2">
                  <p className="text-eyebrow">มาแรง</p>
                  <span className="text-meta">ดูทั้งหมด</span>
                </div>
                <div className="divide-y divide-border/60 pb-4">
                  {shown.map((m) => (
                    <MoverRow key={m.code} m={m} />
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div>
              <p className="text-eyebrow mb-2">แถบล่างมือถือ</p>
              <div className="hairline rounded-2xl bg-card px-4 pb-3 pt-10">
                <div className="flex items-end justify-around">
                  {["หน้าแรก", "ชุดการ์ด"].map((l) => (
                    <span key={l} className="flex flex-col items-center gap-1 text-micro text-muted-foreground">
                      <span className="size-6 rounded bg-muted" aria-hidden />
                      {l}
                    </span>
                  ))}
                  <SearchTabButton variant={tab} />
                  {["พอร์ต", "ดูเพิ่มเติม"].map((l) => (
                    <span key={l} className="flex flex-col items-center gap-1 text-micro text-muted-foreground">
                      <span className="size-6 rounded bg-muted" aria-hidden />
                      {l}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="border-l-2 border-primary pl-4">
                <p className="text-eyebrow mb-1">แถวค้นหาด้วยรูป</p>
                <h2 className="text-h4">{PHOTO_COPY[photo].name}</h2>
                <p className="mt-1 text-body-sm text-muted-foreground">
                  {PHOTO_COPY[photo].note}
                </p>
              </div>
              <div className="border-l-2 border-primary pl-4">
                <p className="text-eyebrow mb-1">ปุ่มค้นหา</p>
                <h2 className="text-h4">{TAB_COPY[tab].name}</h2>
                <p className="mt-1 text-body-sm text-muted-foreground">
                  {TAB_COPY[tab].note}
                </p>
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
      </div>
    </main>
  )
}
