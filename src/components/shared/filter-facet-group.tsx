"use client";

import { useId } from "react";

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
 * รอบ 2026-08-31 (เจ้าของงานสั่งให้ตรวจทุกหน้า) พบว่ายังมีชิปเขียนเองอีก 5 ที่
 * — ตลาด · หน้าชุด · เครื่องคำนวณดรอป · เพิ่มการ์ดเข้าพอร์ต · หน้าการ์ด —
 * จึงยุบเข้ามาที่นี่ทั้งหมด และยกของดีที่สุดของแต่ละที่ขึ้นมาเป็นมาตรฐาน:
 * `selectionMode="single"` มาจากตลาด ซึ่งใช้ปุ่มวิทยุจริง (`<input type="radio">`)
 * ไม่ใช่ปุ่มกดที่แกล้งทำเป็นเลือกได้ค่าเดียว — โปรแกรมอ่านหน้าจอจึงบอกได้ว่า
 * "เลือกได้อันเดียวนะ" ก่อนกด แทนที่จะให้ผู้ใช้กดแล้วเดาเอง
 *
 * `values` คือค่าที่เลือกอยู่ · `onToggle` บอกว่ากดอันไหนและกำลังจะเปิดหรือปิด
 * ส่วนกติกาว่าเลือกซ้อนได้ไหมยังเป็นของ caller (โหมด single แค่เปลี่ยน semantics
 * กับหน้าตา ไม่ได้บังคับ state ให้)
 */
export function FilterFacetGroup({
  label,
  hint,
  options,
  values,
  onToggle,
  selectionMode = "multiple",
  className,
}: {
  label: string;
  /** บรรทัดอธิบายใต้หัวข้อ เช่น "เลือกได้ 1 สภาพ" — ใส่เฉพาะหมวดที่ต้องบอกกติกา */
  hint?: string;
  options: readonly FilterFacetOption[];
  values: readonly string[];
  onToggle: (value: string, nextActive: boolean) => void;
  /** "single" = ปุ่มวิทยุ (เลือกได้ค่าเดียว) · ค่าเริ่มต้นคือเลือกซ้อนได้ */
  selectionMode?: "single" | "multiple";
  className?: string;
}) {
  // หัวข้อกับคำอธิบายผูกเข้ากับกลุ่มชิปด้วย aria เอง — ก่อนหน้านี้ตลาดต้องส่ง
  // id เข้ามาเองเพราะตัวนี้ทำให้ไม่ได้ พอทำได้แล้วผู้เรียกไม่ต้องคิดเรื่อง id
  const labelId = useId();
  const hintId = useId();
  const radioName = useId();

  if (options.length === 0) return null;

  const isSingle = selectionMode === "single";

  return (
    <div className={className}>
      <span id={labelId} className="mb-1.5 block text-eyebrow">
        {label}
      </span>
      {hint && (
        <span id={hintId} className="mb-2 block text-meta">
          {hint}
        </span>
      )}
      <div
        role={isSingle ? "radiogroup" : "group"}
        aria-labelledby={labelId}
        aria-describedby={hint ? hintId : undefined}
        className="flex flex-wrap gap-1.5"
      >
        {options.map((option) => {
          const active = values.includes(option.value);
          const activeColor = active ? option.activeColor : undefined;
          const style = activeColor
            ? { backgroundColor: activeColor, borderColor: activeColor }
            : undefined;
          const chipClass = cn(
            "ease-chrome flex min-h-11 items-center gap-1.5 rounded-lg border px-2.5 py-1 text-xs font-medium transition-colors md:min-h-0",
            activeColor
              ? "text-white"
              : active
                ? "border-primary/40 bg-primary/5 text-primary"
                : "border-hair bg-background text-muted-foreground hover:text-foreground",
          );
          const body = (
            <>
              {option.dot && (
                <span className={cn("size-2.5 rounded-full", option.dot)} />
              )}
              {option.label}
            </>
          );

          // ค่าว่างเป็น value ที่ถูกต้องในโหมด single (แปลว่า "ทั้งหมด") จึงต้อง
          // มี key สำรอง ไม่งั้นสองตัวเลือกจะชน key กัน
          const key = option.value || "__all__";

          if (isSingle) {
            return (
              <label
                key={key}
                style={style}
                className={cn(
                  chipClass,
                  "cursor-pointer focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2",
                )}
              >
                <input
                  type="radio"
                  name={radioName}
                  value={option.value}
                  checked={active}
                  onChange={() => onToggle(option.value, true)}
                  className="sr-only"
                />
                {body}
              </label>
            );
          }

          return (
            <button
              key={key}
              type="button"
              aria-pressed={active}
              onClick={() => onToggle(option.value, !active)}
              style={style}
              className={chipClass}
            >
              {body}
            </button>
          );
        })}
      </div>
    </div>
  );
}
