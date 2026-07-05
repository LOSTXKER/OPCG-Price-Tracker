# 📍 PROGRESS — สถานะสด
> **เขียนทับทุกครั้ง ไม่สะสม log** · hook โหลดไฟล์นี้ทุก session · อ่านอันนี้ก่อน แล้วทำต่อจาก NEXT

อัปเดตล่าสุด: 2026-07-05 — **3 PR รอ merge (stacked): #65 Phase 2.2 · #66 Phase 2.3 · #67 Phase 2.4+2.5 (useRecentSearches + useAlertSubmit) · Browser ไม่พร้อมทั้ง session → เบส eyeball preview · ⚠️ stack 3 ชั้น — ควร merge #65+#66 แล้วให้ฉัน rebase #67**

## 🔀 ลำดับ merge (stacked — merge ตามลำดับ)
1. **#65** (`feat/phase2.2-sparkline-hero`, base master)
2. **#66** (`feat/phase2.3-control-atoms`, base master) — conflict trivial ที่ `AGENTS.md`/`PROGRESS.md`/`doc/uxui-refactor-plan.md` (เอาของทั้งสอง)
3. **#67** (`feat/phase2.4-search-recent`, **base = branch 2.3** ไม่ใช่ master) — merge หลัง #66 · ถ้า retarget เป็น master จะเห็น 2.3+2.4 → **base ไว้ที่ branch 2.3 จะเห็นแค่ diff 2.4** · หลัง #66 เข้า master แล้ว retarget #67 → master ได้เลย (ไม่มี conflict code, เหลือแค่ docs superset)
> **แนะนำ: merge #65+#66 ก่อนแล้วบอกฉัน rebase #67 → master** จะสะอาดสุด (stack 3 ชั้นเริ่มยุ่ง)

## ✅ PR #65 — Phase 2.2 (รอ merge)
- KIT-08 รวม sparkline → `ui/mini-sparkline.tsx` เดียว (`fill?`, line-only, ลบ `shared/sparkline.tsx`) · KIT-05(บางส่วน) card-detail hero → `HeroNumber`
- verify: tsc0/lint0/test56/build✓ + review 4 มิติ 0 defect

## ✅ PR #66 — Phase 2.3 control atoms (รอ merge · branch `feat/phase2.3-control-atoms`)
**7 atom + 8 การยุบ เสร็จ (verify: tsc0/lint0/test56/build✓ + review workflow 5 ชุด adversarial verify 0 confirmed defect):**
- **`ui/switch.tsx`** (SETTINGS-09) — ยุบ toggle เขียนมือ 2 ตัว · hit ≥44px · +ariaLabel
- **`ui/icon-button.tsx`** (PORTFOLIO-06) — ghost/solid, ยุบ local 2 + inline 1
- **`ui/rating-stars.tsx`** (COMMERCE-13) — ยุบดาว 6 จุด (4 สี→**amber เดียว**) · **เปลี่ยนสีตั้งใจ**
- **`shared/saved-pill.tsx`** (SETTINGS-10) — ยุบ feedback pill 5 จุด (คงสี emerald/red)
- **`portfolio/portfolio-name-form.tsx`** (RESPONSIVE-04) — ยุบฟอร์มชื่อพอร์ต 4 จุด (sm/md, +aria-label)
- **`ui/qty-stepper.tsx`** (PLAY-07) — ยุบ stepper **ครบ 3/3** (drop+add=split · **deck=joined variant + min=0 เก็บ behavior Minus→ลบการ์ด**)
- **KIT-10 ViewToggle → SegmentedControl** — ลบ `ViewToggle` ทิ้ง, migrate home-market + filter-toolbar (icon = `label` slot · blast radius contained)
- ⚠️ **เบส eyeball preview #66** (browser ไม่พร้อม + login-gated curl ไม่ได้):
  - **privacy toggle** โต h-5→h-6 + off เบจอ่อนกว่า (ยุบเป็น Switch เดียว)
  - **ดาวเรตติ้ง = amber ทั้งเว็บ** (เดิม 4 สี) · ดาวว่าง 2 จุด เทาทึบ→outline จาง `/20`
  - **drop-calc stepper** เปลี่ยนเล็กน้อย (border/active/icon) · **deck stepper** ยุบเป็น QtyStepper (ทรง joined เดิม — ยืนยัน Minus ยังลบการ์ดได้)
  - **market view toggle (grid/table)** = SegmentedControl แล้ว (ปุ่มขนาดต่างจาก ViewToggle เดิมนิดหน่อย h-7 vs p-1.5)
  - notifications toggle · icon button · saved pill · name form · add-card stepper ควร**เหมือนเดิม**

## ✅ PR #67 — Phase 2.4+2.5 hook extraction (รอ merge · branch `feat/phase2.4-search-recent` base 2.3)
> 2 hook dedup บน branch เดียว (ทั้งคู่ = แยก shared hook, ยุบ 3 ไฟล์)
**KIT-07 — `hooks/use-recent-searches.ts`**
- hook กลาง recent-search (localStorage + push/remove/clear/refresh) · dedup case-insensitive · read on mount + `refresh()` สำหรับ modal
- migrate 3 ไฟล์: `card-search` · `command-search` (Cmd-K, `refresh()` ตอนเปิด) · `hero-search-bar`
- **เหลือ (เลื่อน browser):** SearchResultRow + command/hero ใช้ useCardSearch แทน fetch ซ้ำ + keyboard-nav

**TRACK-04 (HIGH) — `hooks/use-alert-submit.ts`**
- hook เดียว owns submit alert (validate + convert JPY + 401 redirect + 403 upgrade + error)
- migrate 3 dialog: `card-set-alert-dialog` · `alert-create-dialog` · `alert-edit-dialog` ผ่าน `submit({target, request, onSuccess, onGated})`
- **คงพฤติกรรมต่าง dialog** (card-set=เช็ค+prefill+1300ms · create/edit=ปิดทันที) — unify success behavior (drift, VISION §106 prefill) = งาน UX แยก ทำตอน browser
- verify: tsc0/lint0/test56/build✓ + review workflow ×2 (recent + alert) adversarial verify
- ⚠️ **เบส eyeball**: recent ยังทำงาน (พิมพ์→enter→เห็น·Cmd-K เปิดใหม่เห็น·hero ลบ/ล้าง) · **alert สร้าง/แก้/set-alert ทำงาน + จับ limit (403→upgrade) + login (401)**

## ⏭️ NEXT — Phase 2 ที่เหลือ
- **`EditionToggle`** (KIT-10 ที่เหลือ) — ⏸️ ทำคู่ **Phase 5.0 tap-target** + **KIT-05 lift** (migrate เดี่ยว = tap 40→28px regression + เปลี่ยนสี active)
- **2.4 ที่เหลือ** (SearchResultRow + useCardSearch ใน command/hero + keyboard-nav) — ⏸️ browser (core interaction)
- **2.5** flow copy-paste (auth kit · guide kit · useAlertSubmit · AdminDataTable 8 หน้า · commerce dedup) · **2.6** โฟลเดอร์ 3 ชั้น (KIT-09 mechanical)
- **จุดเช็คอินเบส:** จบ 2.2+2.3 = เบสดู atom ใหม่บนหน้าจริง (plan §4) — **ถึงแล้ว + เริ่ม 2.4**

## ⚠️ ค้าง/ข้อควรรู้
- **dev log error เก่าค้าง** (`PriceDisplay`·`home/sections/*`) = stale จาก session ก่อน ไม่ใช่ bug ปัจจุบัน (`rm -rf .next`+restart ถ้าเจอ)
- scout เชียร์ bump tap →44px หลายจุด แต่ **= Phase 5.0 ไม่ใช่ 2.3** (2.3 = ยุบของซ้ำ คงหน้าตาเดิม)
- **อย่า migrate `Delta`/`DirectionPill` เข้า PriceTag** · `lastSale`/`lowestAsk` (grades.ts) จงใจเก็บ

## กฎเหล็ก session นี้
- **ห้าม push master ตรง** — branch + PR + merge เท่านั้น
- migrate atom = คงหน้าตาเดิมเป๊ะเมื่อ browser ดูไม่ได้ (ยกเว้นที่ finding สั่งเปลี่ยนสี เช่น RatingStars) · deviate = จดเหตุผล
- เช็ค AGENTS.md canon ก่อนสร้าง component ใหม่

## แหล่งอ้างอิง
- **แผนแม่บท:** `doc/uxui-refactor-plan.md` · **หลักฐาน:** `doc/uxui-audit-findings-2026-07-04.md` · **kit canon:** `AGENTS.md` §Component Kit
