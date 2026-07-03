# 📍 PROGRESS — สถานะสด
> **เขียนทับทุกครั้ง ไม่สะสม log** · hook โหลดไฟล์นี้ทุก session · อ่านอันนี้ก่อน แล้วทำต่อจาก NEXT

อัปเดตล่าสุด: 2026-07-03 — **Mobile iOS rollout เริ่มแล้ว (Batch 0+1) — หน้าจริง** (เบส: "อยากได้แบบนี้ (desktop เดิม) แต่มือถือเป็น iOS ทำไม่ได้หรอ" → "ทำได้ — เริ่มเลย")

## แหล่งอ้างอิง
- **spec เต็ม:** `doc/mine-multigame-spec.md` · **VISION:** identity §1 (ห้ามเปลี่ยน) + IA §2

## ✅ เสร็จ session นี้ — Batch 0 (atoms) + Batch 1 (chrome + home มือถือ) บนหน้าจริง
เบสยืนยันแล้ว: **desktop คงของเดิมเป๊ะ (ชอบแล้ว ตามภาพที่ส่ง) · มือถือ (<md) เปลี่ยนเป็น iOS grammar** — เริ่ม rollout จริงบนหน้าเว็บ (ไม่ใช่ proto อีกต่อไป) โดยใช้ประโยชน์จากโครงที่มีอยู่แล้ว (desktop `<table>` vs มือถือ list เป็นคนละ markup อยู่แล้ว, header แยกไฟล์มือถือ/เดสก์ท็อปอยู่แล้ว):

- **Batch 0 — atoms เข้า production**: ย้าย `GroupedSection`/`GroupedRow` จาก proto → `src/components/ui/grouped-list.tsx` — **`GroupedRow` เขียนใหม่ให้ delegate ไปที่ `ListRow` เดิม** (atom ที่มีอยู่แล้วตาม REDESIGN.md §4.3) แทนที่จะ duplicate แถว เพื่อให้แอปมี row primitive เดียว (แค่เพิ่ม icon-circle leading + `destructive` color) · proto 5 ไฟล์ import จากที่ใหม่แทน + ลบไฟล์ proto เดิม
- **Batch 1a — Chrome มือถือ** (ทุกหน้าได้ผลพร้อมกัน, desktop ไม่แตะ):
  - [`header-mobile.tsx`](src/components/layout/header-mobile.tsx): เดิม solid bg ตลอด → เปลี่ยนเป็น **transparent บนสุด → `.frost .hairline-b` ตอน scroll** (pattern เดียวกับ desktop header ที่มีอยู่แล้ว + `/proto/ios` nav bar ที่พิสูจน์แล้ว)
  - [`page-header.tsx`](src/components/layout/page-header.tsx): title ใช้ `.text-large-title` แทน `.text-h1` ตรงๆ — CSS token ใหม่นี้มี **media query ในตัวเอง** (34px มือถือ → 32px ที่ ≥768px ซึ่งตรงกับขนาด `.text-h1` เดิมเป๊ะ) ดังนั้น desktop (`≥md`) หน้าตาเหมือนเดิม 100% ไม่มี regression ส่วนมือถือได้ large-title ใหญ่ขึ้น
  - [`bottom-nav.tsx`](src/components/layout/bottom-nav.tsx): เปลี่ยน `pb-[env(safe-area-inset-bottom)]` → `.pb-safe` utility ใหม่ (ผลลัพธ์เหมือนเดิมทุกประการ แค่สะอาดขึ้น)
- **Batch 1b — Home/Market มือถือ** ([`mobile-card-item.tsx`](src/components/home/mobile-card-item.tsx) — ใช้ร่วมกันทั้ง home และ `/sets`, market table ทุกที่): thumbnail จาก square `size-11` → **portrait `aspect-[63/88] w-11`** (สัดส่วนการ์ดจริง ตรง VISION "การ์ด=พระเอก") + เพิ่ม `hairline` ring + `min-h-[52px]` explicit tap target — โครงสร้าง rank/ชื่อ/code/sparkline/ราคา/delta เดิมทั้งหมดคงไว้ครบ (ไม่เสียฟีเจอร์) · skeleton ปรับให้ตรงชนิดเดียวกัน (กัน layout shift)
- **จงใจไม่แตะ**: toolbar/tabs ใน `home-market-overview.tsx` — โค้ดใช้ class ร่วมกันระหว่าง mobile/desktop โดยไม่มี `md:hidden` แยกชัดเจนในหลายจุด เสี่ยงกระทบ desktop โดยไม่ตั้งใจ + ของเดิมอ่านได้ดีอยู่แล้ว (underline tabs, icon-only filter บนมือถือ) จึงข้ามในรอบนี้

**verify:** tsc0 · lint0 (34 warning เดิม) · test56 · build✓ · impeccable detect [] (ทุกไฟล์ที่แตะ) · curl smoke ทั้งหน้าจริง (`/`, `/settings`, `/watchlist`, `/portfolio`, `/opcg/sets`, `/opcg/cards/OP01-001`) และ proto (`/proto/ios/*`) 200 ไม่มี server error

## ⚠️ ยังไม่ได้ทำ — เบสต้องเปิดดูเอง
เครื่องมือเปิด browser จริงไม่พร้อมใช้งาน session นี้เหมือนรอบก่อนๆ — verify จำกัดแค่ build/lint/test/curl **ยังไม่เห็นภาพจริงทั้งมือถือและเดสก์ท็อป**

## ⏭️ NEXT
1. **สำคัญที่สุด**: เบสเปิดเว็บจริงเช็ค 2 อย่าง:
   - **Desktop (≥1024px)** ต้องเหมือนเดิมทุกจุด (โดยเฉพาะ page title ที่ใช้ `PageHeader` เช่น `/settings`, `/portfolio`) — เทียบกับภาพที่เคยส่งมา
   - **มือถือ (390px)** ต้องเห็นการเปลี่ยนแปลง: header โปร่งใสตอนบนสุด+frost ตอน scroll, title ใหญ่ขึ้น (large-title), การ์ดใน list เป็นทรงตั้ง (portrait) แทนสี่เหลี่ยมจัตุรัส
2. เบสเคาะ → ทำ batch ถัดไปตามแผนเดิมที่พับไว้ (card detail → portfolio pages → watchlist → settings/More ด้วย `GroupedSection`/`GroupedRow` ที่เพิ่งย้ายเข้า production)
3. `/proto/ios/*` ยังเก็บไว้เป็น reference (ยังไม่ลบ) — ใช้เทียบตอนทำ batch ถัดไป
4. Hub/Detail portfolio split (session ก่อนหน้า) ยังไม่ได้ commit เป็นทางการ — รวมอยู่ใน checkpoint history
