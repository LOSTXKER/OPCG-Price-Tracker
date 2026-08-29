"use client";

import { cn } from "@/lib/utils";
import { t } from "@/lib/i18n";
import { useUIStore } from "@/stores/ui-store";
import { cardArtStyle, type CardArtStyle } from "@/lib/constants/card-art-style";

const TONE: Record<CardArtStyle, string> = {
  manga: "bg-foreground/10 text-foreground/80",
  mangaRed: "bg-red-500/15 text-red-700 dark:bg-red-500/25 dark:text-red-300",
  wanted: "bg-stone-500/15 text-stone-700 dark:bg-stone-400/25 dark:text-stone-200",
};

const LABEL_KEY = {
  manga: "artStyleManga",
  mangaRed: "artStyleMangaRed",
  wanted: "artStyleWanted",
} as const;

/**
 * ป้ายบอก "ลายศิลป์พิเศษ" ของงานพิมพ์ใบนั้น — มังงะ · มังงะแดง · ใบประกาศจับ
 *
 * เป็นป้ายที่ **สอง** เสมอ ไม่ได้แทนป้ายความหายาก (SP/SEC): การ์ดมังงะยังเป็น
 * P-SEC อยู่ ป้ายนี้บอกแค่ว่าลายในภาพเป็นแบบไหน (เจ้าของงานเคาะ 2026-08-30)
 *
 * รายชื่อการ์ดอยู่ใน `@/lib/constants/card-art-style` — ที่นี่แค่แสดงผล
 * ส่ง `cardCode` เต็ม (รวมท้าย _p2 / _r1) เพราะลายผูกกับงานพิมพ์ ไม่ใช่หมายเลขการ์ด
 */
export function ArtStyleBadge({
  cardCode,
  compact = false,
  className,
}: {
  cardCode: string;
  /**
   * รุ่นกะทัดรัดสำหรับแถวรายการบนมือถือ ซึ่งชื่อการ์ดมีที่แค่ 116px —
   * ป้ายขนาดปกติกินไป 54px (เกือบครึ่ง) จนชื่อเหลือ "Monke…" · รุ่นนี้เหลือ ~40px
   */
  compact?: boolean;
  className?: string;
}) {
  const lang = useUIStore((s) => s.language);
  const style = cardArtStyle(cardCode);
  if (!style) return null;

  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center whitespace-nowrap rounded-sm font-normal",
        compact ? "px-1 py-0 text-[10px] leading-4" : "px-1.5 py-0.5 text-micro",
        TONE[style],
        className,
      )}
    >
      {t(lang, LABEL_KEY[style])}
    </span>
  );
}
