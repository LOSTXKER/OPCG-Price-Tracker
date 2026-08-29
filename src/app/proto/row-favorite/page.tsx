"use client";

import Image from "next/image";
import { useCallback, useState, useSyncExternalStore } from "react";
import { useTheme } from "next-themes";
import { Heart, Moon, Sun } from "lucide-react";

import { RarityBadge } from "@/components/shared/rarity-badge";
import { IconButton } from "@/components/ui/icon-button";
import { PriceTag } from "@/components/ui/price-tag";
import { SegmentedControl } from "@/components/ui/segmented-control";
import { cn } from "@/lib/utils";

import { useProtoFlag, useProtoVariant } from "../_kit/use-proto-variant";

/* ------------------------------------------------------------------ data */

/**
 * 8 แถวแรกของหน้าแรกจริง (เรียงตามราคา · ช่วง 7 วัน) — ชื่อ รหัส rarity ราคา
 * เปอร์เซ็นต์ และรูปการ์ด ก๊อปมาจากหน้าจริงทั้งชุด ไม่มีตัวเลขที่แต่งขึ้นเอง
 * รูปดึงจาก R2 ตัวเดียวกับที่เว็บจริงใช้
 */
const ROWS = [
  {
    name: "Monkey.D.Luffy",
    longName: "Monkey.D.Luffy (Parallel)",
    code: "OP13-118",
    rarity: "P-SEC",
    price: "268,800 ฿",
    change: -0.1,
    img: "https://pub-e1c871a889eb42a4bd7dcdc3a5926f3c.r2.dev/op13/OP13-118_p3.png",
  },
  {
    name: "Monkey.D.Luffy",
    longName: "Monkey.D.Luffy (Parallel)",
    code: "OP05-119",
    rarity: "SP",
    price: "209,580 ฿",
    change: 26.8,
    img: "https://pub-e1c871a889eb42a4bd7dcdc3a5926f3c.r2.dev/op05/OP05-119_p7.png",
  },
  {
    name: "Gol.D.Roger",
    longName: "Gol.D.Roger (Parallel)",
    code: "OP09-118",
    rarity: "P-SEC",
    price: "125,580 ฿",
    change: 41.7,
    img: "https://pub-e1c871a889eb42a4bd7dcdc3a5926f3c.r2.dev/op09/OP09-118_p2.png",
  },
  {
    name: "Monkey.D.Luffy (Parallel)",
    longName: "Monkey.D.Luffy (Parallel)",
    code: "OP05-119",
    rarity: "P-SEC",
    price: "125,580 ฿",
    change: 13.2,
    img: "https://pub-e1c871a889eb42a4bd7dcdc3a5926f3c.r2.dev/op05/OP05-119_p2.png",
  },
  {
    name: "Portgas.D.Ace",
    longName: "Portgas.D.Ace (Parallel)",
    code: "OP13-119",
    rarity: "P-SEC",
    price: "104,580 ฿",
    change: -12.8,
    img: "https://pub-e1c871a889eb42a4bd7dcdc3a5926f3c.r2.dev/op13/OP13-119_p3.png",
  },
  {
    name: "Sabo",
    longName: "Sabo (Parallel)",
    code: "OP13-120",
    rarity: "P-SEC",
    price: "83,580 ฿",
    change: -17.5,
    img: "https://pub-e1c871a889eb42a4bd7dcdc3a5926f3c.r2.dev/op13/OP13-120_p3.png",
  },
  {
    name: "Roronoa Zoro (Parallel)",
    longName: "Roronoa Zoro (Parallel)",
    code: "OP06-118",
    rarity: "P-SEC",
    price: "37,380 ฿",
    change: -28.5,
    img: "https://pub-e1c871a889eb42a4bd7dcdc3a5926f3c.r2.dev/op06/OP06-118_p2.png",
  },
  {
    name: "Enel",
    longName: "Enel (Parallel)",
    code: "OP15-118",
    rarity: "P-SEC",
    price: "26,880 ฿",
    change: -39.4,
    img: "https://pub-e1c871a889eb42a4bd7dcdc3a5926f3c.r2.dev/op15/OP15-118_p2.png",
  },
] as const;

type Way = "current" | "right" | "left" | "onimage";

const WAY_OPTIONS = [
  { value: "current", label: "ปัจจุบัน · ไม่มีปุ่ม" },
  { value: "right", label: "A · ขวาสุดของแถว" },
  { value: "left", label: "B · ซ้ายสุด (ตามคอม)" },
  { value: "onimage", label: "C · ซ้อนมุมรูปการ์ด" },
] as const;

const WAY_VALUES = WAY_OPTIONS.map((o) => o.value);

const COPY: Record<Way, { name: string; summary: string; tradeoff: string }> = {
  current: {
    name: "ปัจจุบัน — ในแถวไม่มีปุ่มเลย",
    summary:
      "อยากเก็บการ์ดใบไหนเข้ารายการโปรด ต้องกดเข้าไปในหน้าการ์ดก่อน แล้วค่อยกดหัวใจข้างบน — หรือสลับไปมุมมองตาราง 4 ช่อง (ปุ่มขวาบน) ซึ่งมีปุ่มหัวใจอยู่ใต้การ์ดทุกใบแล้ว",
    tradeoff:
      "คนที่ไล่ดูราคาเป็นรายการยาวๆ ต้องเข้า-ออกหน้าการ์ดทีละใบ · บนคอมตารางเดียวกันนี้มีหัวใจอยู่แล้วตั้งแต่แรก มือถือเลยเป็นที่เดียวที่ไม่มี",
  },
  right: {
    name: "A · หัวใจอยู่ขวาสุด ถัดจากราคา",
    summary:
      "ปุ่มอยู่ริมขวาของแถว สูงเต็มแถว (44px ตามมาตรฐานปุ่มบนมือถือ) — เป็นที่ที่นิ้วโป้งเอื้อมถึงง่ายที่สุดตอนถือมือถือมือเดียว และไล่กดรัวๆ ลงมาทีละแถวได้เพราะปุ่มทุกแถวอยู่แนวเดียวกัน",
    tradeoff:
      "กินความกว้างจากชื่อการ์ดไปราว 40px — ชื่อที่ยาวจะโดนตัดเร็วขึ้น (กดปุ่ม “ชื่อยาวทุกแถว” เพื่อดูเคสหนักสุด) · บนแอนดรอยด์ ขอบขวาสุดเป็นที่ปัดย้อนกลับของเครื่อง เลยเว้นระยะจากขอบไว้เล็กน้อย",
  },
  left: {
    name: "B · หัวใจอยู่ซ้ายสุด ก่อนเลขอันดับ",
    summary:
      "เรียงเหมือนตารางบนคอมเป๊ะ — หัวใจ แล้วเลขอันดับ แล้วรูป · คนที่ใช้ทั้งสองจอจะเจอปุ่มที่เดิม ไม่ต้องเรียนใหม่",
    tradeoff:
      "กินความกว้างจากชื่อเท่าๆ กับแบบ A แต่มืออยู่ไกลกว่า (คนถนัดขวาต้องเอื้อมข้ามจอ) · ขอบซ้ายบนแอนดรอยด์ก็เป็นที่ปัดย้อนกลับเหมือนกัน · หัวใจไปอยู่ติดเลขอันดับ ทำให้มุมซ้ายมีของเล็กๆ สองอย่างชนกัน",
  },
  onimage: {
    name: "C · หัวใจซ้อนมุมขวาบนของรูปการ์ด",
    summary:
      "ไม่กินความกว้างของแถวเลย ชื่อการ์ดยังยาวเท่าเดิมทุกตัวอักษร — ปุ่มลอยอยู่บนมุมรูป มีพื้นทึบรองไม่ให้จมไปกับภาพ",
    tradeoff:
      "ปุ่มเล็กกว่ามาตรฐาน (ราว 28px ไม่ใช่ 44px) เพราะรูปการ์ดในแถวกว้างแค่ 44px — กดพลาดง่ายกว่า และคนอาจกดโดนรูปเปิดหน้าตัวอย่างแทน · หัวใจซ้อนบนภาพจะกลืนกับการ์ดที่มุมสว่าง",
  },
};

const NOTES = [
  "แถวนี้ใช้ร่วมกัน 2 หน้า — หน้าแรกกับหน้าค้นหา ใช้โค้ดตัวเดียวกัน เคาะแบบไหนได้ทั้งสองหน้าพร้อมกัน",
  "บนคอมตารางเดียวกันนี้มีหัวใจอยู่แล้ว (คอลัมน์ซ้ายสุด ก่อนเลขอันดับ) — รอบนี้ไม่แตะของบนคอม",
  "มุมมองตาราง 4 ช่อง (กริด) บนมือถือก็มีหัวใจอยู่แล้วใต้การ์ดทุกใบ — ที่ขาดคือมุมมองรายการอย่างเดียว",
  "ยังไม่ได้เข้าสู่ระบบแล้วกดหัวใจ = เว็บพาไปหน้าเข้าสู่ระบบก่อน (พฤติกรรมเดิมของปุ่มนี้ ไม่ได้เปลี่ยน)",
  "ตัดออกจากหน้านี้: แถบเมนู หัวหน้าแรก และแถบตัวกรอง/เรียง — รอบนี้เคาะแค่หน้าตาของแถว จึงตัดของรอบข้างออกให้ดูง่าย",
  "ตัดออกจากตัวเลือก: แบบ “ปัดแถวไปทางซ้ายแล้วปุ่มโผล่” (แบบแอปเมล iOS) — เพราะไม่มีอะไรบอกว่าปัดได้ คนส่วนใหญ่จะไม่เจอปุ่มเลย",
  "สีของหัวใจตอนยังไม่กดจงใจให้จางเท่าของจริงบนคอม — บนมือถือไม่มีการชี้เมาส์ช่วยบอกว่ากดได้ ถ้าดูแล้วจางไปบอกได้ ปรับให้เข้มขึ้นทีหลังได้",
  "หัวใจในหน้านี้กดเล่นได้จริง แต่ไม่ได้บันทึกอะไรลงระบบ — เป็นของปลอมในหน้าลอง",
] as const;

/* ----------------------------------------------------------------- atoms */

/** หัวใจแบบเดียวกับของจริง (ไอคอน Heart · สีทองเมื่อกดแล้ว) แต่จำค่าไว้ในหน้านี้เท่านั้น */
function ProtoHeart({
  on,
  onToggle,
  className,
  iconClassName,
}: {
  on: boolean;
  onToggle: () => void;
  className?: string;
  iconClassName?: string;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-label={on ? "เอาออกจากรายการโปรด" : "เพิ่มเข้ารายการโปรด"}
      aria-pressed={on}
      className={cn(
        "inline-flex shrink-0 items-center justify-center rounded-sm motion-base",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring active:scale-90",
        on ? "text-primary" : "text-muted-foreground/40 hover:text-primary",
        className,
      )}
    >
      <Heart className={cn("size-5", on && "fill-current", iconClassName)} />
    </button>
  );
}

function CardArt({
  row,
  children,
}: {
  row: (typeof ROWS)[number];
  children?: React.ReactNode;
}) {
  return (
    <div className="relative shrink-0">
      <div className="hairline relative aspect-[63/88] w-11 overflow-hidden rounded-md bg-muted">
        <Image
          src={row.img}
          alt={row.name}
          fill
          className="object-contain"
          sizes="44px"
        />
      </div>
      {children}
    </div>
  );
}

/** หนึ่งแถวของรายการบนมือถือ — ส่วนที่กำลังเทียบกัน จึงเขียนมือ 4 แบบ */
function Row({
  row,
  rank,
  way,
  on,
  onToggle,
  longNames,
}: {
  row: (typeof ROWS)[number];
  rank: number;
  way: Way;
  on: boolean;
  onToggle: () => void;
  longNames: boolean;
}) {
  const name = longNames ? row.longName : row.name;

  const body = (
    <div className="flex min-w-0 flex-1 items-center gap-3">
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium leading-tight">{name}</p>
        <div className="mt-0.5 flex items-center gap-1.5 text-meta">
          <span className="font-mono">{row.code}</span>
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

  return (
    <div className="ease-chrome flex min-h-[52px] items-center gap-3 px-4 py-2.5 active:bg-muted">
      {way === "left" && (
        <ProtoHeart on={on} onToggle={onToggle} className="-ml-2 h-11 w-9" />
      )}
      <span className="w-5 shrink-0 text-center font-price text-xs text-muted-foreground">
        {rank}
      </span>
      <CardArt row={row}>
        {way === "onimage" && (
          <ProtoHeart
            on={on}
            onToggle={onToggle}
            iconClassName="size-3.5"
            className={cn(
              "hairline absolute -right-1.5 -top-1.5 size-7 rounded-full bg-background/90 backdrop-blur-sm",
              !on && "text-muted-foreground/70",
            )}
          />
        )}
      </CardArt>
      {body}
      {way === "right" && (
        <ProtoHeart on={on} onToggle={onToggle} className="-mr-1.5 h-11 w-9" />
      )}
    </div>
  );
}

/** ตารางบนคอม (ย่อ 3 แถว) — ที่นั่นมีคอลัมน์หัวใจอยู่แล้ว รอบนี้ไม่แตะ */
function DesktopPeek({
  faved,
  toggle,
}: {
  faved: Set<string>;
  toggle: (k: string) => void;
}) {
  return (
    <table className="w-full table-fixed">
      <colgroup>
        <col className="w-8" />
        <col className="w-10" />
        <col />
        <col className="w-[110px]" />
        <col className="w-[84px]" />
      </colgroup>
      <thead>
        <tr className="border-b border-hair text-eyebrow">
          <th />
          <th className="py-2 text-left">#</th>
          <th className="py-2 text-left">การ์ด</th>
          <th className="py-2 text-right">ราคา</th>
          <th className="py-2 text-right">7d</th>
        </tr>
      </thead>
      <tbody className="divide-y divide-hair">
        {ROWS.slice(0, 3).map((row, i) => {
          const key = `${row.code}-${i}`;
          return (
            <tr key={key}>
              <td className="py-2">
                <ProtoHeart
                  on={faved.has(key)}
                  onToggle={() => toggle(key)}
                  iconClassName="size-3.5"
                />
              </td>
              <td className="py-2 font-price text-xs text-muted-foreground">
                {i + 1}
              </td>
              <td className="py-2">
                <div className="flex items-center gap-3">
                  <div className="hairline relative size-10 shrink-0 overflow-hidden rounded-md bg-muted">
                    <Image
                      src={row.img}
                      alt={row.name}
                      fill
                      className="object-contain"
                      sizes="40px"
                    />
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium leading-tight">
                      {row.name}
                    </p>
                    <p className="mt-0.5 font-mono text-xs text-muted-foreground">
                      {row.code}
                    </p>
                  </div>
                </div>
              </td>
              <td className="py-2 text-right font-price text-sm font-semibold">
                {row.price}
              </td>
              <td className="py-2 text-right">
                <PriceTag
                  change={row.change}
                  changeOnly
                  changeStyle="plain"
                  showArrow={false}
                  size="sm"
                  className="justify-end"
                />
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}

/* ------------------------------------------------------------ page shell */

const subscribeNever = () => () => {};

export default function RowFavoriteProtoPage() {
  const [way, setWay] = useProtoVariant<Way>("v", WAY_VALUES, "right");
  const [longNames, toggleLongNames] = useProtoFlag("long");
  const [allFaved, toggleAllFaved] = useProtoFlag("all");
  const [faved, setFaved] = useState<Set<string>>(
    () => new Set(["OP05-119-1"]),
  );
  const { resolvedTheme, setTheme } = useTheme();
  const mounted = useSyncExternalStore(
    subscribeNever,
    () => true,
    () => false,
  );
  const isDark = mounted && resolvedTheme === "dark";
  const copy = COPY[way];

  const toggle = useCallback((key: string) => {
    setFaved((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }, []);

  const isOn = (key: string) => allFaved || faved.has(key);

  return (
    <main className="min-h-screen bg-background px-4 py-8 text-foreground sm:px-6 lg:px-10">
      <div className="mx-auto max-w-[1200px]">
        <h1 className="text-h1">ปุ่มรายการโปรดในแถวรายการการ์ด (มือถือ)</h1>
        <p className="mt-2 max-w-3xl text-body text-muted-foreground">
          บนคอม ตารางนี้มีปุ่มหัวใจอยู่แล้วที่คอลัมน์ซ้ายสุด
          แต่บนมือถือแถวเดียวกันไม่มี — คำถามเดียวที่ต้องเคาะคือ{" "}
          <strong>ปุ่มหัวใจควรไปอยู่ตรงไหนของแถว</strong>{" "}
          เพราะแถวบนมือถือกว้างแค่ 375px และตอนนี้ชื่อการ์ดได้ที่ไปแค่ 152px
          เท่านั้น
        </p>

        <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-3">
            <div className="overflow-x-auto pb-1">
              <SegmentedControl
                options={WAY_OPTIONS}
                value={way}
                onChange={setWay}
                ariaLabel="เลือกตำแหน่งปุ่มรายการโปรด"
                className="min-w-max"
                compactVisual={false}
              />
            </div>
            <button
              type="button"
              onClick={toggleLongNames}
              className={cn(
                "hairline ease-chrome h-10 shrink-0 rounded-full px-3.5 text-sm font-medium transition-colors hover:bg-muted",
                longNames && "bg-primary/15 text-primary",
              )}
            >
              {longNames ? "กลับไปชื่อปกติ" : "ชื่อยาวทุกแถว"}
            </button>
            <button
              type="button"
              onClick={toggleAllFaved}
              className={cn(
                "hairline ease-chrome h-10 shrink-0 rounded-full px-3.5 text-sm font-medium transition-colors hover:bg-muted",
                allFaved && "bg-primary/15 text-primary",
              )}
            >
              {allFaved ? "กลับไปกดไว้ใบเดียว" : "กดโปรดไว้ทุกใบ"}
            </button>
          </div>
          <IconButton
            aria-label={isDark ? "ดูแบบโหมดสว่าง" : "ดูแบบโหมดมืด"}
            onClick={() => setTheme(isDark ? "light" : "dark")}
            size="lg"
            className="rounded-full"
          >
            {isDark ? (
              <Sun className="size-[18px]" />
            ) : (
              <Moon className="size-[18px]" />
            )}
          </IconButton>
        </div>

        <section className="mt-6 grid gap-8 lg:grid-cols-[375px_minmax(0,1fr)]">
          <div className="min-w-0">
            <p className="text-eyebrow mb-2">
              รายการบนมือถือ (กว้าง 375px เท่าของจริง)
            </p>
            {/* จอแคบ: ดึงกรอบกลับไปกินขอบหน้า เพื่อให้แถวกว้าง 375px เท่าของจริง
                (ถ้าปล่อยให้อยู่ในระยะขอบหน้า แถวจะแคบกว่าเว็บจริง 32px = ตัดสินผิด) */}
            <div className="-mx-4 sm:mx-0">
              <div className="hairline w-[375px] max-w-full overflow-hidden rounded-none bg-background sm:rounded-[2rem]">
                <div className="divide-y divide-hair">
                  {ROWS.map((row, i) => {
                    const key = `${row.code}-${i}`;
                    return (
                      <Row
                        key={key}
                        row={row}
                        rank={i + 1}
                        way={way}
                        on={isOn(key)}
                        onToggle={() => toggle(key)}
                        longNames={longNames}
                      />
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="border-l-2 border-primary pl-4">
              <h2 className="text-h3">{copy.name}</h2>
              <p className="mt-1.5 max-w-2xl text-body-sm">{copy.summary}</p>
              <p className="mt-1 max-w-2xl text-meta">
                ข้อแลก: {copy.tradeoff}
              </p>
            </div>

            <div>
              <p className="text-eyebrow mb-2">
                บนคอม (มีหัวใจอยู่แล้ว — รอบนี้ไม่แตะ)
              </p>
              <div className="hairline rounded-2xl bg-card p-4">
                <DesktopPeek faved={faved} toggle={toggle} />
              </div>
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
          ชื่อ รหัส ราคา เปอร์เซ็นต์ และรูปการ์ดในหน้านี้ก๊อปมาจากหน้าแรกจริง
          แต่เป็นข้อมูลตายตัว ไม่ได้ต่อฐานข้อมูล · ลิงก์พกตัวเลือกได้:
          กดเลือกแล้วก๊อป URL ส่งกลับมาได้เลย
        </p>
      </div>
    </main>
  );
}
