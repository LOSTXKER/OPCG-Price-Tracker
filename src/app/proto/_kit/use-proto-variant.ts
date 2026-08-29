"use client"

import { useCallback, useEffect, useRef, useState } from "react"

/**
 * useState ที่ผูกค่าไว้กับ query string ของหน้า proto — กดเลือก "แบบ C" แล้ว URL
 * กลายเป็น `?v=c` ทันที เบสจึงส่งลิงก์กลับมาได้เลยว่าชอบอันไหน แทนที่จะต้องบรรยาย
 * ("อันที่สองจากซ้าย" คือที่มาของการเข้าใจผิดรอบก่อนๆ)
 *
 * ใช้ `history.replaceState` ตรงๆ ไม่ใช้ `useSearchParams` เพราะตัวนั้นบังคับให้หน้า
 * ต้องมี Suspense ครอบตอน prerender — หน้า proto ทุกหน้าจะพัง build พร้อมกัน
 *
 * ค่าเริ่มต้นจงใจไม่เขียนลง URL เพื่อให้ลิงก์เปล่า = ค่าเริ่มต้นเสมอ
 */
export function useProtoVariant<T extends string>(
  key: string,
  allowed: readonly T[],
  fallback: T,
) {
  const [value, setValue] = useState<T>(fallback)
  // อ่านผ่าน ref: รายการตัวเลือกเป็น literal ใหม่ทุก render — ใส่ใน deps ไม่ได้
  const allowedRef = useRef(allowed)
  allowedRef.current = allowed

  // อ่าน URL หลัง mount เท่านั้น (ตอน SSR ยังไม่มี window) — ค่ามั่วใน URL ถูกทิ้ง
  useEffect(() => {
    const raw = new URLSearchParams(window.location.search).get(key)
    if (raw && (allowedRef.current as readonly string[]).includes(raw)) {
      setValue(raw as T)
    }
  }, [key])

  const set = useCallback(
    (next: T) => {
      setValue(next)
      const url = new URL(window.location.href)
      if (next === fallback) url.searchParams.delete(key)
      else url.searchParams.set(key, next)
      window.history.replaceState(null, "", url)
    },
    [key, fallback],
  )

  return [value, set] as const
}

/** รุ่นสวิตช์เปิด/ปิด สำหรับปุ่มสลับสถานะขอบ (ว่าง/มีข้อมูล · สั้น/ยาว) */
export function useProtoFlag(key: string, fallback = false) {
  const [raw, setRaw] = useProtoVariant(
    key,
    ["0", "1"] as const,
    fallback ? "1" : "0",
  )
  const toggle = useCallback(
    () => setRaw(raw === "1" ? "0" : "1"),
    [raw, setRaw],
  )
  return [raw === "1", toggle] as const
}
