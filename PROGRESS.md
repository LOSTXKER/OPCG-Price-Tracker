# 📍 PROGRESS — สถานะสด
> **เขียนทับทุกครั้ง ไม่สะสม log** · hook โหลดไฟล์นี้ทุก session · อ่านอันนี้ก่อน แล้วทำต่อจาก NEXT

อัปเดตล่าสุด: 2026-07-06 — **#69–#75 merged เข้า master ครบ (search·guide·auth·sets·honey·ADMIN-06)** · **2.5 ADMIN-02 migrate 5 admin list → `AdminDataTable` เสร็จ รอเปิด PR** (branch `feat/phase2.5-admin-table`, base master) · verify: **tsc0 · lint0err · test56/56 · build✓** + adversarial review 5 ตาราง = **0 finding**

## 🔜 เสร็จ รอเปิด PR — Phase 2.5 ADMIN-02 migrate 5 list → `AdminDataTable` (branch `feat/phase2.5-admin-table`)
ยุบ raw `<table>` 5 หน้า list เข้า `AdminDataTable` (canonical มีอยู่แล้ว adopt cards/logs/users) → ได้ built-in mobile list fallback ฟรีทั้ง 5 (ก่อนหน้าไม่มี = RESPONSIVE-03 win) + chrome สม่ำเสมอ (ADMIN-01):
- **migrate 5**: `bonus-list`(reference ทำเอง) · `schedule-list` · `templates-list` · `preview-client`(precompute `_index`) · `honey-shop-manager` (4 ตัวหลัง delegate workflow ขนาน + review)
- **faithful**: copy cell render content/class เป๊ะ (badge/tabular-nums/สี/thumbnail/∞/—/date) · header align ผ่าน `headerClassName` (cn=tailwind-merge override base text-left) · cell align ผ่าน `className` · คง `AdminEmptyState`/error conditional เดิม (swap แค่ branch table ที่มีข้อมูล) · คง handler ครบ (toggle/delete confirmDialog/crud.remove loading/copy-clone) · schedule status = static icon เดิม (ไม่มี toggle) ไม่ยัด handler
- **intended visible change** (ต้อง eyeball): +mobile fallback · Surface wrapper · row hover `bg-muted/30` (เดิม /70) · header +muted color
- **defer**: `blog/page`(server comp + มี custom mobile fallback แล้ว → ต้องแตก client comp กัน RSC function-prop, value ต่ำ) · `honey-transaction-list`(infinite Load-More) · `set-row`(inline-edit input) · `yuyutei/snkrdunk-match`(matching UI) · `card-editor`(embedded table)
- verify: tsc0 · lint0err (2 img warning = pre-existing, มีที่ HEAD แล้ว) · test56 · build✓ + **adversarial review 5 ตาราง = 0 finding**
- ⚠️ **login-gated ยัง eyeball ไม่ได้** — เบส spot-check: `/admin/honey/shop` · `/admin/honey/missions/{bonus,schedule,templates,preview}` (desktop table + มือถือ list fallback + toggle/delete/edit)

## ✅ เข้า master แล้ว (#69–#75)
- **#69** 2.4 search engine เดียว (`useSearchKeyboardNav`+`SearchResultRow`+`useCardSearch`)
- **#70** 2.5 guide kit (`components/guide/*` ×4 + CONTENT-07/08)
- **#72** 2.5 auth kit (`components/auth/*` ×5 + `lib/auth/password-rules.ts` + IDENTITY-10 a11y)
- **#73** 2.5 SETS-04 `SetPosterTile`
- **#74** 2.5 HONEY-03 streak single source (`lib/honey/streak.ts`, แก้ bug เลข 10/20/30→5/10/15)
- **#75** 2.5 ADMIN-06 `useAdminForm` (`lib/admin/use-admin-form.ts` + ยุบ 7 ฟอร์ม create/edit — achievement·blog·shop·event·bonus·schedule·template)

## ⚠️ เบสต้อง eyeball / ตัดสิน (ค้างจากรอบก่อน)
- **admin forms (ใหม่)**: login-gated — ดู list ด้านบน
- **guide buying** 2 จุด: callout "วิธีอ่านราคา" heading amber ในกล่องฟ้า · ปุ่มย้อน "Sets" ยังอังกฤษ · **CONTENT-09** ลดสี callout รุ้ง→โทนเดียว (เบสไม่เลือกรอบก่อน)
- **atom เก่า #65/#66/#67**: ดาว amber · view toggle · stepper (ยังไม่มีใคร eyeball)
- **auth kit**: /login redirect ใน dev (auth bypass) → eyeball บน preview/prod

## ⏭️ NEXT — Phase 2.5/2.6 ที่เหลือ
1. **2.5 ที่เหลือ**: `ADMIN-02` follow-up (blog/page แตก client comp เข้า AdminDataTable · honey-transaction-list infinite-scroll) · `ADMIN-06` raffle follow-up (nested prize array) · `COMMERCE-02/04/05/06` (หลัง flag) · `CONTENT-03` guide perf (แยก PR) · `DISCOVERY-10` (redesign แยก, ต้อง sign-off)
2. **2.6**: `KIT-09` จัดโฟลเดอร์ 3 ชั้น · `IDENTITY-11` แยก 12 ไฟล์ settings → components/settings · `KIT-04/06`+`HONEY-05`
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
