# 📍 PROGRESS — สถานะสด
> **เขียนทับทุกครั้ง ไม่สะสม log** (log อยู่ใน git history แล้ว) · hook โหลดไฟล์นี้เข้าทุก session
> session ใหม่: อ่านอันนี้ก่อนเริ่ม แล้วทำต่อจาก NEXT

อัปเดตล่าสุด: 2026-06-13 (รอบ refactor — เบสสั่ง "Refactor ก่อน เดี๋ยวค่อยปรับ Design")

## ทำถึงไหน
- audit ทั้ง repo เสร็จ → แผน refactor อยู่ `PLAN.md` ส่วน R (R0-R4) · งานเปลี่ยน design/IA แขวนไว้ "รอเฟส redesign"
- **R0 ครบ**: chromeless auth routes · ตาราง drop-rate dialog มี mobile fallback · เคลียร์ overflow-x-auto 30 จุด
- **R1 typography ครบ**: text-[Npx] → text-micro/overlay · auth hero → text-h1
- **R2 hooks ครบ**: `lib/api/client.ts` (apiFetch/ApiError/apiTry) + `lib/api/shared-resource.ts` + migrate hooks ที่มี fetch ทั้ง 9 ตัว (4 ตัว → useSyncExternalStore)
- **lint errors 29 → 0** (พังมาก่อนแล้ว): เพิ่ม `use-hydrated.ts` แทน mounted-flag · timeout-0/rAF สำหรับ setState-in-effect · hoist conditional hooks + nested component · `daysSince/daysUntil` ใน lib/utils/time.ts
- **ซ่อมเทสต์เก่าพัง**: earn.test.ts stub ขาด `$transaction` → 36/36 เขียว
- **verify ครบผ่านหมด**: `eslint src` 0 errors/78 warnings ✅ · test 36/36 ✅ · `npm run build` ผ่าน (BUILD_ID: hZ81t2dR2BU6dH_cO-11w) ✅ · `tsc --noEmit` clean ✅
- **เจอ+แก้ปัญหา env (ไม่ใช่โค้ด)**: iCloud "Optimize Storage" ดูดไฟล์ node_modules ออก (dataless) ทำ Turbopack อ่านไม่ได้ → daemon `bird` ค้าง → แก้ด้วย killall bird + `rm -rf node_modules && npm install` สด (เบสรันผ่าน `!` เพราะ harness บล็อก rm) · lockfile อัปเดตแก้ drift @emnapi ที่ค้างมาก่อน

## ค้าง / ติดอะไร
- ⚠️ **junk จาก env ต้องลบเอง (ผม rm ไม่ได้ harness บล็อก)** — กัน lint/git/build ปนเปื้อนแล้วด้วย .gitignore `/.next-*/` + eslint ignore `.next-*` & `* [0-9].*` แต่ไฟล์ยังอยู่บนดิสก์:
  ```
  ! rm -rf .next-stale-rebuild .next-failed-* "src/hooks/use-portfolio-api 2.ts"
  ```
  (`use-portfolio-api 2.ts` = iCloud conflict copy เนื้อหาเก่า — อันตรายถ้า iCloud เอาไปทับไฟล์จริง ลบทิ้งเลย)
- ⚠️ **ต้นเหตุจริง iCloud**: โปรเจกต์อยู่บน Desktop ที่ iCloud sync + Optimize Storage → ดูด node_modules ออก + สร้าง conflict copy ของไฟล์ที่แก้ (เจอ `use-portfolio-api 2.ts`) · **แนะนำย้ายออกจาก iCloud จริงจัง** ไม่งั้นวนซ้ำ
- working tree: งานเก่า 15 ไฟล์ + refactor วันนี้ + package-lock.json + .gitignore/eslint.config ยังไม่ commit (~79 ไฟล์) — **เบสยังไม่เคาะวิธี commit** · changeset ใหญ่แล้ว แนะนำ commit เป็นก้อนก่อนไป R2 ต่อ
- R2 ค้าง: fetch ใน components ~70 จุด · แตก client components ยักษ์ 5 ตัว (portfolio-client 661 ฯลฯ) · ลบ `lib/notifications.ts` (รอเบสยืนยัน)
- R1 ค้าง: รวม empty-state · lint warnings 81 · R3 i18n 152 ไฟล์ · R4 client→server pages
- เดิม: cron `leaderboard-rewards` ไม่อยู่ใน vercel.json (M0) · `data/cards-official/` รอเบส

## ▶ NEXT (ทำต่อทันที)
1. ดูผล build รอบสุดท้ายให้จบ — แดงให้แก้ก่อน (ระวัง .next corrupt = ลบทิ้ง build ใหม่)
2. R2 ต่อ: แตก portfolio-client (แยก data hook / presentation) แล้วไล่ migrate fetch ใน components
3. R1: รวม empty-state → ระบบเดียว
