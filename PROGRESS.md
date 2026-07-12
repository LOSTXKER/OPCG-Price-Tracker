# 📍 PROGRESS — สถานะสด
> **เขียนทับทุกครั้ง ไม่สะสม log** · hook โหลดไฟล์นี้ทุก session · อ่านอันนี้ก่อน แล้วทำต่อจาก NEXT

อัปเดตล่าสุด: 2026-07-12 — **เพิ่ม saturation สีราคาขึ้น/ลง Light mode โดยยังอ่านชัด**

## ✅ ทำแล้ว

- Light แยกสีตามหน้าที่: chart/fill ใช้ `#34C759 / #FF3B30`; ข้อความราคาและ PnL ใช้สีอิ่มขึ้น `#00853D / #D93025` (contrast บนขาว 4.75:1 / 4.77:1)
- Chip/soft fill ใช้ hue เดียวกันที่เข้มกว่า `#007A38 / #C80000`; ผ่าน contrast ≥4.5:1 แม้ Market Overview ใช้ fill 22%
- แก้ consumer ที่เคยใช้สีกราฟเป็นข้อความใน Card Detail, Market Overview และ Portfolio share card ให้รับ text role; OG card price ใช้เขียว Dark palette ที่เข้ากับพื้น OG
- Dark คง price palette `#46D68B / #FF6155`; Light success/error status แยกค่าคงที่จาก market token จึงไม่เปลี่ยนตามการปรับสีราคาในอนาคต
- งานก่อนหน้ายังคงครบ: ถอด floating CTA/sentinel/scroll observer จาก Card Detail และลด bottom padding จาก 136px เหลือ 32px โดย CTA ปกติยังอยู่
- เก็บ `card-detail-sticky-buy.tsx` และ `use-sticky-buy.ts` เป็น orphan ชั่วคราว เพราะกฎ repo ต้องขออนุญาตก่อนลบไฟล์

## ✅ หลักฐาน verify ล่าสุด

- Browser Home/Card Detail/Portfolio ที่ 390/1440px: Light text = `rgb(0, 133, 61)` / `rgb(217, 48, 37)`; Dark text = `rgb(70, 214, 139)` / `rgb(255, 97, 85)`
- Browser Market Overview/Watchlist: Light soft-chip text = `rgb(0, 122, 56)` / `rgb(200, 0, 0)`; Dark soft-chip alias กลับไป palette เดิม
- ทุก route/viewport ที่ตรวจไม่มี horizontal overflow; console = **0 errors** (มี image aspect warning เดิม 1 รายการ)
- Card Detail 390px ที่ top / scrollY 1500 / ท้ายหน้า: fixed CTA = 0 ทุกตำแหน่ง, CTA ปกติยังครบ และ root padding = 32px
- Source audit: `CardDetailStickyBuy`/`useStickyBuy` เหลือเฉพาะ definition ในไฟล์ orphan ไม่มี import/call จาก runtime
- `npm run lint` — ผ่านด้วย **0 errors**, 30 warnings เดิมนอก scope
- `npm run test` — **19 files, 132/132 tests ผ่าน**
- `npx tsc --noEmit` — ผ่าน
- `npm run build` — ผ่าน, Next.js 16.2.1 สร้าง **155/155 pages**
- Dev server ถูกหยุดหลัง verification เพื่อเตรียม publish

## ⚠️ ขอบเขตการตรวจ

- สี Light ที่อิ่มขึ้นใช้กับข้อความราคาเท่านั้น; เส้นกราฟ/soft fill และ status colors ไม่เปลี่ยน
- ระหว่างตรวจพบ `.next/dev` ค้าง CSS รุ่นก่อน; ย้าย cache เก่าไป `/tmp/meecard-next-dev-*` แล้ว cold rebuild ยืนยันว่า runtime รับทั้ง vivid และ on-soft token ใหม่
- ชุด diff ปัจจุบันรวมการถอด Card Detail floating CTA กับการแก้ price roles; ไม่แตะ CTA กลาง, API, data, schema, dependency หรือ config
- ไม่ลบไฟล์ orphan โดยพลการ; ถ้าต้องการเก็บกวาดให้ขออนุมัติแยก
- Build ยังมี warning เดิมเรื่อง `middleware` convention deprecated; lint warnings เดิม 30 จุดเป็นงานแยก

## ⏭️ NEXT

1. หลัง merge ให้ smoke test production ที่ 390/1440px เมื่อ CDN อัปเดตครบ
2. ถ้าได้รับอนุญาต ให้ลบไฟล์ orphan `card-detail-sticky-buy.tsx` และ `use-sticky-buy.ts`

## แหล่งอ้างอิง

- แผนแม่บท: `doc/uxui-refactor-plan.md`
- หลักฐาน audit: `doc/uxui-audit-findings-2026-07-04.md`
- Canonical kit: `AGENTS.md` §Component Kit
