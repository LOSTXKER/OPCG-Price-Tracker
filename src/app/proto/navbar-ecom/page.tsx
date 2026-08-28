"use client"

import Image from "next/image"
import { useTheme } from "next-themes"
import { useState, useSyncExternalStore } from "react"
import {
  ArrowDown,
  ArrowUp,
  Bell,
  Briefcase,
  ChevronDown,
  ChevronRight,
  Globe,
  Heart,
  Menu,
  MessageCircle,
  Moon,
  PackageOpen,
  Search,
  Sun,
  Zap,
} from "lucide-react"

import { GameCrest } from "@/components/shared/game-crest"
import { IconButton } from "@/components/ui/icon-button"
import { SegmentedControl } from "@/components/ui/segmented-control"
import { cn } from "@/lib/utils"

/* ------------------------------------------------------------------ data */

type Variant = "current" | "band" | "neutral" | "hybrid"

/** surface = พื้นปกติของเว็บ · band = อยู่บนแถบสีแบรนด์ (ตัวหนังสือต้องกลับสี) */
type Tone = "surface" | "band"

/** ตัวเลขชุดเดียวกับจอจริงของเบส (28 ส.ค.) เพื่อเทียบแบบตาต่อตา */
const STATS = {
  cards: "3,838",
  sets: "51",
  value: "2,688,706 ฿",
  rate: "0.296",
  updated: "5 เม.ย. 2569",
} as const

/** การ์ดขยับแรงชุดตายตัว — ใบจริง รูปจริงจาก R2 (ชุดเดียวกับ proto พอร์ต) */
const MOVERS = [
  { code: "OP13-118", name: "Monkey.D.Luffy", img: "https://pub-e1c871a889eb42a4bd7dcdc3a5926f3c.r2.dev/op13/OP13-118_p3.png", price: "294,400 ฿", change: -8.3 },
  { code: "OP05-119", name: "Monkey.D.Luffy", img: "https://pub-e1c871a889eb42a4bd7dcdc3a5926f3c.r2.dev/op05/OP05-119_p7.png", price: "229,540 ฿", change: 0.1 },
  { code: "OP09-118", name: "Gol.D.Roger", img: "https://pub-e1c871a889eb42a4bd7dcdc3a5926f3c.r2.dev/op09/OP09-118_p2.png", price: "137,540 ฿", change: 6.7 },
  { code: "OP13-119", name: "Portgas.D.Ace", img: "https://pub-e1c871a889eb42a4bd7dcdc3a5926f3c.r2.dev/op13/OP13-119_p3.png", price: "114,540 ฿", change: 5.9 },
  { code: "ST01-012", name: "Monkey.D.Luffy", img: "https://pub-e1c871a889eb42a4bd7dcdc3a5926f3c.r2.dev/st01/ST01-012_p3.png", price: "114,540 ฿", change: 14.9 },
  { code: "OP13-120", name: "Sabo", img: "https://pub-e1c871a889eb42a4bd7dcdc3a5926f3c.r2.dev/op13/OP13-120_p3.png", price: "91,540 ฿", change: -20.3 },
  { code: "EB02-061", name: "Monkey.D.Luffy", img: "https://pub-e1c871a889eb42a4bd7dcdc3a5926f3c.r2.dev/eb02/EB02-061_p3.png", price: "68,540 ฿", change: 3.9 },
] as const

/** คำค้นยอดนิยมใต้ช่องค้นหา (สูตร Shopee) — ตัวอย่างตายตัว ของจริงต่อยอดจากการ์ดที่คนดูมาก */
const HOT_QUERIES = [
  "Luffy P-SEC",
  "OP13-118",
  "Gol.D.Roger",
  "PSA 10",
  "Zoro OP01-001",
  "Buggy SP",
  "ชุด OP15",
  "ขึ้นแรงวันนี้",
] as const

const VARIANT_OPTIONS = [
  { value: "current", label: "ปัจจุบัน" },
  { value: "band", label: "S · แถบสีแบรนด์" },
  { value: "neutral", label: "L · พื้นเดิม" },
  { value: "hybrid", label: "H · คงแถบชีพจร" },
] as const

const VARIANT_COPY: Record<
  Variant,
  { name: string; summary: string; tradeoff: string }
> = {
  current: {
    name: "ปัจจุบัน — แบบ C ที่ขึ้นเว็บอยู่",
    summary:
      "ตัวตั้งเทียบ: แถบชีพจรบนสุด · แถวโลโก้ · แถวเมนูที่มีช่องค้นหาขวาสุด (กว้าง 320px) — สลับไปมาเพื่อดูว่าแบบใหม่เปลี่ยนความรู้สึกแค่ไหน",
    tradeoff: "—",
  },
  band: {
    name: "S · แถบสีแบรนด์ — จัดผังแบบ Shopee",
    summary:
      "ทาสีแบรนด์ทั้งแผง แล้วยกช่องค้นหาเป็นพระเอกใหญ่กลางจอ ของประจำบัญชี (อัปเกรด · ภาษา · ข้อความ · แจ้งเตือน · โปรไฟล์) ขึ้นไปอยู่แถบบางบนสุดคู่กับสถิติตลาด ใต้ช่องค้นหามีคำค้นยอดนิยมให้จิ้มต่อได้ทันที — และปุ่มภาษาโผล่มาอยู่หน้าแถบเป็นครั้งแรก ไม่ต้องกดเข้าเมนูโปรไฟล์",
    tradeoff:
      "การ์ดขยับแรง (แถบวิ่ง) ไม่มีที่ลงในผังนี้ ต้องแลกกับคำค้นยอดนิยม · โหมดมืดแถบกลายเป็นสีทองสว่างทั้งแผง กดปุ่มพระจันทร์ดูแล้วค่อยเคาะ · แถบทาสีตลอด ไม่มีสถานะโปร่งใสตอนอยู่บนสุดหน้าแบบของจริง · สูงรวม ~124px",
  },
  neutral: {
    name: "L · พื้นเดิม — จัดผังแบบ Lazada",
    summary:
      "โครงเดียวกับแบบ S (ค้นหาใหญ่กลางจอ + แถว utility บางบนสุด) แต่อยู่บนพื้นสีเดิมของเว็บ เมนูหลักย้ายขึ้นเป็นตัวหนังสือเล็กแถวบนสุด ส่วนแถบชีพจรเดิมย้ายลงมาอยู่ใต้ช่องค้นหา ครบทั้งการ์ดขยับแรง — ได้ค้นหาเด่นโดยไม่ตัดอะไรทิ้งเลย",
    tradeoff:
      "แบรนด์ไม่ตะโกนเท่าแบบ S · เมนูหลักตัวเล็กลงและขึ้นไปอยู่แถวบนสุด ความเด่นของเมนูลดลง · สูงรวม ~128px",
  },
  hybrid: {
    name: "H · คงแถบชีพจร — ยุบสองแถวล่างเหลือแถวเดียว",
    summary:
      "แถบชีพจรที่เพิ่งขึ้นเว็บอยู่ครบเหมือนเดิมบนสุด แต่แถวโลโก้กับแถวเมนูยุบรวมเป็นแถวเดียว: โลโก้ + เกม›ชุด ฝั่งซ้าย · ช่องค้นหาใหญ่กลางจอ · ของประจำตัวย่อเป็นไอคอนฝั่งขวา แล้วปิดท้ายด้วยแถวบางๆ ที่มีเมนูหลักกับคำค้นยอดนิยม",
    tradeoff:
      "มุมขวาแน่นที่สุดในสามแบบใหม่ (ไอคอนเรียงกัน 7 ตัว) · พอร์ตกับรายการโปรดเหลือแค่ไอคอนไม่มีป้ายชื่อ · สูงรวม ~124px",
  },
}

const SHARED_NOTES = [
  "ของครบทุกชิ้นจาก navbar ปัจจุบัน — ตารางท้ายหน้าไล่ให้ดูทีละชิ้นว่าแบบที่เลือกอยู่เอาไปวางตรงไหน",
  "ช่องค้นหาใหญ่ขึ้นราว 3 เท่าและย้ายมากลางจอ ตามสูตร Shopee/Lazada ที่ให้ค้นหาเป็นพระเอก",
  "คำค้นยอดนิยมใต้ช่องค้นหาเป็นของใหม่ — ตอนนี้เป็นตัวอย่างตายตัว ของจริงต่อยอดจากการ์ดที่คนดูมากได้",
  "ปุ่มทุกปุ่มในตัวอย่างกดไม่ได้จริง (หุ่นโชว์ผัง) · ตัวเลขชุดเดียวกับจอจริงของเบส (28 ส.ค.)",
] as const

/** ตารางพิสูจน์ "ไม่มีอะไรหายเงียบ" — ของ 15 ชิ้นจาก navbar จริง ลงตรงไหนในแต่ละแบบ */
const PLACEMENTS: Record<Variant, ReadonlyArray<{ item: string; where: string }>> = {
  current: [
    { item: "สถิติตลาด (การ์ด · ชุด · มูลค่ารวม · JPY/THB · อัปเดต)", where: "แถบชีพจรบนสุด ฝั่งซ้าย" },
    { item: "การ์ดขยับแรง (แถบวิ่ง)", where: "แถบชีพจรบนสุด ครึ่งขวา" },
    { item: "โลโก้ Meecard", where: "แถวโลโก้ ซ้ายสุด" },
    { item: "ตัวเลือกเกม › ชุด", where: "แถวโลโก้ ถัดจากโลโก้" },
    { item: "ปุ่มอัปเกรด", where: "แถวโลโก้ ฝั่งขวา" },
    { item: "ข้อความ", where: "แถวโลโก้ ฝั่งขวา" },
    { item: "การแจ้งเตือน", where: "แถวโลโก้ ฝั่งขวา" },
    { item: "โปรไฟล์", where: "แถวโลโก้ ขวาสุด" },
    { item: "ฝั่งยังไม่ล็อกอิน (เฟือง · แพ็กเกจ · เข้าสู่ระบบ · สมัคร)", where: "ตำแหน่งเดียวกับโปรไฟล์" },
    { item: "เมนูหลัก (หน้าแรก · ชุดการ์ด · เด็คฯ · ซื้อขาย)", where: "แถวเมนู ฝั่งซ้าย" },
    { item: "พอร์ต", where: "แถวเมนู ฝั่งขวา" },
    { item: "รายการโปรด", where: "แถวเมนู ฝั่งขวา" },
    { item: "Honey + แต้ม", where: "แถวเมนู ฝั่งขวา" },
    { item: "ช่องค้นหา", where: "แถวเมนู ขวาสุด (กว้าง 320px)" },
    { item: "ภาษา · สกุลเงิน · ธีม", where: "ซ่อนในเมนูโปรไฟล์ (guest = ปุ่มเฟือง)" },
  ],
  band: [
    { item: "สถิติตลาด", where: "แถบ utility บนสุด ฝั่งซ้าย (ตัวหนังสือบนสีแบรนด์)" },
    { item: "การ์ดขยับแรง (แถบวิ่ง)", where: "❌ ไม่มีที่ลง — แลกกับคำค้นยอดนิยม" },
    { item: "โลโก้ Meecard", where: "แถวพระเอก ซ้ายสุด" },
    { item: "ตัวเลือกเกม › ชุด", where: "แถวพระเอก ถัดจากโลโก้" },
    { item: "ปุ่มอัปเกรด", where: "แถบ utility ฝั่งขวา" },
    { item: "ข้อความ", where: "แถบ utility ฝั่งขวา" },
    { item: "การแจ้งเตือน", where: "แถบ utility ฝั่งขวา" },
    { item: "โปรไฟล์", where: "แถบ utility ขวาสุด" },
    { item: "ฝั่งยังไม่ล็อกอิน", where: "ตำแหน่งเดียวกับโปรไฟล์ บนแถบ utility" },
    { item: "เมนูหลัก", where: "แถวล่างสุด ฝั่งซ้าย" },
    { item: "พอร์ต", where: "แถวพระเอก ฝั่งขวา (ตำแหน่งตะกร้าของ Shopee)" },
    { item: "รายการโปรด", where: "แถวพระเอก ฝั่งขวา" },
    { item: "Honey + แต้ม", where: "แถวพระเอก ฝั่งขวา" },
    { item: "ช่องค้นหา", where: "แถวพระเอก กลางจอ ใหญ่เต็มตา + คำค้นยอดนิยมแถวล่าง" },
    { item: "ภาษา · สกุลเงิน · ธีม", where: "ภาษาขึ้นแถบ utility ตรงๆ · สกุลเงิน/ธีมยังอยู่ในเมนูโปรไฟล์" },
  ],
  neutral: [
    { item: "สถิติตลาด", where: "แถบชีพจร ย้ายลงล่างสุดของ navbar" },
    { item: "การ์ดขยับแรง (แถบวิ่ง)", where: "แถบชีพจรล่างสุด — อยู่ครบเหมือนเดิม" },
    { item: "โลโก้ Meecard", where: "แถวพระเอก ซ้ายสุด" },
    { item: "ตัวเลือกเกม › ชุด", where: "แถวพระเอก ถัดจากโลโก้" },
    { item: "ปุ่มอัปเกรด", where: "แถว utility บนสุด ฝั่งขวา" },
    { item: "ข้อความ", where: "แถว utility ฝั่งขวา" },
    { item: "การแจ้งเตือน", where: "แถว utility ฝั่งขวา" },
    { item: "โปรไฟล์", where: "แถว utility ขวาสุด" },
    { item: "ฝั่งยังไม่ล็อกอิน", where: "ตำแหน่งเดียวกับโปรไฟล์ บนแถว utility" },
    { item: "เมนูหลัก", where: "แถว utility บนสุด ฝั่งซ้าย (ตัวหนังสือเล็ก)" },
    { item: "พอร์ต", where: "แถวพระเอก ฝั่งขวา" },
    { item: "รายการโปรด", where: "แถวพระเอก ฝั่งขวา" },
    { item: "Honey + แต้ม", where: "แถวพระเอก ฝั่งขวา" },
    { item: "ช่องค้นหา", where: "แถวพระเอก กลางจอ" },
    { item: "ภาษา · สกุลเงิน · ธีม", where: "ภาษาขึ้นแถว utility ตรงๆ · สกุลเงิน/ธีมยังอยู่ในเมนูโปรไฟล์" },
  ],
  hybrid: [
    { item: "สถิติตลาด", where: "แถบชีพจรบนสุด — เหมือนปัจจุบันทุกอย่าง" },
    { item: "การ์ดขยับแรง (แถบวิ่ง)", where: "แถบชีพจรบนสุด — เหมือนปัจจุบันทุกอย่าง" },
    { item: "โลโก้ Meecard", where: "แถวรวม ซ้ายสุด" },
    { item: "ตัวเลือกเกม › ชุด", where: "แถวรวม ถัดจากโลโก้" },
    { item: "ปุ่มอัปเกรด", where: "แถวรวม ฝั่งขวา" },
    { item: "ข้อความ", where: "แถวรวม ฝั่งขวา" },
    { item: "การแจ้งเตือน", where: "แถวรวม ฝั่งขวา" },
    { item: "โปรไฟล์", where: "แถวรวม ขวาสุด" },
    { item: "ฝั่งยังไม่ล็อกอิน", where: "ตำแหน่งเดียวกับโปรไฟล์" },
    { item: "เมนูหลัก", where: "แถวล่างบางๆ ฝั่งซ้าย" },
    { item: "พอร์ต", where: "แถวรวม ฝั่งขวา (ย่อเหลือไอคอน)" },
    { item: "รายการโปรด", where: "แถวรวม ฝั่งขวา (ย่อเหลือไอคอน)" },
    { item: "Honey + แต้ม", where: "แถวรวม ฝั่งขวา (🍯 + เลขแต้ม)" },
    { item: "ช่องค้นหา", where: "แถวรวม กลางจอ + คำค้นยอดนิยมแถวล่าง" },
    { item: "ภาษา · สกุลเงิน · ธีม", where: "ซ่อนในเมนูโปรไฟล์ (เหมือนปัจจุบัน)" },
  ],
}

/* ----------------------------------------------------------------- atoms */

function BrandMark({ tone = "surface" }: { tone?: Tone }) {
  return (
    <span className="flex h-8 shrink-0 items-center gap-2 pr-1">
      <Image
        src="/meecard.png"
        alt="Meecard"
        width={754}
        height={694}
        className="h-auto w-6 shrink-0 select-none"
      />
      <span
        className={cn(
          "text-sm font-bold tracking-tight",
          tone === "band" ? "text-primary-foreground" : "text-foreground",
        )}
      >
        Meecard
      </span>
    </span>
  )
}

/** ป้ายจาง + ตัวเลขเข้ม — สถิติแบบ "ตัวหนังสือเปล่า" บนแถบชีพจร/แถบ utility */
function StatText({
  label,
  value,
  link = false,
  tone = "surface",
}: {
  label: string
  value: string
  link?: boolean
  tone?: Tone
}) {
  const body = (
    <>
      <span
        className={cn(
          tone === "band"
            ? "text-[11px] text-primary-foreground/60"
            : "text-meta",
        )}
      >
        {label}
      </span>
      <span
        className={cn(
          "text-xs font-semibold tabular-nums",
          tone === "band" ? "text-primary-foreground" : "text-foreground",
          link &&
            (tone === "band"
              ? "ease-chrome transition-opacity group-hover:opacity-80"
              : "ease-chrome transition-colors group-hover:text-primary"),
        )}
      >
        {value}
      </span>
    </>
  )
  if (link) {
    return (
      <button
        type="button"
        className="group flex shrink-0 items-baseline gap-1.5 whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40"
      >
        {body}
      </button>
    )
  }
  return (
    <span className="flex shrink-0 items-baseline gap-1.5 whitespace-nowrap">
      {body}
    </span>
  )
}

function GhostIcon({
  icon: Icon,
  label,
  dot = false,
  tone = "surface",
  size = "md",
  iconClassName,
}: {
  icon: typeof Bell
  label: string
  dot?: boolean
  tone?: Tone
  size?: "sm" | "md"
  iconClassName?: string
}) {
  return (
    <button
      type="button"
      aria-label={label}
      className={cn(
        "ease-chrome relative grid shrink-0 place-items-center rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40",
        size === "sm" ? "size-7" : "size-8",
        tone === "band"
          ? "text-primary-foreground/80 hover:bg-primary-foreground/10 hover:text-primary-foreground"
          : "text-muted-foreground hover:bg-muted hover:text-foreground",
      )}
    >
      <Icon className={cn(size === "sm" ? "size-3.5" : "size-4", iconClassName)} aria-hidden />
      {dot && (
        <span
          className="absolute right-1.5 top-1.5 size-2 rounded-full bg-danger"
          aria-hidden
        />
      )}
    </button>
  )
}

function ProfileCapsule({
  tone = "surface",
  compact = false,
}: {
  tone?: Tone
  compact?: boolean
}) {
  return (
    <button
      type="button"
      aria-label="เปิดเมนูโปรไฟล์และการตั้งค่า"
      className={cn(
        "ease-chrome flex shrink-0 items-center gap-1.5 rounded-full pl-2 pr-1 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40",
        compact ? "h-7" : "h-8",
        tone === "band"
          ? "ring-1 ring-primary-foreground/25 hover:bg-primary-foreground/10"
          : "hairline hover:bg-muted/70",
      )}
    >
      <Menu
        className={cn(
          "size-4 shrink-0",
          tone === "band" ? "text-primary-foreground/80" : "text-muted-foreground",
        )}
        aria-hidden
      />
      <span
        className={cn(
          "grid shrink-0 place-items-center rounded-full font-bold",
          compact ? "size-5 text-[9px]" : "size-6 text-[10px]",
          tone === "band"
            ? "bg-primary-foreground/15 text-primary-foreground ring-2 ring-primary-foreground/30"
            : "bg-primary/10 text-primary ring-2 ring-primary/25",
        )}
      >
        T
      </span>
    </button>
  )
}

/** ปุ่มภาษาบนแถบ utility — ของที่เดิมซ่อนอยู่ในเมนูโปรไฟล์ ยกขึ้นมาโชว์แบบ Shopee */
function LangPill({ tone = "surface" }: { tone?: Tone }) {
  return (
    <button
      type="button"
      aria-label="เปลี่ยนภาษา"
      className={cn(
        "ease-chrome flex h-7 shrink-0 items-center gap-1 rounded-full px-2 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40",
        tone === "band"
          ? "text-primary-foreground/80 hover:bg-primary-foreground/10 hover:text-primary-foreground"
          : "text-muted-foreground hover:bg-muted hover:text-foreground",
      )}
    >
      <Globe className="size-3.5" aria-hidden />
      ไทย
      <ChevronDown className="size-3" aria-hidden />
    </button>
  )
}

function UpgradeButton({
  tone = "surface",
  bare = false,
}: {
  tone?: Tone
  /** bare = ตัวหนังสือเล็กไม่มีกรอบ สำหรับแถบ utility บางๆ */
  bare?: boolean
}) {
  if (bare) {
    return (
      <button
        type="button"
        className={cn(
          "ease-chrome flex h-7 shrink-0 items-center gap-1 rounded-full px-2 text-xs font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40",
          tone === "band"
            ? "text-primary-foreground hover:bg-primary-foreground/10"
            : "text-primary hover:bg-primary/10",
        )}
      >
        <Zap className="size-3" aria-hidden />
        อัปเกรด
      </button>
    )
  }
  return (
    <button
      type="button"
      className={cn(
        "ease-chrome flex h-8 shrink-0 items-center gap-1 rounded-full border px-2.5 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40",
        tone === "band"
          ? "border-primary-foreground/40 text-primary-foreground hover:bg-primary-foreground/10"
          : "border-primary/30 text-primary hover:bg-primary/10",
      )}
    >
      <Zap className="size-3" aria-hidden />
      อัปเกรด
    </button>
  )
}

function NavLinkItem({
  label,
  active = false,
  tone = "surface",
}: {
  label: string
  active?: boolean
  tone?: Tone
}) {
  return (
    <button
      type="button"
      aria-current={active ? "page" : undefined}
      className={cn(
        "ease-chrome inline-flex h-9 shrink-0 items-center whitespace-nowrap rounded-full px-3.5 text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40",
        active
          ? tone === "band"
            ? "bg-primary-foreground/15 font-semibold text-primary-foreground"
            : "bg-[var(--p-honey-soft)] font-semibold text-primary"
          : tone === "band"
            ? "font-medium text-primary-foreground/75 hover:text-primary-foreground"
            : "font-medium text-muted-foreground hover:text-foreground",
      )}
    >
      {label}
    </button>
  )
}

function NavCluster({ tone = "surface" }: { tone?: Tone }) {
  return (
    <nav className="flex shrink-0 items-center gap-0.5" aria-label="เมนูหลัก">
      <NavLinkItem label="หน้าแรก" active tone={tone} />
      <NavLinkItem label="ชุดการ์ด" tone={tone} />
      <NavLinkItem label="เด็คและเครื่องมือ" tone={tone} />
      <NavLinkItem label="ซื้อขาย" tone={tone} />
    </nav>
  )
}

/** ลิงก์ตัวหนังสือเปล่าสำหรับแถวบางๆ (utility / แถวคำค้น) */
function TextLink({
  label,
  active = false,
  tone = "surface",
  size = "sm",
}: {
  label: string
  active?: boolean
  tone?: Tone
  size?: "sm" | "xs"
}) {
  return (
    <button
      type="button"
      aria-current={active ? "page" : undefined}
      className={cn(
        "ease-chrome shrink-0 whitespace-nowrap transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40",
        size === "xs" ? "text-xs" : "text-sm",
        active
          ? tone === "band"
            ? "font-semibold text-primary-foreground"
            : "font-semibold text-primary"
          : tone === "band"
            ? "font-medium text-primary-foreground/75 hover:text-primary-foreground"
            : "font-medium text-muted-foreground hover:text-foreground",
      )}
    >
      {label}
    </button>
  )
}

function MyStuffLink({
  icon,
  label,
  trailing,
  ping = false,
  tone = "surface",
}: {
  icon: React.ReactNode
  label: string
  trailing?: React.ReactNode
  ping?: boolean
  tone?: Tone
}) {
  return (
    <button
      type="button"
      className={cn(
        "ease-chrome relative flex h-9 shrink-0 items-center gap-1.5 rounded-full px-3 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40",
        tone === "band"
          ? "text-primary-foreground/85 hover:bg-primary-foreground/10 hover:text-primary-foreground"
          : "text-muted-foreground hover:bg-muted hover:text-foreground",
      )}
    >
      {ping && (
        <span className="absolute -right-1 -top-1 flex size-2" aria-hidden>
          <span className="absolute inline-flex size-full animate-ping rounded-full bg-danger opacity-75" />
          <span className="relative inline-flex size-2 rounded-full bg-danger" />
        </span>
      )}
      {icon}
      {label}
      {trailing}
    </button>
  )
}

function MyStuffCluster({ tone = "surface" }: { tone?: Tone }) {
  return (
    <div className="flex shrink-0 items-center gap-1.5">
      <MyStuffLink
        tone={tone}
        icon={
          <Briefcase
            className={cn(
              "size-3.5",
              tone === "band" ? "text-primary-foreground/60" : "text-muted-foreground/60",
            )}
            aria-hidden
          />
        }
        label="พอร์ต"
      />
      <MyStuffLink
        tone={tone}
        icon={
          <Heart
            className={cn(
              "size-3.5",
              tone === "band" ? "text-primary-foreground" : "text-primary",
            )}
            aria-hidden
          />
        }
        label="รายการโปรด"
      />
      <MyStuffLink
        tone={tone}
        ping
        icon={
          <span className="text-sm leading-none" aria-hidden>
            🍯
          </span>
        }
        label="Honey"
        trailing={
          <span
            className={cn(
              "font-bold tabular-nums",
              tone === "band"
                ? "text-primary-foreground"
                : "text-amber-600 dark:text-amber-400",
            )}
          >
            20
          </span>
        }
      />
    </div>
  )
}

function GamePill({ tone = "surface" }: { tone?: Tone }) {
  return (
    <button
      type="button"
      aria-label="เลือกแคตตาล็อกเกม: One Piece Card Game"
      className={cn(
        "ease-chrome flex h-8 shrink-0 items-center gap-1.5 rounded-full px-3 text-xs font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40",
        tone === "band"
          ? "bg-primary-foreground/10 text-primary-foreground ring-1 ring-primary-foreground/20 hover:bg-primary-foreground/15"
          : "surface-2 text-foreground ring-1 ring-hair hover:bg-muted",
      )}
    >
      <GameCrest game={{ slug: "opcg" }} size={18} variant="selector" decorative />
      OPCG
      <ChevronDown
        className={cn(
          "size-3",
          tone === "band" ? "text-primary-foreground/70" : "text-muted-foreground",
        )}
        aria-hidden
      />
    </button>
  )
}

function SetTrigger({ tone = "surface" }: { tone?: Tone }) {
  return (
    <button
      type="button"
      aria-label="เลือกชุดการ์ด"
      className={cn(
        "ease-chrome flex h-8 w-48 items-center gap-1.5 rounded-full px-2.5 text-label transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40",
        tone === "band"
          ? "bg-primary-foreground/10 text-primary-foreground ring-1 ring-primary-foreground/20 hover:bg-primary-foreground/15"
          : "surface-2 hairline text-foreground hover:bg-muted",
      )}
    >
      <PackageOpen
        className={cn(
          "size-3.5 shrink-0",
          tone === "band" ? "text-primary-foreground/70" : "text-muted-foreground",
        )}
        aria-hidden
      />
      <span className="min-w-0 flex-1 truncate text-left">เลือกชุดการ์ด</span>
      <ChevronDown
        className={cn(
          "size-3.5 shrink-0",
          tone === "band" ? "text-primary-foreground/70" : "text-muted-foreground",
        )}
        aria-hidden
      />
    </button>
  )
}

function CatalogControl({ tone = "surface" }: { tone?: Tone }) {
  return (
    <div className="flex shrink-0 items-center">
      <GamePill tone={tone} />
      <ChevronRight
        className={cn(
          "mx-1 size-3 shrink-0",
          tone === "band" ? "text-primary-foreground/50" : "text-muted-foreground/60",
        )}
        aria-hidden
      />
      <SetTrigger tone={tone} />
    </div>
  )
}

/** ช่องค้นหาขวาสุดของแบบ C ปัจจุบัน (ทรงแคปซูลที่เบสเคาะ 28 ส.ค.) */
function SearchField({ className }: { className?: string }) {
  return (
    <button
      type="button"
      aria-label="ค้นหาการ์ด"
      className={cn(
        "hairline ease-chrome group flex items-center gap-2 rounded-full bg-card px-4 text-left transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40",
        className,
      )}
    >
      <Search
        className="size-[18px] shrink-0 text-muted-foreground transition-colors group-hover:text-foreground"
        aria-hidden
      />
      <span className="min-w-0 flex-1 truncate text-body-sm text-muted-foreground">
        ค้นหาการ์ด...
      </span>
      <kbd className="hairline shrink-0 rounded-full bg-background px-1.5 py-0.5 font-sans text-micro text-muted-foreground">
        /
      </kbd>
    </button>
  )
}

/** ช่องค้นหาพระเอกแบบ Shopee — แคปซูลใหญ่ + ปุ่มค้นหาสีเต็มฝังขวา */
function HeroSearch({
  tone = "surface",
  className,
}: {
  tone?: Tone
  className?: string
}) {
  return (
    <button
      type="button"
      aria-label="ค้นหาการ์ด"
      className={cn(
        "ease-chrome group flex h-11 w-full items-center gap-2 rounded-full pl-4 pr-1 text-left transition-shadow focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40",
        tone === "band"
          ? "bg-background shadow-sm hover:shadow-md"
          : "hairline bg-muted hover:bg-muted/80",
        className,
      )}
    >
      <span className="min-w-0 flex-1 truncate text-body-sm text-muted-foreground">
        ค้นหาการ์ด ชุด หรือรหัส เช่น OP13-118...
      </span>
      <kbd
        className={cn(
          "hairline shrink-0 rounded-full px-1.5 py-0.5 font-sans text-micro text-muted-foreground",
          tone === "band" ? "bg-muted" : "bg-background",
        )}
      >
        /
      </kbd>
      <span className="flex h-9 shrink-0 items-center gap-1.5 rounded-full bg-primary px-5 text-sm font-semibold text-primary-foreground">
        <Search className="size-4" aria-hidden />
        ค้นหา
      </span>
    </button>
  )
}

/** แถวคำค้นยอดนิยมใต้ช่องค้นหา — องค์ประกอบลายเซ็นของ Shopee */
function KeywordRail({ tone = "surface" }: { tone?: Tone }) {
  return (
    <div className="flex min-w-0 items-center gap-3 overflow-hidden">
      <span
        className={cn(
          "shrink-0 text-xs",
          tone === "band" ? "text-primary-foreground/55" : "text-muted-foreground/70",
        )}
      >
        ยอดนิยม:
      </span>
      {HOT_QUERIES.map((q) => (
        <button
          key={q}
          type="button"
          className={cn(
            "ease-chrome shrink-0 whitespace-nowrap text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40",
            tone === "band"
              ? "text-primary-foreground/75 hover:text-primary-foreground"
              : "text-muted-foreground hover:text-foreground",
          )}
        >
          {q}
        </button>
      ))}
    </div>
  )
}

/** แถบวิ่งการ์ดขยับแรง — โครงเดียวกับของจริง (สองชุดวิ่งต่อกัน ชุดหลัง aria-hidden) */
function ProtoMarquee() {
  const items = MOVERS.map((mover) => {
    const up = mover.change > 0
    const Arrow = up ? ArrowUp : ArrowDown
    return (
      <button
        key={mover.code}
        type="button"
        className="ease-chrome flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full px-2 py-0.5 transition-colors hover:bg-muted/60"
      >
        <span className="relative h-5 w-[14px] shrink-0 overflow-hidden rounded-[2px] bg-muted ring-1 ring-border/50">
          <Image
            src={mover.img}
            alt=""
            fill
            sizes="14px"
            loading="eager"
            className="select-none object-cover"
          />
        </span>
        <span className="text-xs font-medium text-foreground">{mover.name}</span>
        <span className="text-meta">{mover.code}</span>
        <span className="text-xs font-semibold tabular-nums text-foreground">
          {mover.price}
        </span>
        <span
          className={cn(
            "inline-flex items-center gap-0.5 font-price text-xs font-semibold tabular-nums",
            up ? "text-price-up" : "text-price-down",
          )}
        >
          <Arrow className="size-3" aria-hidden />
          {up ? "+" : ""}
          {mover.change.toFixed(1)}%
        </span>
      </button>
    )
  })

  return (
    <div aria-label="การ์ดขยับแรง 24 ชม." className="ticker-viewport min-w-0 flex-1">
      <div className="animate-ticker flex w-max items-center">
        <div className="flex items-center gap-1">{items}</div>
        <div className="flex items-center gap-1" aria-hidden>
          {items}
        </div>
      </div>
    </div>
  )
}

/** แถบชีพจรตลาดตามของจริง (h-8): สถิตินิ่งซ้าย · การ์ดขยับแรงวิ่งขวา */
function PulseStrip({ edge = "bottom" }: { edge?: "top" | "bottom" }) {
  return (
    <div
      className={cn(
        "flex h-8 items-center gap-4 overflow-hidden px-8",
        edge === "top" ? "hairline-t" : "hairline-b",
      )}
    >
      <StatText label="การ์ดทั้งหมด" value={STATS.cards} />
      <StatText label="ชุด" value={STATS.sets} />
      <StatText label="มูลค่ารวม" value={STATS.value} link />
      <StatText label="JPY/THB" value={STATS.rate} />
      <span className="shrink-0 whitespace-nowrap text-meta">
        อัปเดตล่าสุด {STATS.updated}
      </span>
      <ProtoMarquee />
    </div>
  )
}

/* --------------------------------------------------------------- navbars */

/** จำลองแบบ C ที่ขึ้นเว็บอยู่ (สถานะบนสุดของหน้า ยังไม่ scroll) — ตัวตั้งเทียบ */
function CurrentNavbar() {
  return (
    <div>
      <PulseStrip />
      <div className="flex h-11 items-center gap-3 px-8">
        <BrandMark />
        <CatalogControl />
        <div className="min-w-0 flex-1" />
        <div className="flex shrink-0 items-center gap-2">
          <UpgradeButton />
          <GhostIcon icon={MessageCircle} label="ข้อความ" />
          <GhostIcon icon={Bell} label="การแจ้งเตือน" dot />
          <ProfileCapsule />
        </div>
      </div>
      <div className="flex h-14 items-center gap-3 px-8">
        <NavCluster />
        <div className="min-w-0 flex-1" />
        <MyStuffCluster />
        <SearchField className="h-10 w-80" />
      </div>
    </div>
  )
}

/** แบบ S — Shopee: แถบสีแบรนด์ทั้งแผง · utility บาง · ค้นหาพระเอก · คำค้นฮิต */
function BandNavbar() {
  return (
    <div className="bg-primary text-primary-foreground">
      <div className="flex h-8 items-center gap-4 overflow-hidden border-b border-primary-foreground/15 px-8">
        <StatText tone="band" label="การ์ดทั้งหมด" value={STATS.cards} />
        <StatText tone="band" label="ชุด" value={STATS.sets} />
        <StatText tone="band" label="มูลค่ารวม" value={STATS.value} link />
        <StatText tone="band" label="JPY/THB" value={STATS.rate} />
        <span className="shrink-0 whitespace-nowrap text-[11px] text-primary-foreground/60">
          อัปเดตล่าสุด {STATS.updated}
        </span>
        <div className="min-w-0 flex-1" />
        <div className="flex shrink-0 items-center gap-1">
          <UpgradeButton tone="band" bare />
          <LangPill tone="band" />
          <GhostIcon tone="band" size="sm" icon={MessageCircle} label="ข้อความ" />
          <GhostIcon tone="band" size="sm" icon={Bell} label="การแจ้งเตือน" dot />
          <ProfileCapsule tone="band" compact />
        </div>
      </div>
      <div className="flex h-16 items-center gap-4 px-8">
        <BrandMark tone="band" />
        <CatalogControl tone="band" />
        <div className="flex min-w-0 flex-1 justify-center px-6">
          <HeroSearch tone="band" className="max-w-2xl" />
        </div>
        <MyStuffCluster tone="band" />
      </div>
      <div className="flex h-7 items-center gap-5 overflow-hidden px-8 pb-1">
        <nav className="flex shrink-0 items-center gap-4" aria-label="เมนูหลัก">
          <TextLink tone="band" label="หน้าแรก" active />
          <TextLink tone="band" label="ชุดการ์ด" />
          <TextLink tone="band" label="เด็คและเครื่องมือ" />
          <TextLink tone="band" label="ซื้อขาย" />
        </nav>
        <div className="min-w-0 flex-1" />
        <KeywordRail tone="band" />
      </div>
    </div>
  )
}

/** แบบ L — Lazada: โครงเดียวกับ S แต่พื้นเดิม + แถบชีพจรครบย้ายลงล่าง */
function NeutralNavbar() {
  return (
    <div>
      <div className="hairline-b flex h-8 items-center gap-4 overflow-hidden px-8">
        <nav className="flex shrink-0 items-center gap-4" aria-label="เมนูหลัก">
          <TextLink size="xs" label="หน้าแรก" active />
          <TextLink size="xs" label="ชุดการ์ด" />
          <TextLink size="xs" label="เด็คและเครื่องมือ" />
          <TextLink size="xs" label="ซื้อขาย" />
        </nav>
        <div className="min-w-0 flex-1" />
        <div className="flex shrink-0 items-center gap-1">
          <UpgradeButton bare />
          <LangPill />
          <GhostIcon size="sm" icon={MessageCircle} label="ข้อความ" />
          <GhostIcon size="sm" icon={Bell} label="การแจ้งเตือน" dot />
          <ProfileCapsule compact />
        </div>
      </div>
      <div className="flex h-16 items-center gap-4 px-8">
        <BrandMark />
        <CatalogControl />
        <div className="flex min-w-0 flex-1 justify-center px-6">
          <HeroSearch className="max-w-2xl" />
        </div>
        <MyStuffCluster />
      </div>
      <PulseStrip edge="top" />
    </div>
  )
}

/** แบบ H — hybrid: แถบชีพจรเดิมอยู่ครบ · สองแถวล่างยุบเหลือแถวเดียว + แถวคำค้นบาง */
function HybridNavbar() {
  return (
    <div>
      <PulseStrip />
      <div className="flex h-16 items-center gap-4 px-8">
        <BrandMark />
        <CatalogControl />
        <div className="flex min-w-0 flex-1 justify-center px-6">
          <HeroSearch className="max-w-xl" />
        </div>
        <div className="flex shrink-0 items-center gap-1">
          <GhostIcon icon={Briefcase} label="พอร์ต" />
          <GhostIcon icon={Heart} label="รายการโปรด" iconClassName="text-primary" />
          <button
            type="button"
            aria-label="Honey — มี 20 แต้ม"
            className="ease-chrome relative flex h-9 shrink-0 items-center gap-1 rounded-full px-2.5 text-sm font-medium transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40"
          >
            <span className="absolute -right-1 -top-1 flex size-2" aria-hidden>
              <span className="absolute inline-flex size-full animate-ping rounded-full bg-danger opacity-75" />
              <span className="relative inline-flex size-2 rounded-full bg-danger" />
            </span>
            <span className="text-sm leading-none" aria-hidden>
              🍯
            </span>
            <span className="font-bold tabular-nums text-amber-600 dark:text-amber-400">
              20
            </span>
          </button>
          <UpgradeButton />
          <GhostIcon icon={MessageCircle} label="ข้อความ" />
          <GhostIcon icon={Bell} label="การแจ้งเตือน" dot />
          <ProfileCapsule />
        </div>
      </div>
      <div className="flex h-7 items-center gap-5 overflow-hidden px-8 pb-1">
        <nav className="flex shrink-0 items-center gap-4" aria-label="เมนูหลัก">
          <TextLink label="หน้าแรก" active />
          <TextLink label="ชุดการ์ด" />
          <TextLink label="เด็คและเครื่องมือ" />
          <TextLink label="ซื้อขาย" />
        </nav>
        <div className="min-w-0 flex-1" />
        <KeywordRail />
      </div>
    </div>
  )
}

/* ------------------------------------------------------------- page fold */

const FOLD_ROWS = [
  { name: "Monkey.D.Luffy", code: "OP13-118 · P-SEC", price: "268,800 ฿", change: -8.3 },
  { name: "Buggy (Parallel)", code: "OP15-092 · SR", price: "4,250 ฿", change: 48.5 },
  { name: "Roronoa Zoro", code: "OP01-001 · L", price: "1,150 ฿", change: -20.8 },
] as const

/** เนื้อหน้าแรกจริงย่อส่วน — ให้เห็นแถบเมนูวางบนบริบทจริง ไม่ใช่ลอยเดี่ยวๆ */
function HomeFold() {
  return (
    <div className="px-8 pb-10 pt-9">
      <h3 className="text-h2">ราคาการ์ดวันพีชวันนี้ — เช็คทุกใบ ทุกเกรด</h3>
      <p className="mt-1.5 max-w-3xl text-body-sm text-muted-foreground">
        Meecard ติดตามราคากลาง Raw และ PSA 10 ของ One Piece Card Game (OPTCG)
        ครบ 3,838 ใบ จาก 51 ชุด อ้างอิงตลาดญี่ปุ่น · อัปเดตล่าสุด 5 เมษายน 2569
      </p>
      <div className="mt-5 divide-y divide-border/60">
        {FOLD_ROWS.map((row) => {
          const up = row.change > 0
          const Arrow = up ? ArrowUp : ArrowDown
          return (
            <div key={row.code} className="flex min-h-14 items-center gap-3 py-2">
              <span className="hairline flex h-9 w-7 shrink-0 items-center justify-center rounded bg-card text-micro text-muted-foreground">
                {row.code.split("-")[0]}
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-body-sm font-medium">{row.name}</p>
                <p className="truncate text-meta">{row.code}</p>
              </div>
              <div className="text-right">
                <p className="font-price text-sm font-semibold tabular-nums">
                  {row.price}
                </p>
                <p
                  className={cn(
                    "inline-flex items-center gap-0.5 font-price text-xs tabular-nums",
                    up ? "text-price-up" : "text-price-down",
                  )}
                >
                  <Arrow className="size-3" aria-hidden />
                  {up ? "+" : ""}
                  {row.change.toFixed(1)}%
                </p>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

/* ------------------------------------------------------------ page shell */

const subscribeNever = () => () => {}

const NAVBARS: Record<Variant, () => React.ReactNode> = {
  current: CurrentNavbar,
  band: BandNavbar,
  neutral: NeutralNavbar,
  hybrid: HybridNavbar,
}

export default function NavbarEcomPrototypePage() {
  const [variant, setVariant] = useState<Variant>("band")
  // Flip the real site theme (next-themes) so the whole page — frame included —
  // previews light/dark; a frame-scoped class can't force light under a dark root.
  const { resolvedTheme, setTheme } = useTheme()
  // resolvedTheme is undefined on the server — gate on hydration (same pattern
  // as app/search/until-hydrated.tsx) so SSR and first client render agree.
  const mounted = useSyncExternalStore(
    subscribeNever,
    () => true,
    () => false,
  )
  const isDark = mounted && resolvedTheme === "dark"
  const copy = VARIANT_COPY[variant]
  const Navbar = NAVBARS[variant]
  const shortLabel = VARIANT_OPTIONS.find((o) => o.value === variant)!.label

  return (
    <main className="min-h-screen bg-background px-4 py-8 text-foreground sm:px-6 lg:px-10">
      <div className="mx-auto max-w-[1440px]">
        <h1 className="text-h1">แถบเมนูแนวใหม่ — แรงบันดาลใจ Shopee/Lazada</h1>
        <p className="mt-2 max-w-3xl text-body text-muted-foreground">
          ข้อมูลและปุ่มทุกชิ้นของ navbar ปัจจุบันยังอยู่ครบ แต่จัดผังใหม่ตามสูตร
          อีคอมเมิร์ซ: ช่องค้นหาใหญ่เป็นพระเอกกลางจอ · ของประจำบัญชีขึ้นแถบบางบนสุด ·
          คำค้นยอดนิยมใต้ช่องค้นหา — สลับดู 3 แบบเทียบกับของปัจจุบันได้เลย
        </p>

        <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
          <div className="overflow-x-auto pb-1">
            <SegmentedControl
              options={VARIANT_OPTIONS}
              value={variant}
              onChange={setVariant}
              ariaLabel="เลือกแบบแถบเมนู"
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
            {isDark ? (
              <Sun className="size-[18px]" aria-hidden />
            ) : (
              <Moon className="size-[18px]" aria-hidden />
            )}
          </IconButton>
        </div>

        <section
          aria-label="ตัวอย่างแถบเมนูบนจอ desktop"
          className="mt-4 overflow-x-auto rounded-2xl shadow-[0_18px_60px_rgba(28,20,12,0.14)] ring-1 ring-border"
        >
          <div className="min-w-[1360px] bg-background text-foreground">
            <Navbar />
            <HomeFold />
          </div>
        </section>
        <p className="mt-3 text-meta">
          ทุกแบบเป็นจอ desktop (≥1024px) สถานะบนสุดของหน้า ยังไม่ scroll ·
          ตัวเลขคือชุดเดียวกับจอจริงของเบส · มือถือใช้แถบเดิม ไม่ถูกแตะรอบนี้
        </p>

        <section className="mt-8 grid gap-6 md:grid-cols-[minmax(0,1fr)_300px]">
          <div className="border-l-2 border-primary pl-4">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-h3">{copy.name}</h2>
              {variant === "band" && (
                <span className="rounded-full bg-primary/15 px-2 py-1 text-micro text-primary">
                  แบบเสนอหลัก
                </span>
              )}
            </div>
            <p className="mt-1.5 max-w-2xl text-body-sm">{copy.summary}</p>
            {copy.tradeoff !== "—" && (
              <p className="mt-1 max-w-2xl text-meta">ข้อแลก: {copy.tradeoff}</p>
            )}
          </div>
          <div className="space-y-2 text-body-sm text-muted-foreground">
            <p className="font-medium text-foreground">ทุกแบบเหมือนกัน:</p>
            {SHARED_NOTES.map((note) => (
              <p key={note}>• {note}</p>
            ))}
          </div>
        </section>

        <section className="mt-8">
          <h2 className="text-h4">ของเดิมแต่ละชิ้นไปอยู่ตรงไหน — แบบ {shortLabel}</h2>
          <div className="hairline mt-3 divide-y divide-border/60 rounded-2xl bg-card px-4">
            {PLACEMENTS[variant].map(({ item, where }) => (
              <div
                key={item}
                className="grid grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)] items-baseline gap-4 py-2.5"
              >
                <span className="text-body-sm font-medium">{item}</span>
                <span className="text-body-sm text-muted-foreground">{where}</span>
              </div>
            ))}
          </div>
        </section>
      </div>
    </main>
  )
}
