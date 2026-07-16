# 📍 PROGRESS — สถานะสด
> **เขียนทับทุกครั้ง ไม่สะสม log** · hook โหลดไฟล์นี้ทุก session · อ่านอันนี้ก่อน แล้วทำต่อจาก NEXT

อัปเดตล่าสุด: 2026-07-17 — **Audit ทั้งเว็บรอบสอง + รื้อ Portfolio/Watchlist เสร็จ รอเบส eyeball บน preview** (branch `feat/portfolio-watchlist-teardown`)

## ✅ Audit UX/UI รอบสอง (2026-07-16)

- ตรวจทั้งเว็บด้วย workflow 22 ทีม (14 กลุ่มหน้า + 8 มิติ cross-cutting) ได้ **319 ข้อ** → รายงานเต็ม: **[doc/uxui-audit-findings-2026-07-16.md](doc/uxui-audit-findings-2026-07-16.md)** (บทสรุป 6 เรื่องใหญ่ + ลำดับแนะนำอยู่หัวไฟล์)
- รอบ adversarial verify โดน session limit ตัดกลางคัน — verify แล้ว 21 ข้อ (จริง 19 · ตกไป 2) ข้อที่เหลือต้องเช็คโค้ดก่อนลงมือเสมอ
- ธีมใหญ่สุด: ทองสองเฉด (amber ดิบ ~80 จุดแข่งกับ honey) · delta แสดงคนละแบบ 3 หน้า market · trending เขียนตารางเอง · ชิป facet ใน FilterModal ซ้ำ 5 หน้า · card-detail มีปัญหาความซื่อสัตย์ข้อมูล 2 ข้อ (กราฟ mock + % ประดิษฐ์) — **อันนี้ควรทำก่อนเพื่อน**

## ✅ รื้อ Portfolio + Watchlist (branch `feat/portfolio-watchlist-teardown`)

- **Portfolio detail = หน้าเดียว ไม่มีแท็บแล้ว** ตาม VISION §5.3: hero (เลขใหญ่ scrub-bound) → กราฟลาก → KPI 4 ช่อง (component ใหม่ `portfolio-kpis.tsx`) → มูฟเวอร์ → ชิปเกม → สินทรัพย์ → แยกตามเกม → สัดส่วน · จอ ≥lg เป็น 2 คอลัมน์ (main + rail 320px) ด้วย display:contents + order กันของ mount ซ้ำ (ยกเว้น movers ตั้งใจ mount 2 มุมมอง) · skeleton + mock preview ตามโครงใหม่ · `PortfolioHeroPanel` เลิกใช้แต่ยังไม่ลบไฟล์ (รอเบสอนุมัติ)
- **Watchlist toolbar เข้า grammar หน้าแรก**: มือถือ = แถว SetPicker เด่น → แถวช่วงเวลา+ค้นหา(ยุบ)+กรอง+มุมมอง+แก้ไข → แถวเรียง · desktop = แถวเดียว · ตาราง ≥sm โชว์ 24H/7D/30D (30D ที่ xl) กดหัวคอลัมน์เรียงได้ · ป้ายปักหมุด/กระดิ่งย้ายจากบนรูปมาไว้ข้างรหัสการ์ด
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
