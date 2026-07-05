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
**4 atom เสร็จ (verify: tsc0/lint0/test56/build✓ + review workflow 3 ชุด 0 confirmed defect):**
- **`ui/switch.tsx`** (SETTINGS-09) — ยุบ toggle เขียนมือ 2 ตัว · hit ≥44px แต่แรก (invisible expander) · +ariaLabel
- **`ui/icon-button.tsx`** (PORTFOLIO-06) — ghost/solid, ยุบ local 2 ไฟล์ + inline 1
- **`ui/rating-stars.tsx`** (COMMERCE-13) — ยุบดาว 6 จุด (4 สี→**amber เดียว**) · **เปลี่ยนสีจริง = ตั้งใจ**
- **`shared/saved-pill.tsx`** (SETTINGS-10) — ยุบ feedback pill 5 จุด (คงสี emerald/red, presentational)
- ⚠️ **เบส eyeball preview #66** (browser ไม่พร้อม + settings/portfolio login-gated curl ไม่ได้):
  - **privacy toggle** โต h-5→h-6 + off-สีเบจอ่อนกว่า (ยุบเป็น Switch เดียว, ตั้งใจ)
  - **ดาวเรตติ้งทุกที่เป็น amber** (marketplace listing/review · seller dashboard · profile seller card/reviews · section-marketplace) — เดิม 4 สี ตอนนี้ทองเดียว · ดาวว่างที่ review-section + seller/reviews เปลี่ยนจากเทาทึบ → outline จาง (`/20`) ให้ตรงกับอีก 4 จุด (ถ้าจางไปแก้ที่ `rating-stars.tsx` ที่เดียวได้ทั้ง 6)
  - notifications toggle · icon button · saved pill ควร**เหมือนเดิม**

## ⏭️ NEXT — Phase 2.3 ที่เลื่อน (3 ตัว — ต้อง browser verify · scout map ครบใน transcript)
> **เหตุผลเลื่อน: ทั้ง 3 เปลี่ยน layout/สี ที่ verify ตาไม่ได้ตอน browser ล่ม** (ต่างจาก 4 ตัวที่ทำ = byte-identical หรือแค่สี)
1. **`QtyStepper`** (PLAY-07) — 3 จุด **layout ต่างกันจริง**: deck-calc (ปุ่มติดกัน+display span, ไม่มี input, max=4) · drop-calc/purchase-config (ปุ่มแยก+input h-9 w-16, 1-99) · add-card-detail-step (ปุ่ม size-10+input h-10 w-20, 1-∞) → ยุบ = เปลี่ยน layout 3 บริบทรวม deck rows หนาแน่น
2. **`KIT-10`** ยุบ pill → SegmentedControl — **verify แล้วไม่ byte-identical**: ViewToggle (`toolbar.tsx:221`, container p-0.5 vs p-1, button p-1.5 vs h-7 · ฝังใน FilterToolbar canonical, ใช้ home-market-overview+filter-toolbar) · EditionToggle (`card-detail/edition-toggle.tsx`, active `bg-foreground/10`≠`bg-primary/15` ต้อง variant ใหม่ + คู่กับ KIT-05 ที่เลื่อน) · **GameFilterChips = canonical แล้ว ไม่ใช่ target** · **FilterTabs = SKIP (คนละ pattern)**
3. **`RESPONSIVE-04`** ฟอร์ม inline ชื่อพอร์ต 4 จุด (portfolio-selector ×2, portfolio-hub-card, portfolio-client CreatePortfolioCard) → byte-identical ได้ (2 size variant: selector px-2/size-3.5 · hub/client px-2.5/size-4) แต่ login-gated verify ไม่ได้ + i18n aria-label — **bundle กับ Phase 5 portfolio mobile pass** (แตะไฟล์เดียวกัน)
- แล้วต่อ **2.4** search engine เดียว · **2.5** flow copy-paste · **2.6** โฟลเดอร์ 3 ชั้น
- **จุดเช็คอินเบส:** จบ 2.2+2.3 = เบสดู atom ใหม่บนหน้าจริง (plan §4) — ตอนนี้ถึงจุดนี้แล้ว

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
