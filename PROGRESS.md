# 📍 PROGRESS — สถานะสด
> **เขียนทับทุกครั้ง ไม่สะสม log** · hook โหลดไฟล์นี้ทุก session · อ่านอันนี้ก่อน แล้วทำต่อจาก NEXT

อัปเดตล่าสุด: 2026-07-03 — **Portfolio: Panel Layout restore** (เบสส่ง screenshot เว็บ live เดิม: "หน้าพอร์ต ฉันขอ UXUI แบบนี้ดีกว่าแบบเดิม แต่ทำให้ดีกว่าเดิม")

## แหล่งอ้างอิง
- **spec เต็ม:** `doc/mine-multigame-spec.md` (จาก design workflow · แยก [NO-SCHEMA] vs [SCHEMA-GATED])
- **VISION:** §1 identity · §2 IA/TRACK · §4 discipline · §5.3 portfolio · §5.7 multi-game · §6 schema (⚠️ gated)

## ✅ เสร็จ session นี้ — Panel Layout restore
เบสปัดตก "Minimal Editorial" (frameless, underline tabs) รอบก่อน แล้วส่ง screenshot ของเว็บ live เดิม (sidebar ซ้าย + hero panel + แท็บ pill) พร้อมสั่ง "เอาแบบนี้ดีกว่าแบบเดิม แต่ทำให้ดีกว่าเดิม" — สืบ git history เจอว่าโครงนี้คือ commit `09ae7e5` (ก่อนถูกรื้อไปหลายรอบ) เลยกู้กลับมาแล้วเสียบฟีเจอร์ใหม่ทั้งหมดเข้าที่เดิม:

- **checkpoint commit `6a15bbc`** — เก็บ Minimal Editorial (ทั้ง `.cursor/skills/impeccable` install + PRODUCT.md) ไว้เป็นประวัติก่อนรื้อ กันงานหาย
- **โครงกลับมาตาม screenshot**: header เต็ม (breadcrumb+h1+desc) · sidebar ซ้าย sticky 280px บน `lg:` (panel "ทุกพอร์ต" มูลค่ารวม+P/L% + panel `PortfolioSidebar` list พอร์ต) · มือถือใช้ `PortfolioSwitcher` pill แทน · แท็บ `SegmentedControl` "ภาพรวม | ข้อมูลเชิงลึก" (ไม่ใช่ underline tabs แบบรอบก่อน)
- **`portfolio-hero-panel.tsx` กู้คืน** (ไฟล์เคยถูกลบตอน Minimal Editorial) — panel เดียว: eyebrow มูลค่าพอร์ต → เลข display+delta pill → แถว 4 สถิติ (กำไร/ขาดทุน · ต้นทุน · ผลงานดีที่สุด · ผลงานแย่ที่สุด) + glow มุมบาง (12% mix) — ตรวจแล้ว logic เดิม honest อยู่แล้ว (glow ตามทิศ P/L จริง ไม่ใช่สีเกม) เพิ่มคอมเมนต์อธิบายกฎให้ชัดกันมือถัดไปพลาด
- **ภาพรวม tab**: hero panel → `PortfolioGameChips` (ย้ายออกจาก toolbar leading slot ที่เคยใส่ไว้ตอน Minimal Editorial) → `PortfolioAssetsTable` — คงฟีเจอร์ใหม่ทั้งหมดที่ทำไว้ก่อนหน้า: 7d sparkline, search/sort/bulk edit toolbar, mobile list 2 บรรทัด, game badge
- **เชิงลึก tab**: money band panel (hero scrub + chart ครอบ `Surface`) → แยกตามเกม → มูฟเวอร์ (ครอบ panel) → สัดส่วน
- **`loading.tsx` + `portfolio-mock-preview.tsx`** เขียนใหม่ mirror sidebar+panel layout (กัน layout jump ทั้ง route-level suspense และ auth-gate preview)
- ไม่แตะ API/hook/Prisma/schema · ไม่มี bottom sheet ใหม่ (ยึด veto เดิม)

**verify:** impeccable detect `[]` (portfolio dirs) · tsc 0 · lint 0 err (34 warning เดิม ไม่เพิ่ม) · test 56/56 · build ✓ · เปิด Chrome จริง localhost:3000/portfolio ด้วย session login ที่ค้างอยู่ (user "Test") — เทียบตรงกับ screenshot ที่เบสส่งทั้ง dark/light mode desktop 1512px และมือถือ 390px (ทั้ง 2 แท็บ)

## ⚠️ สิ่งที่สังเกตระหว่างทำ (ไม่ใช่บั๊กจากงานนี้ — บันทึกไว้เผื่อสงสัย)
- ข้อมูลทดสอบบัญชี "Test" มี asset 2 ใบ แต่มีแค่ใบเดียว (Roronoa Zoro) ที่ตั้ง purchasePrice ไว้จริง → "ผลงานดีที่สุด"/"ผลงานแย่ที่สุด" เลยโชว์การ์ดเดียวกันซ้ำ — ตรง logic (`use-portfolio-api.ts` นับเฉพาะ item ที่มี cost) ไม่ใช่บั๊ก แค่ data ทดสอบมีตัวอย่างไม่พอ
- dev overlay ยังโชว์ hydration warning ที่ `header-market-ticker.tsx`/`footer.tsx` (persisted lang/currency store) — pre-existing ทั้งแอป ไม่เกี่ยวกับงานนี้ (เคยบันทึกไว้ตั้งแต่ session ก่อน)

## ⏭️ NEXT
1. เบสเปิด `localhost:3000/portfolio` เช็คของจริงอีกที (desktop+มือถือ) — ถ้าโอเคแล้วค่อย commit เป็นทางการ (ตอนนี้ยังเป็น working tree ไม่ได้ commit ทับ checkpoint)
2. ถ้าเบสพอใจ: ลบ Minimal Editorial ไฟล์ orphan ที่อาจเหลือ (เช่น `.rise`/`Surface` variant เก่าที่ไม่ใช้แล้ว — ยังไม่ได้เช็ค)
3. watchlist + alerts ยังไม่ได้ตามโครงใหม่นี้ (ถ้าเบสต้องการ consistency ข้ามหน้า ต้องคุยแยก — ตอนนี้แค่ portfolio)
4. Pokémon data survey · Phase G (schema-gated) — ค้างจากรอบก่อนหน้า ยังไม่เริ่ม
5. (ถ้าอยากเก็บ) แก้ hydration warning จาก persisted lang/currency store แบบ app-wide
