# 📍 PROGRESS — สถานะสด
> **เขียนทับทุกครั้ง ไม่สะสม log** · อ่านอันนี้ก่อน แล้วทำต่อจาก NEXT

อัปเดตล่าสุด: 2026-08-28 (ค่ำ) — **กวาดคำ "อัปเดตทุกวัน" ที่เหลือทั้งเว็บเสร็จแล้ว (verify ครบ ยังไม่ commit)**

## รอบนี้ทำอะไร (session นี้)

ต่องานคำสั่งเบส "ไล่เก็บคำว่า 'อัปเดตทุกวัน' ที่เหลือ 35 จุดต่อเลย" — เหตุผลเดิม: pipeline scrape ราคาเสีย ~5 เดือนแล้ว เบสตัดสินว่าเว็บตอนนี้เป็น "demo" ยังไม่ซ่อม pipeline ทันที ดังนั้นคำสัญญา "อัปเดตทุกวัน/updated daily/毎日更新" (รวมคำนุ่มๆ อย่าง "เรียลไทม์/real-time") เป็นเท็จ ต้องเอาออกทั้งหมด เหลือแค่ "อัปเดตล่าสุด <วันที่จริง>" ต่อหน้าเป็นสัญญาณความสดที่ซื่อสัตย์

**ไฟล์ที่แก้ (ยังไม่ commit):**
- `src/app/layout.tsx`, `src/app/opengraph-image.tsx` — title/description/OG alt
- `src/app/guide/versions/page.tsx`, `src/app/blog/[slug]/page.tsx`, `src/app/most-expensive/page.tsx` — meta/copy ตรงๆ
- `src/lib/seo/copy/{card,sets,most-expensive,guide,tools,site}.ts` — intro/FAQ/meta ทุกภาษา (บาง FAQ **เปลี่ยนคำถามใหม่** แทนแก้แค่คำตอบ เช่น "อัปเดตบ่อยแค่ไหน" → "มาจากไหน" เพราะคำตอบเดิมสัญญา schedule ไม่ได้แล้ว)
- `src/lib/i18n/{th,en,jp}.ts` — footer disclaimer, login hero, about tagline/features/sources, mkt/guide related-links, ฯลฯ

**ตั้งใจไม่แตะ** (ไม่ใช่คำสัญญา schedule): Honey daily check-in/streak/mission ทั้งหมด · weekly digest · "ราคาขยับได้ทุกวัน"/"Prices move daily" (คำเตือนเรื่องความผันผวน ไม่ใช่สัญญาอัปเดต) · "ราคารายวัน"/"Daily prices" (ป้ายชื่อตาราง price-history หมายถึง granularity รายวัน ไม่ใช่ schedule) · `aboutFeaturePortfolioDesc` "แบบเรียลไทม์" (พูดถึง client คำนวณใหม่ทันทีตอนราคาเปลี่ยน ไม่ใช่ความสดของข้อมูลราคา)

**Verify**: `tsc --noEmit` clean · `eslint src` 0 error (26 warning เดิมเท่าเดิม) · `vitest run` 151 ไฟล์/906 ผ่าน (จำนวนเท่าเดิม ไม่มี test ไหนต้องแก้) · `npm run build` 211/211 หน้า · เปิด dev จริงเช็ค `/` `/about` `/guide` `/opcg/trending` `/opcg/market-overview` `/opcg/sets` `/most-expensive` ทั้ง curl (grep คำต้องห้ามสามภาษา = 0 จุด) และเปิดเบราว์เซอร์จริงดูหน้าแรก+about (เห็น "อัปเดตล่าสุด 5 เมษายน 2569" ของจริงแทน)

**พบเพิ่มระหว่างทาง (ยังไม่แก้ — รอเบสตัดสิน):** `src/lib/seo/json-ld.ts` มีฟิลด์ `priceValidUntil = scrapedAt + 24 ชม.` ใน Product JSON-LD — เพราะ scrape จริงหยุดมาเป็นเดือนแล้ว ฟิลด์นี้จะคำนวณออกมาเป็น**วันที่หมดอายุไปแล้ว**เกือบทุกหน้าการ์ด (Google อาจมองว่าราคาไม่ valid) — เป็นปัญหาคนละชั้นกับ copy (เชิงเทคนิค/SEO ไม่ใช่คำโฆษณา) เลยไม่แตะในรอบนี้ รอเบสสั่งว่าจะทำยังไง (เอาออก / ขยายเป็น 7 วัน / อย่างอื่น)

## ⚠️ งานคู่ขนานใน tree (ไม่ใช่ของ session นี้ — อย่าเหมารวม)

ระหว่างทำมีไฟล์แก้ค้างของอีก session อยู่ด้วย: `src/app/globals.css`, `src/components/home/home-set-strip.tsx`, `src/components/home/set-ticker-motion.ts` (+ test) — ดูเหมือนกำลังต่องาน ticker แถบชุดการ์อหน้าแรก (commit ล่าสุดของสายนั้น: `2fabbab`, `c68df1d`) ให้ session นั้นปิดงานเอง — **ห้าม commit ไฟล์กลุ่มนี้ปนกับงานกวาดคำของ session นี้**

## สถานะ git

- branch `chore/next-16.3` @ `2fabbab` (จากอีก session) + **ของ session นี้ยังไม่ commit** (แก้เฉพาะไฟล์ copy/i18n/seo ตามลิสต์ด้านบน)
- ไม่มี schema / migration / dependency / config change
- รอเบสสั่ง "commit push" ชัดๆ ก่อน (ตามแพทเทิร์นทุกครั้งใน session นี้)

## NEXT

1. รอเบสสั่ง commit + push งานกวาด "อัปเดตทุกวัน"
2. ตัดสินเรื่อง `priceValidUntil` ใน `src/lib/seo/json-ld.ts` (ดูหัวข้อด้านบน)
3. คิวงานค้างเดิม (ยังไม่แตะ): `getHomeData().rarityRows` query ทิ้งเปล่า · "อัปเดตล่าสุด:" hardcode ไทยที่ trending + most-expensive (ย้ายมาใช้ pattern map 3 locale ของหน้าแรก)
