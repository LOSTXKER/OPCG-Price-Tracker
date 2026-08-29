"use client"

import { useCallback, useSyncExternalStore } from "react"

/**
 * "ตัวเลือกที่กำลังดูอยู่" ของหน้า proto เก็บไว้ใน query string ไม่ใช่ใน state —
 * กดเลือกแบบ C แล้ว URL กลายเป็น `?v=c` ทันที เบสจึงก๊อปลิงก์ส่งกลับมาได้เลยว่า
 * ชอบอันไหน แทนที่จะต้องบรรยาย ("อันที่สองจากซ้าย" คือที่มาของการเข้าใจผิดรอบก่อนๆ)
 *
 * ทำไมไม่ใช้ `useSearchParams` ของ Next: ตัวนั้นบังคับให้หน้าต้องมี Suspense ครอบ
 * ตอน prerender — หน้า proto ทุกหน้าจะพัง build พร้อมกัน
 * ทำไมไม่ใช้ useState + useEffect: React 19 ห้าม setState ใน effect (กฎ compiler)
 * → อ่าน URL เป็น external store ตรงๆ ถูกกว่าและไม่ต้อง sync สองทาง
 */

const listeners = new Set<() => void>()

/** `history.replaceState` ไม่ยิง popstate — เปลี่ยนเองแล้วต้องบอก subscriber เอง */
function emit() {
  for (const listener of listeners) listener()
}

function subscribe(onChange: () => void) {
  listeners.add(onChange)
  window.addEventListener("popstate", onChange)
  // SSR เรนเดอร์ด้วยค่าเริ่มต้นเสมอ (เซิร์ฟเวอร์ไม่รู้ query) — พอ subscribe ติด
  // แล้วต้องบอกให้อ่าน URL จริงซ้ำหนึ่งรอบ ไม่งั้นเปิดลิงก์ `?v=edge` ตรงๆ จะค้าง
  // อยู่ที่ค่าเริ่มต้นตลอด = ลิงก์พกตัวเลือกไม่ได้จริง ซึ่งเป็นเหตุผลเดียวที่
  // เก็บค่าไว้ใน URL ตั้งแต่แรก (เจอจริง 2026-08-29 บน /proto/ai-look?v=edge)
  queueMicrotask(onChange)
  return () => {
    listeners.delete(onChange)
    window.removeEventListener("popstate", onChange)
  }
}

const getSearch = () => window.location.search
/** ตอน SSR ยังไม่มี URL → ทุกหน้าเรนเดอร์ด้วยค่าเริ่มต้น แล้วค่อยสลับหลัง hydrate */
const getServerSearch = () => ""

export function useProtoVariant<T extends string>(
  key: string,
  allowed: readonly T[],
  fallback: T,
) {
  const search = useSyncExternalStore(subscribe, getSearch, getServerSearch)
  const raw = new URLSearchParams(search).get(key)
  const value =
    raw && (allowed as readonly string[]).includes(raw) ? (raw as T) : fallback

  const set = useCallback(
    (next: T) => {
      const url = new URL(window.location.href)
      // ค่าเริ่มต้นไม่เขียนลง URL — ลิงก์เปล่าจึงแปลว่า "ค่าเริ่มต้น" เสมอ
      if (next === fallback) url.searchParams.delete(key)
      else url.searchParams.set(key, next)
      window.history.replaceState(null, "", url)
      emit()
    },
    [key, fallback],
  )

  return [value, set] as const
}

const FLAG_VALUES = ["0", "1"] as const

/** รุ่นสวิตช์เปิด/ปิด สำหรับปุ่มสลับสถานะขอบ (ว่าง/มีข้อมูล · สั้น/ยาว) */
export function useProtoFlag(key: string, fallback = false) {
  const [raw, setRaw] = useProtoVariant(key, FLAG_VALUES, fallback ? "1" : "0")
  const toggle = useCallback(
    () => setRaw(raw === "1" ? "0" : "1"),
    [raw, setRaw],
  )
  return [raw === "1", toggle] as const
}
