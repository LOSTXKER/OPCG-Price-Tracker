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
    value: "searchCompare" as const,
    label: "7+เทียบ",
    ariaLabel: "แถบล่าง 7 ช่อง เพิ่มปุ่มเปรียบเทียบให้ค้นหาอยู่กึ่งกลาง",
  },
  {
    value: "topTwoRow" as const,
    label: "บน 2 แถว",
    ariaLabel: "ช่องค้นหาบนสุด แถวเลือกเกมและชุดใต้ลงมา ตรึงทั้งสองแถว",
  },
  {
    value: "topCollapse" as const,
    label: "บนยุบเอง",
    ariaLabel: "สองแถวเหมือนกัน แต่แถวเลือกชุดยุบเก็บเองตอนเลื่อนหน้า",
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
  searchCompare: {
    name: "7 ช่อง — เพิ่ม เปรียบเทียบ ให้ปุ่มกลับมากึ่งกลาง",
    summary:
      "เพิ่ม เปรียบเทียบ เป็นช่องที่ 7 ข้างปุ่มค้นหา ทำให้ซ้าย–ขวาเท่ากัน (ฝั่งละ 3) ปุ่มค้นหากลับมาอยู่กึ่งกลางเป๊ะเหมือนแบบ 5 ช่อง",
    tradeoff:
      "ช่องแคบลงเหลือ ~54px ป้ายยาวอย่าง รายการโปรด กับ เปรียบเทียบ โดนตัดท้ายแม้ใช้ตัวหนังสือเล็กสุดแล้ว และ เปรียบเทียบ เป็นเครื่องมือที่ปกติโผล่ตอนเลือกการ์ดอยู่แล้ว การให้ที่ถาวรบนแถบอาจเกินน้ำหนักของมัน",
  },
  topTwoRow: {
    name: "ค้นหาบน 2 แถว — ตรึงทั้งคู่",
    summary:
      "แถวแรกเป็นช่องค้นหายาวเต็มแบบแอปช้อปปิ้ง (มีไอคอนกล้อง ค้นหาด้วยรูปได้) แถวสองคือ OPCG → เลือกชุด กลับมาครบตามที่เบสต้องการ เพราะคนเลือกชุดก่อนจริงๆ — ทั้งสองแถวติดอยู่บนจอตลอด แถบล่างเป็น 5 ช่องเดิม",
    tradeoff:
      "หัวเว็บสูงขึ้นจาก 56px เป็น ~104px กินที่จอถาวร — เห็นราคาน้อยลงราวหนึ่งแถวตลอดเวลาที่เลื่อนอ่าน",
  },
  topCollapse: {
    name: "ค้นหาบน 2 แถว — แถวชุดยุบตอนเลื่อน (ฉันแนะนำแบบนี้)",
    summary:
      "อยู่บนสุดหน้าตาเหมือนแบบ 2 แถวทุกอย่าง แต่พอเริ่มเลื่อนอ่านราคา แถว OPCG → เลือกชุด จะหุบเก็บเองเหลือช่องค้นหาแถวเดียว เลื่อนกลับขึ้นบนสุดแถวชุดก็คืนมา — ได้ทั้งค้นหาเด่นและเลือกชุดง่าย โดยไม่เสียพื้นที่จอถาวร",
    tradeoff:
      "ระหว่างเลื่อนอยู่กลางหน้า แถวเลือกชุดจะไม่โชว์ — อยากเปลี่ยนชุดกลางทางต้องเลื่อนกลับขึ้นบนสุด หรือใช้ปุ่ม ทุกชุด ที่หัวตารางแทน (ซึ่งมีอยู่แล้ว)",
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
      // page is opened on a desktop just to grab the URL. topTwoRow pins a
      // 104px chrome, so its dock offset moves with it; topCollapse is back to
      // 56px by the time anything sticks (the catalog row folds on scroll).
      style={
        {
          "--chrome-h": nav === "topTwoRow" ? "6.5rem" : "3.5rem",
        } as CSSProperties
      }
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
        โครงหน้าเป็นแบบ &quot;จัดระเบียบ&quot; ที่เบสเคาะแล้ว — ที่เหลือคือ
        &quot;ค้นหาอยู่ตรงไหน&quot; 5 แบบ: แถบเดิม · ปุ่มนูนกลาง 5 ช่อง ·
        7 ช่องเพิ่มเปรียบเทียบ · และค้นหาบนแบบ 2 แถว (ตรึงตลอด /
        แถวชุดยุบตอนเลื่อน) — แบบปุ่มนูนถอดปุ่มค้นหาบนออก
        ส่วนแบบค้นหาบนได้ทั้งช่องค้นหายาวและ OPCG → เลือกชุด ครบ
        (แบบ &quot;6 ช่อง&quot; กับ &quot;ค้นหาบนไม่มีแถวชุด&quot;
        พับเก็บแล้ว — เรียกกลับมาดูได้ถ้าต้องการ)
      </p>

      {(
        ["plain", "search", "searchCompare", "topTwoRow", "topCollapse"] as const
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
