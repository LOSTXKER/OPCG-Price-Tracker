# 📍 PROGRESS — สถานะสด
> **เขียนทับทุกครั้ง ไม่สะสม log** · hook โหลดไฟล์นี้ทุก session · อ่านอันนี้ก่อน แล้วทำต่อจาก NEXT

อัปเดตล่าสุด: 2026-07-05 — **2 PR รอ merge (แตกจาก master, รอเบสดู preview): #65 = Phase 2.2 (sparkline+hero) · #66 = Phase 2.3 (control atoms — 4 ตัวเสร็จ, 3 เลื่อนรอ browser) · Browser ไม่พร้อม session นี้ → เบส eyeball preview**

## 🔀 ลำดับ merge (2 branch แตกจาก master เดียวกัน)
1. merge **#65** (`feat/phase2.2-sparkline-hero`) ก่อน
2. merge **#66** (`feat/phase2.3-control-atoms`) ทีหลัง → conflict **trivial** ที่ `AGENTS.md` (คนละ row) · `PROGRESS.md` (เอาเวอร์ชันนี้) · `doc/uxui-refactor-plan.md` (คนละบรรทัด) — resolve เอาของทั้งสอง

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

## ⏭️ NEXT — Phase 2.3 เหลือ **จุดเดียว** (⏸️ EditionToggle — ทำคู่ Phase 5 + KIT-05)
- **`EditionToggle`** (`card-detail/edition-toggle.tsx`) → SegmentedControl (KIT-10 ที่เหลือ) — **ยังไม่ยุบ เพราะ:** migrate = **tap target หด 40→28px = regression จริง** + active `bg-foreground/10`≠`bg-primary/15` (เปลี่ยนสี) + ทับ **KIT-05 lift** (ยกขึ้น kit) → คุ้มกว่าทำทีเดียวกับ **Phase 5.0 tap-target** (ที่จะเพิ่ม size ≥44px ให้ SegmentedControl) + KIT-05
- **2.3 ถือว่าจบสาระสำคัญแล้ว** (7 atom · เหลือ EditionToggle จุดเดียวที่ผูกกับ phase อื่น)
- แล้วต่อ **2.4** search engine เดียว · **2.5** flow copy-paste · **2.6** โฟลเดอร์ 3 ชั้น
- **จุดเช็คอินเบส:** จบ 2.2+2.3 = เบสดู atom ใหม่บนหน้าจริง (plan §4) — **ถึงจุดนี้แล้ว**

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
