# 📍 PROGRESS — สถานะสด
> **เขียนทับทุกครั้ง ไม่สะสม log** · hook โหลดไฟล์นี้ทุก session · อ่านอันนี้ก่อน แล้วทำต่อจาก NEXT

อัปเดตล่าสุด: 2026-07-03 — **iOS Proto v2: Desktop จริง** (เบส: "เว็บก็ดี มือถือก็ดี เอา UI ปัจจุบันมาปรับ" → "ทำ proto ก่อนนะ")

## แหล่งอ้างอิง
- **spec เต็ม:** `doc/mine-multigame-spec.md` · **VISION:** identity §1 (ห้ามเปลี่ยน) + IA §2

## ✅ เสร็จ session นี้ — Proto v2 (ยังอยู่ที่ `/proto/ios/*` ไม่แตะหน้าจริง)
รอบก่อน showcase เป็น iOS ล้วน (side rail desktop = จำลอง iPad ไม่ใช่เว็บจริง) — เบสเคาะทิศ iOS แล้ว แต่บอกต่อว่าต้อง **"เว็บก็ดี มือถือก็ดี เอา UI ปัจจุบันมาปรับ"** และให้ **"ทำ proto ก่อน"** (ยังไม่ให้ rollout หน้าจริง) — งานรอบนี้จึงเป็นการเพิ่ม **desktop composition จริง** เข้า proto เดิม โดยจำลองโครงเว็บปัจจุบันเป็นฐาน:

- **`_components/ios-shell.tsx` เขียนใหม่**: ตัด side rail ออก → desktop (`md:`+) ใช้ **top header แบบเว็บจริง** (logo · nav links 4 อัน · search pill · avatar) จำลองโครงจาก `src/components/layout/header.tsx` จริง แต่แต่งด้วยภาษาใหม่ (frost ตอน scroll แทนที่ solid bg เดิม, active link = honey pill เหมือน tab bar) · มือถือ (<md) คงเดิมทั้งหมด (collapsing nav bar + bottom tab bar)
- **Desktop composition ทั้ง 6 จอ** (ปรับเฉพาะ `md:`/`lg:` — มือถือไม่แตะเลย):
  - ตลาด: `max-w-6xl` container · มูฟเวอร์ rail → `lg:grid-cols-6` · catalog list เพิ่มคอลัมน์ 7d บน `lg:`
  - Portfolio hub: `max-w-6xl` · การ์ดพอร์ต `lg:grid-cols-3`
  - Portfolio detail: `max-w-5xl` · แท็บเชิงลึก (กราฟ+stat strip) เป็น `lg:grid-cols-2` (เดิม stack แนวตั้งอย่างเดียว) · ปุ่ม "+เพิ่มการ์ด" ย้ายเข้า header trailing บน desktop (เดิมมีแค่ sticky bar มือถือ)
  - Card detail: มี `lg:grid-cols-[300px_1fr]` อยู่แล้วจากรอบก่อน — แค่ห่อ `max-w-6xl` ให้ตรงกับ header ใหม่ (sticky rail `lg:top-14` พอดีกับความสูง header 56px โดยบังเอิญ ไม่ต้องแก้)
  - Watchlist: `max-w-5xl` · เพิ่มคอลัมน์ 7d บน `lg:` (แบบเดียวกับตลาด)
  - More/Settings: มี `max-w-2xl` (แคบ ถูกต้องแล้วสำหรับ settings) — ไม่ต้องแก้
- verify: tsc0 · lint0 (34 warning เดิม) · test56 · build✓ (6 route ขึ้นจริง) · impeccable detect [] · curl smoke 200 ทุก route ไม่มี server error

## ⚠️ ยังไม่ได้ทำ — เบสต้องเปิดดูเอง
เครื่องมือเปิด browser จริงไม่พร้อมใช้งาน session นี้เหมือนรอบก่อนหน้า — **ยังไม่เห็นภาพจริงบน desktop เลย** (จุดสำคัญที่สุดของรอบนี้คือ desktop header ใหม่กับ multi-column layout — verify ได้แค่ build/lint/test/curl)

## ⏭️ NEXT
1. **สำคัญที่สุด**: เบสเปิด `localhost:3000/proto/ios` บน **desktop จริง (1280-1512px)** ก่อน — เช็คว่า top header ใหม่ (frost+nav links+search+avatar) รู้สึกเหมือนเว็บเดิมที่ปรับดีขึ้นไหม หรือแปลกไป · เช็ค multi-column แต่ละจอ (มูฟเวอร์ grid, portfolio grid 3 คอลัมน์, insights 2 คอลัมน์, card detail sticky rail, watchlist 7d column)
2. เช็คมือถือ 390px อีกรอบว่ายังเหมือนเดิม (ไม่ได้แตะ แต่ควร regression-check)
3. เบสเคาะ (ชอบ/ปรับตรงไหน) → กลับไปทำแผน **rollout หน้าจริง** ที่พับไว้ (Batch 0-2: atoms เข้า production → chrome จริง → Settings/More) — ยังไม่เริ่ม
4. ลบ `/proto/ios/*` ทิ้งหลัง rollout จริงเสร็จ (หรือเก็บเป็น reference เหมือน `/proto/portfolio`)
5. Hub/Detail portfolio split (session ก่อนหน้านั้น) ยังไม่ได้ commit เป็นทางการ — รวมอยู่ใน checkpoint `cb840ef`
