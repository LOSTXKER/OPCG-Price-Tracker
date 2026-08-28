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

type Concept = "current" | "center" | "right" | "brand"

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
  { value: "center", label: "C1 · กลางแถวเมนู" },
  { value: "right", label: "C2 · ชิดขวา" },
  { value: "brand", label: "C3 · ขึ้นแถวโลโก้" },
] as const

const CONCEPT_COPY: Record<
  Concept,
  { name: string; summary: string; tradeoff: string }
> = {
  current: {
    name: "ปัจจุบัน — ตามที่ขึ้นเว็บอยู่",
    summary:
      "ตัวตั้งเทียบ จุดที่เบสทักว่าแปลกมีที่มา: ช่องค้นหาเป็นทรงเหลี่ยมขอบโค้งอยู่ตัวเดียว ท่ามกลางแคปซูลกลมทั้งแถบ (pill เกม/ชุด · ชิปสถิติ · ปุ่มโปรไฟล์ล้วนกลม) แถมถูกวางคั่นกลางระหว่างลิงก์สองกลุ่มพอดี เลยอ่านเป็นของคนละชุดมาวางรวมกัน",
    tradeoff: "—",
  },
  center: {
    name: "C1 · กลางแถวเมนู — เปลี่ยนทรงให้เข้าชุด",
    summary:
      "ตำแหน่งเดิมที่เบสเลือกไว้ (ค้นหาเด่นกลางจอ) แต่เปลี่ยนช่องค้นหาเป็นแคปซูลกลม สูงขึ้นนิด กว้างขึ้นหน่อย และปรับเมนูเป็นแคปซูลตระกูลเดียวกันทั้งแถบ — แก้ตรงจุด \"ดูแปลก\" โดยไม่ย้ายตำแหน่งอะไรเลย",
    tradeoff:
      "ช่องค้นหายังคั่นกลางระหว่างลิงก์ซ้าย-ขวาเหมือนเดิม ถ้าความรู้สึกแปลกมาจากตำแหน่ง ไม่ใช่แค่ทรง แบบนี้จะยังไม่หายสนิท · สูงรวม ~129px เท่าแบบ C ที่เบสเห็น",
  },
  right: {
    name: "C2 · ชิดขวา — ตามผังจริงของ CoinMarketCap",
    summary:
      "เว็บต้นแบบวางช่องค้นหาแบบกะทัดรัดไว้ท้ายแถวเมนู: เมนูอ่านต่อเนื่องจากซ้ายโดยไม่โดนผ่ากลาง ส่วนช่องค้นหาไปอยู่ติดกับของประจำตัว (พอร์ต/รายการโปรด/Honey) กลายเป็นมุมเครื่องมือของฉันชัดๆ",
    tradeoff:
      "ความเด่นของช่องค้นหาลดลงจากที่เบสเคยตั้งใจไว้ว่าเป็นทางเข้าค้นหาทางเดียวต้องเห็นชัด · สูงรวม ~129px",
  },
  brand: {
    name: "C3 · ขึ้นแถวโลโก้ — เติมช่องว่างที่แบบ C สร้างขึ้นพอดี",
    summary:
      "พอสถิติย้ายขึ้นแถบชีพจรแล้ว แถวโลโก้ของแบบ C เหลือช่องว่างตรงกลางทั้งแถว — แบบนี้เอาช่องค้นหาไปวางตรงนั้นเต็มความกว้างเดิม แต่ละชั้นเลยได้หน้าที่เดียวชัด: ตัวเลข → ตัวตน+ค้นหา+บัญชี → เมนู แถวเมนูเหลือแค่ลิงก์จึงเตี้ยลงได้ รวมทั้งแถบเตี้ยกว่า C1/C2 ราว 4px",
    tradeoff:
      "ขยับโครงมากที่สุด (เทสต์ที่ปักหน้าตาแถบไว้ต้องอัปเดตตามเยอะสุด) และแถวโลโก้กลับมามีของหลายชิ้น — แต่ไม่แน่นเท่ารอบที่เคยถอยกลับ เพราะสถิติย้ายออกไปอยู่แถบชีพจรแล้ว",
  },
}

const SHARED_FIXES = [
  "โครงแบบ C ครบทุกตัวเลือก: แถบชีพจรบางบนสุด (การ์ด · ชุด · มูลค่ารวม · JPY/THB · อัปเดตล่าสุด) แล้วแถวโลโก้ถึงโล่ง",
  "เอาสีเขียวออกจากมูลค่ารวม — เขียว/แดงสงวนไว้ให้กำไร-ขาดทุนของราคาเท่านั้น ตามกติกา VISION",
  "มุมโค้งจัดเป็นตระกูลแคปซูลเดียวทั้งแถบ (เมนู · ช่องค้นหา · ปุ่ม) ไม่ปน 3 ขนาดแบบตอนนี้",
  "ตัวเลขทุกตัวเป็นเลขความกว้างคงที่ (tabular) และเส้นแบ่งแนวตั้งถูกตัดออก ใช้ระยะห่างจัดกลุ่มแทน",
] as const

/* ----------------------------------------------------------------- atoms */

function BrandMark() {
  return (
    <span className="flex h-8 shrink-0 items-center gap-2 pr-1">
      <Image
        src="/meecard.png"
        alt="Meecard"
        width={754}
        height={694}
        className="h-auto w-6 shrink-0 select-none"
      />
      <span className="text-sm font-bold tracking-tight text-foreground">
        Meecard
      </span>
    </span>
  )
}

function VDivider({ className }: { className?: string }) {
  return <span className={cn("h-5 w-px shrink-0 bg-border/60", className)} aria-hidden />
}

/** ป้ายจาง + ตัวเลขเข้ม — สถิติแบบ "ตัวหนังสือเปล่า" บนแถบชีพจร */
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
}: {
  icon: typeof Bell
  label: string
  dot?: boolean
}) {
  return (
    <button
      type="button"
      aria-label={label}
      className="ease-chrome relative grid size-8 shrink-0 place-items-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40"
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

function SearchField({
  variant,
  className,
}: {
  /** current = ทรงเหลี่ยมโค้งเดิม · capsule = แคปซูลกลมเข้าชุดกับทั้งแถบ */
  variant: "current" | "capsule"
  className?: string
}) {
  return (
    <button
      type="button"
      aria-label="ค้นหาการ์ด"
      className={cn(
        "hairline ease-chrome group flex items-center gap-2 bg-card text-left transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40",
        variant === "current" && "h-9 rounded-xl px-3",
        variant === "capsule" && "rounded-full px-4",
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
      <kbd
        className={cn(
          "hairline shrink-0 bg-background px-1.5 py-0.5 font-sans text-micro text-muted-foreground",
          variant === "capsule" ? "rounded-full" : "rounded-md",
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

function NavCluster({ shape = "lg" }: { shape?: "lg" | "full" }) {
  return (
    <nav className="flex shrink-0 items-center gap-0.5" aria-label="เมนูหลัก">
      <NavLinkItem label="หน้าแรก" active shape={shape} />
      <NavLinkItem label="ชุดการ์ด" shape={shape} />
      <NavLinkItem label="เด็คและเครื่องมือ" shape={shape} />
      <NavLinkItem label="ซื้อขาย" shape={shape} />
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
      <MyStuffLink
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

function SetTrigger() {
  return (
    <button
      type="button"
      aria-label="เลือกชุดการ์ด"
      className="surface-2 hairline ease-chrome flex h-8 w-48 items-center gap-1.5 rounded-full px-2.5 text-label text-foreground transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40"
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

function UpgradeButton() {
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

function AccountCluster() {
  return (
    <div className="flex shrink-0 items-center gap-2">
      <UpgradeButton />
      <GhostIcon icon={MessageCircle} label="ข้อความ" />
      <GhostIcon icon={Bell} label="การแจ้งเตือน" dot />
      <ProfileCapsule />
    </div>
  )
}

/** แถบชีพจรบางบนสุด — หัวใจของแบบ C */
function TickerStrip() {
  return (
    <div className="hairline-b flex h-7 items-center gap-4 overflow-hidden px-8">
      <StatText label="การ์ดทั้งหมด" value={STATS.cards} compact />
      <StatText label="ชุด" value={STATS.sets} compact />
      <StatText label="มูลค่ารวม" value={STATS.value} link compact />
      <StatText label="JPY/THB" value={STATS.rate} compact />
      <span className="ml-auto shrink-0 whitespace-nowrap text-meta">
        อัปเดตล่าสุด {STATS.updated}
      </span>
    </div>
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
        <CatalogControl />
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
          <UpgradeButton />
          <VDivider className="mx-1" />
          <GhostIcon icon={MessageCircle} label="ข้อความ" />
          <GhostIcon icon={Bell} label="การแจ้งเตือน" dot />
          <ProfileCapsule />
        </div>
      </div>
      <div className="flex h-14 items-center gap-3 px-8">
        <NavCluster />
        <div className="flex min-w-0 flex-1 justify-center">
          <SearchField variant="current" className="w-full max-w-md" />
        </div>
        <MyStuffCluster />
      </div>
    </div>
  )
}

/** แบบ C ทั้งสามตัวเลือก — โครงเดียวกัน ต่างกันเฉพาะตำแหน่ง/ทรงช่องค้นหา */
function CNavbar({ placement }: { placement: "center" | "right" | "brand" }) {
  if (placement === "brand") {
    return (
      <div>
        <TickerStrip />
        <div className="flex h-12 items-center gap-3 px-8">
          <BrandMark />
          <CatalogControl />
          <div className="flex min-w-0 flex-1 justify-center px-3">
            <SearchField variant="capsule" className="h-9 w-full max-w-md" />
          </div>
          <AccountCluster />
        </div>
        <div className="flex h-12 items-center gap-3 px-8">
          <NavCluster shape="full" />
          <div className="min-w-0 flex-1" />
          <MyStuffCluster />
        </div>
      </div>
    )
  }

  return (
    <div>
      <TickerStrip />
      <div className="flex h-11 items-center gap-3 px-8">
        <BrandMark />
        <CatalogControl />
        <div className="min-w-0 flex-1" />
        <AccountCluster />
      </div>
      <div className="flex h-14 items-center gap-3 px-8">
        <NavCluster shape="full" />
        {placement === "center" ? (
          <>
            <div className="flex min-w-0 flex-1 justify-center">
              <SearchField variant="capsule" className="h-10 w-full max-w-lg" />
            </div>
            <MyStuffCluster />
          </>
        ) : (
          <>
            <div className="min-w-0 flex-1" />
            <SearchField variant="capsule" className="h-10 w-80" />
            <MyStuffCluster />
          </>
        )}
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
  const [concept, setConcept] = useState<Concept>("center")
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
  const conceptCopy = CONCEPT_COPY[concept]

  return (
    <main className="min-h-screen bg-background px-4 py-8 text-foreground sm:px-6 lg:px-10">
      <div className="mx-auto max-w-[1440px]">
        <h1 className="text-h1">แบบ C เคาะแล้ว — เหลือเลือกวิธีวางช่องค้นหา</h1>
        <p className="mt-2 max-w-3xl text-body text-muted-foreground">
          ทั้งสามตัวเลือกคือแบบ C เต็มร่าง (แถบชีพจร + สองแถว)
          และจัดช่องค้นหาเป็นแคปซูลเข้าชุดกับทั้งแถบแล้ว —
          ต่างกันที่ตำแหน่งเดียวเท่านั้น สลับเทียบกับของปัจจุบันได้
        </p>

        <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
          <div className="overflow-x-auto pb-1">
            <SegmentedControl
              options={CONCEPT_OPTIONS}
              value={concept}
              onChange={setConcept}
              ariaLabel="เลือกตำแหน่งช่องค้นหา"
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
            ) : (
              <CNavbar placement={concept} />
            )}
            <HomeFold />
          </div>
        </section>
        <p className="mt-3 text-meta">
          ทุกแบบเป็นจอ desktop (≥1024px) สถานะบนสุดของหน้า ยังไม่ scroll ·
          ตัวเลขคือชุดเดียวกับจอจริงของเบส · มือถือใช้แถบเดิม ไม่ถูกแตะ
        </p>

        <section className="mt-8 grid gap-6 md:grid-cols-[minmax(0,1fr)_300px]">
          <div className="border-l-2 border-primary pl-4">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-h3">{conceptCopy.name}</h2>
              {concept === "brand" && (
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
            <p className="font-medium text-foreground">ทุกตัวเลือกได้เหมือนกัน:</p>
            {SHARED_FIXES.map((fix) => (
              <p key={fix}>• {fix}</p>
            ))}
          </div>
        </section>
      </div>
    </main>
  )
}
