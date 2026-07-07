# 📍 PROGRESS — สถานะสด
> **เขียนทับทุกครั้ง ไม่สะสม log** · hook โหลดไฟล์นี้ทุก session · อ่านอันนี้ก่อน แล้วทำต่อจาก NEXT

อัปเดตล่าสุด: 2026-07-07 — **Phase 2 (kit dedup) + Phase 3 (token discipline) เกือบครบ · #69–#88 merged เข้า master** · master เขียว tsc0/lint0/test56/build✓ · เหลือ Phase 3 อันเดียว = **TOKENS-07 status-660** (gradual) · **NEXT = TOKENS-07 หรือ Phase 4 (states) / Phase 1 (ลบโค้ดตาย)**

## ✅ Phase 3 — token discipline (เข้า master แล้ว #83–#88)
- **#83** ลบ orphan `streak-tier-indicator` (dead code)
- **#84** TOKENS-03 hairline → `border-hair` token (373 จุด, invisible)
- **#86** TOKENS-04 `--chrome-h` var (sticky/scroll-mt) + CHROME-07/12 gutter/ticker align
- **#87** TOKENS-02 เงา overlay/floating → `--elev-overlay/raised` token (15 จุด)
- **#88 (ชุดใหญ่ visual)**:
  - **วินัยเขียว/แดง** — honey = accent เดียว (primary): ดาว/Pro/compare-winner amber&เขียว → honey · เขียว/แดง = กำไร/ขาดทุนเท่านั้น
  - **หัวใจ** — "รายการโปรด" ใช้หัวใจอันเดียวทั้งแอป (เดิมปนดาว) · `WatchlistStar`→`WatchlistHeart` · nav rose→honey
  - **motion** — `duration-200/300` → `--dur-*` token (invisible)
  - **radius** — Surface ทุก variant = 12px (`rounded-lg`) · bare `rounded`(4px)→`rounded-sm` 142 จุด
  - **admin palette** (ADMIN-05) — status color → semantic token (7 ไฟล์, preserve category/data color)
  - **guide สี** (CONTENT-09) — สีตกแต่ง→neutral/semantic (preserve board-legend/rarity/card = data)
  - **dead-scroll** (CHROME-09) — main pb ลดเมื่อ route มี mobile footer (ฆ่าแถบว่าง ~128px)
- **verify: ฉันเปิด browser เช็คเอง (dev auth bypass)** — สี/หัวใจ/เงา/radius/guide/admin render ถูก · admin ตาราง(#76)+ฟอร์ม(#75) ทำงานจริง · console 0 error

## ✅ Phase 2.5–2.6 (#69–#82) — kit dedup + จัดบ้าน
search engine · guide/auth kit · SETS-04 · HONEY-03 · **ADMIN-06** `useAdminForm`(ยุบ7ฟอร์ม) · **ADMIN-02** 5 list→`AdminDataTable` · **IDENTITY-11** settings→`components/settings/` · **KIT-04/06/09** · **HONEY-05** honey-sidebar split

## ⏭️ NEXT — เลือกทางต่อ
1. **ปิด Phase 3**: `TOKENS-07` สี status ดิบ 660 จุด → semantic token **ทีละ feature** (เริ่ม orders/alerts/notifications) — audit สั่งทำ gradual, mixed-risk (บาง invisible บาง visual) แยกทำเป็นชุดๆ
2. **Phase 4 — states**: ศูนย์ spinner→skeleton (9 จุด) · loading.tsx ราย segment · empty state ทุกจุดมี CTA · หน้า error ไทย
3. **Phase 1 — ลบโค้ดตาย** ~3,000 บรรทัด/orphan 18+ ไฟล์ (⚠️ เบสอนุมัติ list ก่อนลบ)
4. **Phase 5 — mobile ราย surface** (เบสเลือกหน้า) · **Phase 6** IA/naming · **Phase 7** commerce+admin (ก่อนเปิด marketplace flag)
- M0 bug: cron `leaderboard-rewards` ไม่ถูก schedule ใน vercel.json (Top-10 payout อาจไม่จ่าย)

## ⚠️ ต้องเบส eyeball/ตัดสิน
- **dead-scroll** (#88): มือถือ resize ในเครื่อง dev ไม่ได้ → เบสเช็ค real device (แถบว่างท้ายหน้าหาย + เนื้อหาไม่โดน nav ทับ)
- **radius/สี identity**: ล็อกแล้ว (12px + honey + หัวใจ) — ถ้าอยากปรับ (เช่นดาว/หัวใจทองทั้ง 2 โหมด = ต้อง token `--tier-gold`) บอกได้

## กฎเหล็ก / บทเรียน
- **ห้าม push master ตรง** — branch+PR+merge · self-merge เฉพาะเบสสั่ง "merge" ชัดเจน
- **อย่ารัน `npm run build` ตอน dev server รันอยู่** — ทับ `.next` → hydration mismatch (dev cache, ไม่ใช่บั๊ก) · verify build ตอน dev ปิด หรือ restart dev หลัง build
- **เช็ค UI เอง** ผ่าน browser extension (dev localhost auth bypass) — ไม่โยน eyeball ให้เบสถ้าเข้าเองได้
- migrate = คงพฤติกรรม/data เดิม · adversarial review workflow ก่อน PR · **PRESERVE data color** (rarity/card/tier/legend) ตอนแตะสี

## แหล่งอ้างอิง
- **แผนแม่บท:** `doc/uxui-refactor-plan.md` (8 phases) · **หลักฐาน:** `doc/uxui-audit-findings-2026-07-04.md` (230 findings) · **kit canon:** `AGENTS.md` §Component Kit
