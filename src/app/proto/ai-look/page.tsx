"use client"

import Image from "next/image"
import { useTheme } from "next-themes"
import { useSyncExternalStore } from "react"
import { Moon, ScanSearch, Search, Sun, WandSparkles } from "lucide-react"

import { IconButton } from "@/components/ui/icon-button"
import { SegmentedControl } from "@/components/ui/segmented-control"
import { cn } from "@/lib/utils"

import { useProtoFlag, useProtoVariant } from "../_kit/use-proto-variant"

/* ------------------------------------------------------------------ data */

type Look = "current" | "warm" | "aurora" | "edge"

const OPTIONS = [
  { value: "current", label: "ปัจจุบัน" },
  { value: "warm", label: "A · เรืองแสงโทนเรา" },
  { value: "aurora", label: "B · รุ้งแบบที่ส่งมา" },
  { value: "edge", label: "C · ขอบไล่สีวิ่ง" },
] as const

const VALUES = OPTIONS.map((o) => o.value)

const COPY: Record<Look, { name: string; summary: string; tradeoff: string }> = {
  current: {
    name: "ปัจจุบัน — แถบไล่สีทึบโทนน้ำตาล",
    summary:
      "ที่เพิ่งลงไปเมื่อกี้: พื้นไล่สีน้ำตาลอ่อนจากซ้ายไปขวา + ไอคอนในวงกลม + ป้าย AI · บอกว่าเป็น AI ด้วยตัวหนังสือ ไม่ได้บอกด้วยภาษาภาพ",
    tradeoff: "—",
  },
  warm: {
    name: "A · เรืองแสงโทนเรา — เอาท่ามา ไม่เอาสีมา",
    summary:
      "ยืมท่าจากภาพที่เบสส่ง (เงาฟุ้งรอบกล่อง + ไอคอนประกาย) แต่ใช้สีของแบรนด์เราเอง คือทองกับส้มอบ · ได้ความรู้สึก \"มีอะไรฉลาดอยู่ในนี้\" โดยไม่มีสีแปลกปลอมโผล่มาในเว็บที่ทั้งหน้าเป็นโทนอุ่น",
    tradeoff:
      "เงาทองบนพื้นครีมของโหมดสว่างจะจางกว่าเงารุ้ง — ต้องดูจริงว่าเห็นชัดพอไหม · เงาเรืองลงล่างและออกข้างเท่านั้น ไม่ล้นขึ้นไปทับช่องค้นหา",
  },
  aurora: {
    name: "B · รุ้งแบบที่ส่งมา — ม่วง ฟ้า ชมพู",
    summary:
      "ทำตามภาพเป๊ะ: เงาไล่สีม่วง-ฟ้า-ชมพูฟุ้งรอบกล่อง แบบที่ ChatGPT · Perplexity · Airbnb ใช้กัน · เป็นภาษาที่คนทั้งโลกอ่านออกทันทีว่า \"อันนี้ AI\" เพราะเห็นมาจากหลายแอปแล้ว",
    tradeoff:
      "สีชุดนี้ไม่มีอยู่ในเว็บเราเลยสักที่ — ทั้งเว็บเป็นน้ำตาล/ทอง/ครีม พอมีม่วงฟ้าโผล่มาจุดเดียวจะอ่านเป็น \"ของนอก\" ที่หลุดเข้ามา หรืออ่านเป็น \"ของพิเศษ\" ก็ได้ · ต้องเบสตัดสินว่ารับได้ไหม",
  },
  edge: {
    name: "C · ขอบไล่สีวิ่ง — เส้นขอบเคลื่อนไหว",
    summary:
      "ไม่ฟุ้งออกนอกกล่อง แต่ทำขอบเป็นเส้นไล่สี ครบทั้งสี่ด้าน — ที่หมุนคือจุดสว่างบนเส้น ไม่ใช่ตัวเส้น ขอบจึงไม่เคยขาดหายไปด้านไหน · ปุ่มค้นหาแถบล่างก็ได้วงแหวนไล่สีหมุนรอบชุดเดียวกัน · เนียนกว่าสองแบบบน กินที่น้อยกว่า ไม่ต้องเว้นระยะเผื่อเงา",
    tradeoff:
      "เคลื่อนไหวตลอดเวลา — ถ้าอยู่ในรายการที่มีของอื่นเยอะ อาจกวนสายตากว่าเงานิ่ง · ปิดให้เองเมื่อผู้ใช้ตั้งค่าลดการเคลื่อนไหว",
  },
}

const NOTES = [
  "ภาพที่เบสส่งมามีสามอย่าง: เงาไล่สีฟุ้งรอบกล่อง · ไอคอนประกายในแคปซูล · คำสั้นๆ — สามแบบนี้เอามาทั้งชุด ต่างกันที่ใช้สีอะไร",
  "เว็บเราทั้งหน้าเป็นโทนอุ่น (น้ำตาล ทอง ครีม) — สีรุ้งม่วง-ฟ้าเป็นสีที่ไม่มีอยู่ในระบบสีของเราเลย นี่คือจุดที่ต้องเบสตัดสิน",
  "ไอคอนประกายในภาพคือ Sparkles ซึ่งเว็บเราใช้ไปแล้ว 3 ที่ (แพ็กเกจ · หน้าแรก · ท้ายเว็บ) — ในนี้เลยใช้ WandSparkles ที่หน้าตาใกล้กันแต่ยังว่างอยู่",
  "กดปุ่ม \"ดูตอนกำลังสแกน\" เพื่อดูว่าตอนทำงานจริงหน้าตาเป็นยังไง — ของแบบนี้ต้องดูตอนขยับ ไม่ใช่ตอนนิ่ง",
  "ทุกแบบปิดการเคลื่อนไหวเองเมื่อเครื่องตั้งค่า \"ลดการเคลื่อนไหว\" ไว้",
] as const

/* ----------------------------------------------------------------- atoms */

/** แถวค้นหาด้วยรูป — ของจริงที่อยู่ในช่องค้นหาตอนนี้ */
function PhotoRow({ look, busy }: { look: Look; busy: boolean }) {
  const inner = (
    <div
      className={cn(
        "relative flex w-full items-center gap-3 rounded-2xl px-3 py-2.5 text-left",
        look === "current"
          ? "bg-gradient-to-r from-[var(--p-honey-soft)] to-transparent"
          : "bg-card",
        look === "edge" && "z-10",
      )}
    >
      <span
        className={cn(
          "grid size-10 shrink-0 place-items-center rounded-full",
          look === "current"
            ? "bg-primary/15 text-primary"
            : look === "aurora"
              ? "bg-gradient-to-br from-violet-500/25 via-sky-400/25 to-rose-400/25 text-violet-500 dark:text-violet-300"
              : "bg-gradient-to-br from-primary/30 to-primary/5 text-primary",
        )}
      >
        {look === "current" ? (
          <ScanSearch className="size-[18px]" aria-hidden />
        ) : (
          <WandSparkles className="size-[18px]" aria-hidden />
        )}
      </span>

      <span className="min-w-0 flex-1">
        <span className="flex items-center gap-1.5">
          <span className="text-body-sm font-semibold text-foreground">
            {busy ? "กำลังดูรูปให้อยู่..." : "ค้นหาด้วยรูปภาพ"}
          </span>
          <span
            className={cn(
              "rounded-full px-1.5 text-micro font-semibold",
              look === "aurora"
                ? "bg-gradient-to-r from-violet-500 to-sky-500 text-white"
                : "bg-primary/15 text-primary",
            )}
          >
            AI
          </span>
        </span>
        <span className="block truncate text-meta">
          {busy
            ? "เทียบกับการ์ด 3,838 ใบใน 51 ชุด"
            : "ถ่ายรูปหรืออัปโหลดรูปการ์ด ระบบจะใช้ AI วิเคราะห์ให้"}
        </span>
      </span>
    </div>
  )

  if (look === "current") return <div className="p-2">{inner}</div>

  if (look === "edge") {
    return (
      <div className="p-2">
        <div className="relative overflow-hidden rounded-2xl p-px">
          {/* ขอบไล่สีที่หมุนรอบกล่อง */}
          {/* ขอบครบทั้งสี่ด้าน: สีมีอยู่ทุกองศา แค่ไล่เข้ม-อ่อน — ที่หมุนคือ
              "จุดสว่าง" ไม่ใช่ตัวเส้น เส้นจึงไม่เคยขาดหายไปด้านไหน */}
          <span
            aria-hidden
            className={cn(
              "absolute inset-[-100%] bg-[conic-gradient(from_0deg,var(--primary),color-mix(in_srgb,var(--primary)_28%,transparent)_90deg,var(--primary)_180deg,color-mix(in_srgb,var(--primary)_28%,transparent)_270deg,var(--primary)_360deg)]",
              busy ? "proto-spin-fast" : "proto-spin",
            )}
          />
          {inner}
        </div>
      </div>
    )
  }

  return (
    // pt-3 ให้แถวนี้มีที่หายใจของตัวเอง — เงาฟุ้งต้องมีที่ลงในระยะของตัวเอง
    // ไม่ใช่ไปยืมที่ของเพื่อนบ้านข้างบน
    <div className="px-2 pb-2 pt-3">
      <div className="relative">
        {/* เงาฟุ้งรอบกล่อง — จงใจไม่ให้ล้นขึ้นข้างบน (top-0 ไม่ใช่ -top-2):
            เดิมฟุ้งออกทุกด้าน 8px ด้านบนเลยไปคลุมเส้นแบ่งกับช่องพิมพ์
            จนช่องค้นหาดูมัว (เบสทัก 2026-08-29) · ตอนนี้เรืองลงล่างและออกข้าง
            ซึ่งเป็นที่ว่างของมันเอง */}
        <span
          aria-hidden
          className={cn(
            "absolute -bottom-2 -left-2 -right-2 top-0 rounded-3xl blur-lg",
            busy ? "proto-pulse" : "opacity-90 dark:opacity-60",
            look === "aurora"
              ? "bg-[conic-gradient(from_180deg,rgba(139,92,246,.55),rgba(56,189,248,.5),rgba(244,114,182,.5),rgba(139,92,246,.55))]"
              // โหมดสว่างต้องเข้มกว่า: เงาทองบนพื้นครีมแทบมองไม่เห็นถ้าใช้ค่า
              // เดียวกับโหมดมืด (วัดด้วยตาแล้ว 2026-08-29) — สีเดียวกัน แต่อิ่มขึ้น
              : "bg-[conic-gradient(from_180deg,rgba(214,150,60,.85),rgba(244,166,60,.7),rgba(115,83,62,.5),rgba(214,150,60,.85))] dark:bg-[conic-gradient(from_180deg,rgba(233,185,112,.6),rgba(244,166,60,.5),rgba(115,83,62,.45),rgba(233,185,112,.6))]",
          )}
        />
        <div className="relative">{inner}</div>
      </div>
    </div>
  )
}

/** ปุ่มค้นหาแถบล่าง — จุด AI อีกจุดของเว็บ */
function SearchTab({ look, busyRing }: { look: Look; busyRing: boolean }) {
  return (
    <span className="relative flex flex-col items-center gap-1">
      {/* เงาฟุ้ง — มีเฉพาะแบบที่ใช้เงา (A/B) · แบบ C ใช้วงแหวนแทน */}
      {(look === "warm" || look === "aurora") && (
        <span
          aria-hidden
          className={cn(
            "absolute -top-7 size-14 rounded-full blur-md",
            look === "aurora"
              ? "bg-[conic-gradient(from_180deg,rgba(139,92,246,.7),rgba(56,189,248,.6),rgba(244,114,182,.6),rgba(139,92,246,.7))]"
              : "bg-gradient-to-br from-primary/70 to-primary/10",
          )}
        />
      )}

      {look === "edge" ? (
        // แบบ C บนปุ่มกลม: วงแหวนไล่สีหมุนรอบ — ขอบครบวง ไม่ขาดด้านไหน
        <span className="relative -mt-7 grid size-14 place-items-center rounded-full p-[3px] ring-4 ring-background">
          <span
            aria-hidden
            className={cn(
              "absolute inset-0 rounded-full bg-[conic-gradient(from_0deg,var(--primary),color-mix(in_srgb,var(--primary)_25%,transparent)_90deg,var(--primary)_180deg,color-mix(in_srgb,var(--primary)_25%,transparent)_270deg,var(--primary)_360deg)]",
              busyRing ? "proto-spin-fast" : "proto-spin",
            )}
          />
          <span className="relative grid size-full place-items-center rounded-full bg-primary text-primary-foreground shadow-lg">
            <Search className="size-6" strokeWidth={2.25} aria-hidden />
          </span>
        </span>
      ) : (
        <span
          className={cn(
            "relative flex size-14 -mt-7 items-center justify-center rounded-full text-primary-foreground shadow-lg ring-4 ring-background",
            look === "current"
              ? "bg-gradient-to-br from-primary to-primary/80"
              : look === "aurora"
                ? "bg-gradient-to-br from-violet-500 via-sky-500 to-primary"
                : "bg-gradient-to-br from-primary to-primary/75",
          )}
        >
          <Search className="size-6" strokeWidth={2.25} aria-hidden />
        </span>
      )}
      <span className="text-micro text-muted-foreground">ค้นหา</span>
    </span>
  )
}

/* ------------------------------------------------------------ page shell */

const subscribeNever = () => () => {}

export default function AiLookProtoPage() {
  const [look, setLook] = useProtoVariant<Look>("v", VALUES, "warm")
  const [busy, toggleBusy] = useProtoFlag("busy")
  const { resolvedTheme, setTheme } = useTheme()
  const mounted = useSyncExternalStore(
    subscribeNever,
    () => true,
    () => false,
  )
  const isDark = mounted && resolvedTheme === "dark"
  const copy = COPY[look]

  return (
    <main className="min-h-screen bg-background px-4 py-8 text-foreground sm:px-6 lg:px-10">
      <style>{`
        @keyframes protoSpin { to { transform: rotate(360deg); } }
        @keyframes protoPulse {
          0%, 100% { opacity: .45; }
          50%      { opacity: .95; }
        }
        .proto-spin      { animation: protoSpin 6s linear infinite; }
        .proto-spin-fast { animation: protoSpin 2.2s linear infinite; }
        .proto-pulse     { animation: protoPulse 2s ease-in-out infinite; }
        @media (prefers-reduced-motion: reduce) {
          .proto-spin, .proto-spin-fast, .proto-pulse { animation: none; }
        }
      `}</style>

      <div className="mx-auto max-w-[1200px]">
        <h1 className="text-h1">ส่วน AI ควรใช้ภาษาภาพแบบไหน</h1>
        <p className="mt-2 max-w-3xl text-body text-muted-foreground">
          ภาพที่เบสส่งมามีสามอย่าง: เงาไล่สีฟุ้งรอบกล่อง · ไอคอนประกาย · คำสั้นๆ —
          สามแบบนี้เอามาทั้งชุด ต่างกันตรงที่ใช้ <strong>สีอะไร</strong> ·
          คำถามเดียวที่ต้องเคาะคือ ยอมให้สีม่วง-ฟ้าที่ไม่มีในเว็บเราโผล่มาไหม
        </p>

        <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-3">
            <div className="overflow-x-auto pb-1">
              <SegmentedControl
                options={OPTIONS}
                value={look}
                onChange={setLook}
                ariaLabel="เลือกภาษาภาพของส่วน AI"
                className="min-w-max"
                compactVisual={false}
              />
            </div>
            <button
              type="button"
              onClick={toggleBusy}
              className="hairline ease-chrome h-10 shrink-0 rounded-full px-3.5 text-sm font-medium transition-colors hover:bg-muted"
            >
              {busy ? "ดูตอนอยู่เฉยๆ" : "ดูตอนกำลังสแกน"}
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

        <section className="mt-6 grid gap-8 lg:grid-cols-[390px_minmax(0,1fr)]">
          <div>
            <p className="text-eyebrow mb-2">ในช่องค้นหา (มือถือ 390px)</p>
            <div className="hairline overflow-hidden rounded-[2rem] bg-popover">
              <div className="flex items-center gap-2 border-b border-hair px-3">
                <Search className="size-4 shrink-0 text-muted-foreground" aria-hidden />
                <span className="h-12 flex-1 leading-[3rem] text-base text-muted-foreground">
                  ค้นหาการ์ด, ชุด, รหัส...
                </span>
                <span className="h-10 shrink-0 px-2.5 text-sm font-medium leading-10 text-primary">
                  ยกเลิก
                </span>
              </div>

              <div className="border-b border-hair">
                <PhotoRow look={look} busy={busy} />
              </div>

              <p className="px-4 pb-1 pt-3 text-eyebrow">มาแรง</p>
              <div className="divide-y divide-border/60 pb-3">
                {[
                  { n: "Buggy (Parallel)", c: "OP03-008", p: "1,466 ฿", d: "+48.5%" },
                  { n: "Monkey.D.Luffy", c: "ST21-001", p: "3,108 ฿", d: "+33.3%" },
                  { n: "Kaido (Parallel)", c: "OP04-044", p: "122 ฿", d: "+28.9%" },
                ].map((r) => (
                  <div key={r.c} className="flex min-h-14 items-center gap-3 px-4 py-1.5">
                    <span className="hairline h-10 w-7 shrink-0 rounded bg-card" aria-hidden />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-body-sm font-semibold">{r.n}</span>
                      <span className="text-meta">{r.c}</span>
                    </span>
                    <span className="text-right">
                      <span className="block font-price text-sm font-semibold tabular-nums">
                        {r.p}
                      </span>
                      <span className="font-price text-xs tabular-nums text-price-up">
                        {r.d}
                      </span>
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div>
              <p className="text-eyebrow mb-2">ปุ่มค้นหาที่แถบล่าง</p>
              <div className="hairline rounded-2xl bg-card px-4 pb-3 pt-10">
                <div className="flex items-end justify-around">
                  {["หน้าแรก", "ชุดการ์ด"].map((l) => (
                    <span
                      key={l}
                      className="flex flex-col items-center gap-1 text-micro text-muted-foreground"
                    >
                      <span className="size-6 rounded bg-muted" aria-hidden />
                      {l}
                    </span>
                  ))}
                  <SearchTab look={look} busyRing={busy} />
                  {["พอร์ต", "ดูเพิ่มเติม"].map((l) => (
                    <span
                      key={l}
                      className="flex flex-col items-center gap-1 text-micro text-muted-foreground"
                    >
                      <span className="size-6 rounded bg-muted" aria-hidden />
                      {l}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <div>
              <p className="text-eyebrow mb-2">บนคอม (ในช่องค้นหาเดียวกัน)</p>
              <div className="hairline overflow-hidden rounded-2xl bg-popover">
                <div className="flex items-center gap-2 border-b border-hair px-4">
                  <Search className="size-4 shrink-0 text-muted-foreground" aria-hidden />
                  <span className="h-12 flex-1 leading-[3rem] text-base text-muted-foreground">
                    ค้นหาการ์ด, ชุด, รหัส...
                  </span>
                  <span className="hairline shrink-0 rounded-full bg-background px-1.5 py-0.5 text-micro text-muted-foreground">
                    /
                  </span>
                </div>
                <PhotoRow look={look} busy={busy} />
              </div>
            </div>

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
          </div>
        </section>

        <p className="mt-8 text-meta">
          ภาพการ์ดในหน้านี้เป็นข้อมูลตายตัว · ปุ่มกดไม่ได้จริง ·
          ลิงก์พกตัวเลือกได้: กดเลือกแล้วก๊อป URL ส่งกลับมาได้เลย
        </p>
        <span className="sr-only">
          <Image src="/meecard.png" alt="" width={1} height={1} />
        </span>
      </div>
    </main>
  )
}
