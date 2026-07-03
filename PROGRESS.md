# 📍 PROGRESS — สถานะสด
> **เขียนทับทุกครั้ง ไม่สะสม log** · hook โหลดไฟล์นี้ทุก session · อ่านอันนี้ก่อน แล้วทำต่อจาก NEXT

อัปเดตล่าสุด: 2026-07-03 — **Portfolio: Hub + Detail split** (เบส: "หน้าพอร์ตหน้าแรกเป็นหน้าเลือกพอร์ต + dashboard แล้วกดเข้าไปดูข้อมูลเต็มในพอร์ตนั้น")

## แหล่งอ้างอิง
- **spec เต็ม:** `doc/mine-multigame-spec.md` (จาก design workflow · แยก [NO-SCHEMA] vs [SCHEMA-GATED])
- **VISION:** §1 identity · §2 IA/TRACK · §4 discipline · §5.3 portfolio · §5.7 multi-game · §6 schema (⚠️ gated)

## ✅ เสร็จ session นี้ — Hub + Detail split
เบสไม่เอาโครง sidebar-in-page แบบรอบก่อน (screenshot เว็บเดิม) — ขอ 2 ชั้นจริง: `/portfolio` = หน้าเลือกพอร์ต + dashboard สรุป · `/portfolio/[id]` = หน้าเต็มของพอร์ตนั้น (URL จริง กด back/แชร์ลิงก์/bookmark ได้):

- **checkpoint commit `ddb85db`** — เก็บ panel-restore (sidebar+hero-panel+tabs) ไว้เป็นประวัติก่อนรื้อ
- **`use-portfolio-api.ts` ขยาย** (ไม่แตะ API/Prisma): เพิ่ม param `activePortfolioId` (sync ผ่าน render-time state adjustment ไม่ใช่ effect — กัน lint `set-state-in-effect`) แทนพฤติกรรม auto-select-พอร์ตแรกเดิม · ดึง `toAssetRow`/`buildGameBreakdown` ออกเป็นฟังก์ชันกลาง ใช้ร่วมกันทั้ง per-portfolio (`assets`/`gameBreakdown` เดิม) และ **ใหม่** cross-portfolio (`allAssets`/`allGameBreakdown` — รวมทุกพอร์ตเข้าด้วยกัน สำหรับ hub) · `portfolioMetas` เพิ่ม `previewItems` (top 4 การ์ดตามมูลค่า สำหรับ thumbnail บนการ์ดพอร์ต)
- **Hub ใหม่** (`portfolio-client.tsx` เขียนใหม่ทั้งไฟล์): dashboard hero (มูลค่ารวมทุกพอร์ต + P/L รวม + glow ตามทิศ P/L จริงเสมอ — ไม่ใช่สีเกม) → grid การ์ดพอร์ต (`PortfolioHubCard` ใหม่ — "stretched link" ทั้งใบ เป็น `<Link>` จริงคลุมการ์ด + เมนู `...` ลอยเป็น pointer-events island แยกต่างหาก ไม่ต้อง stopPropagation เพราะไม่ได้ซ้อนกันจริง) → การ์ดสุดท้าย "+ สร้างพอร์ตใหม่" หรือ upsell เมื่อชนลิมิต → แยกตามเกม + มูฟเวอร์รวมข้ามพอร์ตท้ายหน้า (อ่านอย่างเดียว — `PortfolioGameBreakdown` เพิ่ม `onSelect?` optional รองรับ read-only rows)
- **Detail ใหม่** (`/portfolio/[id]/page.tsx` + `portfolio-detail-client.tsx`): breadcrumb หน้าแรก›พอร์ตโฟลิโอ›{ชื่อ} → `PortfolioSwitcher` (onSelect เปลี่ยนจาก setState เป็น `router.push`) + แท็บ ภาพรวม/เชิงลึก + actions — คงฟีเจอร์เดิมครบ (hero panel, game chips, ตาราง sparkline, scrub chart, allocation) · ลบพอร์ตที่กำลังดูอยู่ → เด้งกลับ `/portfolio` อัตโนมัติ · id ไม่ตรงพอร์ตของ user (ลบไปแล้ว/ปลอม) → soft empty-state "ไม่พบพอร์ตนี้" + ปุ่มกลับ (ไม่ใช่ hard 404)
- **Skeleton**: `loading.tsx` (hub) + `[id]/loading.tsx` (detail) ใหม่ตามโครง · `portfolio-mock-preview.tsx` (auth-gate ตอนไม่ login) เขียนใหม่ mirror hub
- i18n ใหม่ 4 key ×3 ภาษา: `selectPortfolio` · `portfolioNotFound(Desc)` · `backToPortfolios`
- ไม่แตะ API routes/Prisma · ไม่มี bottom-sheet ใหม่ · ไม่ทำกราฟรวมข้าม portfolio (honest money — snapshot อายุไม่เท่ากันจะโกหกกราฟ)

**verify:** tsc 0 · lint 0 err (34 warning เดิม ไม่เพิ่ม — เจอ+แก้ 1 error ใหม่ `react-hooks/set-state-in-effect` จาก sync-prop pattern) · test 56/56 · build ✓ (ทั้ง `/portfolio` และ `/portfolio/[id]` ขึ้นใน route list) · impeccable detect `[]` · curl smoke test 4 เส้นทาง (`/portfolio`, `/portfolio/1`, `/portfolio/999999`, `/portfolio/abc`) ทั้งหมด 200 ไม่มี server error ในหน้า

## ⚠️ ยังไม่ได้ทำ — เบสต้องเช็คของจริงเอง
**เครื่องมือเปิด browser จริงไม่พร้อมใช้งาน session นี้** (MCP browser server ไม่ถูกลงทะเบียน) — verify ที่ทำได้จำกัดแค่ build/lint/test/curl ข้างต้น **ยังไม่เห็นภาพจริง**:
1. เบสเปิด `localhost:3000/portfolio` เช็คหน้า hub (การ์ดพอร์ต + dashboard) ทั้ง desktop/มือถือ/dark-light
2. กดเข้าการ์ดพอร์ต → เช็คหน้า detail (breadcrumb, switcher, แท็บ, ตาราง) ทำงานถูกต้อง
3. ลองกดเมนู `...` บนการ์ดพอร์ต (เปลี่ยนชื่อ/ลบ/สลับ public) — ยังไม่เคยกดจริงเลยรอบนี้
4. ลองพิมพ์ URL `/portfolio/999` (id ไม่มีจริง) → ควรเห็น empty-state "ไม่พบพอร์ตนี้"

## 🤔 การตัดสินใจที่เบี่ยงจาก wording เดิมในแผน (ควรรู้ไว้)
- แผนเขียนว่า hero ของ hub มีปุ่ม "+ เพิ่มการ์ด" — **ตัดออก** ยกเว้นตอน 0 พอร์ต (empty state) เพราะถ้ามีหลายพอร์ตแล้ว กดเพิ่มการ์ดจาก hub จะเพิ่มเข้าพอร์ตไหนไม่ชัดเจน (เสี่ยงสร้างพอร์ต "Default" ซ้ำ) — เพิ่มการ์ดทำในหน้า detail ของพอร์ตนั้นแทน (ไม่กำกวม)

## ⏭️ NEXT
1. เบสเปิดเบราว์เซอร์เช็คของจริงตามลิสต์ข้างบน (สำคัญ — session นี้ยัง verify ด้วยตาไม่ได้)
2. ถ้าโอเค → commit ทับ checkpoint `ddb85db`
3. watchlist/alerts ยังเป็นโครงเก่า (ถ้าต้องการ consistency ข้ามหน้าค่อยคุยแยก)
4. Pokémon data survey · Phase G (schema-gated) — ค้างจากรอบก่อนหน้า
