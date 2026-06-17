# 📍 PROGRESS — สถานะสด
> **เขียนทับทุกครั้ง ไม่สะสม log** · hook โหลดไฟล์นี้ทุก session · อ่านอันนี้ก่อน แล้วทำต่อจาก NEXT

อัปเดตล่าสุด: 2026-06-17 — **chunk C cross-family + chunk D (ลบ proto) เสร็จทั้งคู่** · port multi-source pricing model จบครบ · เหลือแต่งาน gate (รอ data จริง)

## บริบท session นี้
port "multi-source pricing model" เข้าหน้าจริง `/cards/[code]` ทีละ chunk. chunk A (ตารางแหล่งราคา) + B (hero verb/recent-sales ซื่อสัตย์) + C same-family (indexed %) เสร็จไปแล้ว · **session นี้ปิด chunk C cross-family** (เทียบ Raw ↔ PSA ข้ามตระกูลบนกราฟ)

## ✅ เสร็จ session นี้ — chunk C cross-family (เทียบ Raw ↔ PSA)
ผ่าน design judge-panel workflow (3 framing: minimal/mode-toggle/ladder-native → judge เลือก **"vs anchor toggle" 46/50**) แล้ว implement ตาม state plan:
- **ดีไซน์: pill เดียว binary** "เทียบกับ PSA 10" (เมื่อ primary=raw) / "เทียบกับ Raw A" (เมื่อ primary=graded) ต่อท้ายแถว เทียบเกรด · กดแล้ว overlay เส้น family ตรงข้าม (anchor จริง = solid) บนกราฟ **indexed %** · **chart-only ไม่แตะ selectedGrade/chartMode** → ตาราง #sources + hero + recent-sales ยังล็อก family เดิม (invariant หลัก)
- ไฟล์แตะ: `card-detail.tsx` — state `vsOther` · derive `crossKey`/`crossAvailable`/`crossLabel` · seriesList append crossKey **ท้ายสุด** (primary คง index 0) · `switchFamily` เพิ่ม `setVsOther(false)` · `compareHue()` = สีต่อเกรดแบบ stable (ไม่ reshuffle ตอน toggle) · render: cross pill + ปุ่ม **ล้างทั้งหมด** + caption **indexedPctNote** (ⓘ อธิบายแกน %)
- i18n ×3: เพิ่ม `compareVs` (เทียบกับ/vs/対) + `indexedPctNote` · reuse `clearAll`
- **ตัดสินใจ deviate จาก verdict 1 จุด:** ข้าม "เทียบแหล่ง coming-soon chip" (verdict บอก optional) — declutter สำคัญกว่า · disabled chip ใน prod ดูยังไม่เสร็จ · ใส่ทีหลังได้
- verify: **tsc 0 · lint 0 · test 40 · hydration 0** · CDP screenshot (`/tmp/shots/desktop-{default,compare,graded-cross}.png` + `mobile-{default,compare}.png`) ยืนยัน: solo→2 paths/แกน ฿ · กด cross→3 paths/แกน % (+149%/+96%/...) · **ตารางไม่ flip** (raw→PSA 10 ตามที่กด Graded เท่านั้น) · ทั้ง desktop+mobile+2 branch

## ✅ chunk D — ลบ proto (เบส confirm "ลบเลย" session นี้)
ลบ `src/app/proto/msrc/` + `src/app/proto/rcol/` แล้ว (เช็คก่อน: ไม่มี production import · tsc ยังเขียวหลังลบ) · เก็บ `card-detail/chart-scale.test.ts` (test ของ chunk C ไม่ใช่ proto) · proto/ อื่น (card-trade-a..h ฯลฯ) ไม่แตะ — เบส auth แค่ msrc+rcol

## ▶ NEXT — งาน gate (รอ pipeline data จริง · ยังไม่ทำ)
- **เทียบแหล่ง (compare sources):** per-source time series ไม่มีจริง (mock ล้วน) · ทำเมื่อ comps pipeline พร้อม · ตอนนี้ honesty = ไม่โชว์เส้นแหล่งปลอม
- **est → ข้อมูลจริง:** PSA 9/8/BGS + graded delta30d ยัง modeled (กราฟ cross 2 เส้นเลยซ้อนกันเพราะ delta เท่ากัน = artifact ของ mock ไม่ใช่บั๊ก) · swap เมื่อมี Grade enum + Comp tables (PLAN:37)

## ⚠️ decisions (เบส confirm)
1. Raw = เก็บ raw_a/b/c เบื้องหลัง · UI โชว์ "Raw" รวม
2. raw markets = Yuyutei ไม่เอา SNKRDUNK (noisy) · graded = SNKRDUNK
3. ad → page-tail ไม่ใช่ข้างกราฟ
4. เทียบแหล่ง ยังไม่ทำ (mock) — ship เทียบเกรด/ข้ามตระกูลก่อน
5. honesty: EstMark รายค่า · ไม่ปลอม sold · cross line = anchor จริง (solid) เท่านั้น

## ⚠️ gotchas
1. dev (Turbopack) SSR cache ค้างหลัง edit เปลี่ยน SSR output → hydration mismatch · ถ้าเจอ badge "Issue" ให้ kill -9 PID + `next dev -p 3005` ใหม่ (memory: proto-preview-gotchas)
2. chart cold-compile ช้าหลัง restart → warm 3× ก่อน screenshot (CDP script `/tmp/shoot.mjs` warm+poll ให้แล้ว)
3. ห้าม `npm run build` ระหว่าง dev · dev ที่ **3005** (3000 = Anajak)
4. Meecard = prototype — mock/ข้อมูลค้างปล่อยได้
5. screenshot กดปุ่มจริงได้ผ่าน CDP (node 24 global WebSocket) → `/tmp/shoot.mjs` (desktop+mobile) · `/tmp/shoot2.mjs` (graded branch)
6. `/cards/OP13-118` = SP (raw 311฿ · PSA 10 69,231฿)
