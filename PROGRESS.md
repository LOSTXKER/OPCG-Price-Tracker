# 📍 PROGRESS — สถานะสด
> **เขียนทับทุกครั้ง ไม่สะสม log** · hook โหลดไฟล์นี้ทุก session · อ่านอันนี้ก่อน แล้วทำต่อจาก NEXT

อัปเดตล่าสุด: 2026-07-05 — **Phase 2.2 ปิดจบ (KIT-08 sparkline + KIT-05 hero) บน branch `feat/phase2.2-sparkline-hero` (เปิด PR แล้ว รอ merge) · ต่อที่ Phase 2.3 control atoms**

## ✅ เสร็จรอบนี้ (branch `feat/phase2.2-sparkline-hero` — ยังไม่ merge)
- **KIT-08** — รวม sparkline 2 ตัว → เหลือ **`ui/mini-sparkline.tsx`** ตัวเดียว
  - `MiniSparkline` ใหม่: gradient เป็น prop `fill?` (default **line-only**) · ใส่ `width/height` SVG attr คงที่ (pixel-stable) · `aria-hidden` · token `--color-price-up/down`
  - migrate 5 จุด: trending · home/mobile-card-item · market/market-table-row · portfolio/assets-table/desktop-row (เดิม `<Sparkline>`) + watchlist (ใช้ `MiniSparkline` อยู่แล้ว)
  - **watchlist เปลี่ยนเป็น line-only** ให้ตรงกับ market/portfolio (= แก้ตรงที่ finding บ่นว่า "หน้าตาต่างโดยไม่มีเหตุผล") · **ลบ `shared/sparkline.tsx`**
- **KIT-05 (บางส่วน)** — card-detail hero `<span text-display>` ดิบ → **`HeroNumber`** ตัวเดียวกับ portfolio (count-up ตอน mount/สลับเกรด · `live={activeIndex != null}` ให้ mirror ค่าเป๊ะตอน scrub กราฟไม่กระตุก · null-guard คงแสดง "—")

## ⚠️ ตัดสินใจเลื่อน (จดเหตุผล กันเข้าใจผิดว่าลืม)
- **ยัง ไม่ ยก `edition-toggle`/`source-logo`/`grades.ts` จาก card-detail ขึ้น kit** (KIT-05 ครึ่งหลัง) — เพราะ (1) ทั้ง 3 ยังถูกใช้แค่ใน feature `cards` ตัวเดียว **ไม่มี consumer ข้าม feature** (marketplace/comps ยังไม่สร้าง) → ย้ายตอนนี้ = churn เปล่า + เสี่ยงฟรี (2) `grades.ts` เป็น **domain logic** ควรไป `lib/cards/` ไม่ใช่ `ui/` (3) `edition-toggle` ทับ **KIT-10** (recompose จาก `SegmentedControl`) → ทำทีเดียวใน 2.3 ดีกว่า double-move · **ยกจริงเมื่อมี consumer ข้าม feature — `SourceLogo` เป็นตัวแรกที่ควรยก**

## ✅ verify รอบนี้
- tsc **0** · lint **0 err** (32 warning เดิม, ไม่มีในไฟล์ที่แก้) · test **56/56** · build **✓** (route ครบ, /trending ยัง static)
- card hero SSR render `26,880 ฿` ใน markup `HeroNumber` ถูกเป๊ะ · fresh curl card/home/trending = 200 ทั้งหมด **0 error ใหม่**
- **review workflow 4 มิติ + adversarial verify** → **0 confirmed code defect** (เหลือแต่ doc-sync ที่ทำครบแล้ว + 1 latent nit gradient-id ที่ dormant/safe → ใส่ comment เตือนไว้)
- ⚠️ **ยังไม่ได้ eyeball sparkline สดด้วย browser** — **Chrome extension ไม่ได้เชื่อมต่อ session นี้** (เหมือนหลาย session ก่อน) · `MiniSparkline` เป็น superset ของ `Sparkline` เดิม + review ยืนยันแล้ว แต่ **เบสควรเปิดดูจริง**: sparkline ใน market/portfolio/watchlist (เส้น trend เขียว/แดง line-only) + card hero count-up ตอนโหลด + ลากกราฟแล้วเลขบนวิ่งตาม

## ⏭️ NEXT — Phase 2.3 Control atoms (ตาม doc/uxui-refactor-plan.md §2.3)
1. **`ui/switch.tsx`** (SETTINGS-09) — toggle เขียนมือใน settings ×2 → atom เดียว (hit ≥44px แต่แรก)
2. **`QtyStepper`** (PLAY-07, ≥44px) — drop-calc + deck-calc ใช้ร่วม (VISION §5.4 ระบุเป็น atom)
3. **`IconButton`** (PORTFOLIO-06) — ตอนนี้ประกาศซ้ำ 2 ไฟล์ + inline 1 · **`RatingStars`** honey ตัวเดียว (COMMERCE-13, ตอนนี้ 3 ตัว 3 สี)
4. **`KIT-10`** ยุบ pill "เลือก 1 จาก N" 5 จุด → `SegmentedControl` เดียว + **ยก `EditionToggle` ขึ้น kit ให้ประกอบจาก SegmentedControl** (ทำคู่กับ KIT-05 ที่เลื่อนไว้)
5. `RESPONSIVE-04` ฟอร์ม inline ชื่อพอร์ต ก๊อป 4 ชุด/3 ไฟล์ → ตัวเดียว
- แล้วต่อ **2.4** search engine เดียว · **2.5** flow copy-paste · **2.6** จัดโฟลเดอร์ 3 ชั้น
- **จุดเช็คอินเบส:** จบ 2.2+2.3 = เบสดู atom ใหม่บนหน้าจริง (plan §4)

## ⚠️ ค้าง/ข้อควรรู้ (สำคัญสำหรับ session หน้า)
- **dev log มี error เก่าค้าง** (`PriceDisplay` ReferenceError · `home/sections/honey-preview|portfolio-preview|preview-row` module-not-found) = **stale residue จาก session ก่อน Phase 1/2.2 ลบไฟล์** — ยืนยันแล้วว่าไม่ใช่ bug ปัจจุบัน (grep src ไม่มี ref จริง · fresh curl 200 0 error) · ถ้าเจออีกให้ `rm -rf .next` แล้ว restart
- **อย่า migrate `Delta`/`DirectionPill` เข้า PriceTag** (คนละ role — จดใน AGENTS.md ⛔ table)
- `lastSale`/`lowestAsk` (grades.ts) = จงใจเก็บ (earmark stat) — อย่าลบ
- branch merged เก่ายังไม่ลบ (#59-#63) — ลบได้ถ้าอยาก (บอกก่อน)

## กฎเหล็ก session นี้ (ยึดต่อ)
- **ห้าม push master ตรง** — branch + PR + merge เท่านั้น (⛔ AGENTS.md)
- migrate atom = **verify ด้วยตา** (โดยเฉพาะราคา) ไม่ใช่แค่ tsc ผ่าน · เช็ค AGENTS.md canon ก่อนสร้าง component ใหม่
- deviate จากแผน = จดเหตุผลใน PROGRESS/PR (เช่นการเลื่อน KIT-05 ครึ่งหลังรอบนี้)

## แหล่งอ้างอิง
- **แผนแม่บท:** `doc/uxui-refactor-plan.md` (8 phases) · **หลักฐาน:** `doc/uxui-audit-findings-2026-07-04.md` (230 findings) · **kit canon:** `AGENTS.md` §Component Kit
