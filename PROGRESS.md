# 📍 PROGRESS — สถานะสด
> **เขียนทับทุกครั้ง ไม่สะสม log** · อ่านอันนี้ก่อน แล้วทำต่อจาก NEXT

อัปเดตล่าสุด: 2026-08-28 (ดึก) — **Navbar แบบ C ลงของจริงแล้ว: แถบชีพจรแยก + ช่องค้นหาขวาสุดหลัง Honey (ตามเบสเคาะ) รอเบสรีวิวบน preview**

## การตัดสินใจของเบสรอบนี้ (ครบทั้งสาย)

จากคำถาม "มีแนวทางทำ navbar ให้สวย/เหมาะใช้จริงกว่านี้มั้ย" → หน้าเทียบ 2 รอบที่ `/proto/navbar` → เบสเคาะเป็นลำดับ: **แบบ C (แถบชีพจรแยกแบบ CoinMarketCap)** → แล้วเคาะช่องค้นหา **"เอา C2 แต่อยู่ขวาสุดหลัง Honey"** — implement จบในคืนเดียว

## สิ่งที่ลงของจริง (in-place ตามแบบ)

**โครงใหม่ 3 ชั้น (desktop ≥md · รวม 128px):**
1. **แถบชีพจร h-7 (28px)** — `data-slot="ticker-strip"` ใน `header-market-ticker.tsx`: การ์ดทั้งหมด · **ชุดการ์ด 51 (ใหม่** จาก `sets.length`**)** · มูลค่ารวม (ลิงก์ market-overview เดิม) · JPY/THB · ขวาสุด **"อัปเดตล่าสุด 5 เม.ย. 2569" (ใหม่** — วันที่จริงจาก DB**)** — ตัวหนังสือเปล่า label จาง+เลขเข้ม tabular **ไม่มีชิป ไม่มีสีเขียว** (แก้ตามกติกา VISION §1)
2. **แถวโลโก้ h-11 (44px)** — โลโก้ · เกม›ชุด (ตัวเดิม) · อัปเกรด · แชท/กระดิ่ง/แคปซูล — **เส้นแบ่งแนวตั้งถูกตัดออกหมด**
3. **แถวเมนู h-14 (56px)** — เมนู 4 ลิงก์ (**rounded-full** จากเดิม rounded-lg) · พอร์ต/รายการโปรด/Honey · **ช่องค้นหาขวาสุดท้ายแถว** (แคปซูล rounded-full, `w-52 lg:w-80`, kbd "/" เดิม, ⌘K+/ shortcut เดิม)

**ไฟล์ที่แตะ:** `header-market-ticker.tsx` (โครงใหม่ทั้งไฟล์) · `header.tsx` (ลำดับแถวเมนู+radius) · `command-search.tsx` (trigger rounded-xl→full, lg:h-9→h-10) · `globals.css` (**`--chrome-h` md: 6.25rem→8rem**) · `api/cards/route.ts` (+`lastPriceAt` จาก `cardPrice.findFirst` scrapedAt desc — มี index) · `use-header-data.ts` (+`updatedLabels` format 3 locale ตอน fetch เสร็จ ตาม pattern หน้าแรก) · `header-constants.ts` (type) · dict 3 ภาษา (+`lastUpdatedLabel`) · เทสต์ 3 ไฟล์อัปเดต literal โดยคงเจตนา + **เพิ่ม assertion ใหม่**: strip ต้องอยู่, ห้ามชิป/ห้ามเขียวใน ticker, ค้นหาต้องอยู่หลัง Honey · proto/navbar อัปเดตเป็นแบบที่เคาะ

## หลักฐานตรวจรับ

- ESLint **0 errors** ทั้งโปรเจค · tsc ผ่าน · **test 151 ไฟล์/906 ข้อผ่าน** (แก้ mock `cardPrice` ใน route.test) · build ผ่าน · ตัวตรวจดีไซน์ 0 findings
- Browser จริง (วัดจาก DOM + ภาพ): หน้าแรกมืด+สว่างครบ 3 ชั้น · `--chrome-h`=8rem, ความสูงจริง 129px (128+เส้น 1px — overhang เดิมของโครงเก่าอยู่แล้ว) · **sticky ทุกจุดตาม var อัตโนมัติ**: card detail section-nav top=128px, set detail แถบ sticky top=128px ที่ 768 · ไม่มี overflow ที่ 768/1024/1512 · สถานะโปร่งใส→ทึบตอน scroll ทำงาน · **มือถือ 375 ไม่กระทบ** (header 56px, `--chrome-h` 3.5rem เดิม)
- วันที่บนแถบ = ของจริงจาก DB (5 เม.ย. 2569 — ข้อมูล demo หยุดตามที่เบสรับรู้แล้ว) เปลี่ยนตามภาษา TH/EN/JP

## สถานะ git

- branch `feat/navbar-direction-r2` — commit implement + push แล้ว · **ไม่มี** schema/migration/dependency/config change (แตะแค่ API response field เพิ่ม ไม่ break ของเดิม)

## NEXT

1. **เบสรีเฟรช `localhost:3000` ดู navbar จริง** (ทุกหน้า desktop ได้แถบใหม่หมด) — จุดที่ควรกวาดตา: หน้าที่มีแถบ sticky (set detail มือถือ/แท็บเล็ต · card detail · watchlist เลือกหลายใบ · โปรไฟล์สาธารณะ) ว่าระยะเกาะไม่แปลก
2. พอใจแล้วสั่งเปิด PR `feat/navbar-direction-r2` → master ได้เลย
3. คิวเดิมค้าง: กวาด "อัปเดตทุกวัน" ~35 จุด · `getHomeData().rarityRows` query ทิ้งเปล่า · "อัปเดตล่าสุด:" hardcode ไทยที่ trending + most-expensive (ตอนนี้ header มี pattern `updatedLabels` 3 locale ให้ลอกแล้ว)
