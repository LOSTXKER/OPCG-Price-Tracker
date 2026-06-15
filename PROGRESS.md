# 📍 PROGRESS — สถานะสด
> **เขียนทับทุกครั้ง ไม่สะสม log** (รายละเอียดอยู่ใน git history) · hook โหลดไฟล์นี้ทุก session
> session ใหม่: อ่านอันนี้ก่อน แล้วทำต่อจาก NEXT

อัปเดตล่าสุด: 2026-06-15 — **card-detail redesign เป็น 3-col layout + minimal trading chart ขึ้นหน้าจริงแล้ว + commit แล้ว** (branch `redesign/card-detail-pricing-layout`)

## ▶ สถานะตอนนี้ (committed)
- **หน้า `/cards/[code]` = 3 คอลัมน์**: identity เต็มกว้าง → [ซ้าย: รูป+ซื้อขาย+ปุ่ม · กลาง: ราคา+กราฟ overlay+แท็บตลาด · ขวา: พอร์ต+"ขายอยู่บน Meecard"] → ล่างเต็มกว้าง: spec+tier+siblings+related
- **กราฟ (`mini-chart`/`card-chart`, shared):** overlay หลายเกรดบนสเกลเดียว (ghost ladder) · เส้นหยัก deterministic + แกนราคา Y (gridline + ป้าย HTML) + last-price + scrub tooltip · grade selector อยู่บนกราฟ · chips = `GradeLogo` (โลโก้บริษัท แทนคำว่า PSA) + เลขเกรด
- **right rail:** `MeecardAsksRail` (active asks จาก `listings` จริง + empty/notify state) · `CardPortfolioCard` (add-to-portfolio จริง ไม่ปลอม holdings)
- minimal restyle (กราฟ bleed, hairline divider) · แท็บ Comps→ประวัติขายล่าสุด · Gem Rate เด่น · population bar เลิกใช้ gold (เหลือ gold = ปุ่มซื้อจุดเดียว)
- **proto:** card-trade-c (2-col) / card-trade-d (3-col, ตัวที่เลือก) committed เป็น visual reference

## ⚠️ 2 ปัญหาเปิดค้าง (ต้องตัดสินใจ/แก้)
1. **กราฟยังเป็น MOCK** — เส้นทั้งหมดมาจาก `mockGradeSeries` (random-walk ปลอม) ไม่ใช่ราคาจริง. `card.chartData` (ประวัติจริง) ถูกส่งเข้า component แล้วแต่ไม่ได้ใช้
2. **scrape หยุด ~5 เม.ย. 2026** — ข้อมูลล่าสุดในฐานข้อมูลเก่า 2 เดือนกว่า (30 วันล่าสุด = 0 จุดทั้งเว็บ) → ต่อให้ทำกราฟจริง มันจะค้างที่เมษา

## 📊 ผลวัดข้อมูลจริง (read-only, 2026-06-15)
- **Raw แน่นเกือบทุกใบ** (มัธยฐาน 25 จุด/90วัน · 104 จุด/ปี) → เส้น Raw จริงใช้ได้ ✓
- **PSA 10 บางมาก** (446 ใบมี, ส่วนใหญ่ ~2 จุด · มีแค่ ~26 ใบที่ ≥8 จุด) → ส่วนใหญ่วาดเส้นจริงไม่ได้
- **ทั้ง DB มีแค่ 2 เกรด: RAW + PSA 10** (9/8/BGS/RawB/C = ไม่มีข้อมูลจริงเลย → ต้อง modeled+ป้าย "est")

## 📌 กฎ design-system (จาก VISION §1/§4)
- honey-gold = accent interactive เดียว **< 5% จอ** · gain/loss เขียว/แดงแยก
- การ์ดใหญ่ = `.panel` · `surface-*`/`hairline` = chip/control · one hero number/screen · tabular-nums + ▲/▼ ทุก delta

## ▶ NEXT (เลือกทาง)
1. **ฟื้น scrape ก่อน** (ดูทำไม cron หยุด — `vercel.json` มี `/api/cron/scrape-snkrdunk` 0 18 * * *) ให้ข้อมูลสด แล้วค่อยต่อกราฟจริง — *แนะนำ*
2. **ต่อกราฟจริง (Stage 1):** ป้อน `chartData` เข้า `CardChart` + helper `deriveGradeSeries` → Raw/PSA10 วาดจริงตรงที่ข้อมูลพอ, เกรดอื่น = หมุดแบน+"est" (ไม่วาดเส้นปลอม). ⚠️ 120-row cap ใน `card-detail.ts` จำกัดช่วงเป็น ~24 วัน — ต้องแก้ก่อนทำ 1Y/All
3. **โลโก้เกรด:** หย่อนไฟล์ทางการลง `/public/grades/` (psa.png·bgs.png·cgc.png) → `GradeLogo` swap จากตัวอักษรเป็นโลโก้เอง
4. Stage 2 (เก็บ PSA 9/8/BGS — ⚠️ เขียน DB ต้องอนุมัติ) · Stage 3 (Grade enum — เลื่อนไว้)

> รายละเอียดแผน pipeline ราย-เกรด: workflow run ใน session 2026-06-15 (understand→plan→adversarial)
