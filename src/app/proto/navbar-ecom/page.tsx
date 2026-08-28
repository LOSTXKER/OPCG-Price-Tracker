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
  LayoutGrid,
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

type Variant = "current" | "scoped" | "sets" | "twoRow"

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

/** ชุดล่าสุดของจริงจาก src/lib/constants/sets.ts — ทางลัดแทนแถบหมวดหมู่ของ Lazada */
const RECENT_SETS: ReadonlyArray<{ code: string; name: string; fresh?: boolean }> = [
  { code: "OP15", name: "Adventure on KAMI's Island", fresh: true },
  { code: "OP14", name: "The Azure Sea's Seven" },
  { code: "OP13", name: "Carrying on His Will" },
  { code: "EB04", name: "EGGHEAD CRISIS" },
  { code: "ST26", name: "Purple/Black Monkey.D.Luffy" },
  { code: "PRB02", name: "ONE PIECE CARD THE BEST vol.2" },
  { code: "OP12", name: "Legacy of the Master" },
  { code: "EB03", name: "ONE PIECE Heroines Edition" },
]

const VARIANT_OPTIONS = [
  { value: "current", label: "ปัจจุบัน" },
  { value: "scoped", label: "1 · ค้นหาครองแถว" },
  { value: "sets", label: "2 · แถบชุดการ์ด" },
  { value: "twoRow", label: "3 · สองแถวจบ" },
] as const

const VARIANT_COPY: Record<
  Variant,
  { name: string; summary: string; tradeoff: string }
> = {
  current: {
    name: "ปัจจุบัน — แบบ C ที่ขึ้นเว็บอยู่",
    summary:
      "ตัวตั้งเทียบ: แถบชีพจร · แถวโลโก้ · แถวเมนูที่มีช่องค้นหาซุกอยู่ขวาสุด — สลับไปมาเพื่อดูว่าแบบใหม่เปลี่ยนความรู้สึกแค่ไหน",
    tradeoff: "—",
  },
  scoped: {
    name: "1 · ค้นหาครองแถว — ตัวเลือกชุดเข้าไปอยู่ในช่องค้นหา",
    summary:
      "ยืมท่าของ Lazada/Amazon: ตัวเลือกเกม›ชุดไม่ใช่ปุ่มลอยข้างโลโก้อีกต่อไป แต่กลายเป็นหัวช่องค้นหา — พอรวมเป็นก้อนเดียว ช่องค้นหาเลยยืดได้เต็มแถวโดยไม่แย่งที่ใคร และสื่อความหมายใหม่ว่า \"ค้นเฉพาะในชุดที่เลือกอยู่\" แถวล่างเหลือแค่เมนูกับของบัญชี ทำให้บางลงได้",
    tradeoff:
      "ปุ่มเลือกชุดกลืนไปกับช่องค้นหา คนที่คุ้นกับปุ่มเดิมข้างโลโก้อาจหาไม่เจอในครั้งแรก · แถวล่าง 36px เตี้ยลงจากเดิม 20px ปุ่มเมนูเลยเล็กลงตาม · สูงรวม 132px เท่าเดิมเป๊ะ (ไม่ต้องแก้ระยะเลื่อนของทั้งเว็บ)",
  },
  sets: {
    name: "2 · แถบชุดการ์ด — แถวล่างกลายเป็นชั้นวางชุด",
    summary:
      "Shopee/Lazada มีแถบหมวดหมู่สินค้าใต้ช่องค้นหา ของเราหมวดหมู่จริงคือ \"ชุดการ์ด\" — เพราะคนเล่นเช็คราคาโดยเลือกชุดก่อนเสมอ แบบนี้เลยเอาชุดล่าสุด 8 ชุดมาเรียงเป็นทางลัดกดเดียวถึง (ชุดใหม่สุดมีป้ายกำกับ) แทนที่จะต้องกดปุ่มเลือกชุดแล้วค่อยหาในรายการ",
    tradeoff:
      "เมนูหลัก 4 ลิงก์ต้องขึ้นไปอยู่แถวกลางแทน ทำให้แถวกลางมีของเยอะสุดในสามแบบ · ทางลัดชุดโชว์ได้แค่ 8 ชุดจาก 51 ชุด ต้องมีปุ่ม \"ทุกชุด\" คู่เสมอ · สูงรวม 132px เท่าเดิม",
  },
  twoRow: {
    name: "3 · สองแถวจบ — คืนพื้นที่ให้เนื้อหา 36px",
    summary:
      "ตัดให้เหลือน้อยที่สุดที่ยังครบ: แถบชีพจรบนสุด แล้วทุกอย่างที่เหลือยัดลงแถวเดียว โลโก้ · เมนู · ช่องค้นหาที่ยืดเต็มช่องว่างตรงกลาง · ของประจำตัวย่อเป็นไอคอน · บัญชี — เตี้ยลงจากของจริง 36px ซึ่งบนจอโน้ตบุ๊กคือได้เห็นราคาการ์ดเพิ่มอีกแถวครึ่งทันทีที่เปิดหน้า",
    tradeoff:
      "แน่นที่สุด ทุกอย่างเบียดกันในแถวเดียว · พอร์ต/รายการโปรดเหลือแค่ไอคอนไม่มีป้ายชื่อ · ถ้าเปิดเมนูซื้อขายหรือเพิ่มลิงก์อีกอันในอนาคตจะเริ่มไม่พอที่ · สูงรวม 96px",
  },
}

const SHARED_NOTES = [
  "ทั้งสามแบบใหม่อยู่บนพื้นสีเดิมของเว็บ ไม่ทาสีแบรนด์ทับ และแถบชีพจรพร้อมสายพานการ์ดขยับแรงอยู่ครบเหมือนเดิมทุกแบบ",
  "เอาแถวคำค้นยอดนิยมออกหมดแล้วตามที่เบสสั่ง",
  "ช่องค้นหาโตขึ้น 2–3 เท่าและย้ายมาอยู่กลางแถว แทนที่จะซุกอยู่ขวาสุดแบบตอนนี้",
  "ของครบทุกชิ้นจากแถบเดิม — ตารางท้ายหน้าไล่ให้ดูทีละชิ้นว่าแบบที่เลือกอยู่เอาไปวางตรงไหน",
  "ปุ่มทุกปุ่มในตัวอย่างกดไม่ได้จริง (หุ่นโชว์ผัง) · ตัวเลขชุดเดียวกับจอจริงของเบส (28 ส.ค.)",
] as const

/** ตารางพิสูจน์ "ไม่มีอะไรหายเงียบ" — ของ 15 ชิ้นจากแถบจริง ลงตรงไหนในแต่ละแบบ */
const PLACEMENTS: Record<Variant, ReadonlyArray<{ item: string; where: string }>> = {
  current: [
    { item: "สถิติตลาด (การ์ด · ชุด · มูลค่ารวม · JPY/THB · อัปเดต)", where: "แถบชีพจรบนสุด ฝั่งซ้าย" },
    { item: "สายพานการ์ดขยับแรง", where: "แถบชีพจรบนสุด ครึ่งขวา" },
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
  scoped: [
    { item: "สถิติตลาด", where: "แถบชีพจรบนสุด — เหมือนเดิมทุกอย่าง" },
    { item: "สายพานการ์ดขยับแรง", where: "แถบชีพจรบนสุด — เหมือนเดิมทุกอย่าง" },
    { item: "โลโก้ Meecard", where: "แถวพระเอก ซ้ายสุด" },
    { item: "ตัวเลือกเกม › ชุด", where: "🔁 กลายเป็นหัวช่องค้นหา (ซ้ายในกรอบเดียวกัน)" },
    { item: "ปุ่มอัปเกรด", where: "แถวล่าง ฝั่งขวา" },
    { item: "ข้อความ", where: "แถวล่าง ฝั่งขวา" },
    { item: "การแจ้งเตือน", where: "แถวล่าง ฝั่งขวา" },
    { item: "โปรไฟล์", where: "แถวล่าง ขวาสุด" },
    { item: "ฝั่งยังไม่ล็อกอิน", where: "ตำแหน่งเดียวกับโปรไฟล์ บนแถวล่าง" },
    { item: "เมนูหลัก", where: "แถวล่าง ฝั่งซ้าย (ตัวหนังสือ ไม่ใช่แคปซูล)" },
    { item: "พอร์ต", where: "แถวพระเอก ฝั่งขวา" },
    { item: "รายการโปรด", where: "แถวพระเอก ฝั่งขวา" },
    { item: "Honey + แต้ม", where: "แถวพระเอก ฝั่งขวา" },
    { item: "ช่องค้นหา", where: "แถวพระเอก ยืดเต็มกลางแถว มีตัวเลือกชุดเป็นหัว" },
    { item: "ภาษา · สกุลเงิน · ธีม", where: "ภาษาขึ้นแถวล่างตรงๆ · สกุลเงิน/ธีมยังอยู่ในเมนูโปรไฟล์" },
  ],
  sets: [
    { item: "สถิติตลาด", where: "แถบชีพจรบนสุด — เหมือนเดิมทุกอย่าง" },
    { item: "สายพานการ์ดขยับแรง", where: "แถบชีพจรบนสุด — เหมือนเดิมทุกอย่าง" },
    { item: "โลโก้ Meecard", where: "แถวพระเอก ซ้ายสุด" },
    { item: "ตัวเลือกเกม › ชุด", where: "🔁 แตกเป็นปุ่มเกมบนแถวพระเอก + ปุ่ม \"ทุกชุด\" นำแถบชุดล่าง" },
    { item: "ปุ่มอัปเกรด", where: "แถวพระเอก ฝั่งขวา" },
    { item: "ข้อความ", where: "แถวพระเอก ฝั่งขวา" },
    { item: "การแจ้งเตือน", where: "แถวพระเอก ฝั่งขวา" },
    { item: "โปรไฟล์", where: "แถวพระเอก ขวาสุด" },
    { item: "ฝั่งยังไม่ล็อกอิน", where: "ตำแหน่งเดียวกับโปรไฟล์" },
    { item: "เมนูหลัก", where: "แถวพระเอก ถัดจากโลโก้ (ตัวหนังสือเล็ก)" },
    { item: "พอร์ต", where: "แถวพระเอก ฝั่งขวา (ย่อเหลือไอคอน)" },
    { item: "รายการโปรด", where: "แถวพระเอก ฝั่งขวา (ย่อเหลือไอคอน)" },
    { item: "Honey + แต้ม", where: "แถวพระเอก ฝั่งขวา (🍯 + เลขแต้ม)" },
    { item: "ช่องค้นหา", where: "แถวพระเอก กลางแถว" },
    { item: "ภาษา · สกุลเงิน · ธีม", where: "ซ่อนในเมนูโปรไฟล์ (เหมือนเดิม)" },
  ],
  twoRow: [
    { item: "สถิติตลาด", where: "แถบชีพจรบนสุด — เหมือนเดิมทุกอย่าง" },
    { item: "สายพานการ์ดขยับแรง", where: "แถบชีพจรบนสุด — เหมือนเดิมทุกอย่าง" },
    { item: "โลโก้ Meecard", where: "แถวเดียว ซ้ายสุด (เหลือรูป ไม่มีตัวหนังสือ)" },
    { item: "ตัวเลือกเกม › ชุด", where: "แถวเดียว ถัดจากโลโก้ (ย่อเหลือปุ่มชุดปุ่มเดียว)" },
    { item: "ปุ่มอัปเกรด", where: "แถวเดียว ฝั่งขวา (ย่อเหลือไอคอน)" },
    { item: "ข้อความ", where: "แถวเดียว ฝั่งขวา" },
    { item: "การแจ้งเตือน", where: "แถวเดียว ฝั่งขวา" },
    { item: "โปรไฟล์", where: "แถวเดียว ขวาสุด" },
    { item: "ฝั่งยังไม่ล็อกอิน", where: "ตำแหน่งเดียวกับโปรไฟล์" },
    { item: "เมนูหลัก", where: "แถวเดียว ถัดจากตัวเลือกชุด" },
    { item: "พอร์ต", where: "แถวเดียว ฝั่งขวา (ย่อเหลือไอคอน)" },
    { item: "รายการโปรด", where: "แถวเดียว ฝั่งขวา (ย่อเหลือไอคอน)" },
    { item: "Honey + แต้ม", where: "แถวเดียว ฝั่งขวา (🍯 + เลขแต้ม)" },
    { item: "ช่องค้นหา", where: "แถวเดียว ยืดเต็มช่องว่างตรงกลาง" },
    { item: "ภาษา · สกุลเงิน · ธีม", where: "ซ่อนในเมนูโปรไฟล์ (เหมือนเดิม)" },
  ],
}

/* ----------------------------------------------------------------- atoms */

function BrandMark({ wordmark = true }: { wordmark?: boolean }) {
  return (
    <span className="flex h-8 shrink-0 items-center gap-2 pr-1">
      <Image
        src="/meecard.png"
        alt="Meecard"
        width={754}
        height={694}
        className="h-auto w-6 shrink-0 select-none"
      />
      {wordmark && (
        <span className="text-sm font-bold tracking-tight text-foreground">
          Meecard
        </span>
      )}
    </span>
  )
}

/** ป้ายจาง + ตัวเลขเข้ม — สถิติแบบ "ตัวหนังสือเปล่า" บนแถบชีพจร */
function StatText({
  label,
  value,
  link = false,
}: {
  label: string
  value: string
  link?: boolean
}) {
  const body = (
    <>
      <span className="text-meta">{label}</span>
      <span
        className={cn(
          "text-xs font-semibold tabular-nums text-foreground",
          link && "ease-chrome transition-colors group-hover:text-primary",
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
  size = "md",
  iconClassName,
}: {
  icon: typeof Bell
  label: string
  dot?: boolean
  size?: "sm" | "md"
  iconClassName?: string
}) {
  return (
    <button
      type="button"
      aria-label={label}
      className={cn(
        "ease-chrome relative grid shrink-0 place-items-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40",
        size === "sm" ? "size-7" : "size-9",
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

function ProfileCapsule({ compact = false }: { compact?: boolean }) {
  return (
    <button
      type="button"
      aria-label="เปิดเมนูโปรไฟล์และการตั้งค่า"
      className={cn(
        "hairline ease-chrome flex shrink-0 items-center gap-1.5 rounded-full pl-2 pr-1 transition-colors hover:bg-muted/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40",
        compact ? "h-7" : "h-8",
      )}
    >
      <Menu className="size-4 shrink-0 text-muted-foreground" aria-hidden />
      <span
        className={cn(
          "grid shrink-0 place-items-center rounded-full bg-primary/10 font-bold text-primary ring-2 ring-primary/25",
          compact ? "size-5 text-[9px]" : "size-6 text-[10px]",
        )}
      >
        T
      </span>
    </button>
  )
}

/** ปุ่มภาษา — ของที่เดิมซ่อนอยู่ในเมนูโปรไฟล์ ยกขึ้นมาโชว์บนแถวบัญชี */
function LangPill() {
  return (
    <button
      type="button"
      aria-label="เปลี่ยนภาษา"
      className="ease-chrome flex h-7 shrink-0 items-center gap-1 rounded-full px-2 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40"
    >
      <Globe className="size-3.5" aria-hidden />
      ไทย
      <ChevronDown className="size-3" aria-hidden />
    </button>
  )
}

function UpgradeButton({
  variant = "outline",
}: {
  /** outline = ปุ่มมีกรอบ · bare = ตัวหนังสือเล็ก · icon = ไอคอนล้วน */
  variant?: "outline" | "bare" | "icon"
}) {
  if (variant === "icon") {
    return (
      <button
        type="button"
        aria-label="อัปเกรดแพ็กเกจ"
        className="ease-chrome grid size-9 shrink-0 place-items-center rounded-full text-primary transition-colors hover:bg-primary/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40"
      >
        <Zap className="size-4" aria-hidden />
      </button>
    )
  }
  if (variant === "bare") {
    return (
      <button
        type="button"
        className="ease-chrome flex h-7 shrink-0 items-center gap-1 rounded-full px-2 text-xs font-semibold text-primary transition-colors hover:bg-primary/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40"
      >
        <Zap className="size-3" aria-hidden />
        อัปเกรด
      </button>
    )
  }
  return (
    <button
      type="button"
      className="ease-chrome flex h-8 shrink-0 items-center gap-1 rounded-full border border-primary/30 px-2.5 text-sm font-semibold text-primary transition-colors hover:bg-primary/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40"
    >
      <Zap className="size-3" aria-hidden />
      อัปเกรด
    </button>
  )
}

function NavLinkItem({ label, active = false }: { label: string; active?: boolean }) {
  return (
    <button
      type="button"
      aria-current={active ? "page" : undefined}
      className={cn(
        "ease-chrome inline-flex h-9 shrink-0 items-center whitespace-nowrap rounded-full px-3.5 text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40",
        active
          ? "bg-[var(--p-honey-soft)] font-semibold text-primary"
          : "font-medium text-muted-foreground hover:text-foreground",
      )}
    >
      {label}
    </button>
  )
}

function NavCluster() {
  return (
    <nav className="flex shrink-0 items-center gap-0.5" aria-label="เมนูหลัก">
      <NavLinkItem label="หน้าแรก" active />
      <NavLinkItem label="ชุดการ์ด" />
      <NavLinkItem label="เด็คและเครื่องมือ" />
      <NavLinkItem label="ซื้อขาย" />
    </nav>
  )
}

/** ลิงก์ตัวหนังสือเปล่าสำหรับแถวบางๆ */
function TextLink({
  label,
  active = false,
  size = "sm",
}: {
  label: string
  active?: boolean
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
          ? "font-semibold text-primary"
          : "font-medium text-muted-foreground hover:text-foreground",
      )}
    >
      {label}
    </button>
  )
}

function TextNavCluster({ size = "sm" }: { size?: "sm" | "xs" }) {
  return (
    <nav className="flex shrink-0 items-center gap-4" aria-label="เมนูหลัก">
      <TextLink size={size} label="หน้าแรก" active />
      <TextLink size={size} label="ชุดการ์ด" />
      <TextLink size={size} label="เด็คและเครื่องมือ" />
      <TextLink size={size} label="ซื้อขาย" />
    </nav>
  )
}

function MyStuffLink({
  icon,
  label,
  trailing,
  ping = false,
}: {
  icon: React.ReactNode
  label: string
  trailing?: React.ReactNode
  ping?: boolean
}) {
  return (
    <button
      type="button"
      className="ease-chrome relative flex h-9 shrink-0 items-center gap-1.5 rounded-full px-3 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40"
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

/** 🍯 + แต้ม — ใช้ได้ทั้งแบบมีป้ายชื่อและแบบย่อ */
function HoneyButton({ compact = false }: { compact?: boolean }) {
  return (
    <button
      type="button"
      aria-label="Honey — มี 20 แต้ม"
      className={cn(
        "ease-chrome relative flex h-9 shrink-0 items-center gap-1 rounded-full text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40",
        compact ? "px-2.5" : "px-3",
      )}
    >
      <span className="absolute -right-1 -top-1 flex size-2" aria-hidden>
        <span className="absolute inline-flex size-full animate-ping rounded-full bg-danger opacity-75" />
        <span className="relative inline-flex size-2 rounded-full bg-danger" />
      </span>
      <span className="text-sm leading-none" aria-hidden>
        🍯
      </span>
      {!compact && <span>Honey</span>}
      <span className="font-bold tabular-nums text-amber-600 dark:text-amber-400">
        20
      </span>
    </button>
  )
}

function MyStuffCluster() {
  return (
    <div className="flex shrink-0 items-center gap-1.5">
      <MyStuffLink
        icon={<Briefcase className="size-3.5 text-muted-foreground/60" aria-hidden />}
        label="พอร์ต"
      />
      <MyStuffLink
        icon={<Heart className="size-3.5 text-primary" aria-hidden />}
        label="รายการโปรด"
      />
      <HoneyButton />
    </div>
  )
}

/** ของประจำตัวแบบย่อ — ไอคอนล้วน สำหรับแถวที่มีของแน่น */
function MyStuffIcons() {
  return (
    <div className="flex shrink-0 items-center gap-0.5">
      <GhostIcon icon={Briefcase} label="พอร์ต" />
      <GhostIcon icon={Heart} label="รายการโปรด" iconClassName="text-primary" />
      <HoneyButton compact />
    </div>
  )
}

function AccountIcons({ compact = false }: { compact?: boolean }) {
  return (
    <div className="flex shrink-0 items-center gap-0.5">
      <GhostIcon size={compact ? "sm" : "md"} icon={MessageCircle} label="ข้อความ" />
      <GhostIcon size={compact ? "sm" : "md"} icon={Bell} label="การแจ้งเตือน" dot />
      <ProfileCapsule compact={compact} />
    </div>
  )
}

function GamePill() {
  return (
    <button
      type="button"
      aria-label="เลือกแคตตาล็อกเกม: One Piece Card Game"
      className="surface-2 ease-chrome flex h-8 shrink-0 items-center gap-1.5 rounded-full px-3 text-xs font-semibold text-foreground ring-1 ring-hair transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40"
    >
      <GameCrest game={{ slug: "opcg" }} size={18} variant="selector" decorative />
      OPCG
      <ChevronDown className="size-3 text-muted-foreground" aria-hidden />
    </button>
  )
}

function SetTrigger({ className }: { className?: string }) {
  return (
    <button
      type="button"
      aria-label="เลือกชุดการ์ด"
      className={cn(
        "surface-2 hairline ease-chrome flex h-8 w-48 items-center gap-1.5 rounded-full px-2.5 text-label text-foreground transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40",
        className,
      )}
    >
      <PackageOpen className="size-3.5 shrink-0 text-muted-foreground" aria-hidden />
      <span className="min-w-0 flex-1 truncate text-left">เลือกชุดการ์ด</span>
      <ChevronDown className="size-3.5 shrink-0 text-muted-foreground" aria-hidden />
    </button>
  )
}

function CatalogControl() {
  return (
    <div className="flex shrink-0 items-center">
      <GamePill />
      <ChevronRight className="mx-1 size-3 shrink-0 text-muted-foreground/60" aria-hidden />
      <SetTrigger />
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

/** ช่องค้นหาพระเอก — แคปซูลใหญ่ + ปุ่มค้นหาสีเต็มฝังขวา (สูตร Shopee/Lazada) */
function HeroSearch({
  scope = false,
  className,
}: {
  /** scope = มีตัวเลือกเกม›ชุดฝังเป็นหัวช่องค้นหา (ท่า Lazada/Amazon) */
  scope?: boolean
  className?: string
}) {
  return (
    <div
      className={cn(
        "hairline ease-chrome group flex h-11 w-full items-center rounded-full bg-card pr-1 transition-colors focus-within:ring-2 focus-within:ring-ring/40 hover:bg-muted/50",
        scope ? "pl-1" : "pl-4",
        className,
      )}
    >
      {scope && (
        <>
          <button
            type="button"
            aria-label="เลือกแคตตาล็อก: OPCG · ทุกชุด"
            className="ease-chrome flex h-9 shrink-0 items-center gap-1.5 rounded-full px-2.5 text-xs font-semibold text-foreground transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40"
          >
            <GameCrest game={{ slug: "opcg" }} size={18} variant="selector" decorative />
            OPCG
            <ChevronRight className="size-3 text-muted-foreground/60" aria-hidden />
            <span className="text-label font-medium text-muted-foreground">ทุกชุด</span>
            <ChevronDown className="size-3.5 text-muted-foreground" aria-hidden />
          </button>
          <span className="mx-1.5 h-5 w-px shrink-0 bg-border" aria-hidden />
        </>
      )}
      <button
        type="button"
        aria-label="ค้นหาการ์ด"
        className="flex min-w-0 flex-1 items-center gap-2 text-left focus-visible:outline-none"
      >
        <span className="min-w-0 flex-1 truncate text-body-sm text-muted-foreground">
          ค้นหาการ์ด ชุด หรือรหัส เช่น OP13-118...
        </span>
        <kbd className="hairline shrink-0 rounded-full bg-background px-1.5 py-0.5 font-sans text-micro text-muted-foreground">
          /
        </kbd>
      </button>
      <span className="ml-2 flex h-9 shrink-0 items-center gap-1.5 rounded-full bg-primary px-5 text-sm font-semibold text-primary-foreground">
        <Search className="size-4" aria-hidden />
        ค้นหา
      </span>
    </div>
  )
}

/** แถบชุดการ์ด — ท่าเดียวกับแถบหมวดหมู่สินค้าของ Lazada แต่หมวดของเราคือ "ชุด" */
function SetRail() {
  return (
    <div className="flex min-w-0 items-center gap-1 overflow-hidden">
      <button
        type="button"
        className="ease-chrome flex h-8 shrink-0 items-center gap-1.5 rounded-full px-2.5 text-sm font-semibold text-foreground transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40"
      >
        <LayoutGrid className="size-3.5 text-muted-foreground" aria-hidden />
        ทุกชุด
        <ChevronDown className="size-3.5 text-muted-foreground" aria-hidden />
      </button>
      <span className="mx-1.5 h-5 w-px shrink-0 bg-border" aria-hidden />
      {RECENT_SETS.map((set) => (
        <button
          key={set.code}
          type="button"
          title={set.code + " · " + set.name}
          className="ease-chrome flex h-8 shrink-0 items-center gap-1.5 rounded-full px-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40"
        >
          {set.code}
          {set.fresh && (
            <span className="rounded-full bg-[var(--p-honey-soft)] px-1.5 py-0.5 text-micro font-semibold text-primary">
              ใหม่
            </span>
          )}
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

/** แถบชีพจรตลาดตามของจริง (h-8) — ทุกแบบใหม่เก็บอันนี้ไว้ครบ ไม่แตะ */
function PulseStrip() {
  return (
    <div className="hairline-b flex h-8 items-center gap-4 overflow-hidden px-8">
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

/** แบบ 1 — ตัวเลือกชุดเข้าไปเป็นหัวช่องค้นหา ช่องค้นหาเลยยืดเต็มแถว */
function ScopedNavbar() {
  return (
    <div>
      <PulseStrip />
      <div className="flex h-16 items-center gap-4 px-8">
        <BrandMark />
        <div className="min-w-0 flex-1">
          <HeroSearch scope />
        </div>
        <MyStuffCluster />
      </div>
      <div className="hairline-t flex h-9 items-center gap-5 px-8">
        <TextNavCluster />
        <div className="min-w-0 flex-1" />
        <div className="flex shrink-0 items-center gap-1">
          <UpgradeButton variant="bare" />
          <LangPill />
          <AccountIcons compact />
        </div>
      </div>
    </div>
  )
}

/** แบบ 2 — แถวล่างกลายเป็นชั้นวางชุดการ์ด (ท่าแถบหมวดหมู่ของ Lazada) */
function SetsNavbar() {
  return (
    <div>
      <PulseStrip />
      <div className="flex h-16 items-center gap-4 px-8">
        <BrandMark />
        <span className="mx-1 h-5 w-px shrink-0 bg-border" aria-hidden />
        <TextNavCluster />
        <div className="flex min-w-0 flex-1 justify-center px-4">
          <HeroSearch className="max-w-xl" />
        </div>
        <MyStuffIcons />
        <UpgradeButton variant="icon" />
        <AccountIcons />
      </div>
      <div className="hairline-t flex h-9 items-center px-8">
        <SetRail />
      </div>
    </div>
  )
}

/** แบบ 3 — ทุกอย่างที่เหลือยัดลงแถวเดียว เตี้ยสุด คืนที่ให้เนื้อหา */
function TwoRowNavbar() {
  return (
    <div>
      <PulseStrip />
      <div className="flex h-16 items-center gap-3 px-8">
        <BrandMark wordmark={false} />
        <SetTrigger className="w-44" />
        <span className="mx-0.5 h-5 w-px shrink-0 bg-border" aria-hidden />
        <TextNavCluster />
        <div className="min-w-0 flex-1 px-2">
          <HeroSearch />
        </div>
        <MyStuffIcons />
        <UpgradeButton variant="icon" />
        <AccountIcons />
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
  scoped: ScopedNavbar,
  sets: SetsNavbar,
  twoRow: TwoRowNavbar,
}

export default function NavbarEcomPrototypePage() {
  const [variant, setVariant] = useState<Variant>("scoped")
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
        <h1 className="text-h1">แถบเมนูแนวใหม่ — รอบสอง</h1>
        <p className="mt-2 max-w-3xl text-body text-muted-foreground">
          รอบนี้ตัดแบบทาสีแบรนด์ทั้งแผงกับแถวคำค้นยอดนิยมออกแล้ว เหลือสามทิศทางที่
          ต่อยอดจากสองแบบที่เบสบอกว่าพอได้ — ทุกแบบอยู่บนพื้นสีเดิม และเก็บแถบชีพจร
          พร้อมสายพานการ์ดขยับแรงไว้ครบเหมือนเดิม ต่างกันที่ว่า &ldquo;แถวล่างของแถบเมนู
          ควรเป็นอะไร&rdquo;
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

        <section className="mt-8 grid gap-6 md:grid-cols-[minmax(0,1fr)_320px]">
          <div className="border-l-2 border-primary pl-4">
            <h2 className="text-h3">{copy.name}</h2>
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
