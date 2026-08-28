"use client"

import Image from "next/image"
import { useTheme } from "next-themes"
import { useRef, useState, useSyncExternalStore } from "react"
import {
  ArrowDown,
  ArrowUp,
  Bell,
  Briefcase,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
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

type Variant = "current" | "railAfterMenu" | "catalogRow" | "gameTabs"

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

/**
 * ชุดจริงจาก src/lib/constants/sets.ts — ใส่ 14 ชุดเพื่อพิสูจน์ว่าแถบรับของเพิ่มได้
 * (ของจริงมี 51 ชุดและจะเพิ่มเรื่อยๆ ทุกไตรมาส)
 */
const SETS = [
  { code: "OP15", name: "Adventure on KAMI's Island", fresh: true },
  { code: "OP14", name: "The Azure Sea's Seven" },
  { code: "OP13", name: "Carrying on His Will" },
  { code: "EB04", name: "EGGHEAD CRISIS" },
  { code: "ST26", name: "Purple/Black Monkey.D.Luffy" },
  { code: "PRB02", name: "ONE PIECE CARD THE BEST vol.2" },
  { code: "OP12", name: "Legacy of the Master" },
  { code: "EB03", name: "ONE PIECE Heroines Edition" },
  { code: "ST25", name: "Blue Buggy" },
  { code: "OP11", name: "A Fist of Divine Speed" },
  { code: "ST24", name: "Green Jewelry Bonney" },
  { code: "OP10", name: "Royal Blood" },
  { code: "ST23", name: "Red Shanks" },
  { code: "PRB01", name: "ONE PIECE CARD THE BEST" },
] as const

/** เกมที่เว็บรองรับ — ปุ่มเลือกเกมต้องไม่หาย เพราะแคตตาล็อกทั้งแถบขึ้นกับมัน */
const GAMES = [
  { slug: "opcg", label: "One Piece", short: "OPCG", active: true },
  { slug: "pokemon", label: "Pokémon", short: "Pokémon", active: false },
] as const

const VARIANT_OPTIONS = [
  { value: "current", label: "ปัจจุบัน" },
  { value: "railAfterMenu", label: "A · เมนูนำ แคตตาล็อกตาม" },
  { value: "catalogRow", label: "B · แถวแคตตาล็อกล้วน" },
  { value: "gameTabs", label: "C · แท็บเกม" },
] as const

const VARIANT_COPY: Record<
  Variant,
  { name: string; summary: string; tradeoff: string }
> = {
  current: {
    name: "ปัจจุบัน — แบบ C ที่ขึ้นเว็บอยู่",
    summary:
      "ตัวตั้งเทียบ: แถบชีพจร · แถวโลโก้ · แถวเมนูที่มีช่องค้นหาซุกอยู่ขวาสุด และชุดการ์ดซ่อนอยู่ใน dropdown",
    tradeoff: "—",
  },
  railAfterMenu: {
    name: "A · เมนูนำ แคตตาล็อกตาม — ใกล้แบบที่เบสชอบที่สุด",
    summary:
      "แถวกลางเหมือนแบบ 2 ที่เบสชอบเป๊ะ (ค้นหากลาง · ของฉัน · บัญชี) แถว 3 แก้สองจุดที่เบสทัก: ปุ่มเลือกเกมกลับมา ยืนนำหน้าชุดให้อ่านเป็นประโยคเดียว \"OPCG › ชุดพวกนี้\" และ ชั้นวางชุดเลื่อนซ้าย-ขวาได้จริง (ปัด/ล้อเมาส์/ปุ่มลูกศร แบบเดียวกับแถบชุดหน้าแรก) เลยไม่ตันที่ 8 ชุดอีกต่อไป — ใส่ 14 ชุดในตัวอย่างให้ลองเลื่อนดู",
    tradeoff:
      "แถว 3 ยังมีของสองประเภทอยู่แถวเดียวกัน (เมนูเว็บ + แคตตาล็อก) ถ้าอนาคตเมนูเพิ่มเป็น 6–7 ลิงก์ ที่ของแคตตาล็อกจะถูกบีบให้แคบลงเรื่อยๆ แม้จะยังเลื่อนได้ก็ตาม",
  },
  catalogRow: {
    name: "B · แถวแคตตาล็อกล้วน — แยกหน้าที่ขาดกัน",
    summary:
      "ตอบข้อกังวลเรื่องปุ่มจะเพิ่มในอนาคตแบบถอนรากถอนโคน: ย้ายเมนูเว็บขึ้นไปแถวกลาง แล้วยกแถว 3 ให้แคตตาล็อกทั้งแถว (เกม › ชุดเลื่อนได้) ปิดท้ายด้วยของฉันชิดขวา — เมนูจะเพิ่มกี่ปุ่มก็ไม่แตะพื้นที่ชุดเลย เพราะอยู่คนละแถว และแต่ละแถวอ่านได้เป็นเรื่องเดียว: แถวกลาง = เว็บ · แถว 3 = ของที่กำลังดูอยู่",
    tradeoff:
      "แถวกลางมีเมนูมาแชร์ที่ ช่องค้นหาเลยแคบกว่าแบบ A ราว 100px · ของฉันย้ายลงไปแถวล่าง ต้องเลื่อนสายตาลงหนึ่งชั้นเพื่อเข้าพอร์ต",
  },
  gameTabs: {
    name: "C · แท็บเกม — เตรียมรับเกมที่สองตั้งแต่วันนี้",
    summary:
      "โครงเดียวกับ B ทุกอย่าง ต่างแค่ปุ่มเลือกเกมเป็น แท็บที่เห็นทุกเกมพร้อมกัน แทน dropdown — พอเปิด Pokémon หรือเกมที่สาม ผู้ใช้เห็นทันทีว่าเว็บมีอะไรบ้างโดยไม่ต้องกดหา และสลับเกมได้ในคลิกเดียวแทนสองคลิก",
    tradeoff:
      "กินที่มากกว่า dropdown และจะกินเพิ่มเรื่อยๆ ตามจำนวนเกม — เกินสี่เกมเมื่อไรต้องยุบกลับเป็น dropdown หรือทำให้แท็บเลื่อนเองอีกที · ตอนมีเกมเดียวจะดูเหมือนแท็บที่ไม่มีอะไรให้สลับ",
  },
}

const SHARED_NOTES = [
  "ทั้งสามแบบล็อกโครงของแบบ 2 ที่เบสชอบไว้แล้ว — ต่างกันแค่วิธีจัดแถวที่ 3",
  "ปุ่มเลือกเกมกลับมาครบทุกแบบ และยืนนำหน้าชุดเสมอ เพราะเกมเป็นตัวกำหนดว่าชุดไหนโผล่ในแถบ",
  "ชั้นวางชุดเลื่อนซ้าย-ขวาได้จริงทุกแบบ (ปัด · ล้อเมาส์ · ปุ่มลูกศร) และไม่เลื่อนเอง เหมือนแถบชุดหน้าแรกที่เบสเคาะไว้",
  "ตัวอย่างใส่ 14 ชุดเพื่อพิสูจน์ว่าแถวรับของเพิ่มได้ — ของจริงมี 51 ชุด และปิดท้ายด้วยปุ่มทุกชุดเสมอ",
  "ทุกปุ่มสูง 40px ขึ้นไป · พอร์ต · รายการโปรด · Honey มีชื่อครบ · ภาษา/สกุลเงิน/ธีมอยู่ในเมนูโปรไฟล์",
  "ทั้งสามแบบสูง 136px — มากกว่าของจริง 4px เพราะแถว 3 ต้องมีที่พอให้ปุ่มขนาดกดได้จริง (ถ้าลง ต้องแก้ --chrome-h เป็น 8.5rem)",
  "ปุ่มทุกปุ่มกดไม่ได้จริง ยกเว้นลูกศรเลื่อนชุดที่เลื่อนได้จริงให้ลอง · ตัวเลขชุดเดียวกับจอจริงของเบส",
] as const

/** ตารางพิสูจน์ "ไม่มีอะไรหายเงียบ" — ของ 15 ชิ้นจากแถบจริง ลงตรงไหนในแต่ละแบบ */
const PLACEMENTS: Record<Variant, ReadonlyArray<{ item: string; where: string }>> = {
  current: [
    { item: "สถิติตลาด (การ์ด · ชุด · มูลค่ารวม · JPY/THB · อัปเดต)", where: "แถบชีพจรบนสุด ฝั่งซ้าย" },
    { item: "สายพานการ์ดขยับแรง", where: "แถบชีพจรบนสุด ครึ่งขวา" },
    { item: "โลโก้ Meecard", where: "แถวโลโก้ ซ้ายสุด" },
    { item: "ปุ่มเลือกเกม", where: "แถวโลโก้ ถัดจากโลโก้ (คู่กับตัวเลือกชุด)" },
    { item: "ตัวเลือกชุดการ์ด", where: "แถวโลโก้ — dropdown ต้องกดเปิดก่อนถึงเห็นชุด" },
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
  railAfterMenu: [
    { item: "สถิติตลาด", where: "แถบชีพจรบนสุด — เหมือนเดิมทุกอย่าง" },
    { item: "สายพานการ์ดขยับแรง", where: "แถบชีพจรบนสุด — เหมือนเดิมทุกอย่าง" },
    { item: "โลโก้ Meecard", where: "แถวกลาง ซ้ายสุด" },
    { item: "ปุ่มเลือกเกม", where: "✅ แถว 3 — ยืนนำหน้าชั้นวางชุด (dropdown)" },
    { item: "ตัวเลือกชุดการ์ด", where: "✅ แถว 3 — ชั้นวางเลื่อนได้ 14 ชุด + ปุ่มทุกชุด (51)" },
    { item: "ปุ่มอัปเกรด", where: "แถวกลาง ฝั่งขวา — ปุ่มมีกรอบ" },
    { item: "ข้อความ", where: "แถวกลาง ฝั่งขวา (ไอคอน 40px)" },
    { item: "การแจ้งเตือน", where: "แถวกลาง ฝั่งขวา (ไอคอน 40px + จุดแดง)" },
    { item: "โปรไฟล์", where: "แถวกลาง ขวาสุด (แคปซูล 40px)" },
    { item: "ฝั่งยังไม่ล็อกอิน", where: "ตำแหน่งเดียวกับโปรไฟล์" },
    { item: "เมนูหลัก", where: "แถว 3 ซ้ายสุด — นำหน้าแคตตาล็อก" },
    { item: "พอร์ต", where: "แถวกลาง ฝั่งขวา — มีป้ายชื่อ" },
    { item: "รายการโปรด", where: "แถวกลาง ฝั่งขวา — มีป้ายชื่อ" },
    { item: "Honey + แต้ม", where: "แถวกลาง ฝั่งขวา — มีป้ายชื่อ" },
    { item: "ช่องค้นหา", where: "แถวกลาง กลางแถว สูง 44px (กว้างสุดในสามแบบ)" },
    { item: "ภาษา · สกุลเงิน · ธีม", where: "ในเมนูโปรไฟล์ (เหมือนของจริง)" },
  ],
  catalogRow: [
    { item: "สถิติตลาด", where: "แถบชีพจรบนสุด — เหมือนเดิมทุกอย่าง" },
    { item: "สายพานการ์ดขยับแรง", where: "แถบชีพจรบนสุด — เหมือนเดิมทุกอย่าง" },
    { item: "โลโก้ Meecard", where: "แถวกลาง ซ้ายสุด" },
    { item: "ปุ่มเลือกเกม", where: "✅ แถว 3 ซ้ายสุด — นำหน้าทั้งแถว (dropdown)" },
    { item: "ตัวเลือกชุดการ์ด", where: "✅ แถว 3 — ชั้นวางเลื่อนได้เต็มแถว + ปุ่มทุกชุด (51)" },
    { item: "ปุ่มอัปเกรด", where: "แถวกลาง ฝั่งขวา — ปุ่มมีกรอบ" },
    { item: "ข้อความ", where: "แถวกลาง ฝั่งขวา (ไอคอน 40px)" },
    { item: "การแจ้งเตือน", where: "แถวกลาง ฝั่งขวา (ไอคอน 40px + จุดแดง)" },
    { item: "โปรไฟล์", where: "แถวกลาง ขวาสุด (แคปซูล 40px)" },
    { item: "ฝั่งยังไม่ล็อกอิน", where: "ตำแหน่งเดียวกับโปรไฟล์" },
    { item: "เมนูหลัก", where: "แถวกลาง ถัดจากโลโก้ — เพิ่มปุ่มได้โดยไม่แตะแคตตาล็อก" },
    { item: "พอร์ต", where: "แถว 3 ขวาสุด — มีป้ายชื่อ" },
    { item: "รายการโปรด", where: "แถว 3 ขวาสุด — มีป้ายชื่อ" },
    { item: "Honey + แต้ม", where: "แถว 3 ขวาสุด — มีป้ายชื่อ" },
    { item: "ช่องค้นหา", where: "แถวกลาง สูง 44px (แคบกว่า A เพราะแบ่งที่ให้เมนู)" },
    { item: "ภาษา · สกุลเงิน · ธีม", where: "ในเมนูโปรไฟล์ (เหมือนของจริง)" },
  ],
  gameTabs: [
    { item: "สถิติตลาด", where: "แถบชีพจรบนสุด — เหมือนเดิมทุกอย่าง" },
    { item: "สายพานการ์ดขยับแรง", where: "แถบชีพจรบนสุด — เหมือนเดิมทุกอย่าง" },
    { item: "โลโก้ Meecard", where: "แถวกลาง ซ้ายสุด" },
    { item: "ปุ่มเลือกเกม", where: "✅ แถว 3 ซ้ายสุด — แท็บเห็นทุกเกมพร้อมกัน" },
    { item: "ตัวเลือกชุดการ์ด", where: "✅ แถว 3 — ชั้นวางเลื่อนได้ + ปุ่มทุกชุด (51)" },
    { item: "ปุ่มอัปเกรด", where: "แถวกลาง ฝั่งขวา — ปุ่มมีกรอบ" },
    { item: "ข้อความ", where: "แถวกลาง ฝั่งขวา (ไอคอน 40px)" },
    { item: "การแจ้งเตือน", where: "แถวกลาง ฝั่งขวา (ไอคอน 40px + จุดแดง)" },
    { item: "โปรไฟล์", where: "แถวกลาง ขวาสุด (แคปซูล 40px)" },
    { item: "ฝั่งยังไม่ล็อกอิน", where: "ตำแหน่งเดียวกับโปรไฟล์" },
    { item: "เมนูหลัก", where: "แถวกลาง ถัดจากโลโก้ — เพิ่มปุ่มได้โดยไม่แตะแคตตาล็อก" },
    { item: "พอร์ต", where: "แถว 3 ขวาสุด — มีป้ายชื่อ" },
    { item: "รายการโปรด", where: "แถว 3 ขวาสุด — มีป้ายชื่อ" },
    { item: "Honey + แต้ม", where: "แถว 3 ขวาสุด — มีป้ายชื่อ" },
    { item: "ช่องค้นหา", where: "แถวกลาง สูง 44px" },
    { item: "ภาษา · สกุลเงิน · ธีม", where: "ในเมนูโปรไฟล์ (เหมือนของจริง)" },
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
        size === "sm" ? "size-9" : "size-10",
      )}
    >
      <Icon className={cn(size === "sm" ? "size-4" : "size-[18px]", iconClassName)} aria-hidden />
      {dot && (
        <span
          className="absolute right-2 top-2 size-2 rounded-full bg-danger"
          aria-hidden
        />
      )}
    </button>
  )
}

function ProfileCapsule() {
  return (
    <button
      type="button"
      aria-label="เปิดเมนูโปรไฟล์ ตั้งค่า ภาษา และธีม"
      className="hairline ease-chrome flex h-10 shrink-0 items-center gap-1.5 rounded-full pl-2.5 pr-1 transition-colors hover:bg-muted/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40"
    >
      <Menu className="size-[18px] shrink-0 text-muted-foreground" aria-hidden />
      <span className="grid size-7 shrink-0 place-items-center rounded-full bg-primary/10 text-[11px] font-bold text-primary ring-2 ring-primary/25">
        T
      </span>
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
        className="ease-chrome grid size-10 shrink-0 place-items-center rounded-full text-primary transition-colors hover:bg-primary/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40"
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
      className="ease-chrome flex h-10 shrink-0 items-center gap-1.5 rounded-full border border-primary/40 px-3.5 text-sm font-semibold text-primary transition-colors hover:bg-primary/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40"
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
        "ease-chrome inline-flex h-10 shrink-0 items-center whitespace-nowrap rounded-full px-3.5 text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40",
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

/** ลิงก์เมนูแบบตัวหนังสือ — ไม่มีพื้นหลัง แต่กรอบกดสูง 40px เต็มตามกฎ hit target */
function TextLink({ label, active = false }: { label: string; active?: boolean }) {
  return (
    <button
      type="button"
      aria-current={active ? "page" : undefined}
      className={cn(
        "ease-chrome inline-flex h-10 shrink-0 items-center whitespace-nowrap rounded-full px-3 text-sm transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40",
        active
          ? "font-semibold text-primary"
          : "font-medium text-muted-foreground hover:text-foreground",
      )}
    >
      {label}
    </button>
  )
}

function TextNavCluster() {
  return (
    <nav className="flex shrink-0 items-center gap-0.5" aria-label="เมนูหลัก">
      <TextLink label="หน้าแรก" active />
      <TextLink label="ชุดการ์ด" />
      <TextLink label="เด็คและเครื่องมือ" />
      <TextLink label="ซื้อขาย" />
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
      className="ease-chrome relative flex h-10 shrink-0 items-center gap-1.5 rounded-full px-3 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40"
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

/** 🍯 + ชื่อ + แต้ม — ชื่อห้ามหาย (เบสสั่ง 2026-08-29) */
function HoneyButton() {
  return (
    <button
      type="button"
      aria-label="Honey — มี 20 แต้ม"
      className="ease-chrome relative flex h-10 shrink-0 items-center gap-1.5 rounded-full px-3 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40"
    >
      <span className="absolute -right-1 -top-1 flex size-2" aria-hidden>
        <span className="absolute inline-flex size-full animate-ping rounded-full bg-danger opacity-75" />
        <span className="relative inline-flex size-2 rounded-full bg-danger" />
      </span>
      <span className="text-base leading-none" aria-hidden>
        🍯
      </span>
      <span>Honey</span>
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

/** ของบัญชี — ข้อความ · แจ้งเตือน · โปรไฟล์ ขนาดเต็มเสมอ (กดจริงได้ 40px) */
function AccountIcons() {
  return (
    <div className="flex shrink-0 items-center gap-0.5">
      <GhostIcon icon={MessageCircle} label="ข้อความ" />
      <GhostIcon icon={Bell} label="การแจ้งเตือน" dot />
      <ProfileCapsule />
    </div>
  )
}

function GamePill() {
  return (
    <button
      type="button"
      aria-label="เลือกแคตตาล็อกเกม: One Piece Card Game"
      className="surface-2 ease-chrome flex h-10 shrink-0 items-center gap-1.5 rounded-full px-3 text-sm font-semibold text-foreground ring-1 ring-hair transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40"
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
        "surface-2 hairline ease-chrome flex h-10 w-48 items-center gap-1.5 rounded-full px-3 text-label text-foreground transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40",
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
            className="ease-chrome flex h-10 shrink-0 items-center gap-1.5 rounded-full px-3 text-sm font-semibold text-foreground transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40"
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
        className="flex min-w-0 flex-1 self-stretch items-center gap-2 text-left focus-visible:outline-none"
      >
        <span className="min-w-0 flex-1 truncate text-body-sm text-muted-foreground">
          ค้นหาการ์ด ชุด หรือรหัส เช่น OP13-118...
        </span>
        <kbd className="hairline shrink-0 rounded-full bg-background px-1.5 py-0.5 font-sans text-micro text-muted-foreground">
          /
        </kbd>
      </button>
      <span className="ml-2 flex h-10 shrink-0 items-center gap-1.5 rounded-full bg-primary px-5 text-sm font-semibold text-primary-foreground">
        <Search className="size-4" aria-hidden />
        ค้นหา
      </span>
    </div>
  )
}

/** ปุ่มเลือกเกมแบบย่อ (dropdown) — ประหยัดที่ ใช้เมื่อเกมยังไม่เยอะ */
function GameSelect() {
  return (
    <button
      type="button"
      aria-label="เลือกเกม: One Piece Card Game"
      className="surface-2 ease-chrome flex h-10 shrink-0 items-center gap-1.5 rounded-full px-3 text-sm font-semibold text-foreground ring-1 ring-hair transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40"
    >
      <GameCrest game={{ slug: "opcg" }} size={18} variant="selector" decorative />
      OPCG
      <ChevronDown className="size-3.5 text-muted-foreground" aria-hidden />
    </button>
  )
}

/** ปุ่มเลือกเกมแบบแท็บ — เห็นทุกเกมพร้อมกัน เตรียมรับเกมที่จะเพิ่มในอนาคต */
function GameTabs() {
  return (
    <div className="flex shrink-0 items-center gap-1" role="tablist" aria-label="เลือกเกม">
      {GAMES.map((game) => (
        <button
          key={game.slug}
          type="button"
          role="tab"
          aria-selected={game.active}
          className={cn(
            "ease-chrome flex h-10 shrink-0 items-center gap-1.5 rounded-full px-3 text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40",
            game.active
              ? "bg-[var(--p-honey-soft)] font-semibold text-primary"
              : "font-medium text-muted-foreground hover:bg-muted hover:text-foreground",
          )}
        >
          <GameCrest game={{ slug: game.slug }} size={18} variant="selector" decorative />
          {game.short}
        </button>
      ))}
    </div>
  )
}

/**
 * ชั้นวางชุดการ์ด — เลื่อนซ้าย-ขวาได้จริงด้วย scrollLeft เหมือน home-set-strip
 * ของจริง (ปัด/ล้อเมาส์/ปุ่มลูกศร) และ **ไม่เลื่อนเอง** ตามที่เบสสั่งไว้กับแถบชุดหน้าแรก
 * — นี่คือสิ่งที่ทำให้แถวนี้รับชุดเพิ่มได้ไม่จำกัด ไม่ใช่ตัดจบที่ 8 ชุด
 */
function SetShelf() {
  const railRef = useRef<HTMLDivElement>(null)

  const nudge = (dir: -1 | 1) => {
    const rail = railRef.current
    if (!rail) return
    rail.scrollBy({
      left: dir * 320,
      behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches
        ? "auto"
        : "smooth",
    })
  }

  return (
    <div className="flex min-w-0 flex-1 items-center gap-1">
      <IconButton
        aria-label="เลื่อนชุดไปทางซ้าย"
        onClick={() => nudge(-1)}
        className="size-10 shrink-0 rounded-full"
      >
        <ChevronLeft className="size-[18px]" aria-hidden />
      </IconButton>
      <div
        ref={railRef}
        className="flex min-w-0 flex-1 items-center gap-1 overflow-x-auto [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {SETS.map((set) => (
          <button
            key={set.code}
            type="button"
            title={set.code + " · " + set.name}
            className="ease-chrome flex h-10 shrink-0 items-center gap-1.5 rounded-full px-3 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40"
          >
            {set.code}
            {"fresh" in set && set.fresh && (
              <span className="rounded-full bg-[var(--p-honey-soft)] px-1.5 py-0.5 text-micro font-semibold text-primary">
                ใหม่
              </span>
            )}
          </button>
        ))}
        <button
          type="button"
          className="ease-chrome flex h-10 shrink-0 items-center gap-1 whitespace-nowrap rounded-full border border-dashed border-hair px-3 text-sm font-medium text-muted-foreground transition-colors hover:border-primary/35 hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40"
        >
          ทุกชุด (51)
          <ChevronRight className="size-3.5" aria-hidden />
        </button>
      </div>
      <IconButton
        aria-label="เลื่อนชุดไปทางขวา"
        onClick={() => nudge(1)}
        className="size-10 shrink-0 rounded-full"
      >
        <ChevronRight className="size-[18px]" aria-hidden />
      </IconButton>
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

/**
 * A — เมนูเว็บซ้าย · แคตตาล็อกเลื่อนขวา
 * แถวกลางเหมือนแบบ 2 เดิมเป๊ะ (ค้นหา + ของฉัน + บัญชี) แถว 3 เพิ่มปุ่มเกมกลับมา
 * และทำให้ชุดเลื่อนได้ — เมนูเพิ่มกี่ปุ่มก็ได้ แคตตาล็อกจะหดให้แล้วเลื่อนเอา
 */
function RailAfterMenuNavbar() {
  return (
    <div>
      <PulseStrip />
      <div className="flex h-14 items-center gap-3 px-8">
        <BrandMark />
        <div className="flex min-w-0 flex-1 justify-center px-4">
          <HeroSearch className="max-w-2xl" />
        </div>
        <MyStuffCluster />
        <UpgradeButton />
        <AccountIcons />
      </div>
      <div className="hairline-t flex h-12 items-center gap-2 px-8">
        <TextNavCluster />
        <span className="mx-1 h-5 w-px shrink-0 bg-border" aria-hidden />
        <GameSelect />
        <ChevronRight className="size-3 shrink-0 text-muted-foreground/60" aria-hidden />
        <SetShelf />
      </div>
    </div>
  )
}

/**
 * B — แถว 3 เป็นแคตตาล็อกล้วน · เมนูเว็บขึ้นไปแถวกลาง · ของฉันลงมาขวาแถว 3
 * แยกหน้าที่ขาดกัน: แถวกลาง = เว็บ · แถว 3 = แคตตาล็อก + ของฉัน
 * เมนูเพิ่มไม่กระทบแคตตาล็อกเลย เพราะอยู่คนละแถว
 */
function CatalogRowNavbar() {
  return (
    <div>
      <PulseStrip />
      <div className="flex h-14 items-center gap-3 px-8">
        <BrandMark />
        <span className="mx-1 h-5 w-px shrink-0 bg-border" aria-hidden />
        <TextNavCluster />
        <div className="min-w-0 flex-1 px-2">
          <HeroSearch />
        </div>
        <UpgradeButton />
        <AccountIcons />
      </div>
      <div className="hairline-t flex h-12 items-center gap-2 px-8">
        <GameSelect />
        <ChevronRight className="size-3 shrink-0 text-muted-foreground/60" aria-hidden />
        <SetShelf />
        <span className="mx-1 h-5 w-px shrink-0 bg-border" aria-hidden />
        <MyStuffCluster />
      </div>
    </div>
  )
}

/**
 * C — เหมือน B แต่เกมเป็นแท็บเห็นทุกเกมพร้อมกัน แทน dropdown
 * เตรียมรับตอนเปิดเกมที่สอง: ผู้ใช้เห็นทันทีว่าเว็บมีเกมอะไรบ้าง ไม่ต้องกดหา
 */
function GameTabsNavbar() {
  return (
    <div>
      <PulseStrip />
      <div className="flex h-14 items-center gap-3 px-8">
        <BrandMark />
        <span className="mx-1 h-5 w-px shrink-0 bg-border" aria-hidden />
        <TextNavCluster />
        <div className="min-w-0 flex-1 px-2">
          <HeroSearch />
        </div>
        <UpgradeButton />
        <AccountIcons />
      </div>
      <div className="hairline-t flex h-12 items-center gap-2 px-8">
        <GameTabs />
        <span className="mx-1 h-5 w-px shrink-0 bg-border" aria-hidden />
        <SetShelf />
        <span className="mx-1 h-5 w-px shrink-0 bg-border" aria-hidden />
        <MyStuffCluster />
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
  railAfterMenu: RailAfterMenuNavbar,
  catalogRow: CatalogRowNavbar,
  gameTabs: GameTabsNavbar,
}

export default function NavbarEcomPrototypePage() {
  const [variant, setVariant] = useState<Variant>("railAfterMenu")
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
        <h1 className="text-h1">แบบ 2 เคาะแล้ว — เหลือเลือกวิธีจัดแถวที่ 3</h1>
        <p className="mt-2 max-w-3xl text-body text-muted-foreground">
          โครงของแบบ 2 ล็อกไว้แล้ว รอบนี้แก้สองจุดที่เบสทัก — เอา&ldquo;ปุ่มเลือกเกม&rdquo;
          กลับมา และทำให้แถวที่ 3 รับปุ่มที่จะเพิ่มในอนาคตได้ ด้วยการให้ชั้นวางชุด
          เลื่อนซ้าย-ขวาได้จริง (ลองกดลูกศรดูได้เลย ใส่มา 14 ชุด) เหลือให้เลือกแค่ว่า
          แถวที่ 3 ควรจัดของยังไง
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
