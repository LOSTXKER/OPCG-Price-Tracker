# 📍 PROGRESS — สถานะสด
> **เขียนทับทุกครั้ง ไม่สะสม log** · อ่านอันนี้ก่อน แล้วทำต่อจาก NEXT

อัปเดตล่าสุด: 2026-08-27 — **Global Game → Set navigation release candidate**

## ผลลัพธ์

- เปลี่ยน label ย่อของปุ่มชุดบน mobile จาก `ชุด` เป็นคำสั่งที่ชัดเจน `เลือกชุด`; desktop และข้อความเต็มใน dialog ยังใช้ `เลือกชุดการ์ด` ตามเดิม
- เพิ่มคำแปลเฉพาะจุดครบ TH `เลือกชุด` / EN `Select set` / JP `セット選択` และล็อกค่าด้วย regression test
- เพื่อให้คำเต็มอ่านได้บนจอแคบ ซ่อน Package icon ที่เป็นของตกแต่งบน mobile และเลื่อน connector Game→Set ไปแสดงตั้งแต่ 430px; dropdown chevron ยังอยู่ตั้งแต่ 360px
- โครง `Logo · Game · เลือกชุด · Search · Bell/Login · Theme` ยังเป็นแถวเดียวสูง 56px และทุก target อย่างน้อย 44×44px

## หลักฐานตรวจรับ

- Browser หน้าแรก 320×667: Set trigger 71px, label box `clientWidth === scrollWidth === 55px`, เห็น `เลือกชุด` ครบ; Logo/Game/Search/Bell/Theme ยัง 44px และ horizontal overflow = 0
- Browser หน้าแรก 390×667: Set trigger ~88px, label box `clientWidth === scrollWidth === 52px`, เห็น `เลือกชุด` ครบพร้อม dropdown chevron; horizontal overflow = 0
- กด `เลือกชุด` เปิด dialog และช่อง `ค้นหารหัสหรือชื่อชุด...`; Escape ปิดและคืน focus ที่ trigger; console/hydration ไม่มี warning/error
- React best-practices review ไม่พบ state/effect/render regression · Impeccable layout detector `[]`
- `npx tsc --noEmit` ผ่าน · `npm run lint` 0 errors (34 warnings เดิม) · `npm run test` **149 files / 882 tests ผ่าน** · `npm run build` ผ่าน **210 หน้า**

## ไฟล์หลักที่เปลี่ยนในรอบล่าสุด

- `src/components/layout/header-catalog-control.tsx`
- `src/components/layout/header-catalog-control.test.tsx`
- `src/lib/i18n/{th,en,jp}.ts`
- `src/lib/i18n.test.ts`

## Worktree / ขอบเขต

- checkpoint ก่อนเริ่ม navbar อยู่ที่ `aa0c8a2`
- production navbar + owner revisions commit `037ccad`; prototype แยก commit `072276a`
- push branch `chore/next-16.3` แล้ว และเปิด PR #119 เข้า default branch `master` (repository ไม่มี branch `main` และห้าม direct push เข้า `master`)
- ไม่มี schema, migration, dependency, config change, data mutation หรือ deploy
- dev server เปิดกลับที่ `http://localhost:3000` หลัง production build ผ่าน

## NEXT

1. รอ remote checks ของ PR #119 แล้ว merge เข้า `master`
2. fetch และยืนยัน `origin/master` ชี้ release commit จริง
3. ตรวจ Vercel Production และหน้าแรกจริงแยกจากสถานะ GitHub
