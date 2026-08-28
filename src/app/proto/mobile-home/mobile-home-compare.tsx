"use client"

import { Moon, Sun } from "lucide-react"
import { useTheme } from "next-themes"
import { useState, useSyncExternalStore, type CSSProperties } from "react"

import type { CardRow } from "@/components/home/market-types"
import type { SetPickerItem } from "@/components/shared/set-picker"
import { IconButton } from "@/components/ui/icon-button"
import { SegmentedControl } from "@/components/ui/segmented-control"
import type { HomeSetLink, TrendingCard } from "@/lib/data/home"
import type { Language } from "@/lib/i18n"
import { cn } from "@/lib/utils"

import { ProtoBottomNav, ProtoTopBar } from "./components/proto-chrome"
import { ProtoHero } from "./components/proto-hero"
import { ProtoHighlightStrip } from "./components/proto-highlight-strip"
import { ProtoMarketSection } from "./components/proto-market-section"
import { ProtoSetStrip } from "./components/proto-set-strip"

type Variant = "a" | "b"

const VARIANT_OPTIONS = [
  { value: "a" as const, label: "A · จัดระเบียบ", ariaLabel: "แบบ A จัดระเบียบ" },
  { value: "b" as const, label: "B · มีไฮไลต์", ariaLabel: "แบบ B มีไฮไลต์ตลาด" },
]

const VARIANT_COPY: Record<
  Variant,
  { name: string; summary: string; tradeoff: string }
> = {
  a: {
    name: "แบบ A — จัดระเบียบ",
    summary:
      "คงทุกส่วนเดิมครบ แต่จัดขอบซ้าย–ขวาให้ตรงกันทั้งหน้า หดหัวเรื่องจากย่อหน้ายาวเหลือสามบรรทัด และยุบแถบควบคุมจากสามแถวเหลือสองแถว — ช่วงเวลา 24h/7d/30d กลายเป็นปุ่มเล็กติดกับคำว่า เปลี่ยนแปลง แตะเพื่อสลับ",
    tradeoff:
      "หน้าตาใกล้ของเดิมที่สุดและเห็นราคาเร็วขึ้นเกือบเท่าตัว แต่ไม่มีของใหม่ให้ดู",
  },
  b: {
    name: "แบบ B — จัดระเบียบ + ไฮไลต์ตลาด",
    summary:
      "ทุกอย่างของแบบ A แล้วเพิ่มแถบการ์ดเด่นปัดข้างได้ (มูลค่าสูงสุด · ขึ้นแรง · ลงแรง) ซึ่งวันนี้มีเฉพาะบนจอคอม — มือถือไม่เคยเห็นเลย",
    tradeoff:
      "หน้าดูมีชีวิตขึ้นและเล่าเรื่องตลาดได้ทันที แต่ตารางราคาถูกดันลงไปราวหนึ่งช่วงนิ้วโป้ง",
  },
}

const subscribeNever = () => () => {}

export function MobileHomeCompare({
  totalCards,
  totalSets,
  updatedLabels,
  featured,
  gainers,
  losers,
  recentSets,
  tableCards,
  tableTotalPages,
  sets,
}: {
  totalCards: number
  totalSets: number
  updatedLabels: Record<Language, string> | null
  featured: TrendingCard | null
  gainers: TrendingCard[]
  losers: TrendingCard[]
  recentSets: HomeSetLink[]
  tableCards: CardRow[]
  tableTotalPages: number
  sets: SetPickerItem[]
}) {
  const [variant, setVariant] = useState<Variant>("a")

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
        <ProtoTopBar />

        {/* THE gutter: 20px, once. No descendant re-adds horizontal padding —
            full-bleed rails cancel it with -mx-5, the row list with -mx-4. */}
        <main className="px-5 pb-36">
          <ProtoHero
            totalCards={totalCards}
            totalSets={totalSets}
            updatedLabels={updatedLabels}
          />

          {variant === "b" && (
            <ProtoHighlightStrip
              featured={featured}
              gainers={gainers}
              losers={losers}
            />
          )}

          <ProtoSetStrip sets={recentSets} />

          <ProtoMarketSection
            cards={tableCards}
            totalPages={tableTotalPages}
            sets={sets}
          />

          <Explainer variant={variant} />
        </main>
      </div>

      <ProtoBottomNav />

      <div className="fixed bottom-24 left-1/2 z-floating flex -translate-x-1/2 items-center gap-1.5">
        <SegmentedControl<Variant>
          options={VARIANT_OPTIONS}
          value={variant}
          onChange={setVariant}
          ariaLabel="เลือกแบบหน้าแรกที่กำลังดู"
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

function Explainer({ variant }: { variant: Variant }) {
  return (
    <section className="mt-12 space-y-3">
      <h2 className="text-h4">หน้าเทียบนี้คืออะไร</h2>
      <p className="text-body-sm text-muted-foreground">
        หน้าแรกมือถือจัดใหม่ 2 แบบ ใช้ข้อมูลจริงจากเว็บทั้งหมด —
        ปุ่มลอยด้านล่างสลับแบบได้ทันทีโดยหน้าไม่เลื่อนกลับขึ้นบน
        ลองเลื่อนเทียบว่ากว่าจะถึงราคาแถวแรกต้องผ่านอะไรบ้าง
      </p>

      {(["a", "b"] as const).map((v) => (
        <div
          key={v}
          className={cn(
            "rounded-xl border p-3.5",
            v === variant ? "border-primary/40 bg-primary/5" : "border-hair",
          )}
        >
          <p className="text-label text-foreground">{VARIANT_COPY[v].name}</p>
          <p className="mt-1 text-body-sm text-muted-foreground">
            {VARIANT_COPY[v].summary}
          </p>
          <p className="mt-1.5 text-meta">ข้อแลก: {VARIANT_COPY[v].tradeoff}</p>
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
