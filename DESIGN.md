# DESIGN — Meecard (ฉบับบาง · มาตรฐาน 2026-09-10)
> ฉบับเต็มเดิม อยู่ใน git: `git show a0400db:DESIGN.md` · กติกา: ≤4KB · คำห้าม ≤8 · กฎ visual = ผลลัพธ์จากหน้าลองที่เจ้าของเคาะ ไม่ใช่ input ล่วงหน้า
## ตัวตนบน UI
- ราคาอ้างอิงการ์ด OPTCG ของนักสะสมไทย อ่านเหมือน trading dashboard นิ่งๆ (CoinGecko/CMC/Collectr)
- espresso อุ่น + honey-gold · dark ค่าเริ่มต้น · Kanit · ตัวเลข mono tabular
- การ์ด = พระเอก (chrome จืด) · hero number ตัวเดียวต่อจอ · โครงจาก whitespace + hairline
- honey ให้ CTA หลัก · เขียว/แดง+▲▼ = กำไร/ขาดทุน · ค่าประมาณติด est · MONEY นิ่ง PLAY สปริง · หมี+น้ำผึ้งที่ empty/escrow
## ground truth ของ token และ component (ชี้ไฟล์ ไม่ลอกค่า)
- token ทุกชั้น + `.text-*`: `src/app/globals.css` · ฟอนต์: `src/app/layout.tsx` · ธีม: `src/providers/theme-provider.tsx`
- component กลาง `src/components/ui/`: price-tag · hero-number · list-row · surface · segmented-control · skeleton
- `src/components/shared/empty-state.tsx` · `src/components/cards/card-detail/`: edition-toggle · grades.ts · card-chart
- `src/components/ads/ad-inventory-slot.tsx` · หน้าลอง `src/app/proto/<slug>/` (kit `_kit/use-proto-variant.ts` + `_kit/proto-compare.tsx` วางเทียบข้างกัน)
## ตอนนี้ใช้อะไร (ทบทวนได้ · เปลี่ยนได้เมื่อเจ้าของเคาะใหม่)
(ที่มา: PLAN.md)
- desktop navbar D2 สองแถว 104px แทน 132px (เบสเคาะ 2026-08-29 · ปัดทิศ search-first 2026-08-28)
- หน้าแรกมือถือแบบ A + แถบล่าง "กลาง 5" (ค้นหานูนกลาง) แทนแท็บรายการโปรด (เบสเลือกจาก /proto/mobile-home 2026-08-29 · ลบแล้ว)
- navbar มือถือ 2 แถว "ขัดเงา" (เบสเลือกจาก /proto/mobile-navbar 2026-08-29 · ลบแล้ว)
- จอสแกนการ์ดเต็มจอแบบ B "กริดเทค" แทน dialog เล็ก (เบสเคาะจาก /proto/photo-scan 2026-08-29)
- canvas หน้าปกติ 1400px แทน 1280px (owner direction 2026-08-28)
- มือถือใช้โครง iOS grouped-list, desktop คงเดิม (เบสสั่งจาก /proto/ios 2026-07-03) · ปุ่มย้อนมือถือ = วงกลมไอคอน (เบสเคาะ 2026-07-03)
## บทเรียนเทคนิค (วัดได้ ไม่ใช่รสนิยม)
- ทุก delta มี ▲/▼ คู่สี (grayscale อ่านได้) · ตัวเลขเงิน tabular-nums ไม่ขยับความกว้างตอน tick
- พอร์ต: ซื้อการ์ดเพิ่มแล้วเส้นมูลค่ากระโดดเป็นกำไรปลอม → P/L = marketValue − netInvested
- motion 2 คลัง (hardcode `duration-200 ease-out` กับ token `--dur-*`/`--ease-*`) = drift → ใช้ token
- ค่าจริงกับค่าประมาณแยกช่องตั้งแต่ API · กราฟ <2 จุด = แจ้ง "ข้อมูลไม่พอ"
- prefers-reduced-motion ปิด animation · tap ≥44px · ตาราง→list ใต้ sm
