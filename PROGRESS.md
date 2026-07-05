# 📍 PROGRESS — สถานะสด
> **เขียนทับทุกครั้ง ไม่สะสม log** · hook โหลดไฟล์นี้ทุก session · อ่านอันนี้ก่อน แล้วทำต่อจาก NEXT

อัปเดตล่าสุด: 2026-07-05 — **Phase 0 + 1 + 2.1 + 2.2 เสร็จ ขึ้น master หมด (PR #57–#63 merged) · master สะอาด · ต่อที่ Phase 2.2 (sparkline) → 2.3**

## ✅ เสร็จแล้ว ขึ้น master (session ล่าสุด — ทุกอย่างผ่าน branch+PR ไม่ push master ตรง)
- **#57** Sheet ทางลัด "ดูเพิ่มเติม" มือถือ · ไอคอนทั้งเว็บ (รายการโปรด=Heart, พอร์ต=Briefcase) · รวม /watchlist 2 แท็บ (การ์ด/แจ้งเตือน, `?tab=alerts`)
- **#58** footer มือถือ ซ่อนเฉพาะหน้าแอป (`FooterChrome` + `NO_MOBILE_FOOTER_ROUTES`)
- **#59 + #60** Phase 1 ลบ dead code **~3,360 บรรทัด** (delete-only + extract-then-delete · verify reference ก่อนเสมอ)
- **#62** Phase 2.1 — **ประกาศ Component Kit canon ใน `AGENTS.md`** ← ตารางนี้ = source of truth ของ kit (เช็คก่อนสร้าง component ใหม่)
- **#63** Phase 2.2 — สร้าง **`PriceTag`** (`ui/price-tag.tsx`, อะตอมเดียว 2 โหมด) → ยุบ `PriceDisplay`+`ChangePill`+`DeltaText` (19 จุด, ลบ 3 ไฟล์) · verify ราคา/สีด้วย browser แล้ว

## ⏭️ NEXT — Phase 2 ที่เหลือ (ตาม doc/uxui-refactor-plan.md §Phase 2 · ทำเป็นชุดย่อย verify จบในตัว)
1. **2.2 ต่อ:** `KIT-08` รวม sparkline 2 ตัว (`shared/sparkline.tsx` + `ui/mini-sparkline.tsx`) → เหลือ `ui/mini-sparkline.tsx` ตัวเดียว · `KIT-05` ยก EditionToggle/SourceBadge/grades ขึ้น kit + card-detail hero ใช้ HeroNumber
2. **2.3 Control atoms:** สร้าง `ui/switch.tsx` (SETTINGS-09) · `QtyStepper` (PLAY-07, ≥44px, drop-calc+deck-calc ใช้ร่วม) · `IconButton` (PORTFOLIO-06) · `RatingStars` honey ตัวเดียว (COMMERCE-13) · ยุบ pill 5 จุด → `SegmentedControl` (KIT-10)
3. **2.4** ยุบระบบค้นหา 3 ชุด → engine เดียว (`useCardSearch`) · **2.5** flow copy-paste (auth kit, guide kit, useAlertSubmit, AdminDataTable ฯลฯ) · **2.6** จัดโฟลเดอร์ 3 ชั้น (ui/shared/feature)
4. หลัง Phase 2: Phase 3 (token) · 4 (states) · 5 (ราย surface — เบสเลือกหน้า) · 6-7

## ⚠️ ค้าง/ข้อควรรู้ (สำคัญสำหรับ session หน้า)
- **อย่าพยายาม migrate `Delta` (card-detail/grade-value) + `DirectionPill` (alert-form) เข้า PriceTag** — verify แล้วว่าคนละ role (Delta มีโหมด abs "+380k฿·350%", DirectionPill เป็น toggle ปุ่ม) · จดใน AGENTS.md ⛔ table แล้ว
- `lastSale`/`lowestAsk` fields (grades.ts) = จงใจเก็บไว้ (earmark stat โซน 3) — อย่าลบ
- **KIT-13** (dead slot ของ Surface) ยังไม่ verify — เก็บทำตอน 2.x
- branch merged ที่ยังไม่ลบ: #59-#63 (feat/phase2-*, fix/phase1*, docs/*) — ลบได้ถ้าอยาก (บอกก่อน)

## กฎเหล็ก session นี้ (ยึดต่อ)
- **ห้าม push master ตรง** — branch + PR + merge เท่านั้น (⛔ AGENTS.md)
- ลบ dead code = verify reference จริงก่อน + delete-only PR · migrate atom = **verify ด้วยตา** (โดยเฉพาะราคา) ไม่ใช่แค่ tsc ผ่าน · เช็ค AGENTS.md canon ก่อนสร้าง component

## แหล่งอ้างอิง
- **แผนแม่บท:** `doc/uxui-refactor-plan.md` (8 phases) · **หลักฐาน:** `doc/uxui-audit-findings-2026-07-04.md` (230 findings) · **kit canon:** `AGENTS.md` §Component Kit
