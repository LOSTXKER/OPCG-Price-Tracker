# 📍 PROGRESS — สถานะสด
> **เขียนทับทุกครั้ง ไม่สะสม log** · hook โหลดไฟล์นี้ทุก session · อ่านอันนี้ก่อน แล้วทำต่อจาก NEXT

อัปเดตล่าสุด: 2026-07-06 — **#69–#74 merged เข้า master ครบ (search·guide·auth·sets·honey)** · **2.5 ADMIN-06 `useAdminForm` เสร็จ รอเปิด PR** (branch `feat/phase2.5-admin-form`, base master) · verify: **tsc0 · lint0err · test56/56 · build✓** + adversarial review 7 ฟอร์ม+hook = **0 reachable behavior change**

## 🔜 เสร็จ รอเปิด PR — Phase 2.5 ADMIN-06 `useAdminForm` (branch `feat/phase2.5-admin-form`)
สร้าง **`src/lib/admin/use-admin-form.ts`** — hook เดียวสำหรับฟอร์ม create/edit แบบหน้าเต็มใน `/admin/**` (คนละตัวกับ `useAdminCrud` ที่เป็น inline list-editor). Owns: form state + `setForm` (API เดียวกับ useState — field onChange เดิมไม่ต้องแก้) · `dirty` (JSON.stringify snapshot) · `error` · `saving` (useTransition) · `handleSubmit` (preventDefault→validate(f,isEdit)→adminFetch(POST·PATCH·PUT)→toast→router.push+refresh; catch→setError+toast.error) · `submitFromBar` (ยุบ getElementById→requestSubmit hack) · `saveBarActive` (=dirty||!isEdit). Per-form ต่างกันส่งผ่าน `validate`/`toBody(f,isEdit)`/endpoints/methods/successMessage/redirectTo/errorToast.
- **migrate 7 ฟอร์ม**: `achievement`(reference ทำเอง) · `blog`(ทำเอง — raw fetch→adminFetch, `errorToast:false` เก็บ showPreview/slugify local) · `shop-item` · `event`(create-vs-edit body ต่างกัน undefined/null+id/isActive — preserved เป๊ะ) · `bonus` · `schedule` · `template` (5 ตัวหลัง delegate workflow ขนาน + review)
- **defer/bespoke (ไม่ยุบ)**: `raffle`(572 บรรทัด nested prize array + cloneFrom — เสี่ยง, follow-up) · `rank-tiers-editor`(array editor คนละ archetype) · `card-editor`+`card-edit-form`(manual state/parent-controlled)
- **AdminSaveBar API ไม่แตะ** (submitFromBar ใช้ requestSubmit เดิม กัน array-editor ที่ใช้ custom onSave พัง) — audit เสนอ `<Button form={formId}>` แต่เลือกไม่ทำ (แตะ consumer อื่น)
- verify: tsc0 · lint0err · test56 · build✓ + **adversarial review workflow** (7 ฟอร์ม + hook, 8 agents) → 6 ฟอร์ม+hook **clean** · blog 1 MED = error-fallback ต่างเฉพาะ branch ที่ route คืนไม่มีทาง (blog routes = adminApiHandler คืน `{error}` เสมอ → reachable behavior เหมือนเดิมเป๊ะ) · finding อื่นทั้งหมด isBehaviorChange=false (initial?.id บน edit-only path · snapshot dirty · document guard · double JSON.parse)
- ⚠️ **login-gated ยัง eyeball ไม่ได้** — เบส spot-check ได้ที่: `/admin/blog/new` · `/admin/honey/{achievements,shop,events,missions/bonus,missions/schedule,missions/templates}/new` (สร้าง+แก้ → save → redirect/toast/error/dirty-bar)

## ✅ เข้า master แล้ว (#69–#74)
- **#69** 2.4 search engine เดียว (`useSearchKeyboardNav`+`SearchResultRow`+`useCardSearch`)
- **#70** 2.5 guide kit (`components/guide/*` ×4 + CONTENT-07/08)
- **#72** 2.5 auth kit (`components/auth/*` ×5 + `lib/auth/password-rules.ts` + IDENTITY-10 a11y)
- **#73** 2.5 SETS-04 `SetPosterTile`
- **#74** 2.5 HONEY-03 streak single source (`lib/honey/streak.ts`, แก้ bug เลข 10/20/30→5/10/15)

## ⚠️ เบสต้อง eyeball / ตัดสิน (ค้างจากรอบก่อน)
- **admin forms (ใหม่)**: login-gated — ดู list ด้านบน
- **guide buying** 2 จุด: callout "วิธีอ่านราคา" heading amber ในกล่องฟ้า · ปุ่มย้อน "Sets" ยังอังกฤษ · **CONTENT-09** ลดสี callout รุ้ง→โทนเดียว (เบสไม่เลือกรอบก่อน)
- **atom เก่า #65/#66/#67**: ดาว amber · view toggle · stepper (ยังไม่มีใคร eyeball)
- **auth kit**: /login redirect ใน dev (auth bypass) → eyeball บน preview/prod

## ⏭️ NEXT — Phase 2.5/2.6 ที่เหลือ
1. **2.5 ที่เหลือ**: `ADMIN-02` migrate ~6 raw-`<table>` list เข้า `AdminDataTable` (มีแล้ว adopt cards/logs/users — ต้องคัด list ที่ fit vs bespoke matching/inline-edit ก่อน) · `ADMIN-06` raffle follow-up (nested prize array) · `COMMERCE-02/04/05/06` (หลัง flag) · `CONTENT-03` guide perf (แยก PR) · `DISCOVERY-10` (redesign แยก, ต้อง sign-off)
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
