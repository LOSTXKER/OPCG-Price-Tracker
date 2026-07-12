# 📍 PROGRESS — สถานะสด
> **เขียนทับทุกครั้ง ไม่สะสม log** · hook โหลดไฟล์นี้ทุก session · อ่านอันนี้ก่อน แล้วทำต่อจาก NEXT

อัปเดตล่าสุด: 2026-07-12 — **ชุด UI toolbar + flat surfaces merge เข้า `master` และ deploy ผ่านแล้ว**

## ✅ ทำแล้ว

- ถอด `fullWidth` และ fixed `w-36` ออกจาก `PriceModeControl`; Raw และ PSA จองความกว้างตาม label + icon + padding ทุก breakpoint
- มือถือยังคง hitbox สูง 44px และ visual frame 36px; ตั้งแต่ `sm:` ยังใช้ความสูง compact เดิม 28px จึงเปลี่ยนเฉพาะความกว้าง
- ไม่แก้ `SegmentedControl` กลาง จึงไม่กระทบ List/Grid, radiogroup, disabled state หรือ Arrow/Home/End behavior
- งานก่อนหน้ายังคงครบ: mobile toolbar compact, ถอด static horizontal fade 13 consumers และ flat surfaces ทั้งเว็บ โดยคง overhead light จากขอบบนเพียงจุดเดียว
- Commit `66e1fc3` merge ผ่าน PR #112 เป็น `98c1439` บน `master`; Vercel checks ผ่านครบ

## ✅ หลักฐาน verify ล่าสุด

- Browser 320/390px: track 113.27px, Raw 44px, PSA 69.27px; label `PSA 10` มี `clientWidth === scrollWidth` ทั้ง active/inactive จึงไม่มี ellipsis
- Browser 768/1440px: Raw 40.17px, PSA 75.27px; label แสดงครบ, geometry สูง 28px เดิม
- ทุก viewport ไม่มีขอบเขตกดซ้อนและไม่มี horizontal page overflow; click และ ArrowLeft สลับ `aria-checked` ถูกต้อง; final console = **0 errors**
- `npm run lint` — ผ่านด้วย **0 errors**, 30 warnings เดิมนอก scope
- `npm run test` — **19 files, 132/132 tests ผ่าน**
- `npx tsc --noEmit` — ผ่าน
- `npm run build` — ผ่าน, Next.js 16.2.1 สร้าง **155/155 pages**
- Dev server รันอยู่ที่ `http://localhost:3001` หลัง final visual smoke

## ⚠️ ขอบเขตการตรวจ

- รอบแก้ `PSA 10` ล่าสุดจำกัดที่ `PriceModeControl` หนึ่งไฟล์; ชุดงานรวมไม่แตะ CTA, form, API, data, schema, dependency หรือ config
- คง overhead light จากขอบบนเป็นข้อยกเว้นด้าน art direction เพียงจุดเดียว; gradient/blur ส่วนอื่นยังถูกถอดเหมือนเดิม
- Build ยังมี warning เดิมเรื่อง `middleware` convention deprecated; lint warnings เดิม 30 จุดเป็นงานแยก

## ⏭️ NEXT

1. Smoke test production Raw/PSA ที่ 390px และ 1440px หลัง CDN อัปเดตครบ
2. งานแยกภายหลัง: image aspect/LCP warning, `middleware.ts` → `proxy.ts` และ lint warnings เดิม

## แหล่งอ้างอิง

- แผนแม่บท: `doc/uxui-refactor-plan.md`
- หลักฐาน audit: `doc/uxui-audit-findings-2026-07-04.md`
- Canonical kit: `AGENTS.md` §Component Kit
