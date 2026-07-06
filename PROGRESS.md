# 📍 PROGRESS — สถานะสด
> **เขียนทับทุกครั้ง ไม่สะสม log** · hook โหลดไฟล์นี้ทุก session · อ่านอันนี้ก่อน แล้วทำต่อจาก NEXT

อัปเดตล่าสุด: 2026-07-06 — **Phase 2 (kit dedup + จัดบ้าน) เสร็จครบ · #69–#81 merged เข้า master ทั้งหมด** · master เขียว: **tsc0 · lint0 · test56/56 · build✓** · **NEXT = Phase 3 (token discipline)** หรือเก็บ 2.5 ที่ค้าง (commerce หลัง flag / redesign ต้อง sign-off)

## ✅ Phase 2.5–2.6 เข้า master แล้ว (#69–#81)
**2.4–2.5 kit/dedup:**
- **#69** search engine เดียว (`useSearchKeyboardNav`+`SearchResultRow`+`useCardSearch`) · **#70** guide kit (`components/guide/*` ×4) · **#72** auth kit (`components/auth/*` ×5 + `lib/auth/password-rules`) · **#73** SETS-04 `SetPosterTile` · **#74** HONEY-03 streak single source (`lib/honey/streak.ts`)
- **#75** ADMIN-06 `lib/admin/use-admin-form.ts` (ยุบ 7 create/edit form: achievement·blog·shop·event·bonus·schedule·template)
- **#76** ADMIN-02 5 admin list → `AdminDataTable` (bonus/schedule/templates/preview/shop · +mobile fallback ฟรี)

**2.6 จัดบ้าน:**
- **#77** IDENTITY-11 ย้าย 13 ไฟล์ settings (`section-*`+`account-*`) → `components/settings/`
- **#78** KIT-04 rename local `ListRow`→`WatchlistRow` + scope docstring + แก้ dead ref `card-table`→`admin-data-table` (AGENTS.md)
- **#79** HONEY-05 แตก `honey-sidebar`(494บ.)→`honey-status-bar`+`stat-card`+`rank-progress`+`guide-contents` (verbatim, review 100% faithful)
- **#80** KIT-06 size prop → `sm|md|lg` (6 comp "default"→"md" + data-attr avatar/select · zero caller churn)
- **#81** KIT-09 ย้าย `compare-button`→`compare/`, `notification-bell`→`layout/` (shared 42→40)

## ⚠️ ต้องเบสตัดสิน/ทำต่อ
- **`streak-tier-indicator` = orphan (0 importer = dead code)** — เจอตอน KIT-09 · **ขออนุญาตลบ** (permission: ลบไฟล์ต้องถามก่อน) — ไม่ได้ย้ายเพราะไม่ย้ายของตาย
- **eyeball ค้าง (login-gated ฉันดูไม่ได้)**: **#76** admin lists มือถือ (`/admin/honey/{shop,missions/bonus,missions/schedule,missions/templates,missions/preview}` — desktop เหมือนเดิม + มือถือได้ list fallback) · **#75** admin forms (`/admin/blog/new` · `/admin/honey/*/new` — save/redirect/toast/dirty-bar)
- **guide buying** 2 จุด: callout heading amber ในกล่องฟ้า · ปุ่มย้อน "Sets" ยังอังกฤษ · **CONTENT-09** ลดสี callout รุ้ง→โทนเดียว (เบสไม่เลือกรอบก่อน)
- **atom เก่า #65/#66/#67**: ดาว amber · view toggle · stepper · **auth kit**: /login redirect ใน dev → eyeball preview/prod

## ⏭️ NEXT
1. **Phase 3 — token discipline sweep** (mechanical, เห็นผลเป็น "แอปเดียวกันทั้งระบบ"): `TOKENS-03` hairline token เดียว · `TOKENS-02` elevation adoption · `TOKENS-01/06` Pro hex→token + radius มาตรฐาน · `TOKENS-05` motion backlog · `TOKENS-04` `--chrome-h` sticky · วินัยเขียว/แดง (`KIT-01`/`CHROME-08`/`DISCOVERY-06`/`TRACK-11`) · `TOKENS-07` status ดิบ 660 จุด ทีละ feature · `ADMIN-03/05` admin palette (ดู `doc/uxui-refactor-plan.md` §Phase 3)
2. **2.5 ที่ค้าง (ไม่เร่ง)**: `ADMIN-02` follow-up (blog/page แตก client comp · honey-transaction infinite-scroll) · `ADMIN-06` raffle (nested prize array) · `COMMERCE-02/04/05/06` (หลัง flag) · `CONTENT-03` guide perf (แยก PR) · `DISCOVERY-10` (redesign แยก, ต้อง sign-off)
3. **EditionToggle → SegmentedControl** ⏸️ คู่ Phase 5.0 tap · แล้ว **Phase 4** states · **5** mobile ราย surface (เบสเลือกหน้า) · 6–7

## ⚠️ ค้าง/ข้อควรรู้
- `useAdminForm` ≠ `useAdminCrud` (inline list-editor) — คนละ archetype · admin hooks ไม่อยู่ AGENTS.md kit table
- **ARIA combobox บน search** = เลื่อน Phase 5.0 · **debounce command/hero = 0ms** จงใจคง behavior · **อย่า migrate `Delta`/`DirectionPill` เข้า PriceTag** · `lastSale`/`lowestAsk` (grades.ts) จงใจเก็บ
- KIT-09 = partial (ย้ายที่ชัด+ปลอดภัย) · upgrade-*/rank-icon/watchlist-star = cross-feature เก็บใน shared (documented ใน refactor-plan)
- branch merged เก่ายังไม่ลบเยอะ (`feat/phase2.*`) — ล้างได้ถ้าเบสต้องการ

## กฎเหล็ก
- **ห้าม push master ตรง** — branch + PR + merge เท่านั้น (self-merge เฉพาะเมื่อเบสสั่ง "merge" ชัดเจน)
- migrate atom/logic = คงพฤติกรรมเดิมเป๊ะ (ยกเว้น finding/เบสสั่งเปลี่ยน) · verify ด้วยตา (browser) เมื่อไม่ login-gated · adversarial review workflow ก่อน PR
- เช็ค `AGENTS.md` §Component Kit canon ก่อนสร้าง component ใหม่

## แหล่งอ้างอิง
- **แผนแม่บท:** `doc/uxui-refactor-plan.md` (8 phases) · **หลักฐาน:** `doc/uxui-audit-findings-2026-07-04.md` (230 findings) · **kit canon:** `AGENTS.md` §Component Kit
