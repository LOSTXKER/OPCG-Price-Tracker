# 📍 PROGRESS — สถานะสด
> **เขียนทับทุกครั้ง ไม่สะสม log** · hook โหลดไฟล์นี้ทุก session · อ่านอันนี้ก่อน แล้วทำต่อจาก NEXT

อัปเดตล่าสุด: 2026-07-05 — **มี 2 PR รอ merge (ทั้งคู่แตกจาก master, รอเบสดู preview): #65 = Phase 2.2 (sparkline+hero) · #NEW = Phase 2.3 part 1 (Switch+IconButton) · Browser ไม่พร้อม session นี้ → เบสต้อง eyeball preview**

## 🔀 ลำดับ merge (สำคัญ — 2 branch แตกจาก master เดียวกัน)
1. merge **#65** (`feat/phase2.2-sparkline-hero`) ก่อน
2. merge **#NEW** (`feat/phase2.3-control-atoms`) ทีหลัง → จะมี conflict **trivial** ที่ `AGENTS.md` (คนละ row ในตาราง kit) · `PROGRESS.md` (overwrite — เอาเวอร์ชันนี้) · `doc/uxui-refactor-plan.md` (คนละบรรทัด checkbox) — resolve ง่าย เอาของทั้งสอง

## ✅ PR #65 — Phase 2.2 (sparkline + hero) — รอ merge
- **KIT-08** รวม sparkline → `ui/mini-sparkline.tsx` ตัวเดียว (`fill?` prop, line-only default, migrate 5 จุด, ลบ `shared/sparkline.tsx`, watchlist→line-only)
- **KIT-05 (บางส่วน)** card-detail hero → `HeroNumber` (count-up + `live` ตอน scrub + null-guard)
- verify: tsc0/lint0/test56/build✓ + card hero SSR ถูก + review workflow 4 มิติ 0 defect

## ✅ PR #NEW — Phase 2.3 part 1 (Switch + IconButton) — รอ merge (branch `feat/phase2.3-control-atoms`)
- **`ui/switch.tsx`** (SETTINGS-09) — Switch atom (checked/onCheckedChange/disabled/ariaLabel) · ทรง h-6 w-11 + thumb size-5 + `motion-base` (canonical motion + reduced-motion) · **tap target ≥44px แต่แรก** ด้วย invisible expander (`-inset-y-2.5`) · ยุบ toggle เขียนมือ 2 ตัว (section-notifications + account-privacy-section) · เพิ่ม `ariaLabel` (เดิมสวิตช์ไม่มีชื่อให้ screen-reader)
- **`ui/icon-button.tsx`** (PORTFOLIO-06) — IconButton atom (children icon, บังคับ `aria-label`, size sm/md/lg, variant ghost/solid, title default=aria-label) · ยุบ local IconButton 2 ไฟล์ + inline 1 (portfolio-client ghost · portfolio-detail-client solid ×2 + inline Globe/Lock)
- verify: tsc0/lint0/test56/build✓ + review workflow 3 มิติ + adversarial verify **0 confirmed defect**
- ⚠️ **เบสต้อง eyeball preview** (browser ไม่พร้อม, หน้า login-gated curl ไม่ได้):
  - **privacy toggle เปลี่ยนมากกว่าขนาด** — นอกจากโตจาก h-5 w-9 → h-6 w-11 แล้ว off-track เปลี่ยน `bg-input`→`bg-muted` (เบจอ่อนกว่านิด) + thumb ได้ ring บางๆ = **ผลพลอยได้ของการยุบเป็น Switch เดียว** (ยอมรับได้/ตั้งใจให้ตรงกับ notifications toggle) แต่บอกไว้ให้ดู
  - notifications toggles + portfolio icon buttons ควร**เหมือนเดิมเป๊ะ** (byte-identical migration) ยกเว้น ghost icon button ได้ focus-ring offset เพิ่ม (เห็นตอน keyboard-focus เท่านั้น)

## ⏭️ NEXT — Phase 2.3 ที่เหลือ (scout map ครบแล้ว → session หน้าทำเร็ว · ที่เลื่อนเพราะเปลี่ยนสี/ต้อง browser)
> scout workflow 6 agent map ของจริงครบแล้ว (ไฟล์:บรรทัด+props อยู่ใน transcript · ถ้าหายรัน scout ซ้ำได้)
1. **`QtyStepper`** (PLAY-07) — 3 จุด: `deck-calculator-client.tsx:389` (1–4, ไม่มี input) · `drop-calculator/purchase-config.tsx:63` (1–99, มี input) · `portfolio/add-card-detail-step.tsx:101` (1–∞, มี input) · props value/onChange/min/max/showInput/size · **medium risk** (tap 36-40→44 อาจ reflow)
2. **`RatingStars`** (COMMERCE-13) — 6 จุด, **ยุบ 4 สี→amber** (foreground/80·yellow-400·amber-400·primary) → เปลี่ยนสีจริง = **ต้อง browser** · commerce flag ปิด ไม่เร่ง
3. **`SavedPill`** (SETTINGS-10) — 5 จุด feedback pill (section-notifications·account-privacy·alert-row·social-links·cover-image) · presentational, parent คุม timing
4. **`KIT-10`** ยุบ pill → SegmentedControl: **ViewToggle** (`toolbar.tsx:221`, active สีตรงกัน = safe) + **GameFilterChips** (byte-identical, แต่มี ComingSoonSeg Link แยก) = ทำได้ · **EditionToggle** ต้อง variant ใหม่ (active `bg-foreground/10` ≠ SegmentedControl `bg-primary/15` → เปลี่ยนสี, ทำคู่ KIT-05 ที่เลื่อน) · **FilterTabs** = SKIP (คนละ pattern) · ⚠️ ทั้งหมด render ต่างเดิม → ต้อง browser
5. **`PortfolioNameForm`** (RESPONSIVE-04) — 4 จุด inline form (portfolio-selector ×2, portfolio-hub-card, portfolio-client) · ปุ่มปัจจุบันจิ๋ว p-1.5 → เก็บทรงเดิม+เพิ่ม aria หรือ bump (ตัดสินตอน browser)
- แล้วต่อ **2.4** search engine เดียว · **2.5** flow copy-paste · **2.6** โฟลเดอร์ 3 ชั้น
- **จุดเช็คอินเบส:** จบ 2.2+2.3 = เบสดู atom ใหม่บนหน้าจริง (plan §4)

## ⚠️ ค้าง/ข้อควรรู้
- **dev log มี error เก่าค้าง** (`PriceDisplay`·`home/sections/*`) = stale จาก session ก่อน ไม่ใช่ bug ปัจจุบัน (ถ้าเจอ `rm -rf .next` + restart)
- scout เชียร์ให้ bump tap →44px หลายจุด แต่ **นั่นคือ Phase 5.0 ไม่ใช่ 2.3** — 2.3 = ยุบของซ้ำ คงหน้าตาเดิม (ยกเว้นที่เลี่ยงไม่ได้ เช่น RatingStars สี)
- **อย่า migrate `Delta`/`DirectionPill` เข้า PriceTag** · `lastSale`/`lowestAsk` (grades.ts) จงใจเก็บ

## กฎเหล็ก session นี้
- **ห้าม push master ตรง** — branch + PR + merge เท่านั้น
- migrate atom = คงหน้าตาเดิมเป๊ะ (byte-identical) เมื่อ browser ดูไม่ได้ · deviate = จดเหตุผล
- เช็ค AGENTS.md canon ก่อนสร้าง component ใหม่

## แหล่งอ้างอิง
- **แผนแม่บท:** `doc/uxui-refactor-plan.md` · **หลักฐาน:** `doc/uxui-audit-findings-2026-07-04.md` · **kit canon:** `AGENTS.md` §Component Kit
