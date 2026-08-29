"use client"

import Image from "next/image"
import { useState, useSyncExternalStore } from "react"
import { useTheme } from "next-themes"
import {
  ArrowRight,
  Check,
  ImageIcon,
  Moon,
  RotateCcw,
  ScanSearch,
  Sun,
  X,
  Zap,
} from "lucide-react"

import { IconButton } from "@/components/ui/icon-button"
import { SegmentedControl } from "@/components/ui/segmented-control"
import { cn } from "@/lib/utils"

/* ------------------------------------------------------------------ data */

type Stage = "camera" | "scanning" | "result"
type Style = "corners" | "grid" | "beam"

/** การ์ดที่ "สแกนเจอ" — ใบจริง รูปจริงจาก R2 */
const FOUND = {
  name: "Monkey.D.Luffy",
  code: "OP13-118",
  rarity: "P-SEC",
  set: "OP13 · Carrying on His Will",
  img: "https://pub-e1c871a889eb42a4bd7dcdc3a5926f3c.r2.dev/op13/OP13-118_p3.png",
  raw: "294,400 ฿",
  psa10: "612,000 ฿",
  change: -8.3,
  confidence: 97,
} as const

const RUNNERS_UP = [
  { name: "Monkey.D.Luffy", code: "OP13-118", note: "พิมพ์ปกติ", confidence: 62 },
  { name: "Monkey.D.Luffy", code: "OP05-119", note: "ลายอื่น", confidence: 31 },
] as const

const STAGE_OPTIONS = [
  { value: "camera", label: "1 · จอกล้อง" },
  { value: "scanning", label: "2 · กำลังสแกน" },
  { value: "result", label: "3 · ผลลัพธ์" },
] as const

const STYLE_OPTIONS = [
  { value: "corners", label: "A · มุมกรอบ" },
  { value: "grid", label: "B · กริดเทค" },
  { value: "beam", label: "C · ลำแสงกวาด" },
] as const

const STYLE_COPY: Record<Style, { name: string; note: string }> = {
  corners: {
    name: "A · มุมกรอบ — ท่ามาตรฐานแอปธนาคาร",
    note: "มุมสี่มุมบอกขอบเขต + เส้นสแกนบางวิ่งขึ้นลง · คนไทยคุ้นจากแอปสแกนจ่ายทุกเจ้า เห็นปุ๊บรู้ทันทีว่าต้องวางการ์ดตรงไหน",
  },
  grid: {
    name: "B · กริดเทค — ตารางจุดเรืองแสง",
    note: "เพิ่มตารางจุดจางๆ ในกรอบ + มุมเรืองแสง · ดูเป็นเครื่องวิเคราะห์มากกว่าแค่กล้อง เหมาะกับที่บอกว่าเบื้องหลังเป็น AI",
  },
  beam: {
    name: "C · ลำแสงกวาด — แสงกวาดทั้งจอ",
    note: "ลำแสงไล่สีกวาดผ่านทั้งกรอบพร้อมเงาเรืองแสงตาม · ว้าวสุดในสามแบบ แต่ก็ดึงสายตามากที่สุด",
  },
}

const NOTES = [
  "กดปุ่มบนสุดเพื่อสลับดู 3 จังหวะ: จอกล้อง → กำลังสแกน → ผลลัพธ์",
  "ปุ่มอัปโหลดอยู่ซ้ายล่าง ชัตเตอร์อยู่กลาง ไฟฉายขวาล่าง — ตำแหน่งเดียวกับแอปสแกนจ่าย",
  "กรอบสแกนเป็นสัดส่วนการ์ดจริง (63:88) ไม่ใช่สี่เหลี่ยมจัตุรัสแบบ QR — บอกโดยไม่ต้องเขียนว่าให้วางอะไร",
  "ผลลัพธ์โชว์ % ความมั่นใจ และตัวเลือกรองที่ AI ลังเล — ถ้าจับผิดใบ ผู้ใช้แก้เองได้ในคลิกเดียว",
  "ทุกอย่างเป็นหุ่นโชว์: กล้องเป็นรูปนิ่ง ปุ่มกดไม่ได้จริง ข้อมูลตายตัว",
] as const

/* ----------------------------------------------------------------- atoms */

function ScanFrame({ style, active }: { style: Style; active: boolean }) {
  return (
    <div className="pointer-events-none absolute inset-0 grid place-items-center">
      <div className="relative aspect-[63/88] w-[62%]">
        {/* กรอบหลัก */}
        <div
          className={cn(
            "absolute inset-0 rounded-2xl",
            style === "grid"
              ? "ring-1 ring-white/25"
              : style === "beam"
                ? "ring-1 ring-white/20"
                : "ring-1 ring-white/15",
          )}
        />

        {/* มุมสี่มุม */}
        {(["tl", "tr", "bl", "br"] as const).map((c) => (
          <span
            key={c}
            className={cn(
              "absolute size-7 border-primary",
              style === "grid" && active && "scan-corner-glow",
              c === "tl" && "left-0 top-0 rounded-tl-2xl border-l-[3px] border-t-[3px]",
              c === "tr" && "right-0 top-0 rounded-tr-2xl border-r-[3px] border-t-[3px]",
              c === "bl" && "bottom-0 left-0 rounded-bl-2xl border-b-[3px] border-l-[3px]",
              c === "br" && "bottom-0 right-0 rounded-br-2xl border-b-[3px] border-r-[3px]",
            )}
          />
        ))}

        {/* กริดจุด (แบบ B) */}
        {style === "grid" && (
          <div
            className="absolute inset-2 rounded-xl opacity-40"
            style={{
              backgroundImage:
                "radial-gradient(circle, rgba(255,255,255,.45) 1px, transparent 1px)",
              backgroundSize: "14px 14px",
            }}
          />
        )}

        {/* เส้น/ลำแสงสแกน */}
        {active && (
          <div className="absolute inset-x-1 inset-y-2 overflow-hidden rounded-xl">
            {style === "beam" ? (
              <span className="scan-beam absolute inset-x-0 h-24 bg-gradient-to-b from-transparent via-primary/45 to-transparent" />
            ) : (
              <span className="scan-line absolute inset-x-0 h-px bg-primary shadow-[0_0_12px_2px_var(--primary)]" />
            )}
          </div>
        )}
      </div>
    </div>
  )
}

function CameraShell({
  children,
  dim = false,
}: {
  children?: React.ReactNode
  dim?: boolean
}) {
  return (
    <div className="relative h-full w-full overflow-hidden bg-neutral-900">
      {/* "ภาพจากกล้อง" — รูปนิ่งเบลอ แทนภาพสด */}
      <Image
        src={FOUND.img}
        alt=""
        fill
        sizes="390px"
        className={cn(
          "select-none object-cover opacity-70 blur-[1px]",
          dim && "brightness-50",
        )}
      />
      <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-transparent to-black/70" />
      {children}
    </div>
  )
}

function TopBar({ label }: { label: string }) {
  return (
    <div className="absolute inset-x-0 top-0 flex items-center justify-between px-4 pt-4">
      <span className="grid size-10 place-items-center rounded-full bg-black/45 text-white backdrop-blur-sm">
        <X className="size-5" aria-hidden />
      </span>
      <span className="rounded-full bg-black/45 px-3 py-1.5 text-xs font-medium text-white backdrop-blur-sm">
        {label}
      </span>
      <span className="grid size-10 place-items-center rounded-full bg-black/45 text-white backdrop-blur-sm">
        <Zap className="size-[18px]" aria-hidden />
      </span>
    </div>
  )
}

function CameraControls() {
  return (
    <div className="absolute inset-x-0 bottom-0 pb-8">
      <p className="mb-5 text-center text-sm text-white/85">
        วางการ์ดให้อยู่ในกรอบ
      </p>
      <div className="flex items-center justify-around px-8">
        {/* ซ้ายล่าง = อัปโหลดรูป (ท่าเดียวกับแอปสแกนจ่าย) */}
        <span className="flex flex-col items-center gap-1.5">
          <span className="grid size-12 place-items-center rounded-xl bg-white/15 text-white backdrop-blur-sm ring-1 ring-white/25">
            <ImageIcon className="size-5" aria-hidden />
          </span>
          <span className="text-micro text-white/80">อัปโหลดรูป</span>
        </span>

        {/* ชัตเตอร์ */}
        <span className="grid size-[72px] place-items-center rounded-full bg-white/25 ring-4 ring-white/70 backdrop-blur-sm">
          <span className="size-14 rounded-full bg-white" />
        </span>

        {/* ขวาล่าง — ถ่วงสมดุลกับปุ่มซ้าย */}
        <span className="flex flex-col items-center gap-1.5">
          <span className="grid size-12 place-items-center rounded-xl bg-white/10 text-white/70 backdrop-blur-sm ring-1 ring-white/15">
            <RotateCcw className="size-5" aria-hidden />
          </span>
          <span className="text-micro text-white/60">สลับกล้อง</span>
        </span>
      </div>
    </div>
  )
}

function ScanningOverlay() {
  return (
    <div className="absolute inset-x-0 bottom-0 pb-10">
      <div className="mx-6 rounded-2xl bg-black/55 px-4 py-3 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <span className="relative grid size-10 shrink-0 place-items-center rounded-full bg-primary/25 text-primary">
            <span className="absolute inset-0 animate-ping rounded-full bg-primary/25" />
            <ScanSearch className="relative size-5" aria-hidden />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-sm font-semibold text-white">
              กำลังวิเคราะห์ด้วย AI
            </span>
            <span className="block text-xs text-white/70">
              เทียบกับการ์ด 3,838 ใบใน 51 ชุด
            </span>
          </span>
        </div>
        {/* แถบความคืบหน้าแบบไหลไม่รู้จบ */}
        <div className="mt-3 h-1 overflow-hidden rounded-full bg-white/15">
          <span className="scan-progress block h-full w-1/3 rounded-full bg-gradient-to-r from-primary/40 via-primary to-primary/40" />
        </div>
      </div>
    </div>
  )
}

function ResultSheet() {
  const up = FOUND.change > 0
  return (
    <div className="absolute inset-x-0 bottom-0">
      <div className="rounded-t-3xl bg-background px-4 pb-8 pt-3 shadow-[0_-18px_60px_rgba(0,0,0,0.5)]">
        <span className="mx-auto mb-3 block h-1 w-10 rounded-full bg-muted-foreground/30" />

        {/* แถบยืนยันผล */}
        <div className="mb-3 flex items-center gap-2">
          <span className="grid size-6 shrink-0 place-items-center rounded-full bg-price-up/15 text-price-up">
            <Check className="size-3.5" aria-hidden />
          </span>
          <span className="text-body-sm font-semibold">เจอการ์ดใบนี้</span>
          <span className="ms-auto rounded-full bg-[var(--p-honey-soft)] px-2 py-0.5 text-micro font-semibold text-primary">
            มั่นใจ {FOUND.confidence}%
          </span>
        </div>

        {/* การ์ดที่เจอ */}
        <div className="hairline flex items-center gap-3 rounded-2xl bg-card p-3">
          <span className="relative h-24 w-[68px] shrink-0 overflow-hidden rounded-lg bg-muted">
            <Image src={FOUND.img} alt="" fill sizes="68px" className="object-cover" />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block truncate text-h5">{FOUND.name}</span>
            <span className="mt-0.5 flex items-center gap-1.5">
              <span className="text-meta">{FOUND.code}</span>
              <span className="hairline rounded px-1 text-micro text-muted-foreground">
                {FOUND.rarity}
              </span>
            </span>
            <span className="mt-2 flex items-baseline gap-2">
              <span className="font-price text-lg font-bold tabular-nums">
                {FOUND.raw}
              </span>
              <span
                className={cn(
                  "font-price text-xs tabular-nums",
                  up ? "text-price-up" : "text-price-down",
                )}
              >
                {up ? "+" : ""}
                {FOUND.change}%
              </span>
            </span>
            <span className="text-meta">PSA 10 · {FOUND.psa10}</span>
          </span>
        </div>

        {/* ตัวเลือกรอง — AI ลังเลระหว่างใบไหน */}
        <p className="mt-3 text-eyebrow">ไม่ใช่ใบนี้เหรอ</p>
        <div className="mt-1.5 space-y-1.5">
          {RUNNERS_UP.map((r) => (
            <div
              key={r.code + r.note}
              className="hairline flex items-center gap-2.5 rounded-xl bg-card/60 px-3 py-2"
            >
              <span className="h-9 w-[26px] shrink-0 rounded bg-muted" aria-hidden />
              <span className="min-w-0 flex-1">
                <span className="block truncate text-body-sm">{r.name}</span>
                <span className="text-meta">
                  {r.code} · {r.note}
                </span>
              </span>
              <span className="text-meta">{r.confidence}%</span>
            </div>
          ))}
        </div>

        <div className="mt-4 flex gap-2">
          <button
            type="button"
            className="hairline ease-chrome flex h-12 flex-1 items-center justify-center gap-1.5 rounded-full text-sm font-medium transition-colors hover:bg-muted"
          >
            <RotateCcw className="size-4" aria-hidden />
            สแกนใหม่
          </button>
          <button
            type="button"
            className="ease-chrome flex h-12 flex-[1.4] items-center justify-center gap-1.5 rounded-full bg-primary text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90"
          >
            ดูราคาทุกเกรด
            <ArrowRight className="size-4" aria-hidden />
          </button>
        </div>
      </div>
    </div>
  )
}

/* ------------------------------------------------------------ page shell */

const subscribeNever = () => () => {}

export default function PhotoScanProtoPage() {
  const [stage, setStage] = useState<Stage>("scanning")
  const [style, setStyle] = useState<Style>("grid")
  const { resolvedTheme, setTheme } = useTheme()
  const mounted = useSyncExternalStore(
    subscribeNever,
    () => true,
    () => false,
  )
  const isDark = mounted && resolvedTheme === "dark"

  return (
    <main className="min-h-screen bg-background px-4 py-8 text-foreground sm:px-6 lg:px-10">
      {/* คีย์เฟรมเฉพาะหน้านี้ — ไม่แตะ globals.css ของจริง */}
      <style>{`
        @keyframes protoScanLine {
          0%   { transform: translateY(0); opacity: 0; }
          10%  { opacity: 1; }
          90%  { opacity: 1; }
          100% { transform: translateY(var(--scan-h, 220px)); opacity: 0; }
        }
        @keyframes protoScanBeam {
          0%   { transform: translateY(-100%); }
          100% { transform: translateY(var(--scan-h, 240px)); }
        }
        @keyframes protoProgress {
          0%   { transform: translateX(-100%); }
          100% { transform: translateX(300%); }
        }
        @keyframes protoCornerGlow {
          0%, 100% { opacity: 1; filter: drop-shadow(0 0 0 transparent); }
          50%      { opacity: .75; filter: drop-shadow(0 0 6px var(--primary)); }
        }
        .scan-line { animation: protoScanLine 2.2s ease-in-out infinite; }
        .scan-beam { animation: protoScanBeam 2.4s ease-in-out infinite; }
        .scan-progress { animation: protoProgress 1.6s ease-in-out infinite; }
        .scan-corner-glow { animation: protoCornerGlow 1.8s ease-in-out infinite; }
        @media (prefers-reduced-motion: reduce) {
          .scan-line, .scan-beam, .scan-progress, .scan-corner-glow {
            animation: none;
          }
        }
      `}</style>

      <div className="mx-auto max-w-[1200px]">
        <h1 className="text-h1">สแกนการ์ดด้วยกล้อง — จอเต็มแบบแอปธนาคาร</h1>
        <p className="mt-2 max-w-3xl text-body text-muted-foreground">
          กดถ่ายรูปแล้วเปิดเป็นจอกล้องเต็มจอ มีปุ่มอัปโหลดรูปซ้ายล่างเหมือนแอปสแกนจ่าย ·
          กรอบสแกนเป็นสัดส่วนการ์ดจริง ไม่ใช่สี่เหลี่ยมแบบ QR · สลับดูได้ทั้งสามจังหวะ
          และเลือกได้ว่าตอนสแกนจะให้ &ldquo;เทค&rdquo; แบบไหน
        </p>

        <div className="mt-5 flex flex-wrap items-end justify-between gap-4">
          <div className="space-y-3">
            <div>
              <p className="text-eyebrow mb-1.5">จังหวะ</p>
              <div className="overflow-x-auto pb-1">
                <SegmentedControl
                  options={STAGE_OPTIONS}
                  value={stage}
                  onChange={setStage}
                  ariaLabel="เลือกจังหวะ"
                  className="min-w-max"
                  compactVisual={false}
                />
              </div>
            </div>
            <div>
              <p className="text-eyebrow mb-1.5">หน้าตาตอนสแกน</p>
              <div className="overflow-x-auto pb-1">
                <SegmentedControl
                  options={STYLE_OPTIONS}
                  value={style}
                  onChange={setStyle}
                  ariaLabel="เลือกหน้าตากรอบสแกน"
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

        <section className="mt-6 grid gap-8 lg:grid-cols-[390px_minmax(0,1fr)]">
          <div>
            <p className="text-eyebrow mb-2">มือถือ 390 × 780</p>
            <div className="hairline h-[780px] w-full overflow-hidden rounded-[2.5rem] bg-black">
              <CameraShell dim={stage === "result"}>
                {stage !== "result" && (
                  <>
                    <TopBar
                      label={stage === "scanning" ? "กำลังสแกน..." : "สแกนการ์ด"}
                    />
                    <ScanFrame style={style} active={stage === "scanning"} />
                  </>
                )}
                {stage === "camera" && <CameraControls />}
                {stage === "scanning" && <ScanningOverlay />}
                {stage === "result" && <ResultSheet />}
              </CameraShell>
            </div>
          </div>

          <div className="space-y-6">
            <div className="border-l-2 border-primary pl-4">
              <h2 className="text-h3">{STYLE_COPY[style].name}</h2>
              <p className="mt-1.5 max-w-2xl text-body-sm text-muted-foreground">
                {STYLE_COPY[style].note}
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              {[
                {
                  t: "1 · จอกล้อง",
                  d: "เต็มจอ · กรอบสัดส่วนการ์ด · อัปโหลดซ้ายล่าง ชัตเตอร์กลาง สลับกล้องขวา · ปิดซ้ายบน ไฟฉายขวาบน",
                },
                {
                  t: "2 · กำลังสแกน",
                  d: "เส้น/ลำแสงกวาดในกรอบ + การ์ดสถานะลอยล่าง บอกว่ากำลังเทียบกับการ์ดกี่ใบ ไม่ใช่แค่หมุนรอ",
                },
                {
                  t: "3 · ผลลัพธ์",
                  d: "แผ่นเลื่อนขึ้นจากล่าง · ยืนยันว่าเจอใบไหน + % ความมั่นใจ + ราคา Raw/PSA 10 + ตัวเลือกรองเผื่อจับผิด",
                },
              ].map((s) => (
                <div key={s.t} className="hairline rounded-2xl bg-card p-3">
                  <p className="text-h5">{s.t}</p>
                  <p className="mt-1 text-body-sm text-muted-foreground">{s.d}</p>
                </div>
              ))}
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
