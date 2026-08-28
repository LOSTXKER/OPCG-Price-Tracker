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
  ProtoTopBar,
  type ChromeVariant,
} from "./components/proto-chrome"
import { ProtoHero } from "./components/proto-hero"
import { ProtoMarketSection } from "./components/proto-market-section"
import { ProtoSetStrip } from "./components/proto-set-strip"

// Layout "แบบ A — จัดระเบียบ" is the owner-approved content (2026-08-28); the
// remaining open decision this page compares is the BOTTOM BAR: today's 5-tab
// bar vs a raised center-search button. (The retired variant-B highlight strip
// still lives in ./components/proto-highlight-strip.tsx, just unmounted.)

const NAV_OPTIONS = [
  {
    value: "plain" as const,
    label: "เดิม",
    ariaLabel: "แถบล่างแบบเดิม 5 ช่อง",
  },
  {
    value: "search" as const,
    label: "กลาง 5",
    ariaLabel: "แถบล่างแบบปุ่มค้นหากลาง 5 ช่อง",
  },
  {
    value: "searchAll" as const,
    label: "6 ช่อง",
    ariaLabel: "แถบล่างแบบปุ่มค้นหาและครบทุกช่องเดิม รวม 6 ช่อง",
  },
  {
    value: "searchCompare" as const,
    label: "7+เทียบ",
    ariaLabel: "แถบล่าง 7 ช่อง เพิ่มปุ่มเปรียบเทียบให้ค้นหาอยู่กึ่งกลาง",
  },
  {
    value: "topSearch" as const,
    label: "ค้นหาบน",
    ariaLabel: "ช่องค้นหาเต็มความกว้างบนแถบบน แถบล่างเป็นแบบเดิม",
  },
]

const NAV_COPY: Record<
  ChromeVariant,
  { name: string; summary: string; tradeoff: string }
> = {
  plain: {
    name: "แถบล่างเดิม — 5 ช่องเท่ากัน",
    summary:
      "หน้าแรก · ชุดการ์ด · รายการโปรด · พอร์ต · ดูเพิ่มเติม ครบเหมือนทุกวันนี้ ปุ่มค้นหาอยู่มุมขวาบนตามเดิม",
    tradeoff: "ไม่มีอะไรต้องย้าย แต่ปุ่มค้นหาก็ไม่ได้เด่นขึ้น",
  },
  search: {
    name: "ค้นหากลาง — ปุ่มนูนกลางแถบ (5 ช่อง)",
    summary:
      "ปุ่มค้นหาทรงกลมสีหลักของเว็บนูนขึ้นกลางแถบพอดีเป๊ะ กดถึงง่ายสุดด้วยนิ้วโป้ง และช่องค้นหาที่มุมขวาบนถูกถอดออก (เหลือจุดเดียว ไม่ซ้ำซ้อน)",
    tradeoff:
      "ช่องกลางของแถบวันนี้คือ รายการโปรด — แบบนี้ รายการโปรด ต้องย้ายไปเป็นแท็บย่อยในพอร์ต (กดเพิ่มหนึ่งชั้นกว่าจะถึง)",
  },
  searchAll: {
    name: "ครบ 6 ช่อง — ค้นหา + รายการโปรด อยู่ด้วยกัน",
    summary:
      "เก็บทุกช่องเดิมไว้ครบแล้วแทรกปุ่มค้นหาเพิ่มเป็นช่องที่ 6 — ไม่ต้องย้าย รายการโปรด ไปไหน",
    tradeoff:
      "6 ช่องแบ่งกึ่งกลางไม่ลงตัว ปุ่มค้นหาเลยเยื้องขวาจากกลางจอราวครึ่งช่อง และทุกช่องแคบลงจนตัวหนังสือต้องเล็กลงหนึ่งขั้น — ลองมองแล้วชั่งว่ารกไปไหม",
  },
  searchCompare: {
    name: "7 ช่อง — เพิ่ม เปรียบเทียบ ให้ปุ่มกลับมากึ่งกลาง",
    summary:
      "เพิ่ม เปรียบเทียบ เป็นช่องที่ 7 ข้างปุ่มค้นหา ทำให้ซ้าย–ขวาเท่ากัน (ฝั่งละ 3) ปุ่มค้นหากลับมาอยู่กึ่งกลางเป๊ะเหมือนแบบ 5 ช่อง",
    tradeoff:
      "ช่องแคบลงเหลือ ~54px ป้ายยาวอย่าง รายการโปรด กับ เปรียบเทียบ โดนตัดท้ายแม้ใช้ตัวหนังสือเล็กสุดแล้ว และ เปรียบเทียบ เป็นเครื่องมือที่ปกติโผล่ตอนเลือกการ์ดอยู่แล้ว การให้ที่ถาวรบนแถบอาจเกินน้ำหนักของมัน",
  },
  topSearch: {
    name: "ค้นหาบน — ช่องค้นหายาวเต็มแถบแบบแอปช้อปปิ้ง",
    summary:
      "แถบบนกลายเป็นช่องค้นหายาวเต็มความกว้าง (พร้อมไอคอนกล้อง ค้นหาด้วยรูปได้) เห็นแล้วรู้ทันทีว่าพิมพ์ค้นหาตรงนี้ — ส่วนแถบล่างกลับเป็น 5 ช่องเดิมครบ ไม่ต้องย้ายอะไรเลย",
    tradeoff:
      "ตัวเลือกเกม → ชุดที่เคยอยู่แถบบนต้องหาที่อยู่ใหม่ — หน้าแรกไม่เดือดร้อน (มีแถบชุด + ปุ่มทุกชุดในหน้าอยู่แล้ว ซ้ำ 3 จุดจะเหลือจุดเดียวด้วยซ้ำ) แต่หน้าอื่นต้องออกแบบที่วางเพิ่ม",
  },
}

const subscribeNever = () => () => {}

export function MobileHomeCompare({
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
  const [nav, setNav] = useState<ChromeVariant>("plain")

  // Same theme-preview pattern as /proto/navbar: flip the real site theme so
  // the whole frame previews light/dark; gate on hydration so SSR agrees.
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
      // The proto is a phone frame at every viewport; without this the sticky
      // column header would dock 100px down (--chrome-h grows at md:) when the
      // page is opened on a desktop just to grab the URL.
      style={{ "--chrome-h": "3.5rem" } as CSSProperties}
    >
      <div className="mx-auto w-full max-w-md md:border-x md:border-hair">
        <ProtoTopBar variant={nav} />

        {/* THE gutter: 20px, once. No descendant re-adds horizontal padding —
            full-bleed rails cancel it with -mx-5, the row list with -mx-4. */}
        <main className="px-5 pb-36">
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

          <Explainer nav={nav} />
        </main>
      </div>

      <ProtoBottomNav variant={nav} />

      <div className="fixed bottom-28 left-1/2 z-floating flex -translate-x-1/2 items-center gap-1.5">
        <SegmentedControl<ChromeVariant>
          options={NAV_OPTIONS}
          value={nav}
          onChange={setNav}
          ariaLabel="เลือกแบบแถบค้นหา/แถบล่างที่กำลังดู"
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
  )
}

function Explainer({ nav }: { nav: ChromeVariant }) {
  return (
    <section className="mt-12 space-y-3">
      <h2 className="text-h4">หน้าเทียบนี้คืออะไร</h2>
      <p className="text-body-sm text-muted-foreground">
        โครงหน้าเป็นแบบ &quot;จัดระเบียบ&quot; ที่เบสเคาะแล้ว —
        ที่เหลือคือ &quot;ค้นหาอยู่ตรงไหน&quot; 5 แบบ: แถบเดิม ·
        ปุ่มนูนกลาง 5 ช่อง · ครบ 6 ช่อง · 7 ช่องเพิ่มเปรียบเทียบ ·
        หรือช่องค้นหายาวบนแถบบนแบบแอปช้อปปิ้ง — แบบปุ่มนูนทุกแบบถอดปุ่มค้นหาบนออก
        ส่วนแบบค้นหาบนถอดตัวเลือกเกม→ชุดออกจากแถบบนแทน
      </p>

      {(
        ["plain", "search", "searchAll", "searchCompare", "topSearch"] as const
      ).map((v) => (
        <div
          key={v}
          className={cn(
            "rounded-xl border p-3.5",
            v === nav ? "border-primary/40 bg-primary/5" : "border-hair",
          )}
        >
          <p className="text-label text-foreground">{NAV_COPY[v].name}</p>
          <p className="mt-1 text-body-sm text-muted-foreground">
            {NAV_COPY[v].summary}
          </p>
          <p className="mt-1.5 text-meta">ข้อแลก: {NAV_COPY[v].tradeoff}</p>
        </div>
      ))}

      <ul className="list-disc space-y-1 ps-4 text-meta">
        <li>
          กดการ์ดหรือชุดแล้วไปหน้าจริงได้เลย — กดย้อนกลับเพื่อกลับมาเทียบต่อ
        </li>
        <li>
          สลับเกรด · ช่วงเวลา (แตะปุ่ม 24h/7d/30d ข้างคำว่า เปลี่ยนแปลง) · เรียง ·
          มุมมองตาราง/กริด · ตัวกรอง ใช้งานได้จริงกับ 24 ใบตัวอย่าง
        </li>
        <li>
          ช่องเลือกชุดกับปุ่มแบ่งหน้าเป็นตัวอย่างเลย์เอาต์ ยังไม่กรอง/เปลี่ยนหน้าจริง
        </li>
        <li>
          รางชุดในหน้าเทียบเลื่อนด้วยนิ้วอย่างเดียว — ของจริงยังไหลเองเหมือนเดิม
        </li>
        <li>แถบบนและแถบล่างเป็นของจำลองไว้วัดระยะจอ กดไม่ได้</li>
      </ul>
    </section>
  )
}
