"use client";

import Image from "next/image";
import { useState, useSyncExternalStore } from "react";
import { useTheme } from "next-themes";
import { Moon, Sun, X } from "lucide-react";

import { MobileSortCluster } from "@/components/home/mobile-sort-cluster";
import type { ChangePeriod, ColumnId } from "@/components/home/market-types";
import { GradeControl } from "@/components/market/price-mode-control";
import type { GradeKey } from "@/lib/pricing/grade-tiers";
import { ArtStyleBadge } from "@/components/shared/art-style-badge";
import { RarityBadge } from "@/components/shared/rarity-badge";
import { SetPicker, type SetPickerItem } from "@/components/shared/set-picker";
import { FilterButton } from "@/components/ui/toolbar";
import { IconButton } from "@/components/ui/icon-button";
import { PriceTag } from "@/components/ui/price-tag";
import { SegmentedControl } from "@/components/ui/segmented-control";
import { ViewModeControl } from "@/components/ui/view-mode-control";
import { cn } from "@/lib/utils";

import { useProtoFlag, useProtoVariant } from "../_kit/use-proto-variant";

/* ------------------------------------------------------------------ data */

/** 6 ชุดแรกจาก /api/sets จริง — รหัส ชื่อ และรูปกล่องของจริง */
const SETS: SetPickerItem[] = [
  {
    code: "op15",
    name: "Adventure on KAMINARI Island",
    nameEn: "Adventure on KAMINARI Island",
    type: "BOOSTER",
    cardCount: 155,
  },
  {
    code: "op14",
    name: "The Azure Sea's Successor",
    nameEn: "The Azure Sea's Successor",
    type: "BOOSTER",
    cardCount: 152,
  },
  {
    code: "op13",
    name: "The New Brave",
    nameEn: "The New Brave",
    type: "BOOSTER",
    cardCount: 150,
  },
  {
    code: "op12",
    name: "Legacy of the Master",
    nameEn: "Legacy of the Master",
    type: "BOOSTER",
    cardCount: 149,
  },
  {
    code: "eb02",
    name: "Anime 25th Collection",
    nameEn: "Anime 25th Collection",
    type: "EXTRA_BOOSTER",
    cardCount: 84,
  },
  {
    code: "st21",
    name: "EX Gear 5",
    nameEn: "EX Gear 5",
    type: "STARTER",
    cardCount: 17,
  },
];

/** 4 แถวแรกของหน้าแรกจริง (Raw · 7 วัน) — ชื่อ รหัส ราคา และรูปของจริง */
const ROWS = [
  {
    name: "Monkey.D.Luffy",
    code: "OP13-118_p3",
    rarity: "P-SEC",
    price: "268,800 ฿",
    change: -0.1,
    img: "https://pub-e1c871a889eb42a4bd7dcdc3a5926f3c.r2.dev/op13/OP13-118_p3.png",
  },
  {
    name: "Monkey.D.Luffy",
    code: "OP05-119_p7",
    rarity: "SP",
    price: "209,580 ฿",
    change: 26.8,
    img: "https://pub-e1c871a889eb42a4bd7dcdc3a5926f3c.r2.dev/op05/OP05-119_p7.png",
  },
  {
    name: "Gol.D.Roger",
    code: "OP09-118_p2",
    rarity: "P-SEC",
    price: "125,580 ฿",
    change: 41.7,
    img: "https://pub-e1c871a889eb42a4bd7dcdc3a5926f3c.r2.dev/op09/OP09-118_p2.png",
  },
  {
    name: "Portgas.D.Ace",
    code: "OP13-119_p3",
    rarity: "P-SEC",
    price: "104,580 ฿",
    change: -12.8,
    img: "https://pub-e1c871a889eb42a4bd7dcdc3a5926f3c.r2.dev/op13/OP13-119_p3.png",
  },
] as const;

/* --------------------------------------------------------------- options */

type Way = "current" | "asked" | "chip" | "onerow";

const WAY_OPTIONS = [
  { value: "current", label: "ปัจจุบัน · 2 แถว" },
  { value: "asked", label: "A · ตามที่สั่ง" },
  { value: "chip", label: "B · A + ป้ายชุดที่เลือก" },
  { value: "onerow", label: "C · ยุบเหลือแถวเดียว" },
] as const;

const WAY_VALUES = WAY_OPTIONS.map((o) => o.value);

const COPY: Record<
  Way,
  { name: string; summary: string; tradeoff: string; rows: string }
> = {
  current: {
    name: "ปัจจุบัน — ชุดอยู่นอก กินความกว้างเต็มแถวบน",
    summary:
      "แถวบน: ปุ่มเลือกชุด (กว้างที่สุดในแถว) + ตัวกรอง + มุมมอง · แถวล่างที่เกาะอยู่ตอนเลื่อน: เกรด แล้วก็แคปซูลเรียง · ชุดที่กำลังดูอยู่อ่านได้ตลอดเวลาโดยไม่ต้องกดอะไร",
    tradeoff:
      "แถวบนแน่น — ปุ่มชุดกับตัวกรองแย่งที่กัน และมุมมอง (สองปุ่มเล็ก) ไปเบียดอยู่ท้ายแถวทั้งที่ไม่ได้เกี่ยวกับการกรองเลย · เกรดอยู่คนละแถวกับตัวกรอง ทั้งที่ทั้งคู่คือ “เลือกจะดูอะไร” เหมือนกัน",
    rows: "2 แถว",
  },
  asked: {
    name: "A · ตามที่สั่ง — ชุดเข้าไปในตัวกรอง",
    summary:
      "แถวบนเหลือ เกรด + ตัวกรอง (เกรดได้ที่กว้างขึ้น เห็นครบถึง BGS 9.5 โดยไม่ต้องปัด) · แถวที่เกาะตอนเลื่อน: แคปซูลเรียง + มุมมอง · ชุดย้ายเข้าไปเป็นหัวข้อแรกในกล่องตัวกรอง",
    tradeoff:
      "⚠️ ขัดกับที่เคยเคาะไว้เอง — คนเล่นการ์ดวันพีชเลือก “ชุด” ก่อนเป็นอย่างแรก กติกาของเว็บจึงเขียนไว้ว่าชุดต้องอยู่นอกกล่องตัวกรองเสมอ · พอย้ายเข้าไป การเปลี่ยนชุดกลายเป็น 3 จังหวะ (กดตัวกรอง → เลือกชุด → กดใช้) จากเดิมกดครั้งเดียว และที่สำคัญกว่านั้นคือ **มองไม่เห็นว่าตอนนี้กำลังดูชุดไหนอยู่** เหลือแค่เลขบนปุ่มตัวกรองว่ามีตัวกรองเปิดอยู่กี่อัน",
    rows: "2 แถว",
  },
  chip: {
    name: "B · เหมือน A แต่มีป้ายบอกชุดที่เลือก",
    summary:
      "โครงเดียวกับ A ทุกอย่าง — เพิ่มแค่ป้ายเล็กใต้แถวบนที่ขึ้นมา **เฉพาะตอนเลือกชุดแล้ว** บอกว่ากำลังดูชุดไหน กดกากบาทเพื่อกลับไปดูทุกชุดได้ทันที · ตอนดูทุกชุด (ค่าเริ่มต้น) ไม่มีป้าย แถวจึงกระชับเท่า A เป๊ะ",
    tradeoff:
      "ยังต้องกด 3 จังหวะเพื่อ **เปลี่ยน** ชุดอยู่ดี (ป้ายบอกได้อย่างเดียวว่าอยู่ชุดไหน กับเอาออก) · ตอนเลือกชุดแล้วจะมีแถบเพิ่มมา 1 แถว ซึ่งเป็นตอนที่คนกำลังไล่ดูการ์ดในชุดนั้นพอดี",
    rows: "2 แถว (3 เมื่อเลือกชุด)",
  },
  onerow: {
    name: "C · ยุบเหลือแถวเดียว — ทุกอย่างอยู่ในตัวกรอง",
    summary:
      "เอาทั้งชุดและเกรดเข้ากล่องตัวกรอง เหลือแถวเดียวที่เกาะอยู่ตอนเลื่อน: แคปซูลเรียง + ตัวกรอง + มุมมอง · ได้ที่ให้รายการการ์ดมากที่สุดในทุกแบบ — เห็นการ์ดเพิ่มอีกเกือบหนึ่งแถวเต็มตั้งแต่ยังไม่เลื่อน",
    tradeoff:
      "⚠️ ที่จอ 375px ของสามชิ้นยัดในแถวเดียวไม่ลงจริง — ดูในกรอบข้างๆ จะเห็นว่าแคปซูลเรียงโดนตัด คำว่า “เปลี่ยนแปลง” หายไปครึ่งคำและปุ่ม 7d หายทั้งปุ่ม (ไม่ใช่ของเสีย เป็นผลจริงของการยัดแถวเดียว) · และเกรดเป็นของที่คนสลับบ่อยที่สุดในหน้านี้ (Raw ↔ PSA 10 คือคำถามหลักของคนเช็คราคา) พอเข้าไปอยู่ในกล่องก็ต้องกด 3 จังหวะทุกครั้ง โดยหน้าจอไม่บอกเลยว่ากำลังดูราคาเกรดไหนอยู่ — อันตรายกว่าไม่บอกชุด เพราะตัวเลขราคาหน้าตาเหมือนกันหมด",
    rows: "1 แถว",
  },
};

const NOTES = [
  "แถวที่เกาะอยู่ตอนเลื่อน = แถวที่ติดอยู่ใต้แถบเมนูเวลาไถลงไปดูการ์ด (ของจริงเป็นแบบนั้นอยู่แล้ว)",
  "กดปุ่ม “เลือกชุด op13 แล้ว” ข้างบนเพื่อดูว่าแต่ละแบบบอกหรือไม่บอกว่ากำลังดูชุดไหนอยู่ — นี่คือจุดที่ A กับ B ต่างกันจริงๆ",
  "ปุ่มทุกปุ่มในหน้านี้เป็นคอมโพเนนต์ตัวจริงจากเว็บ (ปุ่มเลือกชุด · แถบเกรด · ปุ่มตัวกรอง · ปุ่มมุมมอง · แคปซูลเรียง) กดได้จริงทุกอัน แต่ไม่ได้ต่อฐานข้อมูล",
  "กล่องตัวกรองจริงยังไม่ได้ทำในหน้านี้ — กดปุ่มตัวกรองแล้วจะไม่เปิดอะไร รอบนี้เคาะแค่ว่าอะไรอยู่ตรงไหนในแถบ ส่วนข้างในกล่องค่อยจัดตอนลงจริง",
  "รายการการ์ดใต้แถบเป็น 4 ใบแรกของหน้าแรกจริง (ชื่อ รหัส ราคา รูป ของจริงหมด) มีไว้ให้เห็นว่าแถบกินที่ไปเท่าไรก่อนถึงการ์ดใบแรก",
  "บนคอมไม่เปลี่ยนอะไรเลยทั้ง 4 แบบ — แถบบนคอมเป็นแถวเดียวอยู่แล้วและมีที่พอ รอบนี้แตะเฉพาะมือถือ",
] as const;

/* ----------------------------------------------------------------- atoms */

/** ป้ายชุดที่เลือก (แบบ B) */
function SetChip({ code, onClear }: { code: string; onClear: () => void }) {
  return (
    <div className="flex items-center gap-1.5 pb-2">
      <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/15 py-1 pe-1 ps-2.5 text-xs font-medium text-primary">
        {code.toUpperCase()}
        <button
          type="button"
          onClick={onClear}
          aria-label="ดูทุกชุด"
          className="flex size-5 items-center justify-center rounded-full hover:bg-primary/20"
        >
          <X className="size-3" />
        </button>
      </span>
      <span className="text-meta">กำลังดูเฉพาะชุดนี้</span>
    </div>
  );
}

/** แถวการ์ดบนมือถือ — ลอกจากของจริง เพื่อให้เห็นว่าแถบกินที่ไปเท่าไร */
function CardRow({ row, rank }: { row: (typeof ROWS)[number]; rank: number }) {
  return (
    <div className="flex min-h-[52px] items-center gap-3 py-2.5">
      <span className="w-5 shrink-0 text-center font-price text-xs text-muted-foreground">
        {rank}
      </span>
      <div className="hairline relative aspect-[63/88] w-11 shrink-0 overflow-hidden rounded-md bg-muted">
        <Image
          src={row.img}
          alt={row.name}
          fill
          className="object-contain"
          sizes="44px"
        />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex min-w-0 items-center gap-1.5">
          <p className="truncate text-sm font-medium leading-tight">{row.name}</p>
          <ArtStyleBadge cardCode={row.code} compact />
        </div>
        <div className="mt-0.5 flex items-center gap-1.5 text-meta">
          <span className="font-mono">{row.code.split("_")[0]}</span>
          <RarityBadge rarity={row.rarity} size="sm" />
        </div>
      </div>
      <div className="flex shrink-0 flex-col items-end gap-1 text-right">
        <p className="font-price text-sm font-semibold">{row.price}</p>
        <PriceTag
          change={row.change}
          changeOnly
          changeStyle="plain"
          showArrow={false}
          size="sm"
        />
      </div>
    </div>
  );
}

/* ------------------------------------------------------------ page shell */

const subscribeNever = () => () => {};

export default function MobileToolbarProtoPage() {
  const [way, setWay] = useProtoVariant<Way>("v", WAY_VALUES, "asked");
  const [setChosen, toggleSetChosen] = useProtoFlag("set");

  // สถานะจริงของตัวควบคุมทุกตัว — กดเล่นได้เหมือนของจริง
  const [grade, setGrade] = useState<GradeKey>("raw");
  const [viewMode, setViewMode] = useState<"table" | "grid">("table");
  const [period, setPeriod] = useState<ChangePeriod>("7d");
  const [sortCol, setSortCol] = useState<ColumnId | null>("price");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");

  const { resolvedTheme, setTheme } = useTheme();
  const mounted = useSyncExternalStore(
    subscribeNever,
    () => true,
    () => false,
  );
  const isDark = mounted && resolvedTheme === "dark";
  const copy = COPY[way];

  const onSort = (col: ColumnId) => {
    if (col === sortCol) setSortDir(sortDir === "asc" ? "desc" : "asc");
    else {
      setSortCol(col);
      setSortDir("desc");
    }
  };

  const selectedCode = setChosen ? "op13" : null;
  // แบบ A/B/C ชุดอยู่ในกล่องตัวกรอง → ถ้าเลือกชุดแล้วต้องนับรวมในเลขบนปุ่ม
  const filterCount = (way !== "current" && setChosen ? 1 : 0) + 2;

  const setControl = (
    <SetPicker
      sets={SETS}
      selectedCode={selectedCode}
      onSelect={() => toggleSetChosen()}
      variant="inline"
      nullable
      prominent
      triggerClassName="tap-safe rounded-lg border-primary/25 bg-primary/5 hover:border-primary/35 hover:bg-primary/10 aria-expanded:rounded-b-none aria-expanded:border-primary/35 aria-expanded:bg-primary/10"
    />
  );

  const filterButton = (
    <FilterButton
      aria-label="ตัวกรอง"
      active={filterCount > 0}
      count={filterCount}
      className="shrink-0"
    >
      ตัวกรอง
    </FilterButton>
  );

  const viewControl = (
    <ViewModeControl
      modes={["table", "grid"]}
      value={viewMode}
      onChange={setViewMode}
    />
  );

  const gradeControl = <GradeControl value={grade} onChange={setGrade} />;

  const sortCluster = (
    <MobileSortCluster
      period={period}
      onPeriodChange={setPeriod}
      sortCol={sortCol}
      sortDir={sortDir}
      onSort={onSort}
      sortEnabled={grade === "raw"}
      className="shrink-0"
    />
  );

  /** แถวที่เกาะอยู่ตอนเลื่อน — พื้นเทาจางเพื่อให้เห็นว่าอันไหนคือแถวนั้น */
  const stickyRow = (children: React.ReactNode) => (
    <div className="flex items-center gap-2 border-y border-hair bg-muted/25 px-4 py-1.5">
      {children}
    </div>
  );

  return (
    <main className="min-h-screen bg-background px-4 py-8 text-foreground sm:px-6 lg:px-10">
      <div className="mx-auto max-w-[1200px]">
        <h1 className="text-h1">แถบควบคุมบนหน้าแรก (มือถือ)</h1>
        <p className="mt-2 max-w-3xl text-body text-muted-foreground">
          คำถามเดียวที่ต้องเคาะ:{" "}
          <strong>ปุ่มเลือกชุดควรอยู่นอกแถบต่อ หรือย้ายเข้าไปในกล่องตัวกรอง</strong>{" "}
          — ส่วนการย้ายมุมมองไปข้างขวาของแคปซูลเรียง และย้ายเกรดขึ้นไปข้างซ้ายของตัวกรอง
          ทำเหมือนกันหมดในแบบ A · B · C แล้ว
        </p>

        <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-3">
            <div className="overflow-x-auto pb-1">
              <SegmentedControl
                options={WAY_OPTIONS}
                value={way}
                onChange={setWay}
                ariaLabel="เลือกการจัดแถบ"
                className="min-w-max"
                compactVisual={false}
              />
            </div>
            <button
              type="button"
              onClick={toggleSetChosen}
              className={cn(
                "hairline ease-chrome h-10 shrink-0 rounded-full px-3.5 text-sm font-medium transition-colors hover:bg-muted",
                setChosen && "bg-primary/15 text-primary",
              )}
            >
              {setChosen ? "กลับไปดูทุกชุด" : "เลือกชุด op13 แล้ว"}
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

        <section className="mt-6 grid gap-8 lg:grid-cols-[375px_minmax(0,1fr)]">
          <div className="min-w-0">
            <p className="text-eyebrow mb-2">
              มือถือ (กว้าง 375px เท่าของจริง) · {copy.rows}
            </p>
            <div className="-mx-4 sm:mx-0">
              <div className="hairline w-[375px] max-w-full overflow-hidden bg-background sm:rounded-2xl">
                {way === "current" && (
                  <>
                    <div className="flex items-center gap-2 px-4 py-3">
                      <div className="min-w-0 flex-1">{setControl}</div>
                      <div className="shrink-0">{filterButton}</div>
                      <div className="shrink-0">{viewControl}</div>
                    </div>
                    {stickyRow(
                      <>
                        <div className="min-w-0 flex-1">{gradeControl}</div>
                        <span aria-hidden className="h-4 w-px shrink-0 bg-hair" />
                        {sortCluster}
                      </>,
                    )}
                  </>
                )}

                {(way === "asked" || way === "chip") && (
                  <>
                    <div className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="min-w-0 flex-1">{gradeControl}</div>
                        <div className="shrink-0">{filterButton}</div>
                      </div>
                      {way === "chip" && setChosen && (
                        <div className="pt-2">
                          <SetChip code="op13" onClear={toggleSetChosen} />
                        </div>
                      )}
                    </div>
                    {stickyRow(
                      <>
                        <div className="min-w-0 flex-1">{sortCluster}</div>
                        <div className="shrink-0">{viewControl}</div>
                      </>,
                    )}
                  </>
                )}

                {way === "onerow" &&
                  stickyRow(
                    <>
                      <div className="min-w-0 flex-1">{sortCluster}</div>
                      <div className="shrink-0">{filterButton}</div>
                      <div className="shrink-0">{viewControl}</div>
                    </>,
                  )}

                <div className="divide-y divide-hair px-4">
                  {ROWS.map((row, i) => (
                    <CardRow key={row.code} row={row} rank={i + 1} />
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="border-l-2 border-primary pl-4">
              <h2 className="text-h3">{copy.name}</h2>
              <p className="mt-1.5 max-w-2xl text-body-sm">{copy.summary}</p>
              <p className="mt-1 max-w-2xl text-meta">ข้อแลก: {copy.tradeoff}</p>
            </div>

            <div className="hairline rounded-2xl bg-card p-4">
              <p className="text-eyebrow mb-2">
                กติกาเดิมที่เรื่องนี้ไปชนเข้า
              </p>
              <p className="text-body-sm text-muted-foreground">
                เว็บเราเคยเคาะไว้ (และเขียนเป็นกติกาในคู่มือทีมแล้ว) ว่า{" "}
                <strong className="text-foreground">
                  ปุ่มเลือกชุดต้องอยู่นอกกล่องตัวกรองเสมอ
                </strong>{" "}
                เพราะคนเล่นการ์ดวันพีชเริ่มจาก “ขอดูชุด OP13 หน่อย” ไม่ได้เริ่มจาก
                “ขอดูการ์ดสีแดงทุกชุด” — ชุดจึงถูกวางเป็นตัวเลือกแรกที่เห็นได้โดยไม่ต้องกด
                เหมือนที่เว็บราคาคริปโตวางหมวดไว้หน้าสุด
              </p>
              <p className="mt-2 text-body-sm text-muted-foreground">
                รอบนี้เบสขอย้ายเข้าไปในตัวกรอง ซึ่งสวนกติกานั้น — ไม่ได้แปลว่าผิด
                (เจ้าของงานเปลี่ยนกติกาตัวเองได้) แต่ต้องเคาะรู้ตัวว่ากำลังเปลี่ยนอะไร
                และถ้าเคาะ A หรือ C ฉันจะไปแก้กติกาในคู่มือให้ตรงกันด้วย ไม่งั้นครั้งหน้า
                จะมีคนย้ายกลับ
              </p>
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
          ชื่อ รหัส ราคา และรูปการ์ดก๊อปมาจากหน้าแรกจริง แต่เป็นข้อมูลตายตัว
          ไม่ได้ต่อฐานข้อมูล · ลิงก์พกตัวเลือกได้: กดเลือกแล้วก๊อป URL ส่งกลับมาได้เลย
        </p>
      </div>
    </main>
  );
}
