"use client";

import Image from "next/image";
import { useState, useSyncExternalStore } from "react";
import { useTheme } from "next-themes";
import {
  Bell,
  ChevronRight,
  Heart,
  Moon,
  Share,
  SquarePlus,
  Sun,
  X,
} from "lucide-react";

import { IconButton } from "@/components/ui/icon-button";
import { InstallGuideDialog } from "@/components/pwa/install-guide-dialog";
import { SegmentedControl } from "@/components/ui/segmented-control";
import { cn } from "@/lib/utils";

import { useProtoFlag, useProtoVariant } from "../_kit/use-proto-variant";

/* ---------------------------------------------------------------- options */

type Way = "current" | "icon" | "bar" | "sheet";

const WAY_OPTIONS = [
  { value: "current", label: "ปัจจุบัน · ไม่มีเลย" },
  { value: "icon", label: "ก · ปุ่มในแถวบน" },
  { value: "bar", label: "ข · แถบเชิญชวนเหนือแถบบน" },
  { value: "sheet", label: "ค · แผ่นเด้งจากล่าง" },
] as const;

const WAY_VALUES = WAY_OPTIONS.map((o) => o.value);

const COPY: Record<Way, { name: string; summary: string; tradeoff: string }> = {
  current: {
    name: "ปัจจุบัน — เว็บยังติดตั้งไม่ได้เลย",
    summary:
      "วันนี้เว็บไม่มีไฟล์บอกมือถือว่าตัวเองเป็นแอปได้ (manifest) — แอนดรอยด์จึงไม่เคยเสนอ “เพิ่มไปหน้าจอโฮม” ให้เลย ส่วน iPhone เพิ่มได้ก็จริงแต่เปิดมาเป็นแท็บ Safari ธรรมดา มีแถบที่อยู่เว็บคาอยู่ข้างบน และไอคอนบนหน้าโฮมเป็นตัว M ไม่ใช่หมี",
    tradeoff:
      "คนที่เข้าเว็บทุกวันต้องพิมพ์ที่อยู่หรือหาในบุ๊กมาร์กทุกครั้ง · รอบนี้พื้นฐานทั้งหมดทำเสร็จแล้ว (ไอคอนหมี · เปิดแบบเต็มจอไม่มีแถบ Safari · หน้าจอตอนไม่มีเน็ต) เหลือแค่เคาะว่า “ปุ่มชวนติดตั้ง” จะโผล่ตรงไหน",
  },
  icon: {
    name: "ก · ปุ่มไอคอนในแถวบน ข้างหัวใจ — เบสเคาะแล้ว ลงเว็บจริงแล้ว",
    summary:
      "ปุ่มสี่เหลี่ยมมีเครื่องหมายบวก (ไอคอนเดียวกับที่ iPhone ใช้ใน “เพิ่มไปยังหน้าจอโฮม”) แทรกในแถวบนสุด ข้างปุ่มรายการโปรด — โผล่เฉพาะคนที่ยังไม่ติดตั้ง พอติดตั้งแล้วหายไปเอง กดแล้วเด้งแผ่นติดตั้งของเครื่องทันที · รอบจัดใหม่ตามที่เบสสั่ง: ชื่อหน้ากลายเป็นคำว่า Meecard และปุ่มเครื่องมือ 3 ตัวใส่ทรงเดียวกันหมด (เดิมกระดิ่งไม่มีวงกลม แถวเลยดูไม่จบ)",
    tradeoff:
      "กินความกว้างของแถวไป 44px — วัดที่จอ 360px แล้วยังพอ: ปุ่มทุกตัวยัง 44px ครบ และแบรนด์ได้ที่ 155px · ข้อแลกที่เหลืออยู่คือไอคอนไม่มีคำอธิบาย คนที่ไม่เคยติดตั้งเว็บเป็นแอปมาก่อนอาจไม่กด — ถ้าอยากได้คนติดตั้งเยอะกว่านี้ ต้องเสริมแบบ ข หรือ ค",
  },
  bar: {
    name: "ข · แถบเชิญชวนบางๆ เหนือแถบบน",
    summary:
      "แถบสูงราว 52px ซ้อนอยู่บนสุด — มีไอคอนหมี ประโยคเดียวว่า “เพิ่ม Meecard ไปหน้าจอโฮม” ปุ่ม “เพิ่ม” และกากบาทปิด · ปิดแล้วหายไป 30 วัน และยังกลับไปติดตั้งได้จาก “ดูเพิ่มเติม” ตลอด",
    tradeoff:
      "กินที่แนวตั้งชั่วคราวราว 52px ตอนเปิดครั้งแรก — เนื้อหาถูกดันลง · เป็นรูปแบบที่คนคุ้นว่าเป็น “แบนเนอร์ชวน” เลยมีคนกดปิดโดยไม่อ่าน แต่อย่างน้อยข้อความบอกชัดว่าได้อะไร ต่างจากไอคอนโดดๆ",
  },
  sheet: {
    name: "ค · แผ่นเด้งจากข้างล่างครั้งเดียว",
    summary:
      "แผ่นโผล่จากขอบล่างหลังเข้าเว็บสักพัก — มีรูปไอคอนหมีขนาดจริงให้เห็นว่าติดตั้งแล้วหน้าโฮมจะได้อะไร พร้อมปุ่ม “เพิ่มไปหน้าจอโฮม” เต็มความกว้าง และ “ไว้ก่อน”",
    tradeoff:
      "ขวางทางที่สุด — เด้งมาคาหน้าจอตอนคนกำลังดูราคา และทับแถบเมนูล่าง · แต่ก็เป็นแบบที่คนกดติดตั้งเยอะที่สุด เพราะเห็นเต็มตาว่าจะได้อะไร · ต้องคุมจังหวะดีๆ (เช่น เปิดเว็บครั้งที่ 2 ขึ้นไป) ไม่งั้นกวนคนที่เพิ่งเข้ามาครั้งแรก",
  },
};

const NOTES = [
  "iPhone กับ Android ไม่เหมือนกันตรงที่: Android กดปุ่มเดียวติดตั้งเลย ส่วน iPhone ไม่มีปุ่มให้เว็บสั่งได้ ต้องสอนให้คนกดปุ่มแชร์ของ Safari เอง — กดสลับ “ดูแบบ iPhone / Android” ข้างบนเพื่อเทียบ",
  "ทุกแบบโผล่เฉพาะบนมือถือ และเฉพาะคนที่ยังไม่ติดตั้ง — ติดตั้งแล้วเว็บรู้เองและไม่ชวนซ้ำ",
  "ทุกแบบจะมีทางกลับเสมอที่ “ดูเพิ่มเติม” (แถวล่างสุดของหน้านี้) เผื่อคนกดปิดไปแล้วเปลี่ยนใจ",
  "พื้นฐานที่ทำเสร็จแล้วรอบนี้ (ไม่ต้องเคาะ): ไอคอนหมีบนหน้าจอโฮม · เปิดจากหน้าโฮมแล้วไม่มีแถบที่อยู่เว็บ · ทางลัดกดค้างที่ไอคอน (รายการโปรด · พอร์ต · ค้นหา) · หน้าจอตอนเน็ตหลุด",
  "ยังไม่ได้ทำ และไม่ได้อยู่ในรอบนี้: การแจ้งเตือนแบบแอป (push) — เป็นงานคนละก้อน ต้องขออนุญาตผู้ใช้และมีเซิร์ฟเวอร์ส่ง",
  "ปุ่มในหน้านี้กดดูหน้าตาได้ แต่ไม่ได้ติดตั้งจริง — เป็นของจำลอง",
] as const;

/* ----------------------------------------------------------------- atoms */

/** ไอคอนหมีในกรอบสีแบรนด์ — หน้าตาเดียวกับที่จะไปโผล่บนหน้าจอโฮมจริง */
function BearIcon({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "flex shrink-0 items-center justify-center overflow-hidden rounded-[22%]",
        className,
      )}
      style={{ background: "#73533E" }}
    >
      <Image
        src="/meecard.png"
        alt=""
        width={754}
        height={694}
        className="h-auto w-[82%] select-none"
      />
    </span>
  );
}

/** แถวบนสุดของมือถือ ลอกจาก header-mobile.tsx ของจริง */
function MobileHeaderRow({ showInstallIcon }: { showInstallIcon: boolean }) {
  return (
    <div className="flex h-14 min-w-0 items-center px-2">
      <span className="mr-1 flex size-11 shrink-0 items-center justify-center">
        <Image
          src="/meecard.png"
          alt=""
          width={754}
          height={694}
          className="h-auto w-8 select-none"
        />
      </span>
      <span className="text-h5 min-w-0 flex-1 truncate text-foreground">
        Meecard
      </span>
      {showInstallIcon && (
        <span className="surface-2 hairline flex min-h-11 min-w-11 items-center justify-center rounded-full text-foreground">
          <SquarePlus className="size-[18px]" />
        </span>
      )}
      <span className="surface-2 hairline flex min-h-11 min-w-11 items-center justify-center rounded-full text-foreground">
        <Heart className="size-[18px]" />
      </span>
      <span className="surface-2 hairline flex min-h-11 min-w-11 items-center justify-center rounded-full text-foreground">
        <Bell className="size-[18px]" />
      </span>
      <span aria-hidden className="mx-1 h-5 w-px shrink-0 bg-hair" />
      <span className="flex min-h-11 min-w-11 items-center justify-center rounded-full bg-primary/15 text-sm font-semibold text-primary">
        บ
      </span>
    </div>
  );
}

/** แถวที่สอง (เกม → ชุด) — ใส่ไว้ให้เห็นว่าของใหม่ไปเบียดอะไรบ้าง */
function MobileContextRow() {
  return (
    <div className="flex h-12 min-w-0 items-center gap-2 bg-muted/30 px-2">
      <span className="hairline flex h-9 items-center gap-2 rounded-full px-3 text-sm">
        <span className="size-4 rounded-full bg-primary/30" />
        วันพีช
      </span>
      <span className="hairline flex h-9 min-w-0 flex-1 items-center gap-2 rounded-full px-3 text-sm">
        <span className="h-5 w-4 shrink-0 rounded-[3px] bg-primary/25" />
        <span className="truncate text-muted-foreground">
          OP13 · ผู้กล้าใหม่
        </span>
      </span>
    </div>
  );
}

/** แถบเชิญชวน (แบบ ข) */
function InstallBar({
  ios,
  onClose,
  onHowTo,
}: {
  ios: boolean;
  onClose: () => void;
  onHowTo: () => void;
}) {
  return (
    <div className="flex items-center gap-2.5 border-b border-hair bg-card px-3 py-2">
      <BearIcon className="size-9" />
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium leading-tight">
          เพิ่ม Meecard ไปหน้าจอโฮม
        </p>
        <p className="truncate text-meta">
          {ios ? "เปิดเร็วขึ้น เต็มจอ ไม่มีแถบ Safari" : "เปิดเร็วขึ้น เหมือนแอป"}
        </p>
      </div>
      <button
        type="button"
        onClick={onHowTo}
        className="flex h-9 shrink-0 items-center rounded-full bg-primary px-4 text-sm font-semibold text-primary-foreground"
      >
        {ios ? "ดูวิธี" : "เพิ่ม"}
      </button>
      <button
        type="button"
        onClick={onClose}
        aria-label="ปิด"
        className="flex size-9 shrink-0 items-center justify-center rounded-full text-muted-foreground"
      >
        <X className="size-4" />
      </button>
    </div>
  );
}

/** แผ่นเด้งจากล่าง (แบบ ค) */
function InstallSheet({
  ios,
  onClose,
  onHowTo,
}: {
  ios: boolean;
  onClose: () => void;
  onHowTo: () => void;
}) {
  return (
    <div className="absolute inset-x-0 bottom-0 z-10">
      <div aria-hidden className="h-24 bg-gradient-to-t from-black/45 to-transparent" />
      <div className="hairline-t rounded-t-2xl bg-card px-5 pb-6 pt-4">
        <div className="flex items-start gap-3">
          <BearIcon className="size-14" />
          <div className="min-w-0 flex-1">
            <p className="text-h5">เพิ่ม Meecard ไปหน้าจอโฮม</p>
            <p className="mt-1 text-body-sm text-muted-foreground">
              {ios
                ? "เปิดจากหน้าโฮมได้เลย เต็มจอ ไม่มีแถบที่อยู่เว็บ"
                : "เปิดจากหน้าโฮมได้เลย เร็วกว่า และใช้ได้เหมือนแอป"}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="ปิด"
            className="-mr-1 flex size-9 shrink-0 items-center justify-center rounded-full text-muted-foreground"
          >
            <X className="size-4" />
          </button>
        </div>

        {ios ? (
          <div className="mt-4 space-y-2 rounded-xl bg-muted/50 p-3 text-body-sm">
            <p className="flex items-center gap-2">
              <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-primary/15 text-xs font-semibold text-primary">
                1
              </span>
              กดปุ่มแชร์
              <Share className="size-4 text-primary" />
              ข้างล่างจอ
            </p>
            <p className="flex items-center gap-2">
              <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-primary/15 text-xs font-semibold text-primary">
                2
              </span>
              เลื่อนหา “เพิ่มไปยังหน้าจอโฮม”
            </p>
            <p className="flex items-center gap-2">
              <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-primary/15 text-xs font-semibold text-primary">
                3
              </span>
              กด “เพิ่ม” มุมขวาบน
            </p>
          </div>
        ) : (
          <button
            type="button"
            onClick={onHowTo}
            className="mt-4 h-12 w-full rounded-full bg-primary text-sm font-semibold text-primary-foreground"
          >
            เพิ่มไปหน้าจอโฮม
          </button>
        )}

        <button
          type="button"
          onClick={onClose}
          className="mt-2 h-11 w-full rounded-full text-sm font-medium text-muted-foreground"
        >
          ไว้ก่อน
        </button>
      </div>
    </div>
  );
}

/** เนื้อหาหน้าแรกจางๆ ให้เห็นว่าของใหม่ไปทับ/ดันอะไร */
function FakePage() {
  return (
    <div className="space-y-3 px-4 py-4">
      <div className="h-5 w-40 rounded bg-muted" />
      <div className="hairline flex items-center gap-3 rounded-xl p-3">
        <div className="h-14 w-10 shrink-0 rounded bg-muted" />
        <div className="min-w-0 flex-1 space-y-2">
          <div className="h-3.5 w-32 rounded bg-muted" />
          <div className="h-3 w-20 rounded bg-muted/70" />
        </div>
        <div className="h-4 w-16 rounded bg-muted" />
      </div>
      <div className="hairline flex items-center gap-3 rounded-xl p-3">
        <div className="h-14 w-10 shrink-0 rounded bg-muted" />
        <div className="min-w-0 flex-1 space-y-2">
          <div className="h-3.5 w-24 rounded bg-muted" />
          <div className="h-3 w-16 rounded bg-muted/70" />
        </div>
        <div className="h-4 w-16 rounded bg-muted" />
      </div>
      <div className="hairline flex items-center gap-3 rounded-xl p-3">
        <div className="h-14 w-10 shrink-0 rounded bg-muted" />
        <div className="min-w-0 flex-1 space-y-2">
          <div className="h-3.5 w-28 rounded bg-muted" />
          <div className="h-3 w-14 rounded bg-muted/70" />
        </div>
        <div className="h-4 w-16 rounded bg-muted" />
      </div>
    </div>
  );
}

/** แถบเมนูล่างปลอม — มีไว้ให้เห็นว่าแผ่นเด้ง (แบบ ค) ไปทับอะไร */
function FakeBottomNav() {
  return (
    <div className="hairline-t mt-auto flex h-16 items-end justify-around bg-background px-2 pb-2">
      {["หน้าแรก", "ชุด", "", "โปรด", "เพิ่มเติม"].map((label, i) =>
        label ? (
          <span key={label} className="flex flex-col items-center gap-1">
            <span className="size-5 rounded bg-muted" />
            <span className="text-[10px] text-muted-foreground">{label}</span>
          </span>
        ) : (
          <span
            key={`raised-${i}`}
            className="-mt-4 flex size-12 items-center justify-center rounded-full bg-primary"
          >
            <span className="size-5 rounded-full bg-primary-foreground/70" />
          </span>
        ),
      )}
    </div>
  );
}

/** แถวใน “ดูเพิ่มเติม” — ทางกลับที่ทุกแบบมีเหมือนกัน */
function MoreRow() {
  return (
    <div className="hairline flex items-center gap-3 rounded-xl bg-card px-4 py-3">
      <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary/15 text-primary">
        <SquarePlus className="size-[18px]" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium leading-tight">เพิ่มไปหน้าจอโฮม</p>
        <p className="text-meta">เปิด Meecard ได้เร็วขึ้น เหมือนแอป</p>
      </div>
      <ChevronRight className="size-4 shrink-0 text-muted-foreground" />
    </div>
  );
}

/* ------------------------------------------------------------ page shell */

const subscribeNever = () => () => {};

export default function PwaInstallProtoPage() {
  const [way, setWay] = useProtoVariant<Way>("v", WAY_VALUES, "bar");
  const [ios, toggleIos] = useProtoFlag("ios");
  const [closed, setClosed] = useState(false);
  const [guideOpen, setGuideOpen] = useState(false);
  const { resolvedTheme, setTheme } = useTheme();
  const mounted = useSyncExternalStore(
    subscribeNever,
    () => true,
    () => false,
  );
  const isDark = mounted && resolvedTheme === "dark";
  const copy = COPY[way];

  return (
    <main className="min-h-screen bg-background px-4 py-8 text-foreground sm:px-6 lg:px-10">
      <div className="mx-auto max-w-[1200px]">
        <h1 className="text-h1">ปุ่ม “เพิ่มไปหน้าจอโฮม” บนมือถือ</h1>
        <p className="mt-2 max-w-3xl text-body text-muted-foreground">
          พื้นฐานทำเสร็จแล้ว — ตอนนี้เว็บติดตั้งลงหน้าจอโฮมได้จริง ไอคอนเป็นหมี
          และเปิดมาแบบเต็มจอไม่มีแถบที่อยู่เว็บ เหลือคำถามเดียวที่ต้องเคาะ:{" "}
          <strong>คำชวนให้ติดตั้งควรโผล่ตรงไหน</strong> — และแลกกับอะไร
        </p>

        <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-3">
            <div className="overflow-x-auto pb-1">
              <SegmentedControl
                options={WAY_OPTIONS}
                value={way}
                onChange={(v) => {
                  setWay(v);
                  setClosed(false);
                }}
                ariaLabel="เลือกที่วางคำชวนติดตั้ง"
                className="min-w-max"
                compactVisual={false}
              />
            </div>
            <button
              type="button"
              onClick={toggleIos}
              className={cn(
                "hairline ease-chrome h-10 shrink-0 rounded-full px-3.5 text-sm font-medium transition-colors hover:bg-muted",
                ios && "bg-primary/15 text-primary",
              )}
            >
              {ios ? "ดูแบบ Android (Chrome)" : "ดูแบบ iPhone (Safari)"}
            </button>
            {closed && (
              <button
                type="button"
                onClick={() => setClosed(false)}
                className="hairline ease-chrome h-10 shrink-0 rounded-full px-3.5 text-sm font-medium transition-colors hover:bg-muted"
              >
                เรียกกลับมาดูอีกครั้ง
              </button>
            )}
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
              มือถือ (กว้าง 375px เท่าของจริง)
            </p>
            <div className="-mx-4 sm:mx-0">
              <div className="hairline relative flex h-[640px] w-[375px] max-w-full flex-col overflow-hidden bg-background sm:rounded-[2rem]">
                {way === "bar" && !closed && (
                  <InstallBar
                    ios={ios}
                    onClose={() => setClosed(true)}
                    onHowTo={() => setGuideOpen(true)}
                  />
                )}
                <MobileHeaderRow showInstallIcon={way === "icon"} />
                <MobileContextRow />
                <FakePage />
                <FakeBottomNav />
                {way === "sheet" && !closed && (
                  <InstallSheet
                    ios={ios}
                    onClose={() => setClosed(true)}
                    onHowTo={() => setGuideOpen(true)}
                  />
                )}
              </div>
            </div>

            <p className="text-eyebrow mb-2 mt-6">
              ทางกลับใน “ดูเพิ่มเติม” — มีเหมือนกันทุกแบบ
            </p>
            <div className="w-[375px] max-w-full">
              <MoreRow />
            </div>
          </div>

          <div className="space-y-6">
            <div className="border-l-2 border-primary pl-4">
              <h2 className="text-h3">{copy.name}</h2>
              <p className="mt-1.5 max-w-2xl text-body-sm">{copy.summary}</p>
              <p className="mt-1 max-w-2xl text-meta">ข้อแลก: {copy.tradeoff}</p>
            </div>

            <div>
              <p className="text-eyebrow mb-2">
                ไอคอนที่จะไปอยู่บนหน้าจอโฮมจริง
              </p>
              <div className="hairline flex items-center gap-5 rounded-2xl bg-card p-5">
                <div className="text-center">
                  <BearIcon className="size-16" />
                  <p className="mt-1.5 text-meta">iPhone</p>
                </div>
                <div className="text-center">
                  <BearIcon className="size-16 rounded-full!" />
                  <p className="mt-1.5 text-meta">Android</p>
                </div>
                <p className="max-w-[22ch] text-meta">
                  แอนดรอยด์ตัดไอคอนเป็นวงกลมเอง หมีเลยถูกวางเผื่อขอบไว้แล้ว
                </p>
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

        {/* กล่องสอนวิธีของ iPhone ตัวนี้ไม่ใช่ของจำลอง — เป็นคอมโพเนนต์จริงที่
            ลงเว็บไปแล้ว (เรียกจาก “ดูเพิ่มเติม” ด้วย) เบสจึงเห็นของจริงตั้งแต่หน้าลอง */}
        <InstallGuideDialog
          open={guideOpen}
          onOpenChange={setGuideOpen}
          language="TH"
        />

        <p className="mt-8 text-meta">
          หน้านี้เป็นของจำลอง ไม่ได้ติดตั้งจริง · ลิงก์พกตัวเลือกได้:
          กดเลือกแล้วก๊อป URL ส่งกลับมาได้เลย
        </p>
      </div>
    </main>
  );
}
