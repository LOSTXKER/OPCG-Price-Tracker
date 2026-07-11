# 📍 PROGRESS — สถานะสด
> **เขียนทับทุกครั้ง ไม่สะสม log** · hook โหลดไฟล์นี้ทุก session · อ่านอันนี้ก่อน แล้วทำต่อจาก NEXT

อัปเดตล่าสุด: 2026-07-11 — **UX Truth & Safety T1–T3 เสร็จและ verify แล้ว**

## ✅ ทำแล้ว

- **Pricing/Auth:** guest CTA ส่งเข้า login โดยรักษา plan intent; login/register/forgot/reset/OAuth callback รับเฉพาะ redirect ภายในที่ปลอดภัย; กลับมาแล้ว resume checkout แบบ one-shot หรือกดต่อเองได้; CTA ระบุและตามรอบบิลที่กำลังเห็น
- **Subscription:** success/cancel/pending/error/retry ชัด; trial 14 วันและ limits ใช้ source of truth; Lifetime tier ถูก guard ทั้ง UI/API; webhook ยกเลิกและ refund subscription ที่ชน Lifetime แบบ idempotent; stale deletion event ลดแพ็กเกจใหม่ไม่ได้; Checkout จำกัด immediate card payment
- **Marketplace/Commerce:** filter ใช้ draft→Apply, X/Escape discard, URL เป็น source of truth รวม exact `cardCode`, condition/rarity/variant/sort/page; query เกินหน้าจริง clamp; loading/success/empty/error/retry ครบและ request เก่าเขียนทับใหม่ไม่ได้; copy ซื้อขาย/ชำระเงิน/ความน่าเชื่อถือผู้ขายตรง behavior จริง
- **Card detail:** ข้อมูลจำลองเหลือ preview 3 แถวพร้อม disclosure ว่าไม่ใช่ธุรกรรมจริงและไม่ใช้คำนวณราคา; real feed expand ใน flow, ไม่มี vertical scroll ซ้อน และไม่แสดง count จากข้อมูลที่ถูก cap
- **Orders/Messages:** event ระบบเก็บแบบ language-neutral และ render TH/EN/JP ตามผู้ดู; legacy message และ tracking ยังอ่านได้
- ใช้ canonical components/tokens เดิม; ไม่เพิ่ม dependency, config, Prisma schema หรือ migration

## ✅ หลักฐาน verify ล่าสุด

- `npm run lint` — **0 errors**, 30 warnings เดิม
- `npm run test` — **19 files, 131/131 tests ผ่าน**
- `npx tsc --noEmit` — ผ่าน
- `npm run build` — ผ่าน, Next สร้าง **155 pages**; มี warning เดิมเรื่อง `middleware.ts` deprecated
- Guest auth browser (`NEXT_PUBLIC_BYPASS_AUTH=false`) — Pricing → Login → Forgot/Register รักษา redirect; external redirect ถูกตัดกลับ `/`
- Browser matrix 390×844, 768×1024, 1440×900 — Pricing/Marketplace/Card ไม่มี horizontal overflow และ Card feed ไม่มี nested vertical scroll
- Mobile filter — control หลัก 44px, radio/pressed state ตรง URL, Escape ปิด dialog และคืน focus; `/marketplace?page=999` normalize กลับหน้าที่มีข้อมูล
- Pricing — query Pro+ รายปีแสดง intent ถูก; สลับรายเดือนแล้วข้อความและ CTA เปลี่ยนตามรอบบิลปัจจุบัน
- Light/Dark — สลับได้และไม่เกิด overflow; browser console error = 0
- UX/UI P0–P3 ก่อนหน้านี้ขึ้น production แล้ว; production smoke เดิม 105/105 non-`/proto` routes ผ่าน

## ⚠️ ขอบเขตการตรวจ

- ยังไม่ได้จ่ายเงินจริงใน Stripe test mode หรือ login ด้วยบัญชีจริงครบ flow; billing race ตรวจด้วย regression tests/mocks และ guest auth ตรวจด้วย browser
- Full 105-route browser smoke ไม่ได้รันซ้ำใน batch นี้ เพราะเปลี่ยนเฉพาะ Pricing/Auth/Commerce/Card/Orders; build ครบ 155 pages และตรวจแม่แบบที่เปลี่ยนครบ 3 ขนาด
- Lint warnings เดิม 30 จุดและ migration `middleware.ts` → `proxy.ts` เป็นงานแยก

## ⏭️ NEXT

1. ถ้าต้องการความมั่นใจด้านการเงินจริง ให้ทำ Stripe test-mode E2E ด้วยบัญชีจริง
2. งานแยกภายหลัง: `middleware.ts` → `proxy.ts` และเก็บ lint warnings เดิม

## แหล่งอ้างอิง

- แผนแม่บท: `doc/uxui-refactor-plan.md`
- หลักฐาน audit: `doc/uxui-audit-findings-2026-07-04.md`
- Canonical kit: `AGENTS.md` §Component Kit
