"use client"

import Image from "next/image"
import { useState } from "react"
import {
  Bell,
  Check,
  ChevronDown,
  LayoutGrid,
  Moon,
  Search,
  Sun,
} from "lucide-react"

import { IconButton } from "@/components/ui/icon-button"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { SegmentedControl } from "@/components/ui/segmented-control"
import { cn } from "@/lib/utils"

type Direction = "spotlight" | "shelf" | "stamp"
type PreviewTheme = "light" | "dark"

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

const DIRECTION_OPTIONS = [
  { value: "spotlight", label: "A · Spotlight" },
  { value: "shelf", label: "B · Shelf" },
  { value: "stamp", label: "C · Stamp" },
] as const

const DIRECTION_COPY: Record<
  Direction,
  { name: string; summary: string; tradeoff: string }
> = {
  spotlight: {
    name: "Pack Spotlight",
    summary:
      "ให้ภาพแพ็กจริงเป็นจุดเด่นหนึ่งจุด พร้อมรหัสและชื่อชุดในตำแหน่งเดียว",
    tradeoff: "สมดุลที่สุดระหว่างความมีชีวิต ความชัด และพื้นที่บนมือถือ",
  },
  shelf: {
    name: "Latest Pack Shelf",
    summary:
      "โชว์แพ็กล่าสุดสองชุดให้แตะไปได้ทันที เหมาะกับคนที่เข้ามาเลือกชุดก่อน",
    tradeoff: "เลือกได้เร็วที่สุด แต่ชื่อชุดจะมีน้ำหนักน้อยลง",
  },
  stamp: {
    name: "Set Stamp",
    summary:
      "ใช้รหัสชุดเป็นตราประทับชัด ๆ แล้วให้ชื่อชุดวิ่งต่อแบบเรียบคม",
    tradeoff: "นิ่งและจำง่าย แต่พลังจากภาพการ์ดน้อยกว่าอีกสองแบบ",
  },
}

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
        compact ? "h-8 w-6" : "h-10 w-7",
      )}
    >
      <Image
        src={set.imageUrl}
        alt=""
        fill
        sizes={compact ? "24px" : "28px"}
        className={cn(
          "object-contain",
          compact ? "scale-[1.65]" : "scale-150",
        )}
      />
    </span>
  )
}

function GameIdentity({
  previewTheme,
  compact = false,
}: {
  previewTheme: PreviewTheme
  compact?: boolean
}) {
  const [open, setOpen] = useState(false)

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        render={
          <button
            type="button"
            aria-label="เลือกเกม เกมปัจจุบัน OPCG"
            className={cn(
              "flex h-11 shrink-0 items-center justify-center gap-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring",
              compact ? "px-0.5" : "px-1.5",
            )}
          />
        }
      >
        <span className="size-2 shrink-0 rounded-full bg-primary" aria-hidden />
        <span className="text-body-sm font-semibold">OPCG</span>
        <ChevronDown className="size-3.5 text-muted-foreground" aria-hidden />
      </PopoverTrigger>
      <PopoverContent
        align="start"
        sideOffset={6}
        collisionPadding={12}
        showArrow={false}
        className={cn(
          "w-60 p-2",
          previewTheme === "dark" && "dark",
        )}
        style={{ colorScheme: previewTheme }}
      >
        <p className="px-2 pb-1 pt-0.5 text-eyebrow">เลือกเกม</p>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="flex min-h-11 w-full items-center gap-2 rounded-lg px-2 text-left hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <span className="size-2 shrink-0 rounded-full bg-primary" aria-hidden />
          <span className="min-w-0 flex-1 text-body-sm font-medium">
            ONE PIECE CARD GAME
          </span>
          <Check className="size-4 shrink-0 text-primary" aria-hidden />
        </button>
        <button
          type="button"
          disabled
          className="flex min-h-11 w-full items-center gap-2 rounded-lg px-2 text-left text-muted-foreground opacity-60"
        >
          <span className="size-2 shrink-0 rounded-full bg-muted-foreground/50" aria-hidden />
          <span className="min-w-0 flex-1 text-body-sm">Pokémon TCG</span>
          <span className="text-micro">เร็ว ๆ นี้</span>
        </button>
      </PopoverContent>
    </Popover>
  )
}

function SpotlightCatalog({
  activeSet,
  onNextSet,
  previewTheme,
}: {
  activeSet: PrototypeSet
  onNextSet: () => void
  previewTheme: PreviewTheme
}) {
  return (
    <div className="flex min-w-0 flex-1 items-center">
      <GameIdentity previewTheme={previewTheme} />
      <span className="h-6 w-px shrink-0 bg-border" aria-hidden />
      <button
        type="button"
        onClick={onNextSet}
        aria-label={`เลือกชุดการ์ด ชุดปัจจุบัน ${activeSet.code} ${activeSet.name}`}
        className="flex h-11 min-w-0 flex-1 items-center gap-2 px-1.5 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring"
      >
        <PackArtwork set={activeSet} />
        <span className="min-w-0 flex-1">
          <span className="block truncate text-micro text-primary">
            ชุดล่าสุด · {activeSet.code}
          </span>
          <span className="block truncate text-label text-foreground">
            {activeSet.name}
          </span>
        </span>
        <ChevronDown
          className="size-4 shrink-0 text-muted-foreground"
          aria-hidden
        />
      </button>
    </div>
  )
}

function ShelfCatalog({
  activeSet,
  onSelectSet,
  previewTheme,
}: {
  activeSet: PrototypeSet
  onSelectSet: (set: PrototypeSet) => void
  previewTheme: PreviewTheme
}) {
  const [pickerOpen, setPickerOpen] = useState(false)

  return (
    <div className="flex min-w-0 flex-1 items-center">
      <GameIdentity compact previewTheme={previewTheme} />
      <span className="mx-0.5 h-6 w-px shrink-0 bg-border" aria-hidden />
      <div className="flex min-w-0 flex-1 items-center justify-end">
        {PROTOTYPE_SETS.slice(0, 2).map((set) => {
          const selected = set.code === activeSet.code

          return (
            <button
              key={set.code}
              type="button"
              onClick={() => onSelectSet(set)}
              aria-label={`ไปที่ชุด ${set.code} ${set.name}`}
              aria-pressed={selected}
              className={cn(
                "relative flex size-11 shrink-0 items-center justify-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring",
                selected &&
                  "after:absolute after:bottom-0.5 after:h-0.5 after:w-5 after:rounded-full after:bg-primary",
              )}
            >
              <PackArtwork set={set} compact />
            </button>
          )
        })}
        <Popover open={pickerOpen} onOpenChange={setPickerOpen}>
          <PopoverTrigger
            render={
              <button
                type="button"
                aria-label="ดูชุดการ์ดทั้งหมด"
                className="flex size-11 shrink-0 items-center justify-center text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring"
              />
            }
          >
            <LayoutGrid className="size-[18px]" aria-hidden />
          </PopoverTrigger>
          <PopoverContent
            align="end"
            sideOffset={6}
            collisionPadding={12}
            showArrow={false}
            className={cn(
              "w-64 p-2",
              previewTheme === "dark" && "dark",
            )}
            style={{ colorScheme: previewTheme }}
          >
            <p className="px-2 pb-1 pt-0.5 text-eyebrow">เลือกชุดการ์ด</p>
            {PROTOTYPE_SETS.map((set) => (
              <button
                key={set.code}
                type="button"
                onClick={() => {
                  onSelectSet(set)
                  setPickerOpen(false)
                }}
                className="flex min-h-12 w-full items-center gap-2 rounded-lg px-2 text-left hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <PackArtwork set={set} compact />
                <span className="min-w-0 flex-1">
                  <span className="block text-label font-semibold">{set.code}</span>
                  <span className="block truncate text-meta">{set.name}</span>
                </span>
                {set.code === activeSet.code && (
                  <Check className="size-4 shrink-0 text-primary" aria-hidden />
                )}
              </button>
            ))}
          </PopoverContent>
        </Popover>
      </div>
    </div>
  )
}

function StampCatalog({
  activeSet,
  onNextSet,
  previewTheme,
}: {
  activeSet: PrototypeSet
  onNextSet: () => void
  previewTheme: PreviewTheme
}) {
  return (
    <div className="flex min-w-0 flex-1 items-center">
      <GameIdentity compact previewTheme={previewTheme} />
      <span className="mx-0.5 h-6 w-px shrink-0 bg-border" aria-hidden />
      <button
        type="button"
        onClick={onNextSet}
        aria-label={`เลือกชุดการ์ด ชุดปัจจุบัน ${activeSet.code} ${activeSet.name}`}
        className="flex h-11 min-w-0 flex-1 items-center gap-2 px-1 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring"
      >
        <span className="flex h-8 min-w-10 shrink-0 items-center justify-center rounded-md bg-foreground px-1 font-mono text-xs font-bold text-background">
          {activeSet.code}
        </span>
        <span className="min-w-0 flex-1 truncate text-label text-foreground">
          {activeSet.name}
        </span>
        <ChevronDown
          className="size-4 shrink-0 text-muted-foreground"
          aria-hidden
        />
      </button>
    </div>
  )
}

function PrototypeNotifications({
  previewTheme,
}: {
  previewTheme: PreviewTheme
}) {
  return (
    <Popover>
      <PopoverTrigger
        render={
          <IconButton
            aria-label="ดูการแจ้งเตือน"
            size="lg"
            className="rounded-none"
          >
            <Bell className="size-[18px]" aria-hidden />
          </IconButton>
        }
      />
      <PopoverContent
        align="end"
        sideOffset={6}
        collisionPadding={12}
        showArrow={false}
        className={cn(
          "w-60 p-3",
          previewTheme === "dark" && "dark",
        )}
        style={{ colorScheme: previewTheme }}
      >
        <p className="text-h5">การแจ้งเตือน</p>
        <p className="mt-1 text-meta">ยังไม่มีรายการใหม่ในตัวอย่างนี้</p>
      </PopoverContent>
    </Popover>
  )
}

function PrototypeHeader({
  direction,
  previewTheme,
  activeSet,
  onNextSet,
  onSelectSet,
  onToggleTheme,
}: {
  direction: Direction
  previewTheme: PreviewTheme
  activeSet: PrototypeSet
  onNextSet: () => void
  onSelectSet: (set: PrototypeSet) => void
  onToggleTheme: () => void
}) {
  return (
    <header className="hairline-b flex h-14 min-w-0 items-center gap-0 px-2">
      <span
        className="flex size-11 shrink-0 items-center justify-center"
      >
        <Image
          src="/meecard.png"
          alt="Meecard"
          width={754}
          height={694}
          className="h-auto w-[26px] select-none"
          priority
        />
      </span>

      {direction === "spotlight" ? (
        <SpotlightCatalog
          activeSet={activeSet}
          onNextSet={onNextSet}
          previewTheme={previewTheme}
        />
      ) : direction === "shelf" ? (
        <ShelfCatalog
          activeSet={activeSet}
          onSelectSet={onSelectSet}
          previewTheme={previewTheme}
        />
      ) : (
        <StampCatalog
          activeSet={activeSet}
          onNextSet={onNextSet}
          previewTheme={previewTheme}
        />
      )}

      <PrototypeNotifications previewTheme={previewTheme} />
      <IconButton
        aria-label={previewTheme === "dark" ? "ใช้โหมดสว่าง" : "ใช้โหมดมืด"}
        onClick={onToggleTheme}
        size="lg"
        className="rounded-none"
      >
        {previewTheme === "dark" ? (
          <Sun className="size-[18px]" aria-hidden />
        ) : (
          <Moon className="size-[18px]" aria-hidden />
        )}
      </IconButton>
    </header>
  )
}

function HomeFold({ activeSet }: { activeSet: PrototypeSet }) {
  return (
    <div className="px-4 pb-10 pt-7">
      <section className="text-center">
        <p className="text-meta">ทุกอย่างของการ์ดเกม ในที่เดียว</p>
        <h2 className="mt-1.5 text-h1">เช็คราคาการ์ดวันพีช</h2>
        <p className="mt-1 text-body-sm font-semibold">
          ราคากลาง · เทรนด์ · PSA 10
        </p>

        <div className="hairline mt-5 flex h-12 items-center gap-2 rounded-xl bg-card px-3 text-left text-muted-foreground">
          <Search className="size-[18px] shrink-0" aria-hidden />
          <span className="truncate text-body-sm">ค้นหาชื่อหรือรหัสการ์ด...</span>
        </div>
      </section>

      <section className="mt-7">
        <div className="flex items-end justify-between gap-3">
          <div>
            <p className="text-meta">ตลาดการ์ดวันนี้</p>
            <h3 className="text-h3">ราคาการ์ดล่าสุด</h3>
          </div>
          <span className="text-label text-primary">ดูทั้งหมด</span>
        </div>

        <div className="mt-3 divide-y divide-border">
          <div className="flex min-h-16 items-center gap-3 py-2.5">
            <PackArtwork set={activeSet} compact />
            <div className="min-w-0 flex-1">
              <p className="truncate text-body-sm font-medium">
                การ์ดเด่นจากชุด {activeSet.code}
              </p>
              <p className="truncate text-meta">{activeSet.name}</p>
            </div>
            <div className="text-right">
              <p className="text-price">฿—</p>
              <p className="text-meta">Raw</p>
            </div>
          </div>
          <div className="flex min-h-16 items-center gap-3 py-2.5">
            <span className="flex h-8 w-6 shrink-0 items-center justify-center rounded bg-muted text-micro text-muted-foreground">
              SR
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-body-sm font-medium">
                การ์ดมาแรงประจำวัน
              </p>
              <p className="text-meta">อัปเดตล่าสุดวันนี้</p>
            </div>
            <div className="text-right">
              <p className="text-price">฿—</p>
              <p className="text-meta">PSA 10</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}

export default function HeaderNavigationPrototypePage() {
  const [direction, setDirection] = useState<Direction>("spotlight")
  const [previewTheme, setPreviewTheme] = useState<PreviewTheme>("light")
  const [activeSetIndex, setActiveSetIndex] = useState(0)
  const activeSet = PROTOTYPE_SETS[activeSetIndex] ?? PROTOTYPE_SETS[0]
  const directionCopy = DIRECTION_COPY[direction]

  const selectSet = (set: PrototypeSet) => {
    const nextIndex = PROTOTYPE_SETS.findIndex(
      (candidate) => candidate.code === set.code,
    )
    if (nextIndex >= 0) setActiveSetIndex(nextIndex)
  }

  const nextSet = () => {
    setActiveSetIndex(
      (currentIndex) => (currentIndex + 1) % PROTOTYPE_SETS.length,
    )
  }

  return (
    <main className="min-h-screen bg-background py-6 text-foreground sm:px-6 sm:py-10">
      <div className="mx-auto grid min-w-0 max-w-6xl gap-8 md:grid-cols-[minmax(0,1fr)_390px] md:items-start md:gap-x-12 md:gap-y-0">
        <section className="min-w-0 px-4 sm:px-0 md:col-start-1 md:row-start-1">
          <p className="text-eyebrow">Prototype · Mobile global navigation</p>
          <h1 className="mt-2 text-h1">ทำให้ Navbar มีชีวิต โดยไม่กลับไปเป็นกล่องใหญ่</h1>
          <p className="mt-3 max-w-2xl text-body text-muted-foreground">
            ทั้งสามแบบใช้ภาพแพ็กจริงเป็นพลังหลัก แยก “เกม” กับ “ชุด” ชัดเจน
            และยังคงความสูงแถบไว้ที่ 56px
          </p>

          <div className="mt-6 overflow-x-auto pb-1">
            <SegmentedControl
              options={DIRECTION_OPTIONS}
              value={direction}
              onChange={setDirection}
              ariaLabel="เลือกทิศทาง Navbar"
              className="min-w-max"
              compactVisual={false}
            />
          </div>
        </section>

        <section
          aria-label="ตัวอย่าง Navbar บนมือถือ"
          className="min-w-0 md:col-start-2 md:row-span-2 md:row-start-1"
        >
          <div
            className={cn(
              "mx-auto min-h-[640px] w-full max-w-[390px] overflow-hidden bg-background text-foreground sm:rounded-[1.75rem] sm:shadow-[0_18px_60px_rgba(28,20,12,0.16)] sm:ring-1 sm:ring-border",
              previewTheme === "dark" && "dark",
            )}
            style={{ colorScheme: previewTheme }}
          >
            <PrototypeHeader
              direction={direction}
              previewTheme={previewTheme}
              activeSet={activeSet}
              onNextSet={nextSet}
              onSelectSet={selectSet}
              onToggleTheme={() =>
                setPreviewTheme((theme) =>
                  theme === "dark" ? "light" : "dark",
                )
              }
            />
            <HomeFold activeSet={activeSet} />
          </div>
          <p className="mx-auto mt-3 max-w-[390px] px-4 text-center text-meta sm:px-0">
            ข้อมูลในจอเป็นตัวอย่างเพื่อดูสัดส่วน · หน้าจริงยังไม่ถูกเปลี่ยน
          </p>
        </section>

        <section className="min-w-0 px-4 sm:px-0 md:col-start-1 md:row-start-2 md:pt-6">
          <div className="border-l-2 border-primary pl-4">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-h3">{directionCopy.name}</h2>
              {direction === "spotlight" && (
                <span className="rounded-full bg-primary/15 px-2 py-1 text-micro text-primary">
                  ฉันแนะนำ
                </span>
              )}
            </div>
            <p className="mt-1.5 text-body-sm">{directionCopy.summary}</p>
            <p className="mt-1 text-meta">Trade-off: {directionCopy.tradeoff}</p>
          </div>

          <div className="mt-7 space-y-2 text-body-sm text-muted-foreground">
            <p>• กดตัวเลือก A/B/C เพื่อเทียบในบริบทหน้าแรกจริง</p>
            <p>• กดชื่อชุดหรือภาพแพ็ก เพื่อสลับ OP15 → OP14 → OP13</p>
            <p>• กดไอคอนดวงจันทร์/ดวงอาทิตย์ เพื่อเช็ก Light และ Dark</p>
          </div>
        </section>
      </div>
    </main>
  )
}
