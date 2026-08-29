"use client"

import Image from "next/image"
import { useState, useSyncExternalStore } from "react"
import { useTheme } from "next-themes"
import {
  Camera,
  ImageIcon,
  Moon,
  RotateCcw,
  ScanSearch,
  Sun,
  Upload,
  X,
} from "lucide-react"

import { IconButton } from "@/components/ui/icon-button"
import { SegmentedControl } from "@/components/ui/segmented-control"
import { cn } from "@/lib/utils"
import { useProtoVariant } from "../_kit/use-proto-variant"

/* ------------------------------------------------------------------ data */

/** การ์ดที่ "ค้นเจอ" — ใบจริง รูปจริงจาก R2 · ไม่มี % ความมั่นใจ เพราะ
 *  ของจริง (`/api/cards/identify`) ไม่ได้ส่งค่านั้นกลับมา */
const FOUND = {
  name: "Monkey.D.Luffy",
  code: "OP13-118",
  rarity: "P-SEC",
  set: "OP13 · Carrying on His Will",
  img: "https://pub-e1c871a889eb42a4bd7dcdc3a5926f3c.r2.dev/op13/OP13-118_p3.png",
  raw: "294,400 ฿",
  psa10: "612,000 ฿",
} as const

const RUNNERS_UP = [
  { name: "Monkey.D.Luffy", code: "OP13-118", note: "พิมพ์ปกติ" },
  { name: "Monkey.D.Luffy", code: "OP05-119", note: "ลายอื่น" },
] as const

type Way = "current" | "drop" | "both"
type Stage = "idle" | "busy" | "result"

const WAY_OPTIONS = [
  { value: "current", label: "ปัจจุบัน · เปิดกล้องเต็มจอ" },
  { value: "drop", label: "ก · อัปโหลดอย่างเดียว" },
  { value: "both", label: "ข · อัปโหลด + กล้องเป็นตัวสำรอง" },
] as const

const WAY_VALUES = WAY_OPTIONS.map((o) => o.value)

const STAGE_OPTIONS = [
  { value: "idle", label: "1 · ยังไม่มีรูป" },
  { value: "busy", label: "2 · กำลังอ่านรูป" },
  { value: "result", label: "3 · ผลลัพธ์" },
] as const

const WAY_COPY: Record<Way, { name: string; good: string; bad: string }> = {
  current: {
    name: "ปัจจุบัน · เปิดกล้องเต็มจอ (ใช้ของมือถือมาทั้งดุ้น)",
    good: "โค้ดชุดเดียวคุมทั้งมือถือและคอม ไม่ต้องดูแลสองทาง · คนที่ต่อกล้องแยกไว้ถ่ายการ์ดใช้ได้ทันที",
    bad: "โน้ตบุ๊กกับ iMac มีแต่กล้องหน้า — เปิดมาเห็นหน้าตัวเองเต็มจอ 27 นิ้ว แล้วต้องยกการ์ดจ่อจอด้วยมือเดียว · กล้องหน้าโฟกัสระยะใกล้ไม่ได้ ตัวหนังสือบนการ์ดเลยเบลอจนอ่านเลขชุดไม่ออก ผลที่ AI ทายก็เพี้ยนตาม · ขอสิทธิ์กล้องบนคอมคนกดปฏิเสธง่าย แล้วสิทธิ์นั้นเสียถาวรจนกว่าจะไปแก้ในตั้งค่าเบราว์เซอร์เอง",
  },
  drop: {
    name: "ก · อัปโหลดอย่างเดียว — ลากรูปมาทิ้ง หรือกด Ctrl+V วางเลย",
    good: "ตรงกับสิ่งที่คนทำจริงบนคอม: รูปการ์ดที่จะเช็คราคามักมาจากประกาศขายในเฟซ/ไลน์อยู่แล้ว — คลิกขวาก๊อป แล้ววางในกล่องนี้ จบใน 2 วินาที ไม่ต้องเซฟลงเครื่องก่อน · ลากไฟล์จากโฟลเดอร์มาทิ้งก็ได้ · ไม่ต้องขอสิทธิ์อะไรเลย · รูปจากมือถือ/กล้องคมกว่าเว็บแคมมาก AI จึงทายแม่นกว่า · กล่องเล็กกลางจอ ไม่กินทั้งจอโดยไม่จำเป็น",
    bad: "คนที่ต่อกล้อง USB หรือใช้มือถือเป็นเว็บแคมไว้ถ่ายการ์ด จะถ่ายสดจากหน้านี้ไม่ได้ ต้องถ่ายเก็บเป็นไฟล์ก่อน (คนกลุ่มนี้บนเว็บเราน้อยมาก)",
  },
  both: {
    name: "ข · อัปโหลดเป็นพระเอก แต่มีปุ่ม “ใช้กล้องคอม” เล็กๆ ไว้ล่าง",
    good: "ได้ข้อดีของแบบ ก ครบ และไม่ตัดทางคนที่มีกล้องดีๆ ต่ออยู่ · ปุ่มกล้องเป็นตัวรอง จึงไม่มีใครถูกเปิดกล้องใส่หน้าโดยไม่ตั้งใจ — ต้องกดเองเท่านั้น",
    bad: "มีสองทางให้เลือกบนหน้าเดียว = ต้องอธิบายเพิ่มอีกบรรทัด และต้องดูแลโค้ดกล้องบนคอมต่อไปทั้งที่มีคนใช้น้อย",
  },
}

const NOTES = [
  "มือถือไม่แตะ — ยังเป็นจอกล้องเต็มจอแบบที่เบสเคาะไปแล้ว ทุกแบบในหน้านี้เปลี่ยนเฉพาะตอนเปิดบนคอม",
  "การวางรูปด้วย Ctrl+V ทำได้จริงบนเบราว์เซอร์คอมทุกเจ้า (Chrome / Safari / Edge / Firefox) ไม่ต้องขอสิทธิ์เพิ่ม",
  "ผลลัพธ์ไม่มี “% ความมั่นใจ” เพราะระบบจริงของเราไม่ได้ส่งค่านั้นออกมา — ใส่ไปก็เป็นตัวเลขที่แต่งขึ้น",
  "เส้นแบ่งว่าเครื่องไหนคือ “คอม” ใช้ขนาดจอ ไม่ใช่ระบบปฏิบัติการ — แท็บเล็ตแนวนอนจะได้หน้าอัปโหลดเหมือนคอม ซึ่งถูกแล้วเพราะกล้องหลังแท็บเล็ตถ่ายการ์ดลำบากพอกัน",
]

/* --------------------------------------------------------------- pieces */

function DropZone({ big }: { big: boolean }) {
  return (
    <div
      className={cn(
        "grid place-items-center rounded-2xl border-2 border-dashed border-border bg-muted/40 text-center transition-colors",
        big ? "min-h-[212px] px-8 py-8" : "min-h-[176px] px-6 py-6",
      )}
    >
      <div>
        <span className="mx-auto grid size-14 place-items-center rounded-2xl bg-primary/15 text-primary">
          <Upload className="size-6" aria-hidden />
        </span>
        <p className="mt-3 text-h4">ลากรูปการ์ดมาวางตรงนี้</p>
        <p className="mt-1 text-body-sm text-muted-foreground">
          หรือกด <kbd className="hairline rounded px-1.5 py-0.5 text-code">Ctrl</kbd>{" "}
          + <kbd className="hairline rounded px-1.5 py-0.5 text-code">V</kbd>{" "}
          เพื่อวางรูปที่ก๊อปมา
        </p>
        <button
          type="button"
          className="ease-chrome mt-4 h-11 rounded-full bg-primary px-6 text-sm font-semibold text-primary-foreground transition-transform active:scale-95"
        >
          <span className="inline-flex items-center gap-2">
            <ImageIcon className="size-4" aria-hidden />
            เลือกรูปจากเครื่อง
          </span>
        </button>
        <p className="mt-2.5 text-meta">รองรับ JPG · PNG · HEIC ไม่เกิน 8 MB</p>
      </div>
    </div>
  )
}

function BusyBlock() {
  return (
    <div className="grid min-h-[212px] place-items-center rounded-2xl bg-muted/40 px-8">
      <div className="text-center">
        <span className="relative mx-auto grid size-14 place-items-center rounded-full bg-primary/20 text-primary">
          <span className="absolute inset-0 animate-ping rounded-full bg-primary/20" />
          <ScanSearch className="relative size-6" aria-hidden />
        </span>
        <p className="mt-3 text-h4">กำลังอ่านรูป</p>
        <p className="mt-1 text-body-sm text-muted-foreground">
          เทียบกับการ์ดในฐานข้อมูล
        </p>
      </div>
    </div>
  )
}

function ResultBlock() {
  return (
    <div className="space-y-4">
      <div className="hairline flex gap-4 rounded-2xl bg-card p-4">
        <div className="relative aspect-[63/88] w-24 shrink-0 overflow-hidden rounded-lg bg-muted">
          <Image src={FOUND.img} alt="" fill unoptimized sizes="96px" className="object-cover" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-eyebrow">เจอการ์ดนี้</p>
          <p className="mt-0.5 truncate text-h4">{FOUND.name}</p>
          <p className="text-body-sm text-muted-foreground">
            {FOUND.code} · {FOUND.rarity}
          </p>
          <div className="mt-3 flex gap-6">
            <div>
              <p className="text-meta">ราคา Raw</p>
              <p className="text-h4">{FOUND.raw}</p>
            </div>
            <div>
              <p className="text-meta">PSA 10</p>
              <p className="text-h4">{FOUND.psa10}</p>
            </div>
          </div>
        </div>
      </div>

      <div>
        <p className="text-eyebrow mb-2">ไม่ใช่ใบนี้เหรอ</p>
        <div className="space-y-2">
          {RUNNERS_UP.map((c) => (
            <div
              key={c.code + c.note}
              className="hairline flex items-center justify-between rounded-xl bg-card px-3 py-2.5"
            >
              <span className="min-w-0">
                <span className="block truncate text-body-sm font-medium">{c.name}</span>
                <span className="block text-meta">
                  {c.code} · {c.note}
                </span>
              </span>
              <span className="text-meta shrink-0">ดูราคา →</span>
            </div>
          ))}
        </div>
      </div>

      <button
        type="button"
        className="hairline ease-chrome h-11 w-full rounded-full text-sm font-medium transition-colors hover:bg-muted"
      >
        <span className="inline-flex items-center gap-2">
          <RotateCcw className="size-4" aria-hidden />
          ลองรูปอื่น
        </span>
      </button>
    </div>
  )
}

/** จอกล้องเต็มจอแบบมือถือ — ที่แบบ "ปัจจุบัน" ยกมาใช้บนคอมด้วย */
function CameraFullScreen({ stage }: { stage: Stage }) {
  return (
    <div className="relative size-full bg-black">
      {/* แทนภาพจากเว็บแคม: บนโน้ตบุ๊กคือ "หน้าคนใช้" ไม่ใช่การ์ด */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_35%,#3a3f4a,#111318_70%)]" />
      <p className="absolute inset-x-0 top-1/2 -translate-y-1/2 text-center text-sm text-white/45">
        {stage === "busy"
          ? "กำลังอ่านรูป..."
          : "ภาพจากกล้องหน้าโน้ตบุ๊ก (คนใช้เห็นหน้าตัวเอง)"}
      </p>

      {stage !== "busy" && (
        <div className="pointer-events-none absolute inset-x-0 top-0 bottom-24 grid place-items-center">
          <div className="relative aspect-[63/88] h-[46%]">
            <div className="absolute inset-0 rounded-2xl ring-1 ring-white/25" />
            {(["tl", "tr", "bl", "br"] as const).map((c) => (
              <span
                key={c}
                className={cn(
                  "absolute size-7 border-primary",
                  c === "tl" && "left-0 top-0 rounded-tl-2xl border-l-[3px] border-t-[3px]",
                  c === "tr" && "right-0 top-0 rounded-tr-2xl border-r-[3px] border-t-[3px]",
                  c === "bl" && "bottom-0 left-0 rounded-bl-2xl border-b-[3px] border-l-[3px]",
                  c === "br" && "bottom-0 right-0 rounded-br-2xl border-b-[3px] border-r-[3px]",
                )}
              />
            ))}
          </div>
        </div>
      )}

      <span className="absolute left-4 top-4 grid size-10 place-items-center rounded-full bg-white/15 text-white">
        <X className="size-5" aria-hidden />
      </span>

      <div className="absolute inset-x-0 bottom-0 pb-8">
        <p className="mb-5 text-center text-sm text-white/85">วางการ์ดให้อยู่ในกรอบ</p>
        <div className="flex items-center justify-around px-16">
          <span className="flex flex-col items-center gap-1.5">
            <span className="grid size-12 place-items-center rounded-xl bg-white/15 text-white ring-1 ring-white/25">
              <ImageIcon className="size-5" aria-hidden />
            </span>
            <span className="text-micro text-white/80">อัปโหลด</span>
          </span>
          <span className="grid size-[72px] place-items-center rounded-full bg-white/25 ring-4 ring-white/70">
            <span className="size-14 rounded-full bg-white" />
          </span>
          <span className="size-12" aria-hidden />
        </div>
      </div>
    </div>
  )
}

/** กล่องกลางจอของแบบ ก / ข */
function UploadDialog({ way, stage }: { way: Way; stage: Stage }) {
  return (
    <div className="hairline w-full max-w-xl overflow-hidden rounded-3xl bg-background shadow-2xl">
      <div className="flex items-center justify-between border-b border-border px-5 py-3.5">
        <div className="flex items-center gap-2.5">
          <span className="grid size-8 place-items-center rounded-lg bg-primary/15 text-primary">
            <ScanSearch className="size-4" aria-hidden />
          </span>
          <span>
            <span className="block text-h5">ค้นหาการ์ดด้วยรูป</span>
            <span className="block text-meta">ให้ AI ดูรูปแล้วบอกว่าเป็นใบไหน ราคาเท่าไร</span>
          </span>
        </div>
        <span className="hairline grid size-9 place-items-center rounded-full">
          <X className="size-4" aria-hidden />
        </span>
      </div>

      <div className="p-5">
        {stage === "idle" ? (
          <DropZone big={way === "drop"} />
        ) : stage === "busy" ? (
          <BusyBlock />
        ) : (
          <ResultBlock />
        )}

        {way === "both" && stage === "idle" && (
          <div className="mt-4 flex items-center gap-3">
            <span className="h-px flex-1 bg-border" />
            <span className="text-meta">หรือ</span>
            <span className="h-px flex-1 bg-border" />
          </div>
        )}
        {way === "both" && stage === "idle" && (
          <button
            type="button"
            className="hairline ease-chrome mt-4 flex h-11 w-full items-center justify-center gap-2 rounded-full text-sm font-medium transition-colors hover:bg-muted"
          >
            <Camera className="size-4" aria-hidden />
            ใช้กล้องคอมถ่ายสด
          </button>
        )}
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ page */

export default function PhotoDesktopProtoPage() {
  const [way, setWay] = useProtoVariant<Way>("v", WAY_VALUES, "current")
  const [stage, setStage] = useState<Stage>("idle")
  const { resolvedTheme, setTheme } = useTheme()
  const mounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  )
  const isDark = mounted && resolvedTheme === "dark"

  return (
    <main className="min-h-dvh bg-background px-6 py-10">
      <div className="mx-auto max-w-6xl">
        <h1 className="text-h1">ค้นหาด้วยรูปบนคอม — ควรเปิดกล้อง หรือให้อัปโหลด</h1>
        <p className="mt-2 max-w-3xl text-body text-muted-foreground">
          บนมือถือ กดแล้วเปิดกล้องเต็มจอถือว่าถูกแล้ว (เบสเคาะไปแล้ว) · แต่บนคอม
          กล้องที่มีคือกล้องหน้าโน้ตบุ๊ก ซึ่งหันเข้าหาคนใช้ ไม่ได้หันลงมาที่การ์ด —
          หน้านี้เทียบสามทางว่าเปิดบนคอมแล้วควรเจอกับอะไร
        </p>

        <div className="mt-5 flex flex-wrap items-end justify-between gap-4">
          <div className="space-y-3">
            <div>
              <p className="text-eyebrow mb-1.5">แบบ</p>
              <div className="overflow-x-auto pb-1">
                <SegmentedControl
                  options={WAY_OPTIONS}
                  value={way}
                  onChange={setWay}
                  ariaLabel="เลือกแบบ"
                  className="min-w-max"
                  compactVisual={false}
                />
              </div>
            </div>
            <div>
              <p className="text-eyebrow mb-1.5">จังหวะ</p>
              <div className="overflow-x-auto pb-1">
                <SegmentedControl
                  options={STAGE_OPTIONS}
                  value={stage}
                  onChange={(v) => setStage(v as Stage)}
                  ariaLabel="เลือกจังหวะ"
                  className="min-w-max"
                  compactVisual={false}
                />
              </div>
            </div>
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

        <section className="mt-6 grid gap-8 lg:grid-cols-[minmax(0,1fr)_340px]">
          <div>
            <p className="text-eyebrow mb-2">หน้าจอคอม 1280 × 720</p>
            <div className="hairline relative h-[560px] w-full overflow-hidden rounded-2xl bg-neutral-100 dark:bg-neutral-900">
              {/* หลังกล่อง = หน้าเว็บที่เปิดค้างอยู่ */}
              <div className="absolute inset-0 opacity-40">
                <div className="h-12 border-b border-border bg-background" />
                <div className="grid grid-cols-4 gap-3 p-5">
                  {Array.from({ length: 8 }).map((_, i) => (
                    <div key={i} className="aspect-[63/88] rounded-lg bg-muted" />
                  ))}
                </div>
              </div>

              {way === "current" ? (
                <div className="absolute inset-0">
                  <CameraFullScreen stage={stage} />
                </div>
              ) : (
                <div className="absolute inset-0 grid place-items-center bg-black/45 px-6">
                  <UploadDialog way={way} stage={stage} />
                </div>
              )}
            </div>
            <p className="mt-2 text-meta">
              {way === "current"
                ? "แบบปัจจุบันกินทั้งจอ — บนจอ 27 นิ้วคือดำทั้งจอเพื่อโชว์ภาพกล้องหน้า"
                : "กล่องกลางจอ กว้าง 576px — หน้าเว็บเดิมยังเห็นอยู่ข้างหลัง กดพื้นที่ว่างเพื่อปิด"}
            </p>
          </div>

          <div className="space-y-5">
            <div className="border-l-2 border-primary pl-4">
              <h2 className="text-h3">{WAY_COPY[way].name}</h2>
            </div>
            <div className="hairline rounded-2xl bg-card p-4">
              <p className="text-eyebrow mb-1.5">ได้อะไร</p>
              <p className="text-body-sm text-muted-foreground">{WAY_COPY[way].good}</p>
            </div>
            <div className="hairline rounded-2xl bg-card p-4">
              <p className="text-eyebrow mb-1.5">แลกกับอะไร</p>
              <p className="text-body-sm text-muted-foreground">{WAY_COPY[way].bad}</p>
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
