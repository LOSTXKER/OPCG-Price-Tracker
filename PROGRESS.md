# 📍 PROGRESS — สถานะสด
> **เขียนทับทุกครั้ง ไม่สะสม log** · hook โหลดไฟล์นี้ทุก session · อ่านอันนี้ก่อน แล้วทำต่อจาก NEXT

อัปเดตล่าสุด: 2026-07-05 — **Phase 2.2 + 2.3 + 2.4/2.5(บางส่วน) merged เข้า master หมดแล้ว (PR #65 #66 #67)** · master verify: tsc0/lint0err/test56/build✓ · **⚠️ ยังไม่มีใคร eyeball preview เลย (browser ล่มทั้ง session ที่ทำ) → เบสควรเปิดของจริงเช็คจุดที่เปลี่ยนตั้งใจ**

## ✅ เข้า master แล้ว (session ล่าสุด — 3 PR ผ่าน adversarial review workflow 7 ชุด 0 confirmed defect)
- **#65 Phase 2.2** — `KIT-08` รวม sparkline → `ui/mini-sparkline.tsx` เดียว (ลบ `shared/sparkline.tsx`) · `KIT-05`(บางส่วน) card-detail hero → `HeroNumber`
- **#66 Phase 2.3** — atom กลาง 7 ตัว: `ui/switch.tsx` · `ui/icon-button.tsx` · `ui/rating-stars.tsx` · `shared/saved-pill.tsx` · `portfolio/portfolio-name-form.tsx` · `ui/qty-stepper.tsx` (3/3 split+joined) · **KIT-10 ViewToggle→SegmentedControl** (ลบ ViewToggle)
- **#67 Phase 2.4+2.5** — `hooks/use-recent-searches.ts` (KIT-07, ยุบ recent ซ้ำ 3 surface) · `hooks/use-alert-submit.ts` (TRACK-04, ยุบ submit ซ้ำ 3 dialog)

## ⚠️ เบสต้อง eyeball ของจริงบน master/preview (จุดที่ "เปลี่ยนตั้งใจ" ไม่ใช่ byte-identical)
- **card**: sparkline เส้นล้วนเขียว/แดง · ราคาใหญ่ count-up ตอนโหลด + ลากกราฟเลขวิ่งตาม
- **ดาวเรตติ้ง = amber ทั้งเว็บ** (marketplace/seller/profile) — เดิม 4 สี · ดาวว่าง 2 จุด outline จาง (`/20`)
- **settings**: privacy toggle โต h-5→h-6 + off เบจอ่อนกว่า
- **market view toggle** (grid/table) = SegmentedControl (ปุ่มต่างเดิมนิด) · **deck stepper** ยุบเป็น QtyStepper (ยืนยัน Minus ยังลบการ์ด) · **drop stepper** เปลี่ยนเล็กน้อย
- **search recent + alert สร้าง/แก้** ควรทำงานเหมือนเดิม (dedup recent เป็น case-insensitive)
> ถ้าเจออะไรเพี้ยน: ดาวจาง→แก้ `rating-stars.tsx` ที่เดียว · view toggle→ปรับ SegmentedControl size · อื่นๆ บอกได้

## ⏭️ NEXT — Phase 2 ที่เหลือ (ทำบน master สะอาดได้เลย ไม่ต้อง stack แล้ว)
1. **`EditionToggle`** → SegmentedControl (KIT-10 ที่เหลือ) — ⏸️ **ทำคู่ Phase 5.0 tap-target** (migrate เดี่ยว = tap 40→28px regression + active สีต่าง `bg-foreground/10`≠`bg-primary/15` + ทับ KIT-05 lift)
2. **2.4 ที่เหลือ** (`KIT-07`/`DISCOVERY-04`/`HOME-05`) — `SearchResultRow` กลาง + ให้ command-search/hero-search ใช้ `useCardSearch` แทน fetch ซ้ำ + keyboard-nav — ⏸️ **core interaction ต้อง browser** (card-search ใช้ useCardSearch+SearchResultsDropdown อยู่แล้ว = reference)
3. **2.5 ที่เหลือ** — `IDENTITY-01/10` auth kit · `CONTENT-02` guide kit (6 หน้า, public → curl verify ได้) · `SETS-04`/`DISCOVERY-10` · `HONEY-03/07` · `ADMIN-02/06` AdminDataTable 8 หน้า · `COMMERCE-02/04/05/06`
4. **2.6** `KIT-09` จัดโฟลเดอร์ 3 ชั้น (ui/shared/feature) — mechanical move · `IDENTITY-11` แยก settings · `KIT-04/06`
- แล้ว **Phase 3** token sweep · **4** states · **5** mobile ราย surface (เบสเลือกหน้า) · 6-7

## ⚠️ ค้าง/ข้อควรรู้
- **dev log error เก่าค้าง** (`PriceDisplay`·`home/sections/*`) = stale จาก session ก่อน ไม่ใช่ bug (`rm -rf .next`+restart ถ้าเจอ)
- scout เชียร์ bump tap →44px หลายจุด = **Phase 5.0 ไม่ใช่ 2.x** (2.x = ยุบของซ้ำ คงหน้าตาเดิม)
- **อย่า migrate `Delta`/`DirectionPill` เข้า PriceTag** · `lastSale`/`lowestAsk` (grades.ts) จงใจเก็บ
- branch merged ที่ยังไม่ลบ: `feat/phase2.2-sparkline-hero` · `feat/phase2.3-control-atoms` · `feat/phase2.4-search-recent` (+ เก่า #59-#63) — ลบได้ถ้าอยาก

## กฎเหล็ก
- **ห้าม push master ตรง** — branch + PR + merge เท่านั้น
- migrate atom = คงหน้าตาเดิมเป๊ะเมื่อ browser ดูไม่ได้ (ยกเว้นที่ finding สั่งเปลี่ยนสี) · verify ด้วยตาถ้า browser พร้อม · adversarial review workflow ก่อน PR
- เช็ค `AGENTS.md` §Component Kit canon ก่อนสร้าง component ใหม่

## แหล่งอ้างอิง
- **แผนแม่บท:** `doc/uxui-refactor-plan.md` (8 phases) · **หลักฐาน:** `doc/uxui-audit-findings-2026-07-04.md` (230 findings) · **kit canon:** `AGENTS.md` §Component Kit
