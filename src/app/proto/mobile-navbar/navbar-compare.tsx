"use client"

import { Moon, Sun } from "lucide-react"
import { useTheme } from "next-themes"
import { useState, useSyncExternalStore, type CSSProperties } from "react"

import type { CardRow } from "@/components/home/market-types"
import type { SetPickerItem } from "@/components/shared/set-picker"
import { IconButton } from "@/components/ui/icon-button"
import { SegmentedControl } from "@/components/ui/segmented-control"
import type { HomeSetLink } from "@/lib/data/home"
import type { Language } from "@/lib/i18n"
import { cn } from "@/lib/utils"

import {
  ProtoBottomNav,
  ProtoNavbar,
  type NavbarVariant,
} from "./components/proto-navbar"
import { ProtoHero } from "./components/proto-hero"
import { ProtoMarketSection } from "./components/proto-market-section"
import { ProtoSetStrip } from "./components/proto-set-strip"

const VARIANT_OPTIONS = [
  {
    value: "current" as const,
    label: "ปัจจุบัน",
    ariaLabel: "แถบบนแบบปัจจุบัน แถวเดียว",
  },
  {
    value: "twoRow" as const,
    label: "2 แถว",
    ariaLabel: "แถบบนสองแถว ตามที่สั่งไว้",
  },
  {
    value: "polished" as const,
    label: "ขัดเงา",
    ariaLabel: "แถบบนสองแถว เวอร์ชันขัดเงา",
  },
  {
    value: "polishedCollapse" as const,
    label: "ขัดเงา+ยุบ",
    ariaLabel: "แถบบนสองแถวขัดเงา แถวบริบทยุบตอนเลื่อน",
  },
]

const VARIANT_COPY: Record<
  NavbarVariant,
  { name: string; summary: string; tradeoff: string }
> = {
  current: {
    name: "ปัจจุบัน — แถวเดียว",
    summary:
      "ของที่ใช้อยู่บนเว็บตอนนี้: โลโก้ · เลือกเกม → เลือกชุด · รายการโปรด · แจ้งเตือน อัดอยู่ในแถวเดียว 56px",
    tradeoff:
      "ช่องเลือกชุดถูกบีบจนชื่อชุดยาวๆ ขึ้นไม่ครบ และไม่มีที่ให้โปรไฟล์เลย (ต้องเข้าทางดูเพิ่มเติม)",
  },
  twoRow: {
    name: "2 แถว — ตามที่เบสสั่ง",
    summary:
      "แถวบน: โลโก้ + ชื่อเว็บ + รายการโปรด · แจ้งเตือน · โปรไฟล์ · เข้าสู่ระบบ/ออกจากระบบ — แถวล่าง: เลือกเกม → เลือกชุด เต็มความกว้าง ชื่อชุดขึ้นครบ",
    tradeoff:
      "หัวเว็บสูงขึ้นจาก 56px เป็น 104px กินจอถาวรราวหนึ่งแถวราคาตลอดเวลาที่เลื่อนอ่าน",
  },
  polished: {
    name: "ขัดเงา — 2 แถวเหมือนกัน แต่เก็บงานละเอียดขึ้น (ฉันแนะนำ)",
    summary:
      "โครงเดียวกับที่เบสสั่งเป๊ะ ปรับ 4 จุด: (1) กลางแถวบนเปลี่ยนจากคำว่า Meecard เป็นชื่อหน้าที่กำลังดู เพราะโลโก้บอกชื่อเว็บอยู่แล้ว (2) จัดกลุ่มปุ่ม — เครื่องมือ (รายการโปรด · แจ้งเตือน) แยกจากบัญชีด้วยเส้นบางๆ ไม่ใช่ไอคอนสี่อันเรียงพรืด (3) ออกจากระบบย้ายเข้าเมนูรูปโปรไฟล์แบบเว็บทั่วไป คืนที่ว่างมาให้ชื่อหน้า และตอนยังไม่ล็อกอินได้ปุ่ม เข้าสู่ระบบ แบบมีข้อความเต็ม (4) แถวสองมีพื้นหลังอ่อนๆ แยกชั้น พร้อมโลโก้เกมกับภาพกล่องชุด + ชื่อชุดเต็ม",
    tradeoff:
      "ชื่อหน้าต้องเปลี่ยนตามหน้าที่เปิดอยู่ (ต้องต่อระบบเพิ่มนิดหน่อยตอนทำจริง) และรูปกล่องชุดในแถวสองจะโชว์ก็ต่อเมื่อเลือกชุดแล้ว",
  },
  polishedCollapse: {
    name: "ขัดเงา + ยุบตอนเลื่อน",
    summary:
      "ทุกอย่างของแบบขัดเงา แต่แถวสอง (แถบบริบท) หุบเก็บเองตอนเลื่อนอ่านราคา แล้วคลี่กลับเมื่อเลื่อนขึ้นบนสุด — หัวเว็บกลับมา 56px เท่าเดิมตอนอ่าน",
    tradeoff:
      "ระหว่างเลื่อนกลางหน้าจะไม่เห็นช่องเลือกชุด (ใช้ปุ่ม ทุกชุด ที่หัวตารางแทนได้) และมีจังหวะยุบ/คลี่ให้เห็นตอนเลื่อนใกล้หัวหน้า",
  },
}

const subscribeNever = () => () => {}

export function NavbarCompare({
  totalCards,
  totalSets,
  updatedLabels,
  recentSets,
  tableCards,
  tableTotalPages,
  sets,
}: {
  totalCards: number
  totalSets: number
  updatedLabels: Record<Language, string> | null
  recentSets: HomeSetLink[]
  tableCards: CardRow[]
  tableTotalPages: number
  sets: SetPickerItem[]
}) {
  const [variant, setVariant] = useState<NavbarVariant>("polished")
  const [signedIn, setSignedIn] = useState(true)

  const { resolvedTheme, setTheme } = useTheme()
  const mounted = useSyncExternalStore(
    subscribeNever,
    () => true,
    () => false,
  )
  const isDark = mounted && resolvedTheme === "dark"

  return (
    <div
      className="min-h-dvh bg-background text-foreground"
      // Only the pinned two-row variant permanently raises the chrome; the
      // collapsing one is back to 56px by the time anything sticks.
      style={
        {
          // The pinned two-row variants permanently raise the chrome; the
          // collapsing one is back to 56px by the time anything sticks.
          "--chrome-h":
            variant === "twoRow" || variant === "polished" ? "6.5rem" : "3.5rem",
        } as CSSProperties
      }
    >
      <div className="mx-auto w-full max-w-md md:border-x md:border-hair">
        <ProtoNavbar variant={variant} signedIn={signedIn} />

        <main className="px-5 pb-40">
          <ProtoHero
            totalCards={totalCards}
            totalSets={totalSets}
            updatedLabels={updatedLabels}
          />
          <ProtoSetStrip sets={recentSets} />
          <ProtoMarketSection
            cards={tableCards}
            totalPages={tableTotalPages}
            sets={sets}
          />

          <Explainer
            variant={variant}
            signedIn={signedIn}
            onSelect={setVariant}
          />
        </main>
      </div>

      <ProtoBottomNav />

      {/* Clears the bottom bar AND the search button that overhangs it, plus
          the device safe area — the lesson from the last proto, where taps
          died on a real phone. z-popup so no mock chrome can cover it. */}
      <div className="fixed bottom-[calc(6rem+env(safe-area-inset-bottom))] left-1/2 z-popup flex -translate-x-1/2 flex-col items-center gap-1.5">
        <button
          type="button"
          onClick={() => setSignedIn((v) => !v)}
          className="ease-chrome rounded-full border border-hair bg-background/95 px-3 py-1.5 text-micro shadow-lg backdrop-blur-sm"
        >
          {signedIn ? "กำลังดูแบบ: ล็อกอินแล้ว" : "กำลังดูแบบ: ยังไม่ล็อกอิน"} ·
          แตะเพื่อสลับ
        </button>
        <div className="flex items-center gap-1.5">
          <SegmentedControl<NavbarVariant>
            options={VARIANT_OPTIONS}
            value={variant}
            onChange={setVariant}
            ariaLabel="เลือกแบบแถบบนที่กำลังดู"
            size="sm"
            variant="pill"
            className="rounded-full border border-hair bg-background/95 shadow-lg backdrop-blur-sm"
          />
          <IconButton
            aria-label={isDark ? "ดูแบบโหมดสว่าง" : "ดูแบบโหมดมืด"}
            variant="solid"
            onClick={() => setTheme(isDark ? "light" : "dark")}
            className="size-11 rounded-full border border-hair bg-background/95 shadow-lg backdrop-blur-sm"
          >
            {isDark ? <Sun className="size-4" /> : <Moon className="size-4" />}
          </IconButton>
        </div>
      </div>
    </div>
  )
}

function Explainer({
  variant,
  signedIn,
  onSelect,
}: {
  variant: NavbarVariant
  signedIn: boolean
  onSelect: (v: NavbarVariant) => void
}) {
  return (
    <section className="mt-12 space-y-3">
      <h2 className="text-h4">หน้าเทียบแถบเมนูบน (มือถือ)</h2>
      <p className="text-body-sm text-muted-foreground">
        เนื้อหาข้างบนคือหน้าแรกตัวจริงที่เพิ่งขึ้นเว็บ — ต่างกันแค่แถบบน
        สลับได้จากปุ่มลอยด้านล่าง{" "}
        <strong className="text-foreground">
          หรือแตะการ์ดข้างล่างนี้ก็ได้
        </strong>{" "}
        และปุ่มบนสุดสลับดูสถานะ &quot;ล็อกอินแล้ว / ยังไม่ล็อกอิน&quot;
        เพื่อดูว่าแถวบนยังพอไหมเมื่อมีปุ่มครบ (ตอนนี้กำลังดูแบบ
        {signedIn ? " ล็อกอินแล้ว" : " ยังไม่ล็อกอิน"})
      </p>

      {(["current", "twoRow", "polished", "polishedCollapse"] as const).map((v) => (
        <button
          key={v}
          type="button"
          onClick={() => onSelect(v)}
          aria-pressed={v === variant}
          className={cn(
            "ease-chrome block w-full rounded-xl border p-3.5 text-left",
            v === variant
              ? "border-primary/40 bg-primary/5"
              : "border-hair hover:border-primary/25 hover:bg-primary/5",
          )}
        >
          <span className="flex items-center justify-between gap-2">
            <span className="text-label text-foreground">
              {VARIANT_COPY[v].name}
            </span>
            <span
              className={cn(
                "text-micro shrink-0 rounded-full px-2 py-0.5",
                v === variant
                  ? "bg-primary/15 text-primary"
                  : "border border-hair text-muted-foreground",
              )}
            >
              {v === variant ? "กำลังดู" : "แตะเพื่อดู"}
            </span>
          </span>
          <span className="mt-1 block text-body-sm text-muted-foreground">
            {VARIANT_COPY[v].summary}
          </span>
          <span className="mt-1.5 block text-meta">
            ข้อแลก: {VARIANT_COPY[v].tradeoff}
          </span>
        </button>
      ))}

      <ul className="list-disc space-y-1 ps-4 text-meta">
        <li>แถบบนกับแถบล่างเป็นของจำลองไว้วัดระยะจอ กดไม่ได้</li>
        <li>
          ส่วนเนื้อหา (เลือกชุด · ตัวกรอง · เกรด · เรียง · ตาราง/กริด) กดได้จริง
          กับ 24 ใบตัวอย่าง
        </li>
        <li>กดการ์ดหรือชุดแล้วไปหน้าจริงได้ กดย้อนกลับเพื่อกลับมาเทียบต่อ</li>
      </ul>
    </section>
  )
}
