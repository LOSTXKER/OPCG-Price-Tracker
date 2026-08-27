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
  Heart,
  MessageCircle,
  Moon,
  Search,
  Sun,
  User,
  Zap,
} from "lucide-react"

import { IconButton } from "@/components/ui/icon-button"
import { SegmentedControl } from "@/components/ui/segmented-control"
import { cn } from "@/lib/utils"

type Concept = "navdeck" | "command" | "market"

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

const CONCEPT_OPTIONS = [
  { value: "navdeck", label: "A · ตามแบบเบส" },
  { value: "command", label: "B · สลับชั้น" },
  { value: "market", label: "C · ชีพจรตลาด" },
] as const

const CONCEPT_COPY: Record<
  Concept,
  { name: string; summary: string; tradeoff: string }
> = {
  navdeck: {
    name: "Nav Deck — ตามที่เบสวางมา",
    summary:
      "ชั้นบนคือเมนูหลักครบทุกปลายทางจบในแถวเดียวพร้อมโปรไฟล์ ชั้นล่างคือพื้นที่ทำงานประจำวัน: เกม → เลือกชุด อัปเกรด แชท แจ้งเตือน และช่องค้นหา",
    tradeoff:
      "เมนูอ่านง่ายที่สุด แต่ช่องค้นหาย้ายลงมุมล่างขวา ความเด่นน้อยกว่าทิศ search-first ที่เพิ่งวางไว้ · ความสูงรวมประมาณเท่า Navbar ปัจจุบัน",
  },
  command: {
    name: "Command Deck — สลับชั้นให้ของที่ใช้บ่อยขึ้นบน",
    summary:
      "คนเปิด Meecard มาเพื่อเลือกชุดกับค้นหาการ์ดก่อนเสมอ แบบนี้จึงยกสองอย่างนั้นขึ้นชั้นบนกลางจอแบบเว็บราคาคริปโต แล้วให้เมนูทั้งหมดเป็นแท็บบาง ๆ ชั้นล่าง กวาดตาซ้ายไปขวาครบในระดับเดียว",
    tradeoff:
      "เมนูหลักตกลงไปอยู่ชั้นสอง คนมาใหม่ต้องกวาดตาสองระดับก่อนเจอหน้าที่ต้องการ",
  },
  market: {
    name: "Market Deck — ชั้นล่างเป็นชีพจรตลาด",
    summary:
      "โครงเดียวกับแบบ A แต่กลางชั้นล่างฝังราคาความเคลื่อนไหวของชุดเด่นไว้ตลอดเวลา ให้ทั้งเว็บรู้สึก \"มีชีวิต\" แบบกระดานราคา โดยเกม → ชุดยังอยู่ซ้าย และเครื่องมือประจำวันอยู่ขวา",
    tradeoff:
      "ชั้นล่างแน่นที่สุด — ช่องค้นหาเหลือขนาดสั้น และปุ่มอัปเกรดต้องย้ายเข้าไปอยู่ในเมนูโปรไฟล์แทน",
  },
}

const TICKER_ITEMS = [
  { code: "OP15", price: "฿4,250", change: 2.1 },
  { code: "OP14", price: "฿2,890", change: -0.8 },
  { code: "OP13-118", price: "฿12,500", change: 5.4 },
] as const

function PackArtwork({
  set,
  compact = false,
}: {
  set: PrototypeSet
  compact?: boolean
}) {
  return (
    <span
      className={cn(
        "relative shrink-0 overflow-hidden",
        compact ? "h-7 w-5" : "h-9 w-6",
      )}
    >
      <Image
        src={set.imageUrl}
        alt=""
        fill
        sizes={compact ? "20px" : "24px"}
        className="scale-150 object-contain"
      />
    </span>
  )
}

function BrandMark({ withWordmark = true }: { withWordmark?: boolean }) {
  return (
    <span className="flex shrink-0 items-center gap-2 pl-1 pr-2">
      <Image
        src="/meecard.png"
        alt="Meecard"
        width={754}
        height={694}
        className="h-auto w-[26px] select-none"
      />
      {withWordmark && (
        <span className="text-base font-bold tracking-tight">Meecard</span>
      )}
    </span>
  )
}

function NavPill({ label, active = false }: { label: string; active?: boolean }) {
  return (
    <button
      type="button"
      aria-current={active ? "page" : undefined}
      className={cn(
        "ease-chrome inline-flex h-9 shrink-0 items-center whitespace-nowrap rounded-lg px-2.5 text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        active
          ? "bg-[var(--p-honey-soft)] font-semibold text-primary"
          : "font-medium text-muted-foreground hover:text-foreground",
      )}
    >
      {label}
    </button>
  )
}

function NavTab({
  label,
  active = false,
  leading,
  trailing,
}: {
  label: string
  active?: boolean
  leading?: React.ReactNode
  trailing?: React.ReactNode
}) {
  return (
    <button
      type="button"
      aria-current={active ? "page" : undefined}
      className={cn(
        "ease-chrome relative inline-flex h-11 shrink-0 items-center gap-1.5 whitespace-nowrap px-2.5 text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring",
        active
          ? "font-semibold text-foreground after:absolute after:inset-x-2 after:bottom-0 after:h-0.5 after:rounded-full after:bg-primary"
          : "font-medium text-muted-foreground hover:text-foreground",
      )}
    >
      {leading}
      {label}
      {trailing}
    </button>
  )
}

function GamePill() {
  return (
    <button
      type="button"
      aria-label="เลือกเกม เกมปัจจุบัน OPCG"
      className="flex h-9 shrink-0 items-center gap-1.5 rounded-lg px-2 hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      <span className="size-2 shrink-0 rounded-full bg-primary" aria-hidden />
      <span className="text-body-sm font-semibold">OPCG</span>
      <ChevronDown className="size-3.5 text-muted-foreground" aria-hidden />
    </button>
  )
}

function SetPicker({
  set,
  onNextSet,
  compact = false,
}: {
  set: PrototypeSet
  onNextSet: () => void
  compact?: boolean
}) {
  return (
    <button
      type="button"
      onClick={onNextSet}
      aria-label={`เลือกชุดการ์ด ชุดปัจจุบัน ${set.code} ${set.name}`}
      className={cn(
        "flex h-11 min-w-0 items-center gap-2 rounded-lg px-2 text-left hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring",
        compact ? "max-w-[240px]" : "max-w-[300px]",
      )}
    >
      <PackArtwork set={set} compact={compact} />
      <span className="min-w-0 flex-1">
        <span className="block truncate text-micro text-primary">
          ชุดล่าสุด · {set.code}
        </span>
        <span className="block truncate text-label text-foreground">
          {set.name}
        </span>
      </span>
      <ChevronDown className="size-4 shrink-0 text-muted-foreground" aria-hidden />
    </button>
  )
}

function SearchField({ className }: { className?: string }) {
  return (
    <button
      type="button"
      aria-label="ค้นหาการ์ด"
      className={cn(
        "hairline flex h-10 min-w-0 items-center gap-2 rounded-full bg-card px-3.5 text-left text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        className,
      )}
    >
      <Search className="size-4 shrink-0" aria-hidden />
      <span className="min-w-0 flex-1 truncate text-body-sm">
        ค้นหาชื่อหรือรหัสการ์ด...
      </span>
      <kbd className="hairline shrink-0 rounded-md bg-background px-1.5 py-0.5 font-sans text-micro text-muted-foreground">
        ⌘K
      </kbd>
    </button>
  )
}

function UtilityIcon({
  icon: Icon,
  label,
  badge,
  dot = false,
}: {
  icon: typeof Bell
  label: string
  badge?: string
  dot?: boolean
}) {
  return (
    <IconButton aria-label={label} size="lg" className="relative rounded-full">
      <Icon className="size-[18px]" aria-hidden />
      {badge && (
        <span className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-danger px-1 text-[10px] font-bold leading-none text-white">
          {badge}
        </span>
      )}
      {dot && (
        <span
          className="absolute right-2 top-2 size-2 rounded-full bg-danger"
          aria-hidden
        />
      )}
    </IconButton>
  )
}

function UpgradePill() {
  return (
    <button
      type="button"
      className="ease-chrome flex h-9 shrink-0 items-center gap-1 rounded-full border border-primary/30 px-3 text-sm font-semibold text-primary transition-colors hover:bg-primary/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      <Zap className="size-3" aria-hidden />
      อัปเกรด
    </button>
  )
}

function ProfileButton() {
  return (
    <button
      type="button"
      aria-label="เปิดเมนูโปรไฟล์"
      className="flex h-11 shrink-0 items-center gap-1 rounded-full pl-1 pr-1.5 hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      <span className="hairline grid size-8 place-items-center rounded-full bg-[var(--p-honey-soft)] text-primary">
        <User className="size-4" aria-hidden />
      </span>
      <ChevronDown className="size-3.5 text-muted-foreground" aria-hidden />
    </button>
  )
}

function HoneyItem() {
  return (
    <button
      type="button"
      className="ease-chrome flex h-9 shrink-0 items-center gap-1.5 rounded-full px-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      <span className="text-sm leading-none" aria-hidden>
        🍯
      </span>
      Honey
      <span className="font-bold tabular-nums text-amber-600 dark:text-amber-400">
        1,250
      </span>
    </button>
  )
}

function UtilityNavItem({
  icon: Icon,
  label,
  iconClassName,
}: {
  icon: typeof Briefcase
  label: string
  iconClassName?: string
}) {
  return (
    <button
      type="button"
      className="ease-chrome flex h-9 shrink-0 items-center gap-1.5 rounded-full px-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      <Icon className={cn("size-3.5", iconClassName)} aria-hidden />
      {label}
    </button>
  )
}

function TickerChip({
  code,
  price,
  change,
}: {
  code: string
  price: string
  change: number
}) {
  const up = change > 0
  const Arrow = up ? ArrowUp : ArrowDown
  return (
    <span className="flex shrink-0 items-baseline gap-1.5 whitespace-nowrap">
      <span className="text-label font-semibold text-foreground">{code}</span>
      <span className="font-price text-sm tabular-nums text-muted-foreground">
        {price}
      </span>
      <span
        className={cn(
          "inline-flex items-center gap-0.5 font-price text-xs font-medium tabular-nums",
          up ? "text-price-up" : "text-price-down",
        )}
      >
        <Arrow className="size-3" aria-hidden />
        <span className="sr-only">{up ? "up" : "down"}</span>
        {up ? "+" : ""}
        {change.toFixed(1)}%
      </span>
    </span>
  )
}

/* ---------------------------------------------------------------- concepts */

function PrimaryNavRow({ withProfile = true }: { withProfile?: boolean }) {
  return (
    <div className="flex h-14 min-w-0 items-center gap-1 px-3">
      <BrandMark />
      <nav className="flex min-w-0 items-center gap-0.5" aria-label="เมนูหลัก">
        <NavPill label="หน้าแรก" />
        <NavPill label="ชุดการ์ด" active />
        <NavPill label="เด็คและเครื่องมือ" />
        <NavPill label="ซื้อขาย" />
      </nav>
      <div className="flex-1" />
      <div className="flex shrink-0 items-center gap-0.5">
        <UtilityNavItem
          icon={Briefcase}
          label="พอร์ต"
          iconClassName="text-muted-foreground/60"
        />
        <UtilityNavItem icon={Heart} label="รายการโปรด" iconClassName="text-primary" />
        <HoneyItem />
        {withProfile && (
          <>
            <span className="mx-1 h-5 w-px bg-border/40" aria-hidden />
            <ProfileButton />
          </>
        )}
      </div>
    </div>
  )
}

function NavDeckConcept({
  activeSet,
  onNextSet,
}: {
  activeSet: PrototypeSet
  onNextSet: () => void
}) {
  return (
    <div className="hairline-b">
      <PrimaryNavRow />
      <div className="hairline-t flex h-12 min-w-0 items-center gap-1.5 bg-[var(--p-s1)] px-3">
        <GamePill />
        <span className="h-5 w-px shrink-0 bg-border/40" aria-hidden />
        <SetPicker set={activeSet} onNextSet={onNextSet} />
        <div className="flex-1" />
        <UpgradePill />
        <UtilityIcon icon={MessageCircle} label="เปิดแชท มีข้อความใหม่ 3 รายการ" badge="3" />
        <UtilityIcon icon={Bell} label="ดูการแจ้งเตือน มีรายการใหม่" dot />
        <span className="mx-0.5 h-5 w-px shrink-0 bg-border/40" aria-hidden />
        <SearchField className="w-72" />
      </div>
    </div>
  )
}

function CommandDeckConcept({
  activeSet,
  onNextSet,
}: {
  activeSet: PrototypeSet
  onNextSet: () => void
}) {
  return (
    <div className="hairline-b">
      <div className="flex h-14 min-w-0 items-center gap-1.5 px-3">
        <BrandMark withWordmark={false} />
        <GamePill />
        <span className="h-5 w-px shrink-0 bg-border/40" aria-hidden />
        <SetPicker set={activeSet} onNextSet={onNextSet} compact />
        <div className="flex min-w-0 flex-1 justify-center px-3">
          <SearchField className="w-full max-w-xl" />
        </div>
        <div className="flex shrink-0 items-center gap-0.5">
          <UpgradePill />
          <UtilityIcon icon={MessageCircle} label="เปิดแชท มีข้อความใหม่ 3 รายการ" badge="3" />
          <UtilityIcon icon={Bell} label="ดูการแจ้งเตือน มีรายการใหม่" dot />
          <span className="mx-1 h-5 w-px bg-border/40" aria-hidden />
          <ProfileButton />
        </div>
      </div>
      <nav
        className="hairline-t flex h-11 min-w-0 items-center gap-0.5 px-3"
        aria-label="เมนูหลัก"
      >
        <NavTab label="หน้าแรก" />
        <NavTab label="ชุดการ์ด" active />
        <NavTab label="เด็คและเครื่องมือ" />
        <NavTab label="ซื้อขาย" />
        <div className="flex-1" />
        <NavTab
          label="พอร์ต"
          leading={
            <Briefcase className="size-3.5 text-muted-foreground/60" aria-hidden />
          }
        />
        <NavTab
          label="รายการโปรด"
          leading={<Heart className="size-3.5 text-primary" aria-hidden />}
        />
        <NavTab
          label="Honey"
          leading={
            <span className="text-sm leading-none" aria-hidden>
              🍯
            </span>
          }
          trailing={
            <span className="font-bold tabular-nums text-amber-600 dark:text-amber-400">
              1,250
            </span>
          }
        />
      </nav>
    </div>
  )
}

function MarketDeckConcept({
  activeSet,
  onNextSet,
}: {
  activeSet: PrototypeSet
  onNextSet: () => void
}) {
  return (
    <div className="hairline-b">
      <PrimaryNavRow />
      <div className="hairline-t flex h-12 min-w-0 items-center gap-1.5 bg-[var(--p-s1)] px-3">
        <GamePill />
        <span className="h-5 w-px shrink-0 bg-border/40" aria-hidden />
        <SetPicker set={activeSet} onNextSet={onNextSet} compact />
        <div className="flex min-w-0 flex-1 items-center justify-center gap-5 overflow-hidden px-3 [mask-image:linear-gradient(to_right,transparent,black_20px,black_calc(100%-20px),transparent)]">
          {TICKER_ITEMS.map((item) => (
            <TickerChip key={item.code} {...item} />
          ))}
        </div>
        <SearchField className="w-56" />
        <UtilityIcon icon={MessageCircle} label="เปิดแชท มีข้อความใหม่ 3 รายการ" badge="3" />
        <UtilityIcon icon={Bell} label="ดูการแจ้งเตือน มีรายการใหม่" dot />
      </div>
    </div>
  )
}

/* ------------------------------------------------------------- page shell */

const subscribeNever = () => () => {}

const FOLD_ROWS = [
  { name: "Monkey.D.Luffy", code: "OP15-119 · SEC", price: "฿18,900", change: 4.2 },
  { name: "Shanks", code: "OP13-118 · SEC", price: "฿12,500", change: 5.4 },
  { name: "Roronoa Zoro", code: "OP01-001 · L", price: "฿1,150", change: -1.3 },
] as const

function HomeFold({ activeSet }: { activeSet: PrototypeSet }) {
  return (
    <div className="px-8 pb-10 pt-8">
      <div className="flex items-end justify-between gap-4">
        <div>
          <h3 className="text-h2">ราคาตลาดการ์ดวันพีชวันนี้</h3>
          <p className="mt-1 text-meta">
            ติดตาม 3,838 การ์ด จาก 51 ชุด · ชุดที่เลือก {activeSet.code}{" "}
            {activeSet.name}
          </p>
        </div>
        <span className="text-label text-primary">ดูทั้งหมด</span>
      </div>
      <div className="mt-4 divide-y divide-border/60">
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

export default function NavbarPrototypePage() {
  const [concept, setConcept] = useState<Concept>("navdeck")
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
  const [activeSetIndex, setActiveSetIndex] = useState(0)
  const activeSet = PROTOTYPE_SETS[activeSetIndex] ?? PROTOTYPE_SETS[0]
  const conceptCopy = CONCEPT_COPY[concept]

  const nextSet = () => {
    setActiveSetIndex((index) => (index + 1) % PROTOTYPE_SETS.length)
  }

  return (
    <main className="min-h-screen bg-background px-4 py-8 text-foreground sm:px-6 lg:px-10">
      <div className="mx-auto max-w-[1200px]">
        <h1 className="text-h1">Navbar สองชั้น — แยก “ไปไหน” ออกจาก “กำลังดูอะไร”</h1>
        <p className="mt-2 max-w-3xl text-body text-muted-foreground">
          ทั้งสามแบบใช้ของชิ้นเดียวกันทั้งหมดตามที่เบสลิสต์มา
          ต่างกันแค่ว่าให้ชั้นไหนนำ — เมนูนำ ค้นหานำ หรือราคานำ
        </p>

        <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
          <div className="overflow-x-auto pb-1">
            <SegmentedControl
              options={CONCEPT_OPTIONS}
              value={concept}
              onChange={setConcept}
              ariaLabel="เลือกแบบ Navbar"
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
          aria-label="ตัวอย่าง Navbar บนจอ desktop"
          className="mt-4 overflow-x-auto rounded-2xl shadow-[0_18px_60px_rgba(28,20,12,0.14)] ring-1 ring-border"
        >
          <div className="min-w-[1080px] bg-background text-foreground">
            {concept === "navdeck" ? (
              <NavDeckConcept activeSet={activeSet} onNextSet={nextSet} />
            ) : concept === "command" ? (
              <CommandDeckConcept activeSet={activeSet} onNextSet={nextSet} />
            ) : (
              <MarketDeckConcept activeSet={activeSet} onNextSet={nextSet} />
            )}
            <HomeFold activeSet={activeSet} />
          </div>
        </section>
        <p className="mt-3 text-meta">
          ตัวเลขและราคาเป็นข้อมูลตัวอย่างเพื่อดูสัดส่วนเท่านั้น · แบบทั้งหมดเป็นจอ
          desktop (≥md) — มือถือยังใช้ header + bottom nav เดิม · กดชื่อชุดเพื่อสลับ
          OP15 → OP14 → OP13 ได้
        </p>

        <section className="mt-8 grid gap-6 md:grid-cols-[minmax(0,1fr)_280px]">
          <div className="border-l-2 border-primary pl-4">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-h3">{conceptCopy.name}</h2>
              {concept === "command" && (
                <span className="rounded-full bg-primary/15 px-2 py-1 text-micro text-primary">
                  ฉันแนะนำ
                </span>
              )}
            </div>
            <p className="mt-1.5 max-w-2xl text-body-sm">{conceptCopy.summary}</p>
            <p className="mt-1 max-w-2xl text-meta">
              Trade-off: {conceptCopy.tradeoff}
            </p>
          </div>
          <div className="space-y-2 text-body-sm text-muted-foreground">
            <p>• กด A/B/C เพื่อเทียบทั้งสามแบบบนหน้าเดียวกัน</p>
            <p>• กดไอคอนดวงจันทร์/ดวงอาทิตย์ เช็ก Light และ Dark</p>
            <p>• หน้าเว็บจริงยังไม่ถูกแตะ — หน้านี้เป็น mockup ล้วน</p>
          </div>
        </section>
      </div>
    </main>
  )
}
