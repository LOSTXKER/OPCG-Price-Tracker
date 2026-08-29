"use client";

import { cn } from "@/lib/utils";

export type FilterFacetOption = {
  value: string;
  label: string;
  /** จุดสีนำหน้า (ใช้กับตัวกรองสี) — เป็นคลาส Tailwind ของพื้นหลังจุด */
  dot?: string;
  /** สีพื้นตอนถูกเลือก (ใช้กับความหายาก: SEC ส้ม · SR ม่วง …) */
  activeColor?: string;
};

/**
 * หนึ่งหมวดของชิปในกล่องตัวกรอง — หัวข้อ + แถวชิปกดเลือกได้
 *
 * มีตัวเดียวทั้งเว็บโดยตั้งใจ: ก่อนหน้านี้หน้าแรกกับหน้าค้นหาเขียนชิปกันเอง
 * คนละชุด ผลคือชิป "ความหายาก" ที่เลือกไว้เป็นสีประจำระดับในหน้าค้นหา
 * แต่เป็นสีเดียวในหน้าแรก (เจ้าของงานจับได้ 2026-08-30) — ยุบมาไว้ที่นี่
 * แล้วทั้งสองหน้าเรียกตัวนี้ ชิปจึงหน้าตาเหมือนกันถาวร
 *
 * เลือกได้หลายตัวหรือตัวเดียวก็ได้ — ตัวนี้แค่รับ `values` ที่เลือกอยู่
 * แล้วบอก `onToggle` ว่ากดอันไหน ส่วนกติกาว่าเลือกซ้อนได้ไหมเป็นของ caller
 */
export function FilterFacetGroup({
  label,
  options,
  values,
  onToggle,
  className,
}: {
  label: string;
  options: readonly FilterFacetOption[];
  values: readonly string[];
  onToggle: (value: string, nextActive: boolean) => void;
  className?: string;
}) {
  if (options.length === 0) return null;

  return (
    <div className={className}>
      <span className="mb-1.5 block text-eyebrow">{label}</span>
      <div className="flex flex-wrap gap-1.5">
        {options.map((option) => {
          const active = values.includes(option.value);
          const activeColor = active ? option.activeColor : undefined;
          return (
            <button
              key={option.value}
              type="button"
              aria-pressed={active}
              onClick={() => onToggle(option.value, !active)}
              style={
                activeColor
                  ? { backgroundColor: activeColor, borderColor: activeColor }
                  : undefined
              }
              className={cn(
                "ease-chrome flex min-h-11 items-center gap-1.5 rounded-lg border px-2.5 py-1 text-xs font-medium transition-colors md:min-h-0",
                activeColor
                  ? "text-white"
                  : active
                    ? "border-primary/40 bg-primary/5 text-primary"
                    : "border-hair bg-background text-muted-foreground hover:text-foreground",
              )}
            >
              {option.dot && <span className={cn("size-2.5 rounded-full", option.dot)} />}
              {option.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
