# 📍 PROGRESS — สถานะสด
> **เขียนทับทุกครั้ง ไม่สะสม log** · hook โหลดไฟล์นี้ทุก session · อ่านอันนี้ก่อน แล้วทำต่อจาก NEXT

อัปเดตล่าสุด: 2026-07-17 — **รื้อ /watchlist ใหม่ทั้งหน้ารอบที่ 2 (ground-up ตาม spec ที่ชนะ panel 3 designer/3 judge) เสร็จ รอเบส eyeball บน preview** (branch `feat/portfolio-watchlist-teardown`, PR #116) — **แทนที่คำอธิบาย toolbar/table เดิมด้านล่างที่ล้าสมัยแล้ว**

## 🆕 Watchlist ground-up rewrite รอบ 2 (2026-07-17 — เพิ่มเติมจากรอบก่อนหน้า)

หน้าตาใหม่ (บน→ล่าง หลัง PageHeader+tabs เดิม): **Row 3** แถวควบคุมบาง (มือถือ = ช่วงเวลา + ไอคอนค้นหา/กรอง/แก้ไข ไม่มีมุมมองกริด/dropdown เรียงแล้ว · desktop = ข้อความ pulse "ติดตาม N ใบ · ▲up · ▼down" + ค้นหา/กรอง/แก้ไข ไม่มี period pill) → **Row 4 ใหม่** shelf "ขยับแรงวันนี้" (การ์ด 6 ใบที่ขยับแรงสุดวันนี้ ≥1%, ซ่อนถ้าการ์ด <4 ใบ/ไม่มีตัวขยับ/edit mode) → **Row 5+** list ใหม่ (มือถือ = แถวใหญ่ขึ้นสไตล์ Apple Stocks พร้อม long-press เปิดเมนู action แทน ⋯ · desktop = ราคาซ้อน 2 บรรทัด ฿/¥ + hover เผยไอคอน pin/bell/ลบแทน dropdown เดิม, ทั้งแถวคลิกไปหน้าการ์ดได้)

**ตัด:** มุมมองกริด (`WatchlistGridView` ยังไม่ลบไฟล์ รออนุมัติ — ใส่ comment orphaned แล้ว) · sort dropdown (ย้ายไปหัวคอลัมน์/หัว list มือถือ) · เมนู ⋯ ทั้งมือถือ/desktop

**ไฟล์หลักที่แก้/สร้าง:** `watchlist-toolbar.tsx` (rewrite), `watchlist-list-view.tsx` (rewrite), `watchlist-client.tsx` (wiring), `watchlist-mover-shelf.tsx` (ใหม่), `use-long-press.ts` (ใหม่), `watchlist-row-actions.tsx` (rewrite เป็น long-press action dialog), `watchlist-summary.tsx` (+ `WatchlistPulseText`), `watchlist-sort.ts` (+ `selectWatchlistMovers` pure fn), `watchlist-types.ts` (+ price-stack helpers), `watchlist-skeleton.tsx`/`watchlist-mock-preview.tsx` (mirror โครงใหม่), i18n +1 key (`watchlistTracking`, reuse `todaysMovers`/`cardUnit` ที่มีอยู่)

**ข้อควรรู้ก่อน merge:**
- ยังไม่ได้เปิดดูจริงในเบราว์เซอร์ (มีแต่ curl smoke test 200 + skeleton SSR ผ่าน) — **ต้อง eyeball มือถือ 375px + desktop 1280/1440px จริงก่อน merge**
- ข้าม "hover art-peek" ของตาราง desktop (ดูรูปเต็มตอน hover thumbnail) — เสี่ยง clip ใน table container, spec บอกให้ข้ามได้ถ้าเสี่ยง
- Verify: tsc 0 · eslint 0 error (30 warning เดิมไม่เกี่ยว) · vitest 284/284 (ไม่ได้รัน `npm run build`)

## 🔒 การตัดสินใจจากเบส (2026-07-17 — อย่าสวน)

## 🔒 การตัดสินใจจากเบส (2026-07-17 — อย่าสวน)

- **Portfolio เก็บ 2 แท็บ (ภาพรวม/ข้อมูลเชิงลึก) แบบเดิม** — เบส veto การยุบเป็นหน้าเดียวแบบ Robinhood ที่ทำไปรอบแรก (สวน VISION §5.3 โดยเจตนาเจ้าของ) → revert composition กลับแล้ว คงไว้แต่การแก้จุดเล็กในตาราง/dialog · **ห้ามรื้อเป็นหน้าเดียวซ้ำ**
- **Watchlist toolbar ต้อง "เฉพาะที่จำเป็น"** — เบสบอกของเยอะไป → ตัดเหลือ: ค้นหา(ยุบ) · ตัวกรอง · มุมมอง · แก้ไข + จำนวน · ชุดการ์ดย้ายเข้า popup ตัวกรอง · ปุ่มช่วงเวลา/เรียงบน desktop โชว์เฉพาะมุมมองกริด
- **ตารางทุกหน้าเรียงที่หัวคอลัมน์ ไม่ใช่ dropdown** (เบสสั่ง 2026-07-17) → `SortableHeader` = canonical ประกาศใน AGENTS.md แล้ว · ทำแล้ว: watchlist (ชื่อ/ราคา/24H/7D/30D) + ตารางพอร์ต (ราคา/24h/กำไรขาดทุน/มูลค่า) · home/search มีอยู่แล้ว · dropdown เรียงเหลือเฉพาะมือถือ/มุมมองกริด · แถว watchlist โปร่งขึ้น (ตัดป้าย rarity, เพิ่ม padding)

## ✅ Audit UX/UI รอบสอง (2026-07-16)

- ตรวจทั้งเว็บด้วย workflow 22 ทีม (14 กลุ่มหน้า + 8 มิติ cross-cutting) ได้ **319 ข้อ** → รายงานเต็ม: **[doc/uxui-audit-findings-2026-07-16.md](doc/uxui-audit-findings-2026-07-16.md)** (บทสรุป 6 เรื่องใหญ่ + ลำดับแนะนำอยู่หัวไฟล์)
- รอบ adversarial verify โดน session limit ตัดกลางคัน — verify แล้ว 21 ข้อ (จริง 19 · ตกไป 2) ข้อที่เหลือต้องเช็คโค้ดก่อนลงมือเสมอ
- ธีมใหญ่สุด: ทองสองเฉด (amber ดิบ ~80 จุดแข่งกับ honey) · delta แสดงคนละแบบ 3 หน้า market · trending เขียนตารางเอง · ชิป facet ใน FilterModal ซ้ำ 5 หน้า · card-detail มีปัญหาความซื่อสัตย์ข้อมูล 2 ข้อ (กราฟ mock + % ประดิษฐ์) — **อันนี้ควรทำก่อนเพื่อน**

## ✅ รื้อ Watchlist + เก็บงาน Portfolio (branch `feat/portfolio-watchlist-teardown`)

- **Portfolio detail = โครง 2 แท็บเดิม** (revert รอบแรกตามคำสั่งเบส — ดูกล่องการตัดสินใจข้างบน) · ที่คงไว้: PriceTag มีลูกศรในตาราง, Switch กลางใน dialog, ปุ่มลบมองเห็นบนมือถือ, thead เลิก sticky, ลิงก์มูฟเวอร์ไม่เป็น "#" แล้ว
- **Watchlist toolbar โฉมใหม่ (ผ่านปรับรอบสองตาม feedback)**: มือถือ = แถวช่วงเวลา + ไอคอนค้นหา/กรอง/มุมมอง/แก้ไข → แถวเรียง → จำนวน · desktop = แถวเดียว 5 ปุ่ม · **ชุดการ์ดอยู่ใน popup ตัวกรอง** (หัวข้อแรก, SetPicker ทำงานใน modal ได้ปกติ — ทดสอบแล้ว) · ตาราง ≥sm โชว์ 24H/7D/30D (30D ที่ xl) กดหัวคอลัมน์เรียงได้ · ป้ายปักหมุด/กระดิ่งย้ายจากบนรูปมาไว้ข้างรหัสการ์ด
- **เก็บตามผล audit 12 จุดในคอมมิตเดียวกัน**: PriceTag ทุก delta ในตารางพอร์ต · Switch กลาง 2 dialog · ปุ่มลบ bulk-edit มองเห็นบนมือถือ · หัวตารางเลิก sticky มุดใต้ header · ลิงก์มูฟเวอร์ "#" · ปุ่มฟอร์ม alert ≥44px · truncate ชื่อการ์ดแถว alert · EmptyState แท็บแจ้งเตือน · Bookmark=รายการที่บันทึก/หัวใจ=รายการโปรด · กวาดชื่อเป็น "รายการโปรด" ชื่อเดียว 3 ภาษา · copy "กดดาว"→"กดรูปหัวใจ"
- **Verify ครบ**: tsc 0 · eslint 0 error · vitest 273/273 · build ผ่าน · เปิดดูจริงมือถือ 375px + desktop 1280/1440px ทั้งสองหน้า

## ⚠️ รอเบสตัดสินใจ / eyeball

1. **เปิด preview ดู 2 หน้า**: `/portfolio` (มือถือ: ลำดับ hero→กราฟ→สถิติ→มูฟเวอร์→การ์ด · desktop: 2 คอลัมน์) และ `/watchlist` (แถวชุดเด่น · ตาราง 24H/7D/30D · กดหัวคอลัมน์เรียง)
2. **ชื่อทางการของ watchlist** — กวาดทุกคำเป็น "รายการโปรด" (ตามที่ nav ใช้อยู่) · ถ้าเบสชอบ "รายการจับตา" มากกว่า บอกได้ กวาดกลับไฟล์เดียวจบ
3. **อนุมัติลบซากโค้ด** — ชุด portfolio manager/hub เดิม ~1,020 บรรทัด + orphan รอบใหม่ 14 ไฟล์ (~940 บรรทัด, ดู x-duplication ในรายงาน) — ยังไม่ลบตามกฎ

## NEXT

1. เบส eyeball 2 หน้าบน preview → merge PR `feat/portfolio-watchlist-teardown`
2. เริ่มตามลำดับแนะนำในรายงาน: **card-detail ความซื่อสัตย์ข้อมูล 2 ข้อ** (กราฟ mock + % ประดิษฐ์) → กวาดทองสองเฉด → trending เข้า MarketTable
3. งานเดิมใน [doc/uxui-refactor-plan.md](doc/uxui-refactor-plan.md) ยังเดินตาม phase เดิม (audit รอบนี้ = ข้อมูลเสริม ไม่ทับแผน · ข้อที่ชี้ portfolio/watchlist อาจ obsolete แล้ว)
