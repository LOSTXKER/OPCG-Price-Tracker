# 📍 PROGRESS — สถานะสด
> **เขียนทับทุกครั้ง ไม่สะสม log** · hook โหลดไฟล์นี้ทุก session · อ่านอันนี้ก่อน แล้วทำต่อจาก NEXT

อัปเดตล่าสุด: 2026-07-06 — **#69–#78 merged เข้า master ครบ (…·ADMIN-06·ADMIN-02·IDENTITY-11·KIT-04)** · **2.6 HONEY-05 เสร็จ รอเปิด PR** (branch `feat/phase2.6-honey-05`, base master) · verify: **tsc0 · lint0 · test56/56 · build✓**

## 🔜 เสร็จ รอเปิด PR — Phase 2.6 HONEY-05 (แตก honey-sidebar → honey-status-bar + 3 ไฟล์) (branch `feat/phase2.6-honey-05`)
finding: `honey-sidebar.tsx` 494 บรรทัด แต่ export `HoneyStatusBar` (ชื่อไฟล์หลอก = sidebar แต่จริงเป็น status bar บน) รวม stat card + guide content + rank progress ในไฟล์เดียว. แตก behavior-preserving (audit spec):
- rename `honey-sidebar.tsx` → **`honey-status-bar.tsx`** (shell: `streakDayText`·`StatusProps`·`useStatusData`·`HoneyStatusBar`)
- แตก **`stat-card.tsx`** (`HoneyStatCard`+`HoneyCardDetail`+POPOVER classes) · **`rank-progress.tsx`** (`RankProgress`) · **`guide-contents.tsx`** (`TicketGuideContent`+`StreakGuideContent`+`dayLabel`)
- update import ใน `honey-client.tsx` · โค้ดย้ายแบบ verbatim ไม่แก้ logic/JSX
- verify: tsc0 · lint0 · test56 · build✓ + review split fidelity

## ✅ เข้า master แล้ว (#69–#78)
- **#69** 2.4 search engine · **#70** 2.5 guide kit · **#72** 2.5 auth kit · **#73** 2.5 SETS-04 · **#74** 2.5 HONEY-03 streak
- **#75** 2.5 ADMIN-06 `useAdminForm` (+ยุบ 7 ฟอร์ม) · **#76** 2.5 ADMIN-02 5 admin list → `AdminDataTable` (⚠️ login-gated eyeball: `/admin/honey/{shop,missions/*}`)
- **#77** 2.6 IDENTITY-11 แยก 13 ไฟล์ → `components/settings/` · **#78** 2.6 KIT-04 ListRow name-clash + dead refs + PROGRESS sync

## ⚠️ เบสต้อง eyeball / ตัดสิน (ค้างจากรอบก่อน)
- **admin forms (ใหม่)**: login-gated — ดู list ด้านบน
- **guide buying** 2 จุด: callout "วิธีอ่านราคา" heading amber ในกล่องฟ้า · ปุ่มย้อน "Sets" ยังอังกฤษ · **CONTENT-09** ลดสี callout รุ้ง→โทนเดียว (เบสไม่เลือกรอบก่อน)
- **atom เก่า #65/#66/#67**: ดาว amber · view toggle · stepper (ยังไม่มีใคร eyeball)
- **auth kit**: /login redirect ใน dev (auth bypass) → eyeball บน preview/prod

## ⏭️ NEXT — Phase 2.5/2.6 ที่เหลือ
1. **2.5 ที่เหลือ**: `ADMIN-02` follow-up (blog/page แตก client comp เข้า AdminDataTable · honey-transaction-list infinite-scroll) · `ADMIN-06` raffle follow-up (nested prize array) · `COMMERCE-02/04/05/06` (หลัง flag) · `CONTENT-03` guide perf (แยก PR) · `DISCOVERY-10` (redesign แยก, ต้อง sign-off)
2. **2.6 (กำลังทำต่อรวดเดียว session นี้)**: `KIT-06` มาตรฐาน size prop sm|md|lg (+deprecation alias) · `KIT-09` จัดโฟลเดอร์ 3 ชั้น (feature-bound → feature folder; upgrade-* 16 importers = cross-feature เก็บใน shared)
3. **EditionToggle → SegmentedControl** — ⏸️ คู่ Phase 5.0 tap
- แล้ว **Phase 3** token · **4** states · **5** mobile ราย surface (เบสเลือกหน้า) · 6–7

## ⚠️ ค้าง/ข้อควรรู้
- `useAdminForm` ≠ `useAdminCrud` (inline list-editor) — คนละ archetype · admin hooks ไม่อยู่ใน AGENTS.md kit table (เป็น UI-facing) → ไม่ต้องเพิ่ม
- **ARIA combobox บน search** = เลื่อน Phase 5.0 · **debounce command/hero = 0ms** จงใจคง behavior เดิม
- **อย่า migrate `Delta`/`DirectionPill` เข้า PriceTag** · `lastSale`/`lowestAsk` (grades.ts) จงใจเก็บ
- branch merged เก่ายังไม่ลบ: `feat/phase2.2-*`·`2.3-*`·`2.4-*`·`2.5-{guide,auth,sets,honey}`

## กฎเหล็ก
- **ห้าม push master ตรง** — branch + PR + merge เท่านั้น
- migrate atom/logic = คงพฤติกรรมเดิมเป๊ะ (ยกเว้น finding/เบสสั่งเปลี่ยน) · verify ด้วยตา (browser) เมื่อไม่ login-gated · adversarial review workflow ก่อน PR
- เช็ค `AGENTS.md` §Component Kit canon ก่อนสร้าง component ใหม่

## แหล่งอ้างอิง
- **แผนแม่บท:** `doc/uxui-refactor-plan.md` (8 phases) · **หลักฐาน:** `doc/uxui-audit-findings-2026-07-04.md` (230 findings) · **kit canon:** `AGENTS.md` §Component Kit
