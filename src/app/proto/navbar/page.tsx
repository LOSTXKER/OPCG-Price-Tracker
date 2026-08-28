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
  Heart,
  Menu,
  MessageCircle,
  Moon,
  PackageOpen,
  Search,
  Sun,
  TrendingUp,
  Zap,
} from "lucide-react"

import { GameCrest } from "@/components/shared/game-crest"
import { IconButton } from "@/components/ui/icon-button"
import { SegmentedControl } from "@/components/ui/segmented-control"
import { cn } from "@/lib/utils"

/* ------------------------------------------------------------------ data */

type Concept = "current" | "calm" | "warm" | "ticker"

type PrototypeSet = {
  readonly code: string
  readonly name: string
  readonly imageUrl: string
}

const PROTOTYPE_SETS = [
  {
    code: "OP15",
    name: "Adventure on KAMI's Island",
    imageUrl:
      "https://pub-e1c871a889eb42a4bd7dcdc3a5926f3c.r2.dev/sets/op15.webp",
  },
  {
    code: "OP14",
    name: "The Azure Sea's Seven",
    imageUrl:
      "https://pub-e1c871a889eb42a4bd7dcdc3a5926f3c.r2.dev/sets/op14.webp",
  },
  {
    code: "OP13",
    name: "Carrying on His Will",
    imageUrl:
      "https://pub-e1c871a889eb42a4bd7dcdc3a5926f3c.r2.dev/sets/op13.webp",
  },
] as const satisfies readonly PrototypeSet[]

/** ตัวเลขชุดเดียวกับจอจริงของเบส (28 ส.ค.) เพื่อเทียบแบบตาต่อตา */
const STATS = {
  cards: "3,838",
  sets: "51",
  value: "2,688,706 ฿",
  rate: "0.296",
  updated: "5 เม.ย. 2569",
} as const

const CONCEPT_OPTIONS = [
  { value: "current", label: "ปัจจุบัน" },
  { value: "calm", label: "A · โต๊ะเทรดนิ่ง" },
  { value: "warm", label: "B · อุ่นขัดเงา" },
  { value: "ticker", label: "C · แถบชีพจรแยก" },
] as const

const CONCEPT_COPY: Record<
  Concept,
  { name: string; summary: string; tradeoff: string }
> = {
  current: {
    name: "ปัจจุบัน — ตามที่ขึ้นเว็บอยู่",
    summary:
      "เก็บไว้เป็นตัวตั้งเทียบ ปัญหาที่ทำให้ยังดูไม่แพง: สถิติถูกห่อเป็นเม็ดชิปสีพื้นเลยอ่านเป็น \"ปุ่ม\" ทั้งที่กดไม่ได้ · มูลค่ารวมเป็นสีเขียวทั้งที่ไม่ใช่กำไร-ขาดทุน (ผิดกติกาสีของเราเอง) · เส้นแบ่งตั้ง 3 เส้น · มุมโค้งปนกัน 3 ตระกูล — เมนูเหลี่ยมมน ชิปกลม ช่องค้นหาโค้งอีกขนาด",
    tradeoff: "—",
  },
  calm: {
    name: "A · โต๊ะเทรดนิ่ง",
    summary:
      "แถบยึดพื้นทึบ มีเส้นขอบล่างบางตลอดเวลาแบบ TradingView สถิติกลายเป็นตัวหนังสือเปล่า — ตัวเลขเข้ม ป้ายจาง ไม่มีกรอบ มุมโค้งเหลือตระกูลเดียวทั้งแถบ (เหลี่ยมมน) ปุ่มอัปเกรดถอดกรอบเหลือตัวหนังสือสีทอง เส้นแบ่งหายหมด ให้ระยะห่างทำหน้าที่จัดกลุ่มแทน ทุกอย่างเงียบลงเพื่อให้เนื้อหาการ์ดข้างล่างเด่น",
    tradeoff:
      "ความรู้สึก \"ลอยโปร่ง\" ตอนอยู่บนสุดของหน้าหายไป (แถบทึบตลอด) · ความสูงเท่าเดิมเป๊ะ ไม่ต้องขยับระบบแถบลอยหน้าอื่นเลย",
  },
  warm: {
    name: "B · อุ่นขัดเงา",
    summary:
      "คงเสน่ห์ที่เบสเลือกไว้ทั้งหมด (โปร่งใสบนสุด ทรงแคปซูล) แล้วเก็บงานให้สุดทาง: เกม→ชุดรวมเป็นแคปซูลเดียว มีรูปซองการ์ดจริงชวนกด (ลองกดดูได้ — สลับชุดไปเรื่อยๆ) สถิติเป็นตัวหนังสือคั่นด้วยจุดกลางแบบเว็บราคาเหรียญตัวจริง ช่องค้นหา เมนู และปุ่มทุกตัวเปลี่ยนเป็นทรงแคปซูลตระกูลเดียวกันทั้งแถบ",
    tradeoff:
      "แถวบนยังถือของ 3 กลุ่มเหมือนเดิม แค่เรียบร้อยขึ้นมาก · ความสูงเท่าเดิมเป๊ะ ไม่ต้องขยับระบบแถบลอยหน้าอื่นเลย",
  },
  ticker: {
    name: "C · แถบชีพจรแยก",
    summary:
      "ยกสถิติขึ้นไปอยู่แถบเส้นบางของตัวเองบนสุด ตามกายวิภาคจริงของ CoinMarketCap/CoinGecko — ได้พื้นที่แถมสำหรับ \"ชุด 51\" กับ \"อัปเดตล่าสุด\" ฟรี ส่วนแถวโลโก้เหลือแค่แบรนด์ ตัวเลือกเกม→ชุด และบัญชี โล่งขึ้นทันตา",
    tradeoff:
      "แถบรวมสูงขึ้นราว 28px กินที่แนวตั้งของทุกหน้า และต้องขยับระบบแถบลอยที่เกาะใต้เมนูอีก 6 จุดตาม (ทำได้ แต่เป็นงานเทคนิคเพิ่ม)",
  },
}

const SHARED_FIXES = [
  "เอาสีเขียวออกจากมูลค่ารวม — เขียว/แดงสงวนไว้ให้กำไร-ขาดทุนของราคาเท่านั้น ตามกติกา VISION",
  "ตัวเลขทุกตัวบนแถบเป็นเลขความกว้างคงที่ (tabular) — ตัวเลขนิ่ง ไม่ขยับซ้ายขวา",
  "ลดเส้น: เส้นแบ่งแนวตั้งหายเกือบหมด ใช้ระยะห่างจัดกลุ่มแทน",
  "มุมโค้งทั้งแถบเหลือตระกูลเดียว (A เหลี่ยมมน · B แคปซูล) ไม่ปน 3 ขนาดแบบตอนนี้",
] as const

/* ----------------------------------------------------------------- atoms */

function PackArtwork({
  set,
  className,
}: {
  set: PrototypeSet
  className?: string
}) {
  return (
    <span
      className={cn(
        "relative shrink-0 overflow-hidden rounded-[3px]",
        className ?? "h-7 w-5",
      )}
    >
      <Image
        src={set.imageUrl}
        alt=""
        fill
        sizes="24px"
        className="scale-150 object-contain"
      />
    </span>
  )
}

/** พัดซองการ์ด 3 ใบซ้อน — คำเชิญ "เลือกชุด" ของแบบ B ตอนยังไม่ได้เลือก */
function PackFan() {
  return (
    <span className="flex shrink-0 items-center" aria-hidden>
      {PROTOTYPE_SETS.map((set, i) => (
        <span
          key={set.code}
          className={cn(
            "relative h-6 w-[17px] overflow-hidden rounded-[3px] ring-1 ring-border/60",
            i > 0 && "-ml-2",
          )}
          style={{ zIndex: PROTOTYPE_SETS.length - i }}
        >
          <Image
            src={set.imageUrl}
            alt=""
            fill
            sizes="17px"
            className="scale-150 object-contain"
          />
        </span>
      ))}
    </span>
  )
}

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

function VDivider({ className }: { className?: string }) {
  return <span className={cn("h-5 w-px shrink-0 bg-border/60", className)} aria-hidden />
}

/** ป้ายจาง + ตัวเลขเข้ม — สถิติแบบ "ตัวหนังสือเปล่า" ที่ A/B/C ใช้ร่วมกัน */
function StatText({
  label,
  value,
  link = false,
  compact = false,
}: {
  label: string
  value: string
  link?: boolean
  compact?: boolean
}) {
  const body = (
    <>
      <span className="text-meta">{label}</span>
      <span
        className={cn(
          "font-semibold tabular-nums text-foreground",
          compact ? "text-xs" : "text-sm",
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
  shape = "full",
}: {
  icon: typeof Bell
  label: string
  dot?: boolean
  shape?: "full" | "lg"
}) {
  return (
    <button
      type="button"
      aria-label={label}
      className={cn(
        "ease-chrome relative grid size-8 shrink-0 place-items-center text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40",
        shape === "full" ? "rounded-full" : "rounded-lg",
      )}
    >
      <Icon className="size-4" aria-hidden />
      {dot && (
        <span
          className="absolute right-1.5 top-1.5 size-2 rounded-full bg-danger"
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
      aria-label="เปิดเมนูโปรไฟล์และการตั้งค่า"
      className="hairline ease-chrome flex h-8 shrink-0 items-center gap-1.5 rounded-full pl-2 pr-1 transition-colors hover:bg-muted/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40"
    >
      <Menu className="size-4 shrink-0 text-muted-foreground" aria-hidden />
      <span className="grid size-6 shrink-0 place-items-center rounded-full bg-primary/10 text-[10px] font-bold text-primary ring-2 ring-primary/25">
        T
      </span>
    </button>
  )
}

function SearchBox({
  radius,
  height = "h-9",
}: {
  radius: "xl" | "lg" | "full"
  height?: string
}) {
  return (
    <button
      type="button"
      aria-label="ค้นหาการ์ด"
      className={cn(
        "hairline ease-chrome group flex w-full max-w-md items-center gap-2 bg-card px-3 text-left transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40",
        height,
        radius === "xl" && "rounded-xl",
        radius === "lg" && "rounded-lg",
        radius === "full" && "rounded-full px-4",
      )}
    >
      <Search
        className="size-[18px] shrink-0 text-muted-foreground transition-colors group-hover:text-foreground"
        aria-hidden
      />
      <span className="min-w-0 flex-1 truncate text-body-sm text-muted-foreground">
        ค้นหาการ์ด...
      </span>
      <kbd
        className={cn(
          "hairline shrink-0 bg-background px-1.5 py-0.5 font-sans text-micro text-muted-foreground",
          radius === "full" ? "rounded-full" : "rounded-md",
        )}
      >
        /
      </kbd>
    </button>
  )
}

function NavLinkItem({
  label,
  active = false,
  shape = "lg",
}: {
  label: string
  active?: boolean
  shape?: "lg" | "full"
}) {
  return (
    <button
      type="button"
      aria-current={active ? "page" : undefined}
      className={cn(
        "ease-chrome inline-flex h-9 shrink-0 items-center whitespace-nowrap text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40",
        shape === "full" ? "rounded-full px-3.5" : "rounded-lg px-3",
        active
          ? "bg-[var(--p-honey-soft)] font-semibold text-primary"
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
  shape = "full",
}: {
  icon: React.ReactNode
  label: string
  trailing?: React.ReactNode
  ping?: boolean
  shape?: "full" | "lg"
}) {
  return (
    <button
      type="button"
      className={cn(
        "ease-chrome relative flex h-9 shrink-0 items-center gap-1.5 px-3 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40",
        shape === "full" ? "rounded-full" : "rounded-lg",
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

function MyStuffCluster({ shape = "full" }: { shape?: "full" | "lg" }) {
  return (
    <div className="flex shrink-0 items-center gap-1.5">
      <MyStuffLink
        shape={shape}
        icon={<Briefcase className="size-3.5 text-muted-foreground/60" aria-hidden />}
        label="พอร์ต"
      />
      <MyStuffLink
        shape={shape}
        icon={<Heart className="size-3.5 text-primary" aria-hidden />}
        label="รายการโปรด"
      />
      <MyStuffLink
        shape={shape}
        ping
        icon={
          <span className="text-sm leading-none" aria-hidden>
            🍯
          </span>
        }
        label="Honey"
        trailing={
          <span className="font-bold tabular-nums text-amber-600 dark:text-amber-400">
            20
          </span>
        }
      />
    </div>
  )
}

function GamePill({ shape = "full" }: { shape?: "full" | "lg" }) {
  return (
    <button
      type="button"
      aria-label="เลือกแคตตาล็อกเกม: One Piece Card Game"
      className={cn(
        "ease-chrome flex h-8 shrink-0 items-center gap-1.5 text-xs font-semibold text-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40",
        shape === "full"
          ? "surface-2 rounded-full px-3 ring-1 ring-hair hover:bg-muted"
          : "rounded-lg px-2 hover:bg-muted",
      )}
    >
      <GameCrest game={{ slug: "opcg" }} size={18} variant="selector" decorative />
      OPCG
      <ChevronDown className="size-3 text-muted-foreground" aria-hidden />
    </button>
  )
}

function SetTrigger({ shape = "full" }: { shape?: "full" | "lg" }) {
  return (
    <button
      type="button"
      aria-label="เลือกชุดการ์ด"
      className={cn(
        "ease-chrome flex h-8 items-center gap-1.5 text-label text-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40",
        shape === "full"
          ? "surface-2 hairline w-48 rounded-full px-2.5 hover:bg-muted"
          : "rounded-lg px-2 hover:bg-muted",
      )}
    >
      <PackageOpen className="size-3.5 shrink-0 text-muted-foreground" aria-hidden />
      <span className="min-w-0 flex-1 truncate text-left">เลือกชุดการ์ด</span>
      <ChevronDown className="size-3.5 shrink-0 text-muted-foreground" aria-hidden />
    </button>
  )
}

/** แบบ B — เกม→ชุดรวมเป็นแคปซูลเดียว มีรูปซองจริงเป็นคำเชิญ */
function CatalogCapsule({
  selected,
  onCycle,
}: {
  selected: PrototypeSet | null
  onCycle: () => void
}) {
  return (
    <span className="surface-2 hairline flex h-9 shrink-0 items-stretch overflow-hidden rounded-full">
      <button
        type="button"
        aria-label="เลือกแคตตาล็อกเกม: One Piece Card Game"
        className="ease-chrome flex items-center gap-1.5 pl-2.5 pr-2 text-xs font-semibold text-foreground transition-colors hover:bg-muted/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring/40"
      >
        <GameCrest game={{ slug: "opcg" }} size={18} variant="selector" decorative />
        OPCG
      </button>
      <span className="my-2 w-px shrink-0 bg-border/60" aria-hidden />
      <button
        type="button"
        onClick={onCycle}
        aria-label={
          selected
            ? `ชุดที่เลือก ${selected.code} ${selected.name} — กดเพื่อเปลี่ยนชุด`
            : "เลือกชุดการ์ด"
        }
        className="ease-chrome flex min-w-0 items-center gap-2 pl-2 pr-2.5 transition-colors hover:bg-muted/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring/40"
      >
        {selected ? (
          <PackArtwork set={selected} className="h-6 w-[17px]" />
        ) : (
          <PackFan />
        )}
        <span className="max-w-[180px] truncate text-label text-foreground">
          {selected ? `${selected.code} · ${selected.name}` : "เลือกชุดการ์ด"}
        </span>
        <ChevronDown className="size-3.5 shrink-0 text-muted-foreground" aria-hidden />
      </button>
    </span>
  )
}

function UpgradeButton({ variant }: { variant: "outline" | "text" | "soft" }) {
  return (
    <button
      type="button"
      className={cn(
        "ease-chrome flex h-8 shrink-0 items-center gap-1 text-sm font-semibold text-primary transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40",
        variant === "outline" &&
          "rounded-full border border-primary/30 px-2.5 hover:bg-primary/10",
        variant === "text" && "rounded-lg px-2.5 hover:bg-primary/10",
        variant === "soft" && "rounded-full bg-primary/10 px-3 hover:bg-primary/20",
      )}
    >
      <Zap className="size-3" aria-hidden />
      อัปเกรด
    </button>
  )
}

/* --------------------------------------------------------------- navbars */

/** จำลองของจริงบนเว็บตอนนี้ (สถานะบนสุดของหน้า ยังไม่ scroll) — คลาสตามโค้ดจริง */
function CurrentNavbar() {
  return (
    <div>
      <div className="flex h-11 items-center gap-3 px-8">
        <BrandMark />
        <VDivider />
        <div className="flex shrink-0 items-center">
          <GamePill />
          <ChevronRight className="mx-1 size-3 shrink-0 text-muted-foreground/60" aria-hidden />
          <SetTrigger />
        </div>
        <VDivider />
        <div className="flex min-w-0 flex-1 items-center gap-2 overflow-x-auto overflow-y-hidden text-muted-foreground [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <div className="flex h-8 shrink-0 items-center gap-1.5 rounded-full bg-muted/50 px-2.5 text-sm">
            <span className="font-medium">การ์ดทั้งหมด</span>
            <span className="font-semibold tabular-nums text-foreground">
              {STATS.cards}
            </span>
          </div>
          <button
            type="button"
            className="group ease-chrome flex h-8 shrink-0 items-center gap-1.5 rounded-full bg-muted/50 px-2.5 text-sm transition-colors hover:bg-muted"
          >
            <span className="font-medium">มูลค่ารวม</span>
            <span className="font-semibold tabular-nums text-price-up">
              {STATS.value}
            </span>
            <TrendingUp className="size-3 shrink-0 text-price-up opacity-60" aria-hidden />
          </button>
          <div className="flex h-8 shrink-0 items-center gap-1.5 rounded-full bg-muted/50 px-2.5 text-sm">
            <span className="font-medium">JPY/THB</span>
            <span className="font-semibold tabular-nums text-foreground">
              {STATS.rate}
            </span>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <UpgradeButton variant="outline" />
          <VDivider className="mx-1" />
          <GhostIcon icon={MessageCircle} label="ข้อความ" />
          <GhostIcon icon={Bell} label="การแจ้งเตือน" dot />
          <ProfileCapsule />
        </div>
      </div>
      <div className="flex h-14 items-center gap-3 px-8">
        <nav className="flex shrink-0 items-center" aria-label="เมนูหลัก">
          <NavLinkItem label="หน้าแรก" active />
          <NavLinkItem label="ชุดการ์ด" />
          <NavLinkItem label="เด็คและเครื่องมือ" />
          <NavLinkItem label="ซื้อขาย" />
        </nav>
        <div className="flex min-w-0 flex-1 justify-center">
          <SearchBox radius="xl" />
        </div>
        <MyStuffCluster />
      </div>
    </div>
  )
}

/** A · โต๊ะเทรดนิ่ง — ทึบตลอด เส้นเดียวข้างล่าง ตระกูลเหลี่ยมมน ไร้ชิป ไร้เส้นแบ่ง */
function CalmNavbar() {
  return (
    <div className="hairline-b bg-background">
      <div className="flex h-10 items-center gap-4 px-8">
        <BrandMark />
        <div className="flex shrink-0 items-center gap-0.5">
          <GamePill shape="lg" />
          <ChevronRight className="size-3 shrink-0 text-muted-foreground/60" aria-hidden />
          <SetTrigger shape="lg" />
        </div>
        <div className="flex min-w-0 flex-1 items-center gap-5 overflow-hidden pl-2">
          <StatText label="การ์ดทั้งหมด" value={STATS.cards} />
          <StatText label="มูลค่ารวม" value={STATS.value} link />
          <StatText label="JPY/THB" value={STATS.rate} />
        </div>
        <div className="flex shrink-0 items-center gap-1.5">
          <UpgradeButton variant="text" />
          <GhostIcon icon={MessageCircle} label="ข้อความ" shape="lg" />
          <GhostIcon icon={Bell} label="การแจ้งเตือน" dot shape="lg" />
          <ProfileCapsule />
        </div>
      </div>
      <div className="flex h-[60px] items-center gap-3 px-8">
        <nav className="flex shrink-0 items-center" aria-label="เมนูหลัก">
          <NavLinkItem label="หน้าแรก" active />
          <NavLinkItem label="ชุดการ์ด" />
          <NavLinkItem label="เด็คและเครื่องมือ" />
          <NavLinkItem label="ซื้อขาย" />
        </nav>
        <div className="flex min-w-0 flex-1 justify-center">
          <SearchBox radius="lg" height="h-10" />
        </div>
        <MyStuffCluster shape="lg" />
      </div>
    </div>
  )
}

/** B · อุ่นขัดเงา — โครงเดิมเป๊ะ แต่แคปซูลตระกูลเดียว + เกม→ชุดรวมร่าง + สถิติไร้ชิป */
function WarmNavbar({
  selected,
  onCycle,
}: {
  selected: PrototypeSet | null
  onCycle: () => void
}) {
  return (
    <div>
      <div className="flex h-11 items-center gap-3 px-8">
        <BrandMark />
        <CatalogCapsule selected={selected} onCycle={onCycle} />
        <div className="flex min-w-0 flex-1 items-center gap-3 overflow-hidden pl-3">
          <StatText label="การ์ดทั้งหมด" value={STATS.cards} />
          <span className="text-muted-foreground/40" aria-hidden>
            ·
          </span>
          <StatText label="มูลค่ารวม" value={STATS.value} link />
          <span className="text-muted-foreground/40" aria-hidden>
            ·
          </span>
          <StatText label="JPY/THB" value={STATS.rate} />
        </div>
        <div className="flex shrink-0 items-center gap-1.5">
          <UpgradeButton variant="soft" />
          <GhostIcon icon={MessageCircle} label="ข้อความ" />
          <GhostIcon icon={Bell} label="การแจ้งเตือน" dot />
          <ProfileCapsule />
        </div>
      </div>
      <div className="flex h-14 items-center gap-3 px-8">
        <nav className="flex shrink-0 items-center gap-0.5" aria-label="เมนูหลัก">
          <NavLinkItem label="หน้าแรก" active shape="full" />
          <NavLinkItem label="ชุดการ์ด" shape="full" />
          <NavLinkItem label="เด็คและเครื่องมือ" shape="full" />
          <NavLinkItem label="ซื้อขาย" shape="full" />
        </nav>
        <div className="flex min-w-0 flex-1 justify-center">
          <SearchBox radius="full" height="h-10" />
        </div>
        <MyStuffCluster />
      </div>
    </div>
  )
}

/** C · แถบชีพจรแยก — สถิติขึ้นแถบบางของตัวเองแบบ CMC แถวโลโก้โล่ง */
function TickerNavbar() {
  return (
    <div>
      <div className="hairline-b flex h-7 items-center gap-4 overflow-hidden px-8">
        <StatText label="การ์ดทั้งหมด" value={STATS.cards} compact />
        <StatText label="ชุด" value={STATS.sets} compact />
        <StatText label="มูลค่ารวม" value={STATS.value} link compact />
        <StatText label="JPY/THB" value={STATS.rate} compact />
        <span className="ml-auto shrink-0 whitespace-nowrap text-meta">
          อัปเดตล่าสุด {STATS.updated}
        </span>
      </div>
      <div className="flex h-11 items-center gap-3 px-8">
        <BrandMark />
        <div className="flex shrink-0 items-center">
          <GamePill />
          <ChevronRight className="mx-1 size-3 shrink-0 text-muted-foreground/60" aria-hidden />
          <SetTrigger />
        </div>
        <div className="min-w-0 flex-1" />
        <div className="flex shrink-0 items-center gap-2">
          <UpgradeButton variant="outline" />
          <GhostIcon icon={MessageCircle} label="ข้อความ" />
          <GhostIcon icon={Bell} label="การแจ้งเตือน" dot />
          <ProfileCapsule />
        </div>
      </div>
      <div className="flex h-14 items-center gap-3 px-8">
        <nav className="flex shrink-0 items-center" aria-label="เมนูหลัก">
          <NavLinkItem label="หน้าแรก" active />
          <NavLinkItem label="ชุดการ์ด" />
          <NavLinkItem label="เด็คและเครื่องมือ" />
          <NavLinkItem label="ซื้อขาย" />
        </nav>
        <div className="flex min-w-0 flex-1 justify-center">
          <SearchBox radius="xl" />
        </div>
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

export default function NavbarPrototypePage() {
  const [concept, setConcept] = useState<Concept>("current")
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
  // แบบ B: กดฝั่งชุดเพื่อวนดู ยังไม่เลือก → OP15 → OP14 → OP13 → วนกลับ
  const [warmSetIndex, setWarmSetIndex] = useState<number | null>(null)
  const warmSelected =
    warmSetIndex === null ? null : (PROTOTYPE_SETS[warmSetIndex] ?? null)
  const conceptCopy = CONCEPT_COPY[concept]

  const cycleWarmSet = () => {
    setWarmSetIndex((index) => {
      if (index === null) return 0
      const next = index + 1
      return next >= PROTOTYPE_SETS.length ? null : next
    })
  }

  return (
    <main className="min-h-screen bg-background px-4 py-8 text-foreground sm:px-6 lg:px-10">
      <div className="mx-auto max-w-[1440px]">
        <h1 className="text-h1">เก็บงานแถบเมนูบน — เทียบ 3 แนวกับของปัจจุบัน</h1>
        <p className="mt-2 max-w-3xl text-body text-muted-foreground">
          โครงสองแถวที่เบสเคาะไว้ (โลโก้บน · ค้นหากลาง · ตั้งค่าในโปรไฟล์)
          อยู่ครบทุกแบบ — สิ่งที่ต่างคือวิธีนำเสนอ: ความนิ่ง ความอุ่น
          หรือแยกตัวเลขเป็นแถบของมันเอง
        </p>

        <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
          <div className="overflow-x-auto pb-1">
            <SegmentedControl
              options={CONCEPT_OPTIONS}
              value={concept}
              onChange={setConcept}
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
            {concept === "current" ? (
              <CurrentNavbar />
            ) : concept === "calm" ? (
              <CalmNavbar />
            ) : concept === "warm" ? (
              <WarmNavbar selected={warmSelected} onCycle={cycleWarmSet} />
            ) : (
              <TickerNavbar />
            )}
            <HomeFold />
          </div>
        </section>
        <p className="mt-3 text-meta">
          ทุกแบบเป็นจอ desktop (≥1024px) สถานะบนสุดของหน้า ยังไม่ scroll ·
          ตัวเลขคือชุดเดียวกับจอจริงของเบส · มือถือใช้แถบเดิม ไม่ถูกแตะ ·
          ในแบบ B กดฝั่ง &quot;เลือกชุดการ์ด&quot; เพื่อวนดูสถานะตอนเลือกชุดแล้ว
        </p>

        <section className="mt-8 grid gap-6 md:grid-cols-[minmax(0,1fr)_300px]">
          <div className="border-l-2 border-primary pl-4">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-h3">{conceptCopy.name}</h2>
              {concept === "warm" && (
                <span className="rounded-full bg-primary/15 px-2 py-1 text-micro text-primary">
                  ฉันแนะนำ
                </span>
              )}
            </div>
            <p className="mt-1.5 max-w-2xl text-body-sm">{conceptCopy.summary}</p>
            {conceptCopy.tradeoff !== "—" && (
              <p className="mt-1 max-w-2xl text-meta">
                ข้อแลก: {conceptCopy.tradeoff}
              </p>
            )}
          </div>
          <div className="space-y-2 text-body-sm text-muted-foreground">
            <p className="font-medium text-foreground">แก้เหมือนกันทุกแบบ:</p>
            {SHARED_FIXES.map((fix) => (
              <p key={fix}>• {fix}</p>
            ))}
          </div>
        </section>
      </div>
    </main>
  )
}
