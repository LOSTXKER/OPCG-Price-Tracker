# 📍 PROGRESS — สถานะสด
> **เขียนทับทุกครั้ง ไม่สะสม log** · อ่านอันนี้ก่อน แล้วทำต่อจาก NEXT

อัปเดตล่าสุด: 2026-08-26 — **Recent Sales: คืน UI ตัวกรองแบบเดิม**

## ผลลัพธ์

- คืนหน้าปิดตามภาพอ้างอิง: segmented range `7D / 30D / 90D / 1Y / All` อยู่ซ้าย และปุ่ม soft `ตัวกรอง` อยู่ถัดกัน
- ย้าย `สภาพ` และ `ตลาด` กลับเข้า canonical `FilterModal`; หน้าปกติไม่แสดง facet สองชุดนี้
- `30D/90D` เป็น display alias ของค่า shared `1M/3M` เท่านั้น จึงไม่เปลี่ยนช่วงข้อมูล, state ที่แชร์กับกราฟ หรือ tier locks
- modal นับ badge เฉพาะสภาพ+ตลาด, Apply ปิด modal, Reset คืนสอง facet เป็น `ทั้งหมด`; exact condition/source และ inclusive range cutoff เดิมยังทำงาน

## หลักฐานตรวจรับ

- focused tests **2 files / 3 tests ผ่าน** · scoped ESLint ผ่าน · `npx tsc --noEmit` ผ่าน
- `npm run lint` 0 errors (34 warnings เดิม) · `npm run test` **147 files / 868 tests ผ่าน** · `npm run build` ผ่าน 209 หน้า
- Browser จริง light/dark **390 / 768 / 1024 / 1440px**: ช่วงเวลา+ปุ่มตัวกรองอยู่บรรทัดเดียวทุกขนาด, ไม่มี horizontal overflow หรือ page error
- เปิด modal จริงพบสภาพ `ทั้งหมด / PSA 10 / Raw` และตลาด `ทั้งหมด / SNKRDUNK`; เลือกสอง facet แล้ว badge เป็น `2`, Reset ล้าง badge และ Enter/Escape เปิด–ปิดได้
- Chrome dev มี request `/icon?...` ตอบ `ERR_EMPTY_RESPONSE` เป็นบางรอบ แต่หน้าและ controls โหลดครบ; ไม่เกี่ยวกับ diff ตัวกรองนี้
- Impeccable layout detector = `[]`

## ไฟล์ที่เปลี่ยนในงานนี้

- `src/components/cards/card-detail/recent-sales.tsx`
- `src/components/cards/card-detail/price-range-control.tsx`
- `src/components/cards/card-detail/recent-sales-controls.test.tsx`
- `PLAN.md` · `PROGRESS.md`

## Worktree / ขอบเขต

- Worktree ยังมีงานค้างไม่ commit จากชุดก่อน รวม Honey race, card-detail history dedupe, OP03 date, latest-set placement และ homepage hero set picker รอบสอง — งานนี้ไม่ย้อนแก้ชุดเหล่านั้น
- ไม่มีการเขียนฐานข้อมูล และยังไม่ commit, push หรือ deploy

## NEXT

1. เบสรีเฟรชหน้า OP13-118 แล้วดู UI แบบเดิม: ช่วงเวลา + ปุ่ม `ตัวกรอง`
2. ถ้าทิศทางผ่าน ค่อยรวมตรวจ diff และ commit/push บน branch `chore/next-16.3` เมื่อเบสสั่ง (ห้าม push เข้า master ตรงๆ)
