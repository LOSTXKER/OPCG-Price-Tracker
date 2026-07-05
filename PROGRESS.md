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
**6 atom เสร็จ (verify: tsc0/lint0/test56/build✓ + review workflow 4 ชุด adversarial verify 0 confirmed defect):**
- **`ui/switch.tsx`** (SETTINGS-09) — ยุบ toggle เขียนมือ 2 ตัว · hit ≥44px แต่แรก · +ariaLabel
- **`ui/icon-button.tsx`** (PORTFOLIO-06) — ghost/solid, ยุบ local 2 ไฟล์ + inline 1
- **`ui/rating-stars.tsx`** (COMMERCE-13) — ยุบดาว 6 จุด (4 สี→**amber เดียว**) · **เปลี่ยนสีจริง = ตั้งใจ**
- **`shared/saved-pill.tsx`** (SETTINGS-10) — ยุบ feedback pill 5 จุด (คงสี emerald/red)
- **`portfolio/portfolio-name-form.tsx`** (RESPONSIVE-04) — ยุบฟอร์มชื่อพอร์ต inline 4 จุด (sm/md, +aria-label)
- **`ui/qty-stepper.tsx`** (PLAY-07) — ยุบ stepper **2/3**: drop-calc + add-card (deck ⏸️ เลื่อน)
- ⚠️ **เบส eyeball preview #66** (browser ไม่พร้อม + settings/portfolio login-gated curl ไม่ได้):
  - **privacy toggle** โต h-5→h-6 + off-สีเบจอ่อนกว่า (ยุบเป็น Switch เดียว, ตั้งใจ)
  - **ดาวเรตติ้งทุกที่เป็น amber** (marketplace · seller · profile) — เดิม 4 สี · ดาวว่าง 2 จุด (review-section/seller/reviews) เทาทึบ→outline จาง `/20` (แก้ที่ `rating-stars.tsx` ที่เดียวได้ทั้ง 6 ถ้าจางไป)
  - **drop-calculator stepper** เปลี่ยนเล็กน้อย (border-border→hairline, ตัด active:scale, icon size-4→3.5, +focus ring) — ยุบเป็น QtyStepper เดียว · add-card stepper ~เหมือนเดิม
  - notifications toggle · icon button · saved pill · name form ควร**เหมือนเดิม**

## ⏭️ NEXT — Phase 2.3 เหลือ 2 จุด (⏸️ เลื่อน — ต้อง browser verify)
> **เหตุผล: ทั้ง 2 เปลี่ยน layout/แก้ canonical ที่ verify ตาไม่ได้ตอน browser ล่ม** (6 ตัวที่ทำแล้ว = byte-identical / แค่สี / ปลอดภัย)
1. **`QtyStepper` deck** (PLAY-07 เหลือ 1/3) — `deck-calculator-client.tsx:389` ปุ่ม**ติดกัน** (joined, rounded-l/r ใน border เดียว) + display span + **behavior พิเศษ: Minus ที่ qty 1 → 0 = ลบการ์ด** + dense row → migrate = เสี่ยง reflow + ต้องยืนยัน behavior · atom `QtyStepper` มี `showInput={false}` รองรับแล้ว แต่ deck ต้อง joined variant + min=0-remove logic → ทำตอน browser
2. **`KIT-10`** ยุบ pill → SegmentedControl — **verify แล้วไม่ byte-identical**: ViewToggle (`toolbar.tsx:221`, container p-0.5 vs p-1, button p-1.5 vs h-7 · ฝังใน FilterToolbar canonical) · EditionToggle (`card-detail/edition-toggle.tsx`, active `bg-foreground/10`≠`bg-primary/15` ต้อง variant ใหม่บน canonical · คู่กับ KIT-05 lift) · GameFilterChips = canonical แล้ว · FilterTabs = SKIP · **แก้ canonical SegmentedControl (ใช้ 16 ที่) = ต้องดูตา**
- แล้วต่อ **2.4** search engine เดียว · **2.5** flow copy-paste · **2.6** โฟลเดอร์ 3 ชั้น
- **จุดเช็คอินเบส:** จบ 2.2+2.3 = เบสดู atom ใหม่บนหน้าจริง (plan §4) — **เกือบจบ 2.3 (เหลือ 2 จุด browser)**

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
