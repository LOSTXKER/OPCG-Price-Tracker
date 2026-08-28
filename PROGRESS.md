# 📍 PROGRESS — สถานะสด
> **เขียนทับทุกครั้ง ไม่สะสม log** · อ่านอันนี้ก่อน แล้วทำต่อจาก NEXT

อัปเดตล่าสุด: 2026-08-29 (เช้า) — ✅ **ขึ้น master แล้ว (`d27a7a6`) · เบสสั่งเอง · Vercel deploy อัตโนมัติ** — หน้าแรกมือถือโฉมใหม่ + แถบล่างปุ่มค้นหากลาง + **แถบเมนูบนมือถือ 2 แถว**

## งานที่ขึ้นเว็บรอบนี้ (มือถือทั้งหมด · desktop ไม่แตะเลย)

### 1. แถบเมนูบนมือถือ 2 แถว "ขัดเงา" (เบสเลือกจาก `/proto/mobile-navbar`)

- **แถวบน (h-14 = 56px)** — โลโก้ · **ชื่อหน้าที่กำลังดู** (resolver ใน `header-mobile.tsx` แปลง pathname → ชื่อไทย ใช้ dictionary keys เดิม fallback = "Meecard") · หัวใจ→`/watchlist` (ติดสีทองเมื่ออยู่หน้านั้น) · กระดิ่ง · **เส้นแบ่ง** · avatar ตัวอักษรแรกของชื่อ→`/more` **หรือ** ปุ่ม "เข้าสู่ระบบ" แบบมีข้อความเต็ม→`/login`
- **แถวล่าง (h-12 = 48px, `bg-muted/30`)** — แถบบริบท: `HeaderCatalogControl` เต็มความกว้าง · trigger ทรงใหม่ (h-9, ไม่มี max-w cap) แสดง **ภาพกล่องชุด + CODE + ชื่อชุดเต็ม 2 บรรทัด** แทน label ตัวหนังสือที่เคยถูกตัด
- **`--chrome-h` มือถือ 3.5rem → 6.5rem** — sticky/scroll-mt ทั้งเว็บอ่านค่านี้ตัวเดียว จึงเลื่อนตามเองครบทุกหน้า
- **ตัดสินใจ:** "ออกจากระบบ" ไม่เป็นปุ่มแยกบนแถบ (นานๆ กดที ถ้ากินช่องถาวรจะเบียดชื่อหน้า) → อยู่หลัง avatar ที่ `/more` ซึ่งมีโปรไฟล์+ตั้งค่า+ออกจากระบบครบอยู่แล้ว — **เบสรับทราบตอนส่งงาน ยังเปลี่ยนได้ถ้าอยากให้แยก**

**วัดได้จริง: ช่องเลือกชุด 123px → 258px (2.1 เท่า)** ชื่ออย่าง "Adventure on KAMI's Island" ขึ้นครบ

### 2. หน้าแรกมือถือ + แถบล่าง (รอบก่อนหน้าในวันเดียวกัน)

- แถบล่าง 4 แท็บ + **ปุ่มค้นหาทรงกลมนูนกลางแถบ** (เปิด search modal ในหน้าเดิม) · รายการโปรดย้ายขึ้น navbar
- Hero หด (โปรยสั้น + บรรทัด meta) · หัวแถบชุดบรรทัดเดียวบนมือถือ · **แถบควบคุม 3→2 แถว** (ช่วงเวลาเป็นปุ่มกดวนติดกับ "เปลี่ยนแปลง" ใน `mobile-sort-cluster.tsx`) · **ขอบเดียว 20px ทั้งหน้า** (`MarketTable` prop `mobileFlush`) · โฆษณาลอยยกพ้นปุ่มค้นหา
- **แถวราคาแรก 608px → 496px** (เร็วขึ้น 112px ≈ 2 แถว) วัดเทียบ production จริง

### Verify (ครบทั้งสองงาน)

tsc สะอาด · `npm run lint` **0 errors** (26 warnings เดิม/นอก scope) · `npm run test` **154 ไฟล์ / 924 ข้อผ่าน** · `npm run build` **213 หน้า** · เปิดจริง 375×812 Dark+Light: header 104px · sticky เกาะ 104px ไม่ทับทุกหน้าที่ทดสอบ (หน้าแรก · ชุด OP15 · การ์ด OP13-118 · รายการโปรด) · ชื่อหน้าเปลี่ยนตาม route ถูกต้อง · ปุ่มทุกปุ่ม hit-test ผ่าน · desktop 1280px ไม่กระทบ (`--chrome-h` 8.25rem เดิม)

**เทสต์ที่เพิ่ม/แก้:** `mobile-home-layout.test.tsx` (ใหม่ 6 ข้อ) · `header-catalog-control.test.tsx` + `header-search-preferences.test.tsx` + `floating-bottom-ad.test.tsx` (อัปเดตให้ล็อกกติกาใหม่: 2 แถว · `--chrome-h: 6.5rem` · trigger ทรงใหม่ · ค้นหาอยู่แถบล่าง · ระยะโฆษณาใหม่)

## ⚠️ บทเรียนรอบนี้ (กันซ้ำ)

1. **แตะโค้ดแล้วต้องรัน test ใหม่ก่อน commit เสมอ** — รอบนี้เคยแก้ระยะโฆษณาหลังรัน test แล้วไม่ได้รันซ้ำ ทำให้ commit `14ea474` มีเทสต์ค้างพัง 1 ข้อ (แก้แล้ว)
2. **ทดสอบ floating control ต้องเช็ค `elementsFromPoint` + เผื่อ `safe-area`** — JS `.click()` ข้าม hit-test จึงให้ผลหลอก
3. **Next.js 16 dev server บล็อก `/_next/*` เมื่อเข้าผ่าน LAN IP** → มือถือได้ HTML เปล่ากดอะไรไม่ติด ดูบนมือถือต้อง production build (`npm run build && npm run start`) หรือเพิ่ม `allowedDevOrigins` ใน next.config (config change — ต้องขออนุมัติ)
4. **server ค้างหลายพอร์ตทำให้เบส "ไม่เห็นงานที่ทำ"** — ก่อนให้เบสดู ต้องเช็ค `lsof` ว่าไม่มีตัวเก่าค้างที่ port 3000

## สถานะ git

- **master = `d27a7a6`** (fast-forward จาก branch `claude/mobile-home-layout-c8d6e8`) — เบสสั่ง "commit push main" ทั้งสองรอบ
- ไม่มี schema / dependency / config change
- proto ที่ใช้เลือกแบบถูกลบแล้วทั้งสองชุด — ย้อนดูได้จาก git: หน้าแรก `032e83d` · navbar `2fdfa67`
- dev server รันอยู่ที่ **port 3000**

## NEXT

1. **เบสดูของจริงบนเว็บ** — Vercel deploy จาก master อัตโนมัติ · บนเครื่องนี้ `http://localhost:3000`
2. ถ้าอยากปรับต่อ: ปุ่ม "ออกจากระบบ" แยกบนแถบ (ตอนนี้อยู่หลัง avatar ที่ `/more`) · แถบไฮไลต์ตลาดบนมือถือ (กู้จาก `git show 032e83d:src/app/proto/mobile-home/components/proto-highlight-strip.tsx`)
3. คิวเดิมที่ยังไม่แตะ: `getHomeData().rarityRows` query ทิ้งเปล่า · `priceValidUntil` ใน `lib/seo/json-ld.ts` (คำนวณเป็นวันหมดอายุไปแล้วเกือบทุกหน้าการ์ด)
