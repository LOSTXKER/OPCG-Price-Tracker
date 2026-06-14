# 📍 PROGRESS — สถานะสด
> **เขียนทับทุกครั้ง ไม่สะสม log** (รายละเอียดอยู่ใน git history) · hook โหลดไฟล์นี้ทุก session
> session ใหม่: อ่านอันนี้ก่อน แล้วทำต่อจาก NEXT

อัปเดตล่าสุด: 2026-06-14 — **เข้าเฟส REDESIGN จริงแบบ in-place บน main · warm-premium = default dark theme ขึ้น main แล้ว · [VISION.md](VISION.md) = north-star**

## ▶ สถานะตอนนี้
- **redesign ทำ in-place บน v1 โดยตรง** (ไม่ทำ parallel v2 / ไม่ fork repo — สรุปแล้วว่าวิธีนี้ดีสุด, ตัด v2 toggle/scaffolding ทิ้งหมด)
- **warm-premium = default dark theme** อยู่บน main แล้ว (`globals.css` `.dark`: espresso `#100C09` + honey-gold `#E9B970` + hairline border + coral down) — merged #27
- **[VISION.md](VISION.md)** = design north-star อยู่บน main (3-axis IA · warm identity · per-surface direction)

## ⚠️ WORKFLOW override (สำคัญ — เบสสั่งเอง)
- **commit ลง `main` ตรงๆ ไม่ต้อง PR/branch** (เบสสั่ง "ใช้ main ไปเลย") — **override กฎ CLAUDE.md "ห้าม push master ตรง"** สำหรับเฟสนี้
- ยังถือ git เป็น safety net (revert ได้) · ยังรัน verify (lint/test/build) ก่อนเคลมเสร็จ

## 🎨 ทิศ redesign ที่เคาะแล้ว
- **vibe = warm premium** (espresso + honey-gold + honey-glow) — *ไม่ใช่* cold clone แบบ Linear · 🐻 brand หมี+honey = ค่าคงที่ห้ามเปลี่ยน
- **IA = 3 แกน** (Game=namespace `/[game]/` · Feature=nav คงที่ · Action=per-page) → ฟีเจอร์เพิ่ม = tile ใน hub ไม่ใช่ tab (ดู VISION §1)
- **method:** แอปใช้ semantic token ดีมาก → เปลี่ยน token = ทั้งแอป warm เอง · hardcoded color ที่เหลือ ~37 จุดส่วนใหญ่ semantic (สีการ์ด 青/紫/黒 · status · price) = **เก็บไว้** ไม่ใช่ clash
- งานจริงต่อไป = **structural/layout refinement ทีละหน้า** ตาม VISION (ไม่ใช่ไล่แก้สี)

## ⚠️ ยังไม่ verify ด้วยตา
- warm theme เป็นการเปลี่ยนทั้งแอปที่ **AI ยืนยันด้วยตาไม่ได้** → **session หน้า: ให้เบสเปิด `localhost:3000/` (หรือ deploy preview) ดูโทนก่อน** · ถ้าสีไหนไม่เวิร์ค จูน `globals.css` `.dark` จุดเดียว (border ตั้ง hairline 0.12 · ปรับง่าย)

## ▶ NEXT
1. **เบส confirm โทน warm** (เปิดดูจริง) — โอเค/ปรับ token ก่อน
2. **refine structural ทีละหน้า บน main** — เริ่ม **card-detail** (แย่สุด/คุ้มสุดตาม VISION §4.1: 5-zone · grade rail · sold comps source-badge) → home(ตาราง market) → portfolio → marketplace
3. (ทีหลัง) light-mode ทำ warm ให้เข้าชุด (ตอนนี้แก้แค่ dark = default) · per-game accent · ฟีเจอร์อนาคต (grade tier/edition JP-EN/escrow/Pokémon ตาม VISION)

## 📌 reference / branch
- **[VISION.md](VISION.md)** = north-star เฟสนี้ (อ่านก่อน refine ทุกหน้า) · **[REDESIGN.md](REDESIGN.md)** = design phase v1 (P0–P2 เสร็จแล้ว, historical)
- **PR #25** (`design/vision-prototype`) = prototype `/proto` (visionary+grounded mockups, warm-premium ทุกหน้า) + v2 scaffolding — **redundant แล้ว ปิดได้** (VISION ขึ้น main แล้ว · /proto เก็บใน git ดู ref ได้) — *เบสยังไม่เคาะปิด*
- prototype `/proto/*` = **อยู่บน main แล้ว** (chromeless, warm-premium mockups — visionary `/proto` + grounded `/proto/real`) → เปิด `localhost:3000/proto` ดูเป็น visual ref ตอน refine · เป็น mockup ไม่ใช่โค้ดจริง (ไม่กระทบแอป)

## ✅ ทำเสร็จก่อนหน้า (merged, อยู่ใน git)
- redesign P0–P2 (#7–#16) · P4.1/4.2 multi-game seam + gameId schema deployed prod (#17/#18) · declutter sweep ทุก batch (#20–#23) · docs cleanup (#24: rewrite doc/ + archive + README) · v2 foundation (#26, ถูกแทนด้วย in-place แล้ว) · warm theme + VISION (#27)

## เครื่องมือ / สภาพแวดล้อม
- `gh` login (LOSTXKER) · **เฟสนี้: commit main ตรง** (ตาม override ข้างบน)
- ถือ [AGENTS.md](AGENTS.md): typography tokens (ห้าม `text-[Xpx]`) · breakpoints (`sm:` data / `md:` chrome / `lg:` columns) · table→list `<sm` · apiHandler/Zod
- verify gate มาตรฐาน: `npx tsc --noEmit` · `npm run lint` (baseline 0 err / 78 warn) · `npm run test` (36/36) · `npm run build`
- warm token values อยู่ `globals.css` `.dark` (บรรทัด ~131) — แก้ที่เดียวกระทบทั้งแอป
