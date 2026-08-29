"use client"

import { useState, useSyncExternalStore } from "react"
import { useTheme } from "next-themes"
import { Camera, Moon, Search, Sun, X } from "lucide-react"

import { IconButton } from "@/components/ui/icon-button"
import { SegmentedControl } from "@/components/ui/segmented-control"
import { cn } from "@/lib/utils"

/* ------------------------------------------------------------------ data */

type Variant = "current" | "clean" | "hint" | "cancel"

const VARIANT_OPTIONS = [
  { value: "current", label: "ปัจจุบัน" },
  { value: "clean", label: "A · เหลือปุ่มปิด" },
  { value: "hint", label: "B · ป้ายคีย์ลัด" },
  { value: "cancel", label: "C · ยกเลิก แบบ iOS" },
] as const

const VARIANT_COPY: Record<
  Variant,
  { name: string; summary: string; tradeoff: string }
> = {
  current: {
    name: "ปัจจุบัน — มี 4 อย่างเบียดกันในแถวเดียว",
    summary:
      "ไอคอนแว่น · ช่องพิมพ์ · ปุ่มล้าง · ปุ่ม \"ค้นหา\" สีทึบ · ป้าย ESC — สองอย่างหลังคือปัญหา",
    tradeoff: "—",
  },
  clean: {
    name: "A · เหลือปุ่มปิดอย่างเดียว",
    summary:
      "ตัดปุ่ม \"ค้นหา\" ออกเพราะซ้ำกับแถว \"ดูผลทั้งหมด\" ที่อยู่ในรายการผลลัพธ์อยู่แล้ว และคนพิมพ์เสร็จก็กด Enter · ส่วน ESC เปลี่ยนเป็นปุ่มกากบาทที่อ่านออกว่าเป็นปุ่มปิด ใช้ได้ทั้งคอมและมือถือเหมือนกัน",
    tradeoff:
      "คนที่ใช้คีย์บอร์ดจะไม่เห็นคำใบ้ว่ากด Esc ปิดได้ (ยังกดได้อยู่ แค่ไม่มีป้ายบอก)",
  },
  hint: {
    name: "B · ป้ายคีย์ลัดบนคอม · กากบาทบนมือถือ",
    summary:
      "บนคอมเก็บป้าย ESC ไว้เป็น \"คำใบ้คีย์ลัด\" จริงๆ (จาง ไม่ใช่ปุ่ม) เพราะคีย์บอร์ดมีปุ่มนั้นจริง · บนมือถือที่ไม่มีคีย์ ESC เปลี่ยนเป็นปุ่มกากบาทแทน — แต่ละอุปกรณ์ได้ของที่ใช้ได้จริง",
    tradeoff:
      "โค้ดต้องแยกสองทางตามขนาดจอ · ป้ายจางบนคอมอาจดูเหมือนกดไม่ได้ ทั้งที่กดได้",
  },
  cancel: {
    name: "C · ปุ่ม \"ยกเลิก\" แบบ iOS",
    summary:
      "แทนที่จะเป็นไอคอน ใช้คำว่า \"ยกเลิก\" ข้างช่องค้นหาแบบที่ iOS ทำ — อ่านออกทันทีว่ากดแล้วเกิดอะไร ไม่ต้องเดาความหมายไอคอน และเป็นท่าที่คนใช้มือถือคุ้นอยู่แล้ว",
    tradeoff:
      "กินความกว้างมากกว่าไอคอน ช่องพิมพ์เลยแคบลง · บนคอมอาจดูเหมือนแอปมือถือ",
  },
}

const NOTES = [
  "ปัญหาที่ 1 — ปุ่ม ESC: มันเป็นปุ่มปิดจริงๆ แต่ทำหน้าตาเป็นป้ายบอกคีย์ลัด คนเลยไม่รู้ว่ากดได้",
  "ปัญหาที่ 2 — บนมือถือไม่มีปุ่ม ESC บนคีย์บอร์ด ป้ายนี้เลยบอกทางลัดที่กดไม่ได้",
  "ปัญหาที่ 3 — ปุ่ม \"ค้นหา\" ซ้ำกับแถว \"ดูผลทั้งหมด\" ในรายการผลลัพธ์ และตอนยังไม่พิมพ์มันจางเป็นของตายกินที่เปล่าๆ",
  "ทุกแบบใหม่: ปุ่มกดได้จริงสูง 40px ขึ้นไป · ปุ่มล้างคำโผล่เฉพาะตอนมีคำในช่อง",
  "ดูทั้งกรอบคอมและกรอบมือถือพร้อมกัน เพราะปัญหาหลักอยู่ที่มือถือ",
] as const

/* ----------------------------------------------------------------- atoms */

function ClearButton() {
  return (
    <button
      type="button"
      aria-label="ล้างคำค้นหา"
      className="ease-chrome grid size-8 shrink-0 place-items-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
    >
      <X className="size-4" aria-hidden />
    </button>
  )
}

function SearchRow({
  variant,
  device,
  typed,
}: {
  variant: Variant
  device: "desktop" | "mobile"
  typed: boolean
}) {
  return (
    <div className="flex items-center gap-2 border-b border-hair px-3">
      <Search className="size-4 shrink-0 text-muted-foreground" aria-hidden />
      <span
        className={cn(
          "h-12 flex-1 truncate text-base leading-[3rem]",
          typed ? "text-foreground" : "text-muted-foreground",
        )}
      >
        {typed ? "luffy" : "ค้นหาการ์ด, ชุด, รหัส..."}
      </span>

      {typed && <ClearButton />}

      {variant === "current" && (
        <>
          <button
            type="button"
            disabled={!typed}
            className="min-h-11 shrink-0 rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground disabled:opacity-30 sm:min-h-0"
          >
            ค้นหา
          </button>
          <span className="hairline shrink-0 rounded-md bg-muted/40 px-1.5 py-0.5 font-mono text-micro text-muted-foreground">
            ESC
          </span>
        </>
      )}

      {variant === "clean" && (
        <button
          type="button"
          aria-label="ปิด"
          className="ease-chrome grid size-10 shrink-0 place-items-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          <X className="size-[18px]" aria-hidden />
        </button>
      )}

      {variant === "hint" &&
        (device === "desktop" ? (
          <span className="hairline shrink-0 rounded-md bg-muted/40 px-1.5 py-1 font-mono text-micro text-muted-foreground">
            ESC
          </span>
        ) : (
          <button
            type="button"
            aria-label="ปิด"
            className="ease-chrome grid size-10 shrink-0 place-items-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <X className="size-[18px]" aria-hidden />
          </button>
        ))}

      {variant === "cancel" && (
        <button
          type="button"
          className="ease-chrome -me-1 flex h-10 shrink-0 items-center rounded-full px-2.5 text-sm font-medium text-primary transition-colors hover:bg-primary/10"
        >
          ยกเลิก
        </button>
      )}
    </div>
  )
}

function PhotoRow() {
  return (
    <div className="border-b border-hair p-2">
      <div className="flex min-h-11 w-full items-center gap-2.5 rounded-xl px-3 text-left text-sm text-muted-foreground">
        <Camera className="size-4 text-primary" aria-hidden />
        <span className="flex-1">ค้นหาด้วยรูปภาพ</span>
      </div>
    </div>
  )
}

function ResultRows() {
  return (
    <div className="divide-y divide-border/60">
      {[
        { name: "Monkey.D.Luffy", code: "OP13-118 · P-SEC", price: "268,800 ฿" },
        { name: "Monkey.D.Luffy", code: "OP05-119 · SP", price: "209,580 ฿" },
      ].map((r) => (
        <div key={r.code} className="flex min-h-14 items-center gap-3 px-4 py-2">
          <span className="hairline h-9 w-7 shrink-0 rounded bg-card" aria-hidden />
          <span className="min-w-0 flex-1">
            <span className="block truncate text-body-sm font-medium">{r.name}</span>
            <span className="block truncate text-meta">{r.code}</span>
          </span>
          <span className="font-price text-sm font-semibold tabular-nums">
            {r.price}
          </span>
        </div>
      ))}
    </div>
  )
}

function Popup({
  variant,
  device,
  typed,
}: {
  variant: Variant
  device: "desktop" | "mobile"
  typed: boolean
}) {
  return (
    <div className="hairline overflow-hidden rounded-2xl bg-popover shadow-[0_18px_60px_rgba(28,20,12,0.18)]">
      <SearchRow variant={variant} device={device} typed={typed} />
      <PhotoRow />
      {typed ? (
        <ResultRows />
      ) : (
        <div className="px-4 py-6 text-center text-meta">
          ค้นหาล่าสุด · ยอดนิยม · มาแรง จะขึ้นตรงนี้
        </div>
      )}
    </div>
  )
}

/* ------------------------------------------------------------ page shell */

const subscribeNever = () => () => {}

export default function SearchHeaderProtoPage() {
  const [variant, setVariant] = useState<Variant>("clean")
  const [typed, setTyped] = useState(false)
  const { resolvedTheme, setTheme } = useTheme()
  const mounted = useSyncExternalStore(
    subscribeNever,
    () => true,
    () => false,
  )
  const isDark = mounted && resolvedTheme === "dark"
  const copy = VARIANT_COPY[variant]

  return (
    <main className="min-h-screen bg-background px-4 py-8 text-foreground sm:px-6 lg:px-10">
      <div className="mx-auto max-w-[1200px]">
        <h1 className="text-h1">หัวช่องค้นหา — ปุ่ม ESC กับปุ่มค้นหาควรเป็นยังไง</h1>
        <p className="mt-2 max-w-3xl text-body text-muted-foreground">
          ปุ่ม ESC ตอนนี้เป็นปุ่มปิดจริงๆ แต่ทำหน้าตาเป็นป้ายคีย์ลัด — และบนมือถือ
          ไม่มีปุ่ม ESC บนคีย์บอร์ดเลย ส่วนปุ่ม &ldquo;ค้นหา&rdquo; ก็ซ้ำกับแถว
          &ldquo;ดูผลทั้งหมด&rdquo; ที่อยู่ในรายการผลลัพธ์อยู่แล้ว · สามแบบนี้แก้คนละวิธี
        </p>

        <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-3">
            <div className="overflow-x-auto pb-1">
              <SegmentedControl
                options={VARIANT_OPTIONS}
                value={variant}
                onChange={setVariant}
                ariaLabel="เลือกแบบหัวช่องค้นหา"
                className="min-w-max"
                compactVisual={false}
              />
            </div>
            <button
              type="button"
              onClick={() => setTyped((v) => !v)}
              className="hairline ease-chrome h-10 shrink-0 rounded-full px-3.5 text-sm font-medium transition-colors hover:bg-muted"
            >
              {typed ? "ดูตอนยังไม่พิมพ์" : "ดูตอนพิมพ์แล้ว"}
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

        <section className="mt-6 grid gap-8 lg:grid-cols-[minmax(0,1fr)_390px]">
          <div>
            <p className="text-eyebrow mb-2">บนคอม</p>
            <Popup variant={variant} device="desktop" typed={typed} />
          </div>
          <div>
            <p className="text-eyebrow mb-2">บนมือถือ (390px)</p>
            <div className="hairline rounded-[2rem] bg-muted/20 p-3">
              <Popup variant={variant} device="mobile" typed={typed} />
            </div>
          </div>
        </section>

        <section className="mt-8 grid gap-6 md:grid-cols-[minmax(0,1fr)_320px]">
          <div className="border-l-2 border-primary pl-4">
            <h2 className="text-h3">{copy.name}</h2>
            <p className="mt-1.5 max-w-2xl text-body-sm">{copy.summary}</p>
            {copy.tradeoff !== "—" && (
              <p className="mt-1 max-w-2xl text-meta">ข้อแลก: {copy.tradeoff}</p>
            )}
          </div>
          <div className="space-y-2 text-body-sm text-muted-foreground">
            <p className="font-medium text-foreground">สิ่งที่ต้องรู้:</p>
            {NOTES.map((n) => (
              <p key={n}>• {n}</p>
            ))}
          </div>
        </section>
      </div>
    </main>
  )
}
